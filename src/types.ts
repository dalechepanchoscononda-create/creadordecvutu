export interface PersonalInfo {
  photo: string;
  name: string;
  profession: string;
  email: string;
  phone: string;
  website: string;
  location: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: string; // e.g. "Básico", "Intermedio", "Avanzado", "Experto"
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string; // e.g. "Nativo", "Fluido", "Intermedio", "Básico"
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  profile: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
  references: ReferenceItem[];
}

export type TemplateType = 'professional' | 'modern' | 'minimalist' | 'executive' | 'creative';

export interface ThemeMode {
  darkMode: boolean;
}
