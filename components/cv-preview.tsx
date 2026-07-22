import type { GeneratedCV, ProfileBundle } from "@/lib/types";
import type { CVSectionKey, CVSettings, CVTemplateKey } from "@/lib/cv-builder";
import { CV_POPIA_DECLARATION, formatEmploymentPeriod } from "@/lib/cv-standards";

function value(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const item = record[key];
    if (item !== null && item !== undefined && item !== "") {
      return String(item);
    }
  }
  return "";
}

function period(record: Record<string, unknown>): string {
  const start = value(record, "start_date");
  const current = Boolean(record.is_current);
  const end = current ? "Present" : value(record, "end_date");
  return [start, end].filter(Boolean).join(" – ");
}

function records(
  candidate: unknown,
  fallback: Record<string, unknown>[],
): Record<string, unknown>[] {
  return Array.isArray(candidate)
    ? candidate.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
    : fallback;
}

function skillName(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    return value(item as Record<string, unknown>, "name", "skill");
  }
  return "";
}

function cleanPoint(item: unknown): string {
  if (typeof item === "string") {
    return item
      .replace(/^\s*(?:[•●▪◦*-]|\d+[.)])\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (typeof item === "object" && item !== null) {
    return value(
      item as Record<string, unknown>,
      "description",
      "text",
      "name",
      "achievement",
      "responsibility",
      "duty",
    );
  }
  return "";
}

function pointForm(input: unknown): string[] {
  const candidates = Array.isArray(input)
    ? input.flatMap((item) => pointForm(item))
    : typeof input === "string"
      ? input
          .replace(/\r/g, "")
          .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
      : [input];

  const seen = new Set<string>();
  return candidates
    .map(cleanPoint)
    .filter((item) => {
      const key = item.toLocaleLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function experiencePoints(item: Record<string, unknown>): string[] {
  const structured = [
    item.responsibilities,
    item.duties,
    item.achievements,
    item.key_achievements,
  ].flatMap(pointForm);
  return structured.length ? pointForm(structured) : pointForm(item.description);
}

export function CVPreview({
  bundle,
  generated,
  targetRole,
  template, settings, sectionOrder, zoom,
}: {
  bundle: ProfileBundle;
  generated: GeneratedCV | null;
  targetRole: string;
  template: CVTemplateKey;
  settings: CVSettings;
  sectionOrder: CVSectionKey[];
  zoom: number;
}) {
  const profile = bundle.profile;
  const content = generated?.content || {};
  const importedPersonal =
    typeof content.personal_details === "object" &&
    content.personal_details !== null
      ? (content.personal_details as Record<string, unknown>)
      : {};
  const summary =
    String(content.professional_summary || content.summary || "") ||
    profile?.professional_summary ||
    "";

  const skills = pointForm(
    Array.isArray(content.skills) && content.skills.length
      ? content.skills.map(skillName).filter(Boolean)
      : bundle.skills.map((item) => value(item, "name", "skill")).filter(Boolean),
  );
  const experience = records(content.experience, bundle.experience);
  const education = records(content.education, bundle.education);
  const projects = records(content.projects, bundle.projects);
  const certifications = records(content.certifications, bundle.certifications);
  const languages = records(content.languages, bundle.languages);
  const references = records(content.references, bundle.references);
  const fullName =
    value(importedPersonal, "full_name") || bundle.user.full_name;
  const email = value(importedPersonal, "email") || bundle.user.email;
  const phone = value(importedPersonal, "phone") || profile?.phone || "";
  const location = value(importedPersonal, "location") || profile?.location || "";
  const linkedin =
    value(importedPersonal, "linkedin_url", "linkedin") ||
    profile?.linkedin_url ||
    "";
  const website =
    value(importedPersonal, "website_url", "portfolio_url", "website") ||
    profile?.website_url ||
    "";

  const templateClass = `cv-document cv-template-${template}`;
  const padding = settings.margin === "narrow" ? "34px 38px" : settings.margin === "wide" ? "72px 78px" : "54px 58px";

  return (
    <div style={{transform:`scale(${zoom})`,transformOrigin:"top center"}}><article className={templateClass} aria-label="A4 CV preview" style={{boxSizing:"border-box",fontFamily:settings.font,fontSize:`${settings.fontSize}px`,lineHeight:settings.lineHeight,padding,width:"210mm",minHeight:"297mm",["--cv-accent" as string]:settings.accent}}>
      <header className="cv-header">
        <h1>{fullName}</h1>
        <p className="cv-role">
          {targetRole || profile?.professional_title || "Professional"}
        </p>
        <div className="cv-contact">
          {phone && <span>{phone}</span>}
          <span>{email}</span>
          {location && <span>{location}</span>}
          {linkedin && <span>{linkedin}</span>}
          {website && <span>{website}</span>}
        </div>
      </header>

      {summary && (
        <section className="cv-section">
          <h2>Professional Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="cv-section">
          <h2>Professional Experience</h2>
          <div className="cv-stack">
            {experience.map((item, index) => (
              <div className="cv-entry" key={String(item.id || index)}>
                <div className="cv-entry-heading">
                  <div>
                    <h3>{value(item, "job_title")}</h3>
                    <p>{value(item, "company")}</p>
                  </div>
                  <div className="cv-entry-meta">
                    <span>{formatEmploymentPeriod(item)}</span>
                    <span>{value(item, "location")}</span>
                  </div>
                </div>
                {experiencePoints(item).length > 0 && (
                  <ul className="cv-duty-list">
                    {experiencePoints(item).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="cv-section">
          <h2>Education</h2>
          <div className="cv-stack">
            {education.map((item, index) => (
              <div className="cv-entry" key={String(item.id || index)}>
                <div className="cv-entry-heading">
                  <div>
                    <h3>{value(item, "qualification")}</h3>
                    <p>{value(item, "institution")}</p>
                  </div>
                  <div className="cv-entry-meta">
                    <span>{period(item)}</span>
                    <span>{value(item, "field_of_study")}</span>
                  </div>
                </div>
                {value(item, "description") && (
                  <p>{value(item, "description")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="cv-section">
          <h2>Core Skills</h2>
          <ul className="cv-skill-grid">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section className="cv-section">
          <h2>Projects</h2>
          <div className="cv-stack">
            {projects.map((item, index) => (
              <div className="cv-entry" key={String(item.id || index)}>
                <div className="cv-entry-heading">
                  <div>
                    <h3>{value(item, "name", "project_name")}</h3>
                    <p>{value(item, "project_url")}</p>
                  </div>
                  <div className="cv-entry-meta">
                    <span>{period(item)}</span>
                  </div>
                </div>
                {value(item, "description") && (
                  <p>{value(item, "description")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="cv-two-column">
        {certifications.length > 0 && (
          <section className="cv-section">
            <h2>Certifications</h2>
            <ul>
              {certifications.map((item, index) => (
                <li key={String(item.id || index)}>
                  <strong>{value(item, "name")}</strong>
                  {value(item, "issuer") && ` — ${value(item, "issuer")}`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {languages.length > 0 && (
          <section className="cv-section">
            <h2>Languages</h2>
            <ul>
              {languages.map((item, index) => (
                <li key={String(item.id || index)}>
                  <strong>{value(item, "name")}</strong>
                  {value(item, "proficiency") &&
                    ` — ${value(item, "proficiency")}`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {references.length > 0 && (
        <section className="cv-section">
          <h2>References</h2>
          <div className="cv-reference-grid">
            {references.map((item, index) => (
              <div key={String(item.id || index)}>
                <strong>{value(item, "full_name")}</strong>
                <p>
                  {[value(item, "relationship"), value(item, "company")]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {[value(item, "email"), value(item, "phone")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="cv-declaration">
        <h2>Declaration and POPIA Consent</h2>
        <p>{CV_POPIA_DECLARATION}</p>
      </footer>
    </article></div>
  );
}
