import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Plus, Trash2, Download, Printer, Eye, Settings, 
  User, Mail, Phone, MapPin, Globe, Languages, Briefcase, 
  GraduationCap, Award, FileText, Layout, CheckCircle, 
  Sun, Moon, ZoomIn, ZoomOut, RotateCcw, Upload, Info, 
  Check, AlertCircle, RefreshCw, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { CVData, TemplateType } from "./types";
import { initialSpanishData, initialEnglishData } from "./initialData";
import { CVPreview } from "./components/CVPreview";
import { translateSingleText, translateMultipleTexts } from "./utils/translationHelper";
import { generateDocx } from "./utils/docxExporter";
import { convertOklchToRgbForElementTree } from "./utils/pdfHelper";

export default function App() {
  // -----------------------------------------
  // State
  // -----------------------------------------
  const [spanishData, setSpanishData] = useState<CVData>(() => {
    const saved = localStorage.getItem("bilingual_cv_es");
    return saved ? JSON.parse(saved) : initialSpanishData;
  });

  const [englishData, setEnglishData] = useState<CVData>(() => {
    const saved = localStorage.getItem("bilingual_cv_en");
    return saved ? JSON.parse(saved) : initialEnglishData;
  });

  const [template, setTemplate] = useState<TemplateType>(() => {
    return (localStorage.getItem("bilingual_cv_template") as TemplateType) || "professional";
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("bilingual_cv_dark") === "true";
  });

  const [zoom, setZoom] = useState<number>(0.65); // Default zoom level for large side-by-side previews
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const [isTranslatingAll, setIsTranslatingAll] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);

  // Active debounce timers
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const latestValues = useRef<{ [key: string]: string }>({});
  const activeRequests = useRef<{ [key: string]: number }>({});

  // -----------------------------------------
  // Persistence & Effects
  // -----------------------------------------
  useEffect(() => {
    localStorage.setItem("bilingual_cv_es", JSON.stringify(spanishData));
  }, [spanishData]);

  useEffect(() => {
    localStorage.setItem("bilingual_cv_en", JSON.stringify(englishData));
  }, [englishData]);

  useEffect(() => {
    localStorage.setItem("bilingual_cv_template", template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem("bilingual_cv_dark", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // -----------------------------------------
  // Notification Toast Helper
  // -----------------------------------------
  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // -----------------------------------------
  // Translation Queue & Debouncing Engine
  // -----------------------------------------
  const queueTranslation = (
    fieldPath: string, 
    spanishValue: string, 
    updateEnglishFn: (translatedVal: string) => void
  ) => {
    // 1. Immediately update English preview with the raw Spanish value so the structure stays completely identical in real-time
    updateEnglishFn(spanishValue);

    // 2. Clear existing timer for this field path
    if (debounceTimers.current[fieldPath]) {
      clearTimeout(debounceTimers.current[fieldPath]);
      if (activeRequests.current[fieldPath] > 0) {
        activeRequests.current[fieldPath]--;
      }
    }

    if (!spanishValue || spanishValue.trim() === "") {
      if ((activeRequests.current[fieldPath] || 0) === 0) {
        setTranslatingFields(prev => {
          if (prev.has(fieldPath)) {
            const next = new Set(prev);
            next.delete(fieldPath);
            return next;
          }
          return prev;
        });
      }
      return;
    }

    // Update latest value ref
    latestValues.current[fieldPath] = spanishValue;

    // Increment active requests
    activeRequests.current[fieldPath] = (activeRequests.current[fieldPath] || 0) + 1;

    setTranslatingFields(prev => {
      if (!prev.has(fieldPath)) {
        const next = new Set(prev);
        next.add(fieldPath);
        return next;
      }
      return prev;
    });

    debounceTimers.current[fieldPath] = setTimeout(async () => {
      try {
        const translated = await translateSingleText(spanishValue);
        if (latestValues.current[fieldPath] === spanishValue) {
          updateEnglishFn(translated);
        }
      } catch (err) {
        console.error(`Translation error for ${fieldPath}:`, err);
      } finally {
        if (activeRequests.current[fieldPath] > 0) {
          activeRequests.current[fieldPath]--;
        }
        if ((activeRequests.current[fieldPath] || 0) === 0) {
          setTranslatingFields(prev => {
            const next = new Set(prev);
            next.delete(fieldPath);
            return next;
          });
        }
      }
    }, 1000); // 1s typing debounce to keep request rate perfect
  };

  // -----------------------------------------
  // Translate Entire Resume (Batch Action)
  // -----------------------------------------
  const handleTranslateAll = async () => {
    setIsTranslatingAll(true);
    showNotification("Traduciendo currículum completo con Inteligencia Artificial...", "info");

    try {
      // Collect all values that require translation
      const translatableMap: Array<{ path: string; val: string; setter: (v: string) => void }> = [];

      // Profession & Location
      translatableMap.push({
        path: "personalInfo.profession",
        val: spanishData.personalInfo.profession,
        setter: (v) => setEnglishData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, profession: v } }))
      });
      translatableMap.push({
        path: "personalInfo.location",
        val: spanishData.personalInfo.location,
        setter: (v) => setEnglishData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: v } }))
      });

      // Profile
      translatableMap.push({
        path: "profile",
        val: spanishData.profile,
        setter: (v) => setEnglishData(prev => ({ ...prev, profile: v }))
      });

      // Education
      spanishData.education.forEach((edu, idx) => {
        translatableMap.push({
          path: `education.${idx}.degree`,
          val: edu.degree,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.education];
            if (list[idx]) list[idx].degree = v;
            return { ...prev, education: list };
          })
        });
        translatableMap.push({
          path: `education.${idx}.description`,
          val: edu.description,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.education];
            if (list[idx]) list[idx].description = v;
            return { ...prev, education: list };
          })
        });
      });

      // Experience
      spanishData.experience.forEach((exp, idx) => {
        translatableMap.push({
          path: `experience.${idx}.position`,
          val: exp.position,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.experience];
            if (list[idx]) list[idx].position = v;
            return { ...prev, experience: list };
          })
        });
        translatableMap.push({
          path: `experience.${idx}.description`,
          val: exp.description,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.experience];
            if (list[idx]) list[idx].description = v;
            return { ...prev, experience: list };
          })
        });
      });

      // Skills
      spanishData.skills.forEach((sk, idx) => {
        translatableMap.push({
          path: `skills.${idx}.name`,
          val: sk.name,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.skills];
            if (list[idx]) list[idx].name = v;
            return { ...prev, skills: list };
          })
        });
      });

      // Certifications
      spanishData.certifications.forEach((cert, idx) => {
        translatableMap.push({
          path: `certifications.${idx}.name`,
          val: cert.name,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.certifications];
            if (list[idx]) list[idx].name = v;
            return { ...prev, certifications: list };
          })
        });
      });

      // Projects
      spanishData.projects.forEach((proj, idx) => {
        translatableMap.push({
          path: `projects.${idx}.name`,
          val: proj.name,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.projects];
            if (list[idx]) list[idx].name = v;
            return { ...prev, projects: list };
          })
        });
        translatableMap.push({
          path: `projects.${idx}.description`,
          val: proj.description,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.projects];
            if (list[idx]) list[idx].description = v;
            return { ...prev, projects: list };
          })
        });
      });

      // References
      spanishData.references.forEach((ref, idx) => {
        translatableMap.push({
          path: `references.${idx}.relation`,
          val: ref.relation,
          setter: (v) => setEnglishData(prev => {
            const list = [...prev.references];
            if (list[idx]) list[idx].relation = v;
            return { ...prev, references: list };
          })
        });
      });

      // Execute single batch translation request for all fields
      const textsToTranslate = translatableMap.map(item => item.val);
      const translatedTexts = await translateMultipleTexts(textsToTranslate);

      // Map back results
      translatedTexts.forEach((translated, index) => {
        const mappingItem = translatableMap[index];
        if (mappingItem) {
          mappingItem.setter(translated);
        }
      });

      showNotification("Currículum traducido al inglés exitosamente.", "success");
    } catch (err) {
      console.error("Failed to batch translate CV:", err);
      showNotification("Error al traducir de forma masiva, usando copia simple.", "error");
    } finally {
      setIsTranslatingAll(false);
    }
  };

  // -----------------------------------------
  // Individual Field Edit Synchronization
  // -----------------------------------------
  const handlePersonalInfoChange = (field: keyof typeof spanishData.personalInfo, value: string) => {
    // 1. Update Spanish state
    setSpanishData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));

    // 2. Direct sync or Translate
    if (field === "name" || field === "email" || field === "phone" || field === "website" || field === "photo") {
      // These fields are static and don't need language translation
      setEnglishData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value }
      }));
    } else {
      // Run translation for Profession or Location
      queueTranslation(`personalInfo.${String(field)}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, [field]: translatedVal }
        }));
      });
    }
  };

  const handleProfileChange = (val: string) => {
    setSpanishData(prev => ({ ...prev, profile: val }));
    queueTranslation("profile", val, (translatedVal) => {
      setEnglishData(prev => ({ ...prev, profile: translatedVal }));
    });
  };

  // -----------------------------------------
  // Photo Upload Handler (base64)
  // -----------------------------------------
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handlePersonalInfoChange("photo", base64String);
        showNotification("Fotografía cargada y optimizada.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    handlePersonalInfoChange("photo", "");
    showNotification("Fotografía eliminada.", "info");
  };

  // -----------------------------------------
  // Dynamic List Handlers (Edu, Exp, etc.)
  // -----------------------------------------
  const addEducation = () => {
    const id = "edu-" + Date.now();
    const newItem = { id, institution: "", degree: "", startDate: "", endDate: "", description: "" };
    setSpanishData(prev => ({ ...prev, education: [...prev.education, newItem] }));
    setEnglishData(prev => ({ ...prev, education: [...prev.education, { ...newItem }] }));
    showNotification("Formación académica añadida.");
  };

  const deleteEducation = (id: string) => {
    setSpanishData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
    setEnglishData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
    showNotification("Formación académica eliminada.", "info");
  };

  const updateEducation = (id: string, field: string, value: string) => {
    // Update Spanish
    setSpanishData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field as any]: value } : e)
    }));

    // Sync to English
    if (field === "institution" || field === "startDate" || field === "endDate") {
      setEnglishData(prev => ({
        ...prev,
        education: prev.education.map(e => e.id === id ? { ...e, [field as any]: value } : e)
      }));
    } else {
      // Translate degree or description
      const itemIndex = spanishData.education.findIndex(e => e.id === id);
      queueTranslation(`education.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          education: prev.education.map(e => e.id === id ? { ...e, [field as any]: translatedVal } : e)
        }));
      });
    }
  };

  const addExperience = () => {
    const id = "exp-" + Date.now();
    const newItem = { id, company: "", position: "", startDate: "", endDate: "", description: "" };
    setSpanishData(prev => ({ ...prev, experience: [...prev.experience, newItem] }));
    setEnglishData(prev => ({ ...prev, experience: [...prev.experience, { ...newItem }] }));
    showNotification("Experiencia laboral añadida.");
  };

  const deleteExperience = (id: string) => {
    setSpanishData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
    setEnglishData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
    showNotification("Experiencia laboral eliminada.", "info");
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, [field as any]: value } : e)
    }));

    if (field === "company" || field === "startDate" || field === "endDate") {
      setEnglishData(prev => ({
        ...prev,
        experience: prev.experience.map(e => e.id === id ? { ...e, [field as any]: value } : e)
      }));
    } else {
      const itemIndex = spanishData.experience.findIndex(e => e.id === id);
      queueTranslation(`experience.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          experience: prev.experience.map(e => e.id === id ? { ...e, [field as any]: translatedVal } : e)
        }));
      });
    }
  };

  const addSkill = () => {
    const id = "sk-" + Date.now();
    const newItem = { id, name: "", level: "Intermedio" };
    setSpanishData(prev => ({ ...prev, skills: [...prev.skills, newItem] }));
    setEnglishData(prev => ({ ...prev, skills: [...prev.skills, { ...newItem }] }));
  };

  const deleteSkill = (id: string) => {
    setSpanishData(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
    setEnglishData(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  const updateSkill = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, [field as any]: value } : s)
    }));

    if (field === "level") {
      // Map Spanish levels to English levels instantly
      const levelMap: { [key: string]: string } = {
        "Principiante": "Beginner",
        "Intermedio": "Intermediate",
        "Avanzado": "Advanced",
        "Experto": "Expert",
      };
      const engLevel = levelMap[value] || value;
      setEnglishData(prev => ({
        ...prev,
        skills: prev.skills.map(s => s.id === id ? { ...s, level: engLevel } : s)
      }));
    } else {
      const itemIndex = spanishData.skills.findIndex(s => s.id === id);
      queueTranslation(`skills.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          skills: prev.skills.map(s => s.id === id ? { ...s, [field as any]: translatedVal } : s)
        }));
      });
    }
  };

  const addLanguage = () => {
    const id = "lan-" + Date.now();
    const newItem = { id, name: "", level: "Intermedio" };
    setSpanishData(prev => ({ ...prev, languages: [...prev.languages, newItem] }));
    setEnglishData(prev => ({ ...prev, languages: [...prev.languages, { ...newItem }] }));
  };

  const deleteLanguage = (id: string) => {
    setSpanishData(prev => ({ ...prev, languages: prev.languages.filter(l => l.id !== id) }));
    setEnglishData(prev => ({ ...prev, languages: prev.languages.filter(l => l.id !== id) }));
  };

  const updateLanguage = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      languages: prev.languages.map(l => l.id === id ? { ...l, [field as any]: value } : l)
    }));

    // Auto map values
    if (field === "level") {
      const levelMap: { [key: string]: string } = {
        "Nativo": "Native",
        "Fluido": "Fluent",
        "Intermedio": "Intermediate",
        "Básico": "Basic",
      };
      const engLevel = levelMap[value] || value;
      setEnglishData(prev => ({
        ...prev,
        languages: prev.languages.map(l => l.id === id ? { ...l, level: engLevel } : l)
      }));
    } else {
      // For language names (e.g. "Español" -> "Spanish")
      const nameMap: { [key: string]: string } = {
        "Español": "Spanish",
        "Inglés": "English",
        "Francés": "French",
        "Alemán": "German",
        "Italiano": "Italian",
        "Portugués": "Portuguese",
      };
      const engName = nameMap[value] || value;
      setEnglishData(prev => ({
        ...prev,
        languages: prev.languages.map(l => l.id === id ? { ...l, name: engName } : l)
      }));
    }
  };

  const addCertification = () => {
    const id = "cert-" + Date.now();
    const newItem = { id, name: "", issuer: "", date: "" };
    setSpanishData(prev => ({ ...prev, certifications: [...prev.certifications, newItem] }));
    setEnglishData(prev => ({ ...prev, certifications: [...prev.certifications, { ...newItem }] }));
  };

  const deleteCertification = (id: string) => {
    setSpanishData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
    setEnglishData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      certifications: prev.certifications.map(c => c.id === id ? { ...c, [field as any]: value } : c)
    }));

    if (field === "issuer" || field === "date") {
      setEnglishData(prev => ({
        ...prev,
        certifications: prev.certifications.map(c => c.id === id ? { ...c, [field as any]: value } : c)
      }));
    } else {
      const itemIndex = spanishData.certifications.findIndex(c => c.id === id);
      queueTranslation(`certifications.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          certifications: prev.certifications.map(c => c.id === id ? { ...c, [field as any]: translatedVal } : c)
        }));
      });
    }
  };

  const addProject = () => {
    const id = "proj-" + Date.now();
    const newItem = { id, name: "", description: "", link: "" };
    setSpanishData(prev => ({ ...prev, projects: [...prev.projects, newItem] }));
    setEnglishData(prev => ({ ...prev, projects: [...prev.projects, { ...newItem }] }));
  };

  const deleteProject = (id: string) => {
    setSpanishData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    setEnglishData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const updateProject = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field as any]: value } : p)
    }));

    if (field === "link") {
      setEnglishData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? { ...p, [field as any]: value } : p)
      }));
    } else {
      const itemIndex = spanishData.projects.findIndex(p => p.id === id);
      queueTranslation(`projects.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === id ? { ...p, [field as any]: translatedVal } : p)
        }));
      });
    }
  };

  const addReference = () => {
    const id = "ref-" + Date.now();
    const newItem = { id, name: "", relation: "", phone: "", email: "" };
    setSpanishData(prev => ({ ...prev, references: [...prev.references, newItem] }));
    setEnglishData(prev => ({ ...prev, references: [...prev.references, { ...newItem }] }));
  };

  const deleteReference = (id: string) => {
    setSpanishData(prev => ({ ...prev, references: prev.references.filter(r => r.id !== id) }));
    setEnglishData(prev => ({ ...prev, references: prev.references.filter(r => r.id !== id) }));
  };

  const updateReference = (id: string, field: string, value: string) => {
    setSpanishData(prev => ({
      ...prev,
      references: prev.references.map(r => r.id === id ? { ...r, [field as any]: value } : r)
    }));

    if (field === "name" || field === "phone" || field === "email") {
      setEnglishData(prev => ({
        ...prev,
        references: prev.references.map(r => r.id === id ? { ...r, [field as any]: value } : r)
      }));
    } else {
      const itemIndex = spanishData.references.findIndex(r => r.id === id);
      queueTranslation(`references.${itemIndex}.${field}`, value, (translatedVal) => {
        setEnglishData(prev => ({
          ...prev,
          references: prev.references.map(r => r.id === id ? { ...r, [field as any]: translatedVal } : r)
        }));
      });
    }
  };

  // -----------------------------------------
  // Clear / Reset Form
  // -----------------------------------------
  const handleResetForm = () => {
    if (window.confirm("¿Estás seguro de que quieres limpiar el formulario? Se perderá todo el progreso local.")) {
      const cleanEs: CVData = {
        personalInfo: { photo: "", name: "", profession: "", email: "", phone: "", website: "", location: "" },
        profile: "",
        education: [],
        experience: [],
        skills: [],
        languages: [],
        certifications: [],
        projects: [],
        references: [],
      };
      setSpanishData(cleanEs);
      setEnglishData(cleanEs);
      localStorage.removeItem("bilingual_cv_es");
      localStorage.removeItem("bilingual_cv_en");
      showNotification("Formulario reiniciado.", "info");
    }
  };

  const handleLoadSample = () => {
    setSpanishData(initialSpanishData);
    setEnglishData(initialEnglishData);
    showNotification("Datos de ejemplo cargados.", "success");
  };

  // -----------------------------------------
  // Progress Calculation
  // -----------------------------------------
  const calculateProgress = () => {
    let score = 0;
    const maxScore = 9;

    if (spanishData.personalInfo.name.trim() !== "") score++;
    if (spanishData.personalInfo.profession.trim() !== "") score++;
    if (spanishData.personalInfo.email.trim() !== "") score++;
    if (spanishData.profile.trim() !== "") score++;
    if (spanishData.education.length > 0) score++;
    if (spanishData.experience.length > 0) score++;
    if (spanishData.skills.length > 0) score++;
    if (spanishData.languages.length > 0) score++;
    if (spanishData.projects.length > 0) score++;

    return Math.round((score / maxScore) * 100);
  };

  // -----------------------------------------
  // Export: PDF Generator
  // -----------------------------------------
  const handleDownloadPdf = async (language: "ES" | "EN") => {
    const id = language === "ES" ? "cv-preview-es" : "cv-preview-en";
    const element = document.getElementById(id);
    if (!element) {
      showNotification("Error: No se encontró la hoja de vista previa.", "error");
      return;
    }

    setPdfGenerating(language);
    showNotification(`Generando PDF en ${language === "ES" ? "Español" : "Inglés"} en alta calidad...`, "info");

    const rawName = spanishData.personalInfo.name.replace(/\s+/g, "_");
    const fileName = `CV_${rawName || "Currículum"}_${language}.pdf`;

    // Save current scale/width styles
    const originalTransform = element.style.transform;
    const originalTransformOrigin = element.style.transformOrigin;
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;

    // Reset styles temporarily for standard A4 capture
    element.style.transform = "none";
    element.style.transformOrigin = "top left";
    element.style.width = "794px";
    element.style.height = "1123px";
    element.style.borderRadius = "0px";
    element.style.boxShadow = "none";

    let clone: HTMLElement | null = null;

    try {
      // Delay slightly for render cycles to resolve
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Create a deep clone for clean oklch -> rgb style mapping
      clone = element.cloneNode(true) as HTMLElement;
      
      // Perform oklch -> rgb conversion on the clone element tree
      convertOklchToRgbForElementTree(element, clone);

      // Force standard printable sizing and absolute hidden positioning on the clone
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.transform = "none";
      clone.style.transformOrigin = "top left";
      clone.style.width = "794px";
      clone.style.height = "1123px";
      clone.style.borderRadius = "0px";
      clone.style.boxShadow = "none";
      clone.style.backgroundColor = "#ffffff";

      // Append clone to DOM for rendering
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2.5, // Crisp retina-quality rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      
      // A4 Dimensions: 210mm x 297mm
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      pdf.save(fileName);

      showNotification(`¡PDF descargado exitosamente!`, "success");
    } catch (err) {
      console.error("PDF capture error:", err);
      showNotification("Hubo un error al compilar el PDF.", "error");
    } finally {
      // Clean up clone
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }

      // Restore styles
      element.style.transform = originalTransform;
      element.style.transformOrigin = originalTransformOrigin;
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.borderRadius = originalBorderRadius;
      element.style.boxShadow = originalBoxShadow;
      setPdfGenerating(null);
    }
  };

  // -----------------------------------------
  // Export: DOCX Word Generator
  // -----------------------------------------
  const handleDownloadDocx = async (language: "ES" | "EN") => {
    const data = language === "ES" ? spanishData : englishData;
    const rawName = spanishData.personalInfo.name.replace(/\s+/g, "_");
    const fileName = `CV_${rawName || "Currículum"}_${language}.docx`;

    showNotification(`Generando documento Word (.docx) en ${language === "ES" ? "Español" : "Inglés"}...`, "info");

    try {
      const blob = await generateDocx(data, language);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification(`¡Word descargado exitosamente!`, "success");
    } catch (err) {
      console.error("DOCX generation error:", err);
      showNotification("Error al compilar el archivo Word.", "error");
    }
  };

  // -----------------------------------------
  // Native Print Trigger
  // -----------------------------------------
  const handlePrint = () => {
    window.print();
  };

  const isFormValid = spanishData.personalInfo.name.trim() !== "" && spanishData.personalInfo.email.trim() !== "";
  const progressPercent = calculateProgress();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-[#0f172a]"}`}>
      
      {/* 1. Header Toolbar */}
      <header className={`sticky top-0 z-40 h-16 px-6 border-b flex flex-wrap gap-4 items-center justify-between backdrop-blur-md ${darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/20">
            CV
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1.5">
              CV Builder <span className="text-blue-600 dark:text-blue-400">Bilingüe</span>
              <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                v2.4
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Escribe en español &amp; traduce al inglés al instante</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{progressPercent}% Completado</span>
          </div>
          {progressPercent === 100 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Info className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Load/Reset Fallbacks */}
          <button 
            onClick={handleLoadSample}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded transition"
            title="Cargar datos de ejemplo realistas"
          >
            Ejemplo de Relleno
          </button>
          
          <button 
            onClick={handleResetForm}
            className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-1.5 rounded transition mr-2"
          >
            Limpiar Todo
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors border ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Print Button */}
          <button 
            onClick={handlePrint}
            className={`p-2 rounded-lg transition-colors border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
            title="Imprimir Currículums"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 w-full grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* =========================================================
            COL 1: Left Form Editor (4 Columns on XL)
            ========================================================= */}
        <section className={`xl:col-span-4 p-5 overflow-y-auto form-scroll flex flex-col gap-4 border-r ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <FileText className="w-4 h-4 text-blue-600" /> Formulario (Español)
            </h2>
            <button
              onClick={handleTranslateAll}
              disabled={isTranslatingAll}
              className="text-[10.5px] font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/40 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition"
            >
              <RefreshCw className={`w-3 h-3 ${isTranslatingAll ? "animate-spin" : ""}`} />
              Traducir Todo Ahora
            </button>
          </div>

          {!isFormValid && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Información de validación:</span> Completa el <span className="font-bold">Nombre</span> y <span className="font-bold">Email</span> para habilitar las descargas de forma correcta.
              </div>
            </div>
          )}

          {/* Form Navigation Accordions */}
          <div className="flex flex-col gap-2">
            
            {/* 1. Datos Personales */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "personal" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "personal" ? "" : "personal")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> 1. Datos Personales</span>
                <span className="text-[10px] text-slate-400">{activeSection === "personal" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "personal" && (
                <div className="p-4 flex flex-col gap-3.5 text-xs">
                  {/* Photo Upload row */}
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center border">
                      {spanishData.personalInfo.photo ? (
                        <img src={spanishData.personalInfo.photo} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-[11px]">Fotografía del CV</span>
                      <div className="flex gap-2">
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer transition">
                          Cargar Foto
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        {spanishData.personalInfo.photo && (
                          <button onClick={removePhoto} className="text-rose-500 hover:underline text-[10px] font-bold">
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={spanishData.personalInfo.name} 
                        onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                        placeholder="Juan Pérez" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Profesión</label>
                      <input 
                        type="text" 
                        value={spanishData.personalInfo.profession} 
                        onChange={(e) => handlePersonalInfoChange("profession", e.target.value)}
                        placeholder="Docente de informática" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={spanishData.personalInfo.email} 
                        onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                        placeholder="juan.perez@example.com" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Teléfono</label>
                      <input 
                        type="text" 
                        value={spanishData.personalInfo.phone} 
                        onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                        placeholder="+34 600 112 233" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ubicación</label>
                      <input 
                        type="text" 
                        value={spanishData.personalInfo.location} 
                        onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                        placeholder="Madrid, España" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sitio Web</label>
                      <input 
                        type="text" 
                        value={spanishData.personalInfo.website} 
                        onChange={(e) => handlePersonalInfoChange("website", e.target.value)}
                        placeholder="juanperez.dev" 
                        className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Perfil Profesional */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "profile" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "profile" ? "" : "profile")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> 2. Perfil Profesional</span>
                <span className="text-[10px] text-slate-400">{activeSection === "profile" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "profile" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Extracto del perfil profesional (en Español)</label>
                    <textarea 
                      value={spanishData.profile}
                      onChange={(e) => handleProfileChange(e.target.value)}
                      placeholder="Docente de informática apasionado por las redes y desarrollo web..."
                      className="w-full h-28 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Formación Académica */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "education" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "education" ? "" : "education")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /> 3. Formación Académica</span>
                <span className="text-[10px] text-slate-400">{activeSection === "education" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "education" && (
                <div className="p-4 flex flex-col gap-4 text-xs">
                  {spanishData.education.map((edu, idx) => (
                    <div key={edu.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 relative">
                      <button 
                        onClick={() => deleteEducation(edu.id)}
                        className="absolute top-2 right-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-[10px] text-blue-600">Estudios {idx + 1}</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Título / Carrera</label>
                          <input 
                            type="text" 
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                            placeholder="Ingeniería Informática"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Institución</label>
                          <input 
                            type="text" 
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                            placeholder="Universidad Complutense"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha Inicio</label>
                          <input 
                            type="month" 
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha Fin (o vacío)</label>
                          <input 
                            type="text" 
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                            placeholder="2022 o Presente"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Detalles / Logros (en Español)</label>
                        <textarea 
                          value={edu.description}
                          onChange={(e) => updateEducation(edu.id, "description", e.target.value)}
                          placeholder="Especialización en Ingeniería del Software..."
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-14 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={addEducation} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-4 h-4 text-blue-500" /> Añadir Estudios
                  </button>
                </div>
              )}
            </div>

            {/* 4. Experiencia Laboral */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "experience" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "experience" ? "" : "experience")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-600" /> 4. Experiencia Laboral</span>
                <span className="text-[10px] text-slate-400">{activeSection === "experience" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "experience" && (
                <div className="p-4 flex flex-col gap-4 text-xs">
                  {spanishData.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 relative">
                      <button 
                        onClick={() => deleteExperience(exp.id)}
                        className="absolute top-2 right-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-[10px] text-blue-600">Trabajo {idx + 1}</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Puesto / Cargo</label>
                          <input 
                            type="text" 
                            value={exp.position}
                            onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                            placeholder="Desarrollador React"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Empresa</label>
                          <input 
                            type="text" 
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                            placeholder="TecnoSoluciones"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha Inicio</label>
                          <input 
                            type="text" 
                            value={exp.startDate}
                            placeholder="2020-09"
                            onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha Fin (o vacío)</label>
                          <input 
                            type="text" 
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                            placeholder="Presente"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descripción de funciones (en Español)</label>
                        <textarea 
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                          placeholder="Impartición de clases, desarrollo web con React..."
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-14 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={addExperience} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-4 h-4 text-blue-500" /> Añadir Experiencia
                  </button>
                </div>
              )}
            </div>

            {/* 5. Habilidades */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "skills" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "skills" ? "" : "skills")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><Layout className="w-4 h-4 text-blue-600" /> 5. Habilidades</span>
                <span className="text-[10px] text-slate-400">{activeSection === "skills" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "skills" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  {spanishData.skills.map((skill) => (
                    <div key={skill.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input 
                        type="text" 
                        value={skill.name}
                        onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                        placeholder="React / Redes / etc."
                        className="flex-1 bg-white dark:bg-slate-850 p-1.5 rounded border border-slate-200 dark:border-slate-700 outline-none text-[11px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <select 
                        value={skill.level}
                        onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                        className="bg-white dark:bg-slate-850 p-1.5 rounded border border-slate-200 dark:border-slate-700 outline-none text-[10px] font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Principiante">Básico</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                        <option value="Experto">Experto</option>
                      </select>
                      <button onClick={() => deleteSkill(skill.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addSkill} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Añadir Habilidad
                  </button>
                </div>
              )}
            </div>

            {/* 6. Idiomas */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "languages" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "languages" ? "" : "languages")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><Languages className="w-4 h-4 text-blue-600" /> 6. Idiomas</span>
                <span className="text-[10px] text-slate-400">{activeSection === "languages" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "languages" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  {spanishData.languages.map((lan) => (
                    <div key={lan.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input 
                        type="text" 
                        value={lan.name}
                        onChange={(e) => updateLanguage(lan.id, "name", e.target.value)}
                        placeholder="Español, Inglés..."
                        className="flex-1 bg-white dark:bg-slate-850 p-1.5 rounded border border-slate-200 dark:border-slate-700 outline-none text-[11px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <select 
                        value={lan.level}
                        onChange={(e) => updateLanguage(lan.id, "level", e.target.value)}
                        className="bg-white dark:bg-slate-850 p-1.5 rounded border border-slate-200 dark:border-slate-700 outline-none text-[10px] font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Nativo">Nativo</option>
                        <option value="Fluido">Fluido / C1 / C2</option>
                        <option value="Intermedio">Intermedio / B2</option>
                        <option value="Básico">Básico</option>
                      </select>
                      <button onClick={() => deleteLanguage(lan.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addLanguage} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Añadir Idioma
                  </button>
                </div>
              )}
            </div>

            {/* 7. Certificaciones */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "certifications" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "certifications" ? "" : "certifications")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><Award className="w-4 h-4 text-blue-600" /> 7. Certificaciones</span>
                <span className="text-[10px] text-slate-400">{activeSection === "certifications" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "certifications" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  {spanishData.certifications.map((cert) => (
                    <div key={cert.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative">
                      <button onClick={() => deleteCertification(cert.id)} className="absolute top-1.5 right-1.5 text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Certificación (Español)</label>
                        <input 
                          type="text" 
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                          placeholder="Certificación Cisco CCNA"
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Emisor</label>
                          <input 
                            type="text" 
                            value={cert.issuer}
                            onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                            placeholder="Cisco Systems"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha / Año</label>
                          <input 
                            type="text" 
                            value={cert.date}
                            onChange={(e) => updateCertification(cert.id, "date", e.target.value)}
                            placeholder="2021"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addCertification} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Añadir Certificación
                  </button>
                </div>
              )}
            </div>

            {/* 8. Proyectos */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "projects" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "projects" ? "" : "projects")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><Layout className="w-4 h-4 text-blue-600" /> 8. Proyectos destacados</span>
                <span className="text-[10px] text-slate-400">{activeSection === "projects" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "projects" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  {spanishData.projects.map((proj) => (
                    <div key={proj.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative">
                      <button onClick={() => deleteProject(proj.id)} className="absolute top-1.5 right-1.5 text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Proyecto</label>
                        <input 
                          type="text" 
                          value={proj.name}
                          onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                          placeholder="Plataforma AprendeProg"
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Enlace URL</label>
                        <input 
                          type="text" 
                          value={proj.link}
                          onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                          placeholder="https://aprendeprog.dev"
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descripción (en Español)</label>
                        <textarea 
                          value={proj.description}
                          onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                          placeholder="Aplicación web interactiva de programación..."
                          className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-14 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={addProject} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Añadir Proyecto
                  </button>
                </div>
              )}
            </div>

            {/* 9. Referencias */}
            <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeSection === "references" ? "ring-1 ring-blue-500 border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button 
                onClick={() => setActiveSection(activeSection === "references" ? "" : "references")}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs bg-slate-100/30 dark:bg-slate-800/20 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              >
                <span className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> 9. Referencias recomendadas</span>
                <span className="text-[10px] text-slate-400">{activeSection === "references" ? "Cerrar" : "Expandir"}</span>
              </button>
              {activeSection === "references" && (
                <div className="p-4 flex flex-col gap-3 text-xs">
                  {spanishData.references.map((ref) => (
                    <div key={ref.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative">
                      <button onClick={() => deleteReference(ref.id)} className="absolute top-1.5 right-1.5 text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Referente</label>
                          <input 
                            type="text" 
                            value={ref.name}
                            onChange={(e) => updateReference(ref.id, "name", e.target.value)}
                            placeholder="Dra. Sofía Martínez"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cargo / Relación (Español)</label>
                          <input 
                            type="text" 
                            value={ref.relation}
                            onChange={(e) => updateReference(ref.id, "relation", e.target.value)}
                            placeholder="Directora Académica"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Teléfono</label>
                          <input 
                            type="text" 
                            value={ref.phone}
                            onChange={(e) => updateReference(ref.id, "phone", e.target.value)}
                            placeholder="+34 699..."
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email</label>
                          <input 
                            type="email" 
                            value={ref.email}
                            onChange={(e) => updateReference(ref.id, "email", e.target.value)}
                            placeholder="sofia@mail.com"
                            className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addReference} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/60 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Añadir Referencia
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* =========================================================
            COLS 2 & 3: Centered Preview Panels (8 Columns on XL)
            ========================================================= */}
        <section className="xl:col-span-8 flex flex-col h-full bg-slate-900/10 dark:bg-slate-950/20">
          
          {/* Workspace Config Bar */}
          <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-blue-600" /> Plantilla:
              </span>
              <div className="flex gap-1">
                {(["professional", "modern", "minimalist", "executive", "creative"] as TemplateType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg border capitalize transition-all ${template === t ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >
                    {t === "professional" ? "Profesional" : t === "modern" ? "Moderna" : t === "minimalist" ? "Minimalista" : t === "executive" ? "Ejecutiva" : "Creativa"}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zoom:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setZoom(Math.max(0.4, zoom - 0.05))} 
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10.5px] font-black px-1.5 font-mono min-w-[38px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={() => setZoom(Math.min(1.2, zoom + 0.05))}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setZoom(0.65)} 
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-l border-slate-200 dark:border-slate-700 pl-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

          {/* Interactive Previews Area (Side-by-Side scrolling canvas) */}
          <div className="flex-1 overflow-auto p-6 flex flex-row justify-center gap-8 min-w-0 select-none bg-slate-200/50 dark:bg-slate-950/40 relative">
            
            {/* Spanish Preview Column */}
            <div 
              className="flex flex-col gap-3 relative shrink-0"
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
              }}
            >
              {/* Header Label / Toolbar */}
              <div className={`flex justify-between items-center px-4 py-2 rounded-xl text-xs shrink-0 select-none shadow-sm border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">🇪🇸 Español</span>
                  <span className="pill bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Vista Previa</span>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleDownloadPdf("ES")}
                    disabled={pdfGenerating !== null}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold text-[9.5px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button 
                    onClick={() => handleDownloadDocx("ES")}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-2.5 py-1 rounded font-bold text-[9.5px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Word
                  </button>
                </div>
              </div>

              {/* Real A4 Canvas Wrapper */}
              <div 
                id="cv-preview-es"
                className="overflow-hidden rounded-2xl shadow-xl transition-transform origin-top-left shrink-0 bg-white"
                style={{
                  width: "794px",
                  height: "1123px",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <CVPreview 
                  data={spanishData} 
                  language="ES" 
                  template={template} 
                  translatingFields={new Set()} 
                />
              </div>
            </div>

            {/* English Preview Column */}
            <div 
              className="flex flex-col gap-3 relative shrink-0"
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
              }}
            >
              {/* Header Label / Toolbar */}
              <div className={`flex justify-between items-center px-4 py-2 rounded-xl text-xs shrink-0 select-none shadow-sm border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">🇬🇧 English</span>
                  <span className="pill bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">Auto-Translate</span>
                  {translatingFields.size > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleDownloadPdf("EN")}
                    disabled={pdfGenerating !== null}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold text-[9.5px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button 
                    onClick={() => handleDownloadDocx("EN")}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-2.5 py-1 rounded font-bold text-[9.5px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Word
                  </button>
                </div>
              </div>

              {/* Real A4 Canvas Wrapper */}
              <div 
                id="cv-preview-en"
                className="overflow-hidden rounded-2xl shadow-xl transition-transform origin-top-left shrink-0 bg-white"
                style={{
                  width: "794px",
                  height: "1123px",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <CVPreview 
                  data={englishData} 
                  language="EN" 
                  template={template} 
                  translatingFields={translatingFields} 
                />
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-3.5 rounded-xl shadow-lg flex items-start gap-2.5 text-xs font-medium pointer-events-auto border ${n.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400" : n.type === "error" ? "bg-rose-50 dark:bg-rose-950/80 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400" : "bg-blue-50 dark:bg-blue-950/80 border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-400"}`}
            >
              {n.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : n.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{n.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
