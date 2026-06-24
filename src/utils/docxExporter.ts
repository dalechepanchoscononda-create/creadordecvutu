import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { CVData } from "../types";

export function generateDocx(data: CVData, language: "ES" | "EN"): Promise<Blob> {
  const isEs = language === "ES";

  // Text mappings
  const titles = {
    profile: isEs ? "PERFIL PROFESIONAL" : "PROFESSIONAL PROFILE",
    experience: isEs ? "EXPERIENCIA LABORAL" : "WORK EXPERIENCE",
    education: isEs ? "FORMACIÓN ACADÉMICA" : "EDUCATION",
    skills: isEs ? "HABILIDADES" : "SKILLS",
    languages: isEs ? "IDIOMAS" : "LANGUAGES",
    certifications: isEs ? "CERTIFICACIONES" : "CERTIFICATIONS",
    projects: isEs ? "PROYECTOS" : "PROJECTS",
    references: isEs ? "REFERENCIAS" : "REFERENCES",
    contact: isEs ? "DATOS PERSONALES" : "PERSONAL INFORMATION",
    to: isEs ? "a" : "to",
    present: isEs ? "Presente" : "Present",
  };

  const paragraphs: Paragraph[] = [];

  // 1. Name & Profession Header
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: data.personalInfo.name.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: "1A365D", // Dark navy
          font: "Arial",
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: data.personalInfo.profession,
          bold: true,
          size: 24, // 12pt
          color: "4A5568", // Gray
          font: "Arial",
        }),
      ],
    })
  );

  // 2. Contact details
  const contactText = [
    data.personalInfo.email && `Email: ${data.personalInfo.email}`,
    data.personalInfo.phone && `Tel: ${data.personalInfo.phone}`,
    data.personalInfo.location && `Loc: ${data.personalInfo.location}`,
    data.personalInfo.website && `Web: ${data.personalInfo.website}`,
  ].filter(Boolean).join("  |  ");

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: contactText,
          size: 18, // 9pt
          color: "718096",
          font: "Arial",
        }),
      ],
    })
  );

  // Helper for Section Headers
  const addSectionHeader = (title: string) => {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 22, // 11pt
            color: "1A365D",
            font: "Arial",
          }),
        ],
      })
    );
  };

  // 3. Professional Profile Section
  if (data.profile && data.profile.trim() !== "") {
    addSectionHeader(titles.profile);
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: data.profile,
            size: 20, // 10pt
            font: "Arial",
            color: "2D3748",
          }),
        ],
      })
    );
  }

  // 4. Experience Section
  if (data.experience && data.experience.length > 0) {
    addSectionHeader(titles.experience);
    data.experience.forEach((item) => {
      const dateStr = `${item.startDate} ${titles.to} ${item.endDate || titles.present}`;
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: `${item.position} `,
              bold: true,
              size: 20,
              font: "Arial",
              color: "2D3748",
            }),
            new TextRun({
              text: `@ ${item.company} `,
              bold: true,
              italics: true,
              size: 20,
              font: "Arial",
              color: "4A5568",
            }),
            new TextRun({
              text: `(${dateStr})`,
              size: 18,
              font: "Arial",
              color: "718096",
            }),
          ],
        })
      );
      if (item.description && item.description.trim() !== "") {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 150 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: item.description,
                size: 20,
                font: "Arial",
                color: "2D3748",
              }),
            ],
          })
        );
      }
    });
  }

  // 5. Education Section
  if (data.education && data.education.length > 0) {
    addSectionHeader(titles.education);
    data.education.forEach((item) => {
      const dateStr = `${item.startDate} ${titles.to} ${item.endDate || titles.present}`;
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: `${item.degree} `,
              bold: true,
              size: 20,
              font: "Arial",
              color: "2D3748",
            }),
            new TextRun({
              text: `@ ${item.institution} `,
              italics: true,
              bold: true,
              size: 20,
              font: "Arial",
              color: "4A5568",
            }),
            new TextRun({
              text: `(${dateStr})`,
              size: 18,
              font: "Arial",
              color: "718096",
            }),
          ],
        })
      );
      if (item.description && item.description.trim() !== "") {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 150 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: item.description,
                size: 20,
                font: "Arial",
                color: "2D3748",
              }),
            ],
          })
        );
      }
    });
  }

  // 6. Skills Section
  if (data.skills && data.skills.length > 0) {
    addSectionHeader(titles.skills);
    const skillsText = data.skills
      .map((s) => `${s.name} (${s.level})`)
      .join(", ");
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: skillsText,
            size: 20,
            font: "Arial",
            color: "2D3748",
          }),
        ],
      })
    );
  }

  // 7. Languages Section
  if (data.languages && data.languages.length > 0) {
    addSectionHeader(titles.languages);
    const languagesText = data.languages
      .map((l) => `${l.name} (${l.level})`)
      .join(", ");
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: languagesText,
            size: 20,
            font: "Arial",
            color: "2D3748",
          }),
        ],
      })
    );
  }

  // 8. Certifications Section
  if (data.certifications && data.certifications.length > 0) {
    addSectionHeader(titles.certifications);
    data.certifications.forEach((item) => {
      const dateText = item.date ? ` (${item.date})` : "";
      paragraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `${item.name} - `,
              bold: true,
              size: 20,
              font: "Arial",
              color: "2D3748",
            }),
            new TextRun({
              text: `${item.issuer}${dateText}`,
              size: 20,
              font: "Arial",
              color: "4A5568",
            }),
          ],
        })
      );
    });
  }

  // 9. Projects Section
  if (data.projects && data.projects.length > 0) {
    addSectionHeader(titles.projects);
    data.projects.forEach((item) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: item.name,
              bold: true,
              size: 20,
              font: "Arial",
              color: "2D3748",
            }),
            item.link &&
              new TextRun({
                text: ` (${item.link})`,
                size: 16,
                font: "Arial",
                color: "3182CE",
              }),
          ].filter(Boolean) as TextRun[],
        })
      );
      if (item.description && item.description.trim() !== "") {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 150 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: item.description,
                size: 20,
                font: "Arial",
                color: "2D3748",
              }),
            ],
          })
        );
      }
    });
  }

  // 10. References Section
  if (data.references && data.references.length > 0) {
    addSectionHeader(titles.references);
    data.references.forEach((item) => {
      const contactStr = [item.phone, item.email].filter(Boolean).join(" | ");
      paragraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `${item.name} `,
              bold: true,
              size: 20,
              font: "Arial",
              color: "2D3748",
            }),
            new TextRun({
              text: `(${item.relation})`,
              italics: true,
              size: 18,
              font: "Arial",
              color: "4A5568",
            }),
            contactStr &&
              new TextRun({
                text: ` - ${contactStr}`,
                size: 18,
                font: "Arial",
                color: "718096",
              }),
          ].filter(Boolean) as TextRun[],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}
