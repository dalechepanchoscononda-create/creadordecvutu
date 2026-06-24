export async function translateSingleText(text: string): Promise<string> {
  if (!text || text.trim() === "") return "";
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    
    const data = await response.json();
    return data.translation || text;
  } catch (error) {
    console.error("Failed to translate single text:", error);
    // Simple fallback mapping for offline/no-key states
    return text + " [EN]";
  }
}

export async function translateMultipleTexts(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) return [];
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.translations && Array.isArray(data.translations)) {
      return data.translations;
    }
    return texts;
  } catch (error) {
    console.error("Failed to translate multiple texts:", error);
    return texts.map(t => t + " [EN]");
  }
}
