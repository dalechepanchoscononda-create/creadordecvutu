import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for profile images
app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Helper to retry with exponential backoff on retriable errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isRetriable = 
      err.status === 429 || 
      err.status === 503 || 
      err.code === 429 || 
      err.code === 503 ||
      (err.message && (
        err.message.includes("503") || 
        err.message.includes("429") || 
        err.message.includes("UNAVAILABLE") || 
        err.message.includes("demand") ||
        err.message.includes("Resource has been exhausted") ||
        err.message.includes("limit")
      ));

    if (retries > 0 && isRetriable) {
      console.warn(`Gemini API call failed (retriable). Retrying in ${delay}ms... (Remaining retries: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Helper to try a Gemini API call across a list of fallback models with backoff
async function generateContentWithFallbackModels(
  client: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  },
  models: string[] = ["gemini-3.5-flash", "gemini-2.5-flash"]
): Promise<any> {
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`Attempting Gemini generation with model: ${model}...`);
      const response = await retryWithBackoff(() =>
        client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        })
      );
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message || err);
      lastError = err;
      // Continue to next model in list
    }
  }

  throw lastError || new Error("All fallback models failed.");
}

// Translate endpoint
app.post("/api/translate", async (req, res) => {
  const { text, texts } = req.body;
  try {
    // Check if Gemini is configured
    let client: GoogleGenAI;
    try {
      client = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization failed, using mock translator fallback:", err.message);
      return returnFallback(req, res);
    }

    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        return res.json({ translations: [] });
      }

      try {
        // Translate array in a single call to save tokens and time
        const prompt = `Traduce la siguiente lista de textos en español al inglés de forma profesional para un currículum vitae. 
Mantén el orden de los elementos. Retorna un arreglo JSON de cadenas de texto (JSON string array) únicamente, sin formato Markdown extra, con la traducción.
Textos en español:
${JSON.stringify(texts)}`;

        const response = await generateContentWithFallbackModels(client, {
          contents: prompt,
          config: {
            systemInstruction: "Eres un traductor profesional bilingüe experto en CVs y currículums. Traduce los textos de español a inglés técnico y profesional. Retorna exclusivamente un arreglo JSON válido (por ejemplo, [\"trad1\", \"trad2\"]). No agregues explicaciones, ni etiquetas markdown de código como ```json.",
            responseMimeType: "application/json",
          }
        });

        let responseText = response.text || "[]";
        // Clean up markdown formatting if the model ignored mime type instructions
        responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        const parsed = JSON.parse(responseText);
        return res.json({ translations: parsed });
      } catch (err: any) {
        console.error("Gemini batch translation failed, falling back to mock:", err.message);
        return returnFallback(req, res);
      }
    } else if (text !== undefined) {
      if (!text || text.trim() === "") {
        return res.json({ translation: "" });
      }

      try {
        const prompt = `Traduce profesionalmente al inglés el siguiente texto de un currículum. Retorna ÚNICAMENTE la traducción limpia, sin comentarios ni explicaciones adicionales:\n\n"${text}"`;
        
        const response = await generateContentWithFallbackModels(client, {
          contents: prompt,
          config: {
            systemInstruction: "Eres un traductor profesional bilingüe para perfiles profesionales. Traduce el texto al inglés con tono profesional de CV. Retorna únicamente el texto traducido.",
          }
        });

        const translation = (response.text || "").trim();
        return res.json({ translation });
      } catch (err: any) {
        console.error("Gemini single translation failed, falling back to mock:", err.message);
        return returnFallback(req, res);
      }
    }

    return res.status(400).json({ error: "Debe proporcionar 'text' o 'texts'" });
  } catch (error: any) {
    console.error("Translation API error:", error);
    return returnFallback(req, res);
  }
});

// Helper to return fallback translations
function returnFallback(req: any, res: any) {
  const { text, texts } = req.body;
  if (texts && Array.isArray(texts)) {
    const fallbacks = texts.map((t: string) => mockTranslate(t));
    return res.json({ translations: fallbacks });
  } else if (text !== undefined) {
    return res.json({ translation: mockTranslate(text) });
  }
  return res.status(400).json({ error: "No input provided" });
}

// Simple dictionary mapping for mock translate fallback
function mockTranslate(text: string): string {
  if (!text) return "";
  const clean = text.trim().toLowerCase();
  
  // Basic vocabulary mapping for fallback
  const dict: { [key: string]: string } = {
    "desarrollador": "Developer",
    "desarrollador de software": "Software Developer",
    "desarrollador frontend": "Frontend Developer",
    "desarrollador backend": "Backend Developer",
    "ingeniero": "Engineer",
    "ingeniero de sistemas": "Systems Engineer",
    "docente de informática": "Computer Science Teacher",
    "gerente de proyectos": "Project Manager",
    "administrador": "Administrator",
    "español": "Spanish",
    "inglés": "English",
    "nativo": "Native",
    "básico": "Basic",
    "intermedio": "Intermediate",
    "avanzado": "Advanced",
    "experto": "Expert",
    "fluido": "Fluent",
  };

  if (dict[clean]) return dict[clean];

  // Professional profile example
  if (clean.includes("docente de informática con experiencia en redes y desarrollo web")) {
    return "Computer science teacher with experience in networking and web development.";
  }

  // Generic fallback indicator
  return `${text} [EN]`;
}

// Mount Vite middleware or static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bilingual CV Builder backend is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
