import { CVData } from "./types";

export const initialSpanishData: CVData = {
  personalInfo: {
    photo: "", // Can be filled by placeholder in UI or base64 upload
    name: "Mateo Silva",
    profession: "Docente de informática y desarrollador web",
    email: "mateo.silva@example.com",
    phone: "+34 612 345 678",
    website: "mateosilva.dev",
    location: "Madrid, España",
  },
  profile: "Docente de informática con experiencia en redes y desarrollo web. Apasionado por la enseñanza de nuevas tecnologías, la programación web y el diseño de sistemas interactivos modernos. Comprometido con el aprendizaje activo y el desarrollo de habilidades técnicas en jóvenes estudiantes.",
  education: [
    {
      id: "edu-1",
      institution: "Universidad Complutense de Madrid",
      degree: "Grado en Ingeniería Informática",
      startDate: "2018-09",
      endDate: "2022-06",
      description: "Especialización en Ingeniería del Software. Graduado con mención de honor. Participante activo en el club de robótica de la facultad.",
    }
  ],
  experience: [
    {
      id: "exp-1",
      company: "Colegio San Ignacio",
      position: "Profesor de Computación y Robótica",
      startDate: "2022-09",
      endDate: "Presente",
      description: "Impartición de clases de desarrollo web, algoritmos y redes. Fundador de la liga escolar de robótica competitiva. Diseño del currículo académico tecnológico.",
    },
    {
      id: "exp-2",
      company: "TecnoSoluciones SL",
      position: "Desarrollador Frontend React",
      startDate: "2020-07",
      endDate: "2022-08",
      description: "Diseño e implementación de interfaces de usuario modernas utilizando React, Tailwind CSS y TypeScript. Optimización de tiempos de carga en un 30% para clientes corporativos.",
    }
  ],
  skills: [
    { id: "sk-1", name: "Desarrollo Frontend (React, Vue)", level: "Experto" },
    { id: "sk-2", name: "Configuración de Redes y Seguridad", level: "Avanzado" },
    { id: "sk-3", name: "Metodologías Activas de Enseñanza", level: "Avanzado" },
    { id: "sk-4", name: "Bases de Datos (SQL, NoSQL)", level: "Intermedio" }
  ],
  languages: [
    { id: "lan-1", name: "Español", level: "Nativo" },
    { id: "lan-2", name: "Inglés", level: "Avanzado (C1)" }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Certificación Cisco CCNA (Redes)",
      issuer: "Cisco Systems",
      date: "2021-11",
    },
    {
      id: "cert-2",
      name: "Desarrollador Frontend Profesional Meta",
      issuer: "Coursera / Meta",
      date: "2023-04",
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Plataforma Educativa 'AprendeProg'",
      description: "Aplicación web interactiva donde estudiantes aprenden programación básica con ejercicios prácticos y calificación en tiempo real.",
      link: "https://aprendeprog.dev",
    },
    {
      id: "proj-2",
      name: "Sistema Automatizado de Asistencia Escolar",
      description: "Desarrollo de un prototipo IoT con lector NFC y base de datos local para simplificar el registro de asistencia estudiantil.",
      link: "https://github.com/mateo/school-attendance",
    }
  ],
  references: [
    {
      id: "ref-1",
      name: "Dra. Sofía Martínez",
      relation: "Directora Académica del Colegio San Ignacio",
      phone: "+34 699 888 777",
      email: "s.martinez@sanignacio.edu",
    }
  ],
};

export const initialEnglishData: CVData = {
  personalInfo: {
    photo: "",
    name: "Mateo Silva",
    profession: "Computer science teacher and web developer",
    email: "mateo.silva@example.com",
    phone: "+34 612 345 678",
    website: "mateosilva.dev",
    location: "Madrid, Spain",
  },
  profile: "Computer science teacher with experience in networking and web development. Passionate about teaching new technologies, web programming, and designing modern interactive systems. Committed to active learning and developing technical skills in young students.",
  education: [
    {
      id: "edu-1",
      institution: "Complutense University of Madrid",
      degree: "Bachelor's Degree in Computer Engineering",
      startDate: "2018-09",
      endDate: "2022-06",
      description: "Specialization in Software Engineering. Graduated with honors. Active participant in the faculty's robotics club.",
    }
  ],
  experience: [
    {
      id: "exp-1",
      company: "San Ignacio School",
      position: "Computer Science and Robotics Teacher",
      startDate: "2022-09",
      endDate: "Present",
      description: "Teaching web development, algorithms, and networking classes. Founder of the competitive school robotics league. Designed the technology academic curriculum.",
    },
    {
      id: "exp-2",
      company: "TecnoSoluciones SL",
      position: "React Frontend Developer",
      startDate: "2020-07",
      endDate: "2022-08",
      description: "Design and implementation of modern user interfaces using React, Tailwind CSS, and TypeScript. Optimized load times by 30% for corporate clients.",
    }
  ],
  skills: [
    { id: "sk-1", name: "Frontend Development (React, Vue)", level: "Expert" },
    { id: "sk-2", name: "Network Configuration and Security", level: "Advanced" },
    { id: "sk-3", name: "Active Teaching Methodologies", level: "Advanced" },
    { id: "sk-4", name: "Databases (SQL, NoSQL)", level: "Intermediate" }
  ],
  languages: [
    { id: "lan-1", name: "Spanish", level: "Native" },
    { id: "lan-2", name: "English", level: "Advanced (C1)" }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Cisco CCNA Certification (Networking)",
      issuer: "Cisco Systems",
      date: "2021-11",
    },
    {
      id: "cert-2",
      name: "Meta Professional Frontend Developer",
      issuer: "Coursera / Meta",
      date: "2023-04",
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Educational Platform 'AprendeProg'",
      description: "Interactive web application where students learn basic programming with hands-on exercises and real-time grading.",
      link: "https://aprendeprog.dev",
    },
    {
      id: "proj-2",
      name: "Automated School Attendance System",
      description: "Development of an IoT prototype with NFC reader and local database to simplify student attendance logging.",
      link: "https://github.com/mateo/school-attendance",
    }
  ],
  references: [
    {
      id: "ref-1",
      name: "Dr. Sofía Martínez",
      relation: "Academic Director at San Ignacio School",
      phone: "+34 699 888 777",
      email: "s.martinez@sanignacio.edu",
    }
  ],
};
