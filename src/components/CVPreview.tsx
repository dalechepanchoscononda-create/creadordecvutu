import React from "react";
import { CVData, TemplateType } from "../types";
import { 
  Mail, Phone, Globe, MapPin, Calendar, 
  Award, Briefcase, GraduationCap, Link2, User, Sparkles
} from "lucide-react";

interface CVPreviewProps {
  data: CVData;
  language: "ES" | "EN";
  template: TemplateType;
  translatingFields: Set<string>;
}

export const CVPreview: React.FC<CVPreviewProps> = ({
  data,
  language,
  template,
  translatingFields,
}) => {
  const isEs = language === "ES";

  // Mapped static header labels
  const headers = {
    personal: isEs ? "Datos Personales" : "Personal Information",
    profile: isEs ? "Perfil Profesional" : "Professional Profile",
    education: isEs ? "Formación Académica" : "Education",
    experience: isEs ? "Experiencia Laboral" : "Work Experience",
    skills: isEs ? "Habilidades" : "Skills",
    languages: isEs ? "Idiomas" : "Languages",
    certifications: isEs ? "Certificaciones" : "Certifications",
    projects: isEs ? "Proyectos" : "Projects",
    references: isEs ? "Referencias" : "References",
    to: isEs ? "a" : "to",
    present: isEs ? "Presente" : "Present",
  };

  const isTranslating = (fieldPath: string) => translatingFields.has(fieldPath);

  // Field renderer with "translating" glow
  const renderField = (content: string, fieldPath: string, className = "", placeholder = "") => {
    const translating = isTranslating(fieldPath);
    return (
      <span className={`relative transition-all duration-300 ${translating ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 animate-pulse px-1 rounded" : ""} ${className}`}>
        {translating && (
          <span className="absolute -top-4 right-0 text-[9px] bg-blue-500 text-white font-mono px-1 rounded flex items-center gap-0.5 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 animate-spin" /> Translating...
          </span>
        )}
        {content || <span className="text-gray-400 italic">{placeholder}</span>}
      </span>
    );
  };

  // Avatar component
  const Avatar = () => (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white shadow bg-gray-100 flex items-center justify-center shrink-0">
      {data.personalInfo.photo ? (
        <img
          src={data.personalInfo.photo}
          alt={data.personalInfo.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <User className="w-12 h-12 text-gray-400" />
      )}
    </div>
  );

  // -----------------------------------------------------------------
  // 1. PROFESSIONAL TEMPLATE (Two-Column Sidebar)
  // -----------------------------------------------------------------
  const renderProfessional = () => {
    return (
      <div className="w-full h-full bg-white text-slate-800 flex flex-row">
        {/* Sidebar (Left) */}
        <div className="w-[30%] bg-slate-900 text-slate-200 p-5 flex flex-col gap-5 text-[11px]">
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar />
            <div>
              <h2 className="font-bold text-[15px] leading-tight text-white">{data.personalInfo.name || "Tu Nombre"}</h2>
              <p className="text-[10px] text-slate-300 font-medium mt-1">
                {renderField(data.personalInfo.profession, "personalInfo.profession", "", "Profesión")}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-2 mt-2">
            <h3 className="font-bold text-[11px] text-blue-400 uppercase tracking-wider border-b border-slate-700 pb-1">
              {headers.personal}
            </h3>
            <div className="flex flex-col gap-1.5 text-[10px]">
              {data.personalInfo.email && (
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{renderField(data.personalInfo.location, "personalInfo.location")}</span>
                </div>
              )}
              {data.personalInfo.website && (
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{data.personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {data.skills.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-[11px] text-blue-400 uppercase tracking-wider border-b border-slate-700 pb-1">
                {headers.skills}
              </h3>
              <div className="flex flex-col gap-2">
                {data.skills.map((skill, index) => (
                  <div key={skill.id || index} className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-200">
                      {renderField(skill.name, `skills.${index}.name`)}
                    </span>
                    {/* Visual skill bars */}
                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-400 h-full rounded-full" 
                        style={{
                          width: 
                            skill.level === "Experto" ? "100%" :
                            skill.level === "Avanzado" ? "80%" :
                            skill.level === "Intermedio" ? "60%" : "35%"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {data.languages.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-[11px] text-blue-400 uppercase tracking-wider border-b border-slate-700 pb-1">
                {headers.languages}
              </h3>
              <div className="flex flex-col gap-1.5">
                {data.languages.map((lan, index) => (
                  <div key={lan.id || index} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-200">{lan.name}</span>
                    <span className="text-slate-400 font-mono text-[9px]">{lan.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References Section */}
          {data.references.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto">
              <h3 className="font-bold text-[11px] text-blue-400 uppercase tracking-wider border-b border-slate-700 pb-1">
                {headers.references}
              </h3>
              <div className="flex flex-col gap-2">
                {data.references.map((ref, index) => (
                  <div key={ref.id || index} className="flex flex-col gap-0.5 text-[9px] bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    <span className="font-bold text-white">{ref.name}</span>
                    <span className="text-slate-300 italic">{renderField(ref.relation, `references.${index}.relation`)}</span>
                    {ref.phone && <span className="text-slate-400">{ref.phone}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content (Right) */}
        <div className="w-[70%] p-6 flex flex-col gap-5 text-[11px]">
          {/* Profile Section */}
          {data.profile && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[13px] font-bold text-slate-900 border-b-2 border-blue-950 pb-0.5 uppercase tracking-wide">
                {headers.profile}
              </h3>
              <p className="text-slate-600 leading-relaxed text-justify text-[10.5px]">
                {renderField(data.profile, "profile")}
              </p>
            </div>
          )}

          {/* Experience Section */}
          {data.experience.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-slate-900 border-b-2 border-blue-950 pb-0.5 uppercase tracking-wide">
                {headers.experience}
              </h3>
              <div className="flex flex-col gap-3">
                {data.experience.map((exp, index) => (
                  <div key={exp.id || index} className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-[11.5px]">
                          {renderField(exp.position, `experience.${index}.position`)}
                        </h4>
                        <span className="text-blue-800 font-semibold">{exp.company}</span>
                      </div>
                      <span className="text-slate-500 text-[9.5px] shrink-0 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exp.startDate} - {exp.endDate || headers.present}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-justify text-[10px]">
                      {renderField(exp.description, `experience.${index}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {data.education.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-slate-900 border-b-2 border-blue-950 pb-0.5 uppercase tracking-wide">
                {headers.education}
              </h3>
              <div className="flex flex-col gap-3">
                {data.education.map((edu, index) => (
                  <div key={edu.id || index} className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-[11.5px]">
                          {renderField(edu.degree, `education.${index}.degree`)}
                        </h4>
                        <span className="text-slate-700 font-medium">{edu.institution}</span>
                      </div>
                      <span className="text-slate-500 text-[9.5px] shrink-0 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {edu.startDate} - {edu.endDate || headers.present}
                      </span>
                    </div>
                    {edu.description && (
                      <p className="text-slate-600 leading-relaxed text-justify text-[10px]">
                        {renderField(edu.description, `education.${index}.description`)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {data.projects.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-slate-900 border-b-2 border-blue-950 pb-0.5 uppercase tracking-wide">
                {headers.projects}
              </h3>
              <div className="flex flex-col gap-3">
                {data.projects.map((proj, index) => (
                  <div key={proj.id || index} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 text-[11px]">
                        {renderField(proj.name, `projects.${index}.name`)}
                      </h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5 text-[9.5px]">
                          <Link2 className="w-3 h-3" /> {proj.link}
                        </a>
                      )}
                    </div>
                    <p className="text-slate-600 text-[10px] leading-relaxed">
                      {renderField(proj.description, `projects.${index}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {data.certifications.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-slate-900 border-b-2 border-blue-950 pb-0.5 uppercase tracking-wide">
                {headers.certifications}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {data.certifications.map((cert, index) => (
                  <div key={cert.id || index} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100 text-[9.5px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Award className="w-3 h-3 text-blue-800 shrink-0" />
                      {renderField(cert.name, `certifications.${index}.name`)}
                    </span>
                    <span className="text-slate-500 mt-0.5">{cert.issuer} ({cert.date})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 2. MODERN TEMPLATE (Top Banner + Split Columns)
  // -----------------------------------------------------------------
  const renderModern = () => {
    return (
      <div className="w-full h-full bg-white text-slate-800 flex flex-col">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 flex justify-between items-center relative">
          <div className="flex flex-col gap-1.5 z-10">
            <h1 className="font-bold text-[24px] tracking-tight">{data.personalInfo.name || "Tu Nombre"}</h1>
            <p className="text-[13px] text-indigo-200 font-medium tracking-wide">
              {renderField(data.personalInfo.profession, "personalInfo.profession", "", "Profesión")}
            </p>
            {/* Quick Contact Row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-300">
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-indigo-300" /> {data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-300" /> {data.personalInfo.phone}</span>}
              {data.personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-300" /> {renderField(data.personalInfo.location, "personalInfo.location")}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-indigo-300" /> {data.personalInfo.website}</span>}
            </div>
          </div>
          <div className="z-10 bg-white p-1 rounded-full shadow-lg">
            <Avatar />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-5 text-[11px]">
          {/* Column Left (8 cols) */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Profile */}
            {data.profile && (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[12px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
                  {headers.profile}
                </h3>
                <p className="text-slate-600 leading-relaxed text-justify text-[10.5px]">
                  {renderField(data.profile, "profile")}
                </p>
              </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[12px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
                  {headers.experience}
                </h3>
                <div className="flex flex-col gap-3.5">
                  {data.experience.map((exp, index) => (
                    <div key={exp.id || index} className="flex gap-2 text-[10px]">
                      <div className="w-[80px] shrink-0 text-slate-500 font-semibold text-[9.5px]">
                        {exp.startDate} - <br /> {exp.endDate || headers.present}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <h4 className="font-bold text-slate-900 text-[11px]">
                          {renderField(exp.position, `experience.${index}.position`)}
                        </h4>
                        <span className="text-indigo-600 font-medium text-[9.5px]">{exp.company}</span>
                        <p className="text-slate-600 leading-relaxed text-justify">
                          {renderField(exp.description, `experience.${index}.description`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[12px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
                  {headers.education}
                </h3>
                <div className="flex flex-col gap-3.5">
                  {data.education.map((edu, index) => (
                    <div key={edu.id || index} className="flex gap-2 text-[10px]">
                      <div className="w-[80px] shrink-0 text-slate-500 font-semibold text-[9.5px]">
                        {edu.startDate} - <br /> {edu.endDate || headers.present}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <h4 className="font-bold text-slate-900 text-[11px]">
                          {renderField(edu.degree, `education.${index}.degree`)}
                        </h4>
                        <span className="text-indigo-600 font-medium text-[9.5px]">{edu.institution}</span>
                        {edu.description && (
                          <p className="text-slate-600 leading-relaxed text-justify">
                            {renderField(edu.description, `education.${index}.description`)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column Right (4 cols) */}
          <div className="col-span-4 flex flex-col gap-4 border-l border-slate-100 pl-4">
            {/* Skills */}
            {data.skills.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  {headers.skills}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((skill, index) => (
                    <span key={skill.id || index} className="bg-indigo-50 text-indigo-900 text-[9.5px] font-medium px-2 py-1 rounded-md border border-indigo-100">
                      {renderField(skill.name, `skills.${index}.name`)} <span className="text-indigo-400 text-[8.5px]">({skill.level})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  {headers.languages}
                </h3>
                <div className="flex flex-col gap-1.5 text-[10px]">
                  {data.languages.map((lan, index) => (
                    <div key={lan.id || index} className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="font-medium text-slate-800">{lan.name}</span>
                      <span className="text-indigo-600 font-semibold text-[9px]">{lan.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  {headers.projects}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {data.projects.map((proj, index) => (
                    <div key={proj.id || index} className="flex flex-col gap-0.5 text-[9.5px]">
                      <span className="font-bold text-slate-800 truncate">
                        {renderField(proj.name, `projects.${index}.name`)}
                      </span>
                      <p className="text-slate-600 text-[9px] leading-snug">
                        {renderField(proj.description, `projects.${index}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {data.certifications.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  {headers.certifications}
                </h3>
                <div className="flex flex-col gap-2">
                  {data.certifications.map((cert, index) => (
                    <div key={cert.id || index} className="text-[9px] flex flex-col">
                      <span className="font-bold text-slate-800">{renderField(cert.name, `certifications.${index}.name`)}</span>
                      <span className="text-slate-500">{cert.issuer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* References */}
            {data.references.length > 0 && (
              <div className="flex flex-col gap-2 mt-auto">
                <h3 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                  {headers.references}
                </h3>
                <div className="flex flex-col gap-2">
                  {data.references.map((ref, index) => (
                    <div key={ref.id || index} className="text-[9px] flex flex-col bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="font-bold text-slate-800">{ref.name}</span>
                      <span className="text-slate-500 italic truncate">{renderField(ref.relation, `references.${index}.relation`)}</span>
                      {ref.phone && <span className="text-indigo-600 font-mono mt-0.5">{ref.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 3. MINIMALIST TEMPLATE (Single Column, High Contrast, Negative Space)
  // -----------------------------------------------------------------
  const renderMinimalist = () => {
    return (
      <div className="w-full h-full bg-white text-slate-900 p-8 flex flex-col gap-4 text-[10.5px]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-3">
          <div className="flex flex-col gap-1 max-w-[80%]">
            <h1 className="font-extrabold text-[22px] tracking-tight text-slate-950 uppercase">{data.personalInfo.name || "Tu Nombre"}</h1>
            <p className="text-[11.5px] font-medium text-slate-700 tracking-wider uppercase font-mono">
              {renderField(data.personalInfo.profession, "personalInfo.profession", "", "Profesión")}
            </p>
            {/* Quick Contact bar */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[9.5px] text-slate-600 font-mono">
              {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
              {data.personalInfo.location && <span>{renderField(data.personalInfo.location, "personalInfo.location")}</span>}
              {data.personalInfo.website && <span>{data.personalInfo.website}</span>}
            </div>
          </div>
          {/* Clean minimal Avatar */}
          <div className="scale-75 origin-top-right">
            <Avatar />
          </div>
        </div>

        {/* Profile */}
        {data.profile && (
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-[11px] text-slate-950 uppercase tracking-widest font-mono">
              // {headers.profile}
            </h3>
            <p className="text-slate-700 leading-relaxed text-[10px] text-justify">
              {renderField(data.profile, "profile")}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="font-bold text-[11px] text-slate-950 uppercase tracking-widest font-mono border-t border-slate-100 pt-2">
              // {headers.experience}
            </h3>
            <div className="flex flex-col gap-3">
              {data.experience.map((exp, index) => (
                <div key={exp.id || index} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline font-mono text-[10px]">
                    <span className="font-bold text-slate-900">
                      {renderField(exp.position, `experience.${index}.position`)} / <span className="text-slate-600 font-normal">{exp.company}</span>
                    </span>
                    <span className="text-slate-500 text-[9px] shrink-0">
                      [{exp.startDate} - {exp.endDate || headers.present}]
                    </span>
                  </div>
                  <p className="text-slate-700 text-[9.5px] leading-relaxed text-justify">
                    {renderField(exp.description, `experience.${index}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="font-bold text-[11px] text-slate-950 uppercase tracking-widest font-mono border-t border-slate-100 pt-2">
              // {headers.education}
            </h3>
            <div className="flex flex-col gap-2.5">
              {data.education.map((edu, index) => (
                <div key={edu.id || index} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline font-mono text-[10px]">
                    <span className="font-bold text-slate-900">
                      {renderField(edu.degree, `education.${index}.degree`)} / <span className="text-slate-600 font-normal">{edu.institution}</span>
                    </span>
                    <span className="text-slate-500 text-[9px] shrink-0">
                      [{edu.startDate} - {edu.endDate || headers.present}]
                    </span>
                  </div>
                  {edu.description && (
                    <p className="text-slate-700 text-[9.5px] leading-relaxed text-justify">
                      {renderField(edu.description, `education.${index}.description`)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid for small sections */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-2">
          {/* Skills & Languages */}
          <div className="flex flex-col gap-2">
            {data.skills.length > 0 && (
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[10px] text-slate-950 uppercase tracking-widest font-mono">
                  // {headers.skills}
                </h3>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  {data.skills.map((s, idx) => (
                    <span key={s.id || idx}>
                      {renderField(s.name, `skills.${idx}.name`)} ({s.level}){idx < data.skills.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {data.languages.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <h3 className="font-bold text-[10px] text-slate-950 uppercase tracking-widest font-mono">
                  // {headers.languages}
                </h3>
                <p className="text-slate-700 text-[9.5px]">
                  {data.languages.map((l, idx) => (
                    <span key={l.id || idx}>
                      {l.name} ({l.level}){idx < data.languages.length - 1 ? "  |  " : ""}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* Certifications & Projects */}
          <div className="flex flex-col gap-2">
            {data.certifications.length > 0 && (
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[10px] text-slate-950 uppercase tracking-widest font-mono">
                  // {headers.certifications}
                </h3>
                <div className="flex flex-col gap-1 text-[9px]">
                  {data.certifications.map((cert, index) => (
                    <div key={cert.id || index} className="flex justify-between items-baseline">
                      <span className="font-bold truncate text-slate-800">{renderField(cert.name, `certifications.${index}.name`)}</span>
                      <span className="text-slate-500 font-mono scale-95 shrink-0">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.projects.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <h3 className="font-bold text-[10px] text-slate-950 uppercase tracking-widest font-mono">
                  // {headers.projects}
                </h3>
                <div className="flex flex-col gap-1 text-[9px]">
                  {data.projects.map((proj, index) => (
                    <div key={proj.id || index} className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-800 truncate">{renderField(proj.name, `projects.${index}.name`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* References */}
        {data.references.length > 0 && (
          <div className="border-t border-slate-100 pt-2 mt-auto">
            <h3 className="font-bold text-[10px] text-slate-950 uppercase tracking-widest font-mono mb-1">
              // {headers.references}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              {data.references.map((ref, index) => (
                <div key={ref.id || index} className="flex flex-col font-mono text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">{ref.name}</span>
                  <span>{renderField(ref.relation, `references.${index}.relation`)}</span>
                  <span>{ref.phone} / {ref.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 4. EXECUTIVE TEMPLATE (Centered Header, Serif font, Editorial feel)
  // -----------------------------------------------------------------
  const renderExecutive = () => {
    return (
      <div className="w-full h-full bg-white text-stone-800 p-8 flex flex-col gap-4 font-serif text-[10.5px]">
        {/* Header Block */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b-2 border-double border-stone-800 pb-3">
          <Avatar />
          <h1 className="text-[23px] font-bold text-stone-900 tracking-tight mt-1">
            {data.personalInfo.name || "Tu Nombre"}
          </h1>
          <p className="text-[12px] italic text-stone-600 font-semibold tracking-wide">
            {renderField(data.personalInfo.profession, "personalInfo.profession", "", "Profesión")}
          </p>
          {/* Centered contact strip */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-1 text-[9.5px] text-stone-500 font-sans">
            {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
            {data.personalInfo.location && <span>{renderField(data.personalInfo.location, "personalInfo.location")}</span>}
            {data.personalInfo.website && <span>{data.personalInfo.website}</span>}
          </div>
        </div>

        {/* Profile */}
        {data.profile && (
          <div className="flex flex-col gap-1 text-center max-w-[90%] mx-auto">
            <h3 className="text-[11.5px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-0.5">
              {headers.profile}
            </h3>
            <p className="text-stone-700 leading-relaxed text-[10px] italic text-justify">
              {renderField(data.profile, "profile")}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11.5px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-300 pb-0.5">
              {headers.experience}
            </h3>
            <div className="flex flex-col gap-3">
              {data.experience.map((exp, index) => (
                <div key={exp.id || index} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline font-bold text-[10.5px] text-stone-900">
                    <span>
                      {renderField(exp.position, `experience.${index}.position`)} &mdash; <span className="font-normal italic">{exp.company}</span>
                    </span>
                    <span className="font-sans text-[9px] font-medium text-stone-500">
                      {exp.startDate} - {exp.endDate || headers.present}
                    </span>
                  </div>
                  <p className="text-stone-700 text-[9.8px] leading-relaxed text-justify">
                    {renderField(exp.description, `experience.${index}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11.5px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-300 pb-0.5">
              {headers.education}
            </h3>
            <div className="flex flex-col gap-2.5">
              {data.education.map((edu, index) => (
                <div key={edu.id || index} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline font-bold text-[10.5px] text-stone-900">
                    <span>
                      {renderField(edu.degree, `education.${index}.degree`)} &mdash; <span className="font-normal italic">{edu.institution}</span>
                    </span>
                    <span className="font-sans text-[9px] font-medium text-stone-500">
                      {edu.startDate} - {edu.endDate || headers.present}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="text-stone-700 text-[9.8px] leading-relaxed text-justify">
                      {renderField(edu.description, `education.${index}.description`)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dual column for small lists */}
        <div className="grid grid-cols-2 gap-5 mt-1 border-t border-stone-200 pt-2">
          {/* Left Column: Skills & Languages */}
          <div className="flex flex-col gap-2.5">
            {data.skills.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-[10.5px] text-stone-900 uppercase tracking-wider">{headers.skills}</h4>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9.5px]">
                  {data.skills.map((s, idx) => (
                    <span key={s.id || idx} className="text-stone-700">
                      &bull; {renderField(s.name, `skills.${idx}.name`)} <span className="text-stone-500 font-sans scale-90">({s.level})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.languages.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-[10.5px] text-stone-900 uppercase tracking-wider">{headers.languages}</h4>
                <div className="flex flex-col gap-0.5 text-[9.5px]">
                  {data.languages.map((lan, idx) => (
                    <div key={lan.id || idx} className="flex justify-between text-stone-700 border-b border-stone-100 pb-0.5">
                      <span>{lan.name}</span>
                      <span className="italic font-sans text-[8.5px]">{lan.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Projects & Certs */}
          <div className="flex flex-col gap-2.5">
            {data.certifications.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-[10.5px] text-stone-900 uppercase tracking-wider">{headers.certifications}</h4>
                <div className="flex flex-col gap-1 text-[9px]">
                  {data.certifications.map((cert, idx) => (
                    <div key={cert.id || idx} className="text-stone-700 leading-snug">
                      <span className="font-bold">{renderField(cert.name, `certifications.${idx}.name`)}</span> &mdash; <span className="text-stone-500">{cert.issuer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.projects.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-[10.5px] text-stone-900 uppercase tracking-wider">{headers.projects}</h4>
                <div className="flex flex-col gap-1 text-[9px]">
                  {data.projects.map((proj, idx) => (
                    <div key={proj.id || idx} className="text-stone-700">
                      <span className="font-bold">{renderField(proj.name, `projects.${idx}.name`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* References */}
        {data.references.length > 0 && (
          <div className="border-t border-stone-200 pt-2 mt-auto">
            <h4 className="font-bold text-[10.5px] text-stone-900 uppercase tracking-widest text-center mb-1.5">{headers.references}</h4>
            <div className="flex justify-around gap-2 text-[9px]">
              {data.references.map((ref, index) => (
                <div key={ref.id || index} className="flex flex-col items-center">
                  <span className="font-bold text-stone-900">{ref.name}</span>
                  <span className="text-stone-500 italic text-[8.5px]">{renderField(ref.relation, `references.${index}.relation`)}</span>
                  <span className="font-sans text-stone-400 text-[8px] mt-0.5">{ref.phone} | {ref.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 5. CREATIVE TEMPLATE (Playful color blocks, rounded widgets)
  // -----------------------------------------------------------------
  const renderCreative = () => {
    return (
      <div className="w-full h-full bg-slate-50 text-slate-800 flex flex-col p-6 text-[11px] gap-4">
        {/* Colorful top block with rounded edges */}
        <div className="bg-emerald-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden shrink-0">
          {/* Backdrop abstract ball */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/30 rounded-full blur-xl" />
          
          <div className="flex items-center gap-4 z-10">
            <div className="ring-4 ring-white/20 rounded-full">
              <Avatar />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-[22px] tracking-tight">{data.personalInfo.name || "Tu Nombre"}</h1>
              <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block self-start border border-white/10 uppercase tracking-wider">
                {renderField(data.personalInfo.profession, "personalInfo.profession", "", "Profesión")}
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[9.5px] text-emerald-100">
                {data.personalInfo.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {data.personalInfo.email}</span>}
                {data.personalInfo.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {data.personalInfo.phone}</span>}
                {data.personalInfo.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {renderField(data.personalInfo.location, "personalInfo.location")}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom grid (Left is 7 cols, Right is 5 cols) */}
        <div className="flex-1 grid grid-cols-12 gap-4 text-[10.5px]">
          {/* Main content left (7 columns) */}
          <div className="col-span-7 flex flex-col gap-3.5">
            {/* Profile Block */}
            {data.profile && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-[12px] text-emerald-800 uppercase tracking-wide">
                  ✨ {headers.profile}
                </h3>
                <p className="text-slate-600 leading-relaxed text-justify">
                  {renderField(data.profile, "profile")}
                </p>
              </div>
            )}

            {/* Experience Block */}
            {data.experience.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
                <h3 className="font-extrabold text-[12px] text-emerald-800 uppercase tracking-wide">
                  🚀 {headers.experience}
                </h3>
                <div className="flex flex-col gap-3">
                  {data.experience.map((exp, index) => (
                    <div key={exp.id || index} className="flex flex-col gap-1 border-l-2 border-emerald-100 pl-3.5 relative">
                      {/* Interactive dot */}
                      <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 text-[10.5px]">
                          {renderField(exp.position, `experience.${index}.position`)}
                        </span>
                        <span className="text-slate-400 text-[8.5px] font-semibold">{exp.startDate} - {exp.endDate || headers.present}</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-[9px]">{exp.company}</span>
                      <p className="text-slate-500 leading-relaxed text-[9.5px]">
                        {renderField(exp.description, `experience.${index}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Block */}
            {data.education.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
                <h3 className="font-extrabold text-[12px] text-emerald-800 uppercase tracking-wide">
                  🎓 {headers.education}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {data.education.map((edu, index) => (
                    <div key={edu.id || index} className="flex flex-col gap-1 border-l-2 border-emerald-100 pl-3.5 relative">
                      <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 text-[10.5px]">
                          {renderField(edu.degree, `education.${index}.degree`)}
                        </span>
                        <span className="text-slate-400 text-[8.5px] font-semibold">{edu.startDate} - {edu.endDate || headers.present}</span>
                      </div>
                      <span className="text-slate-500 font-bold text-[9px]">{edu.institution}</span>
                      {edu.description && (
                        <p className="text-slate-500 leading-relaxed text-[9.5px]">
                          {renderField(edu.description, `education.${index}.description`)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar (5 columns) */}
          <div className="col-span-5 flex flex-col gap-3.5">
            {/* Skills Badges */}
            {data.skills.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
                <h3 className="font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide">{headers.skills}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((skill, index) => (
                    <span key={skill.id || index} className="bg-emerald-50 text-emerald-700 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      {renderField(skill.name, `skills.${index}.name`)} <span className="text-emerald-500 font-mono text-[8.5px]">({skill.level})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide">{headers.languages}</h3>
                <div className="flex flex-col gap-1">
                  {data.languages.map((lan, index) => (
                    <div key={lan.id || index} className="flex justify-between items-center text-[10px]">
                      <span className="font-medium text-slate-700">{lan.name}</span>
                      <span className="text-emerald-600 font-extrabold text-[9px]">{lan.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects list */}
            {data.projects.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
                <h3 className="font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide">{headers.projects}</h3>
                <div className="flex flex-col gap-2">
                  {data.projects.map((proj, index) => (
                    <div key={proj.id || index} className="text-[9.5px] flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-800">{renderField(proj.name, `projects.${index}.name`)}</span>
                      <p className="text-slate-500 text-[8.5px] mt-0.5">{renderField(proj.description, `projects.${index}.description`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* References */}
            {data.references.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 mt-auto">
                <h3 className="font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide">{headers.references}</h3>
                <div className="flex flex-col gap-1.5">
                  {data.references.map((ref, index) => (
                    <div key={ref.id || index} className="text-[9px] bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800">{ref.name}</span>
                      <span className="text-emerald-600 font-semibold italic">{renderField(ref.relation, `references.${index}.relation`)}</span>
                      {ref.phone && <span className="text-slate-400 font-mono">{ref.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTemplate = () => {
    switch (template) {
      case "professional":
        return renderProfessional();
      case "modern":
        return renderModern();
      case "minimalist":
        return renderMinimalist();
      case "executive":
        return renderExecutive();
      case "creative":
        return renderCreative();
      default:
        return renderProfessional();
    }
  };

  return (
    <div 
      className="bg-white text-slate-800 w-[794px] h-[1123px] relative shadow-2xl overflow-hidden print:shadow-none select-none shrink-0"
      style={{
        width: "794px",
        height: "1123px",
      }}
    >
      {renderTemplate()}
    </div>
  );
};
