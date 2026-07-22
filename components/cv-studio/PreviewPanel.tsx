"use client";

import type { StudioDraft, StudioSection } from "@/lib/cv-studio";
import { CV_POPIA_DECLARATION, formatEmploymentPeriod } from "@/lib/cv-standards";

const v = (record: Record<string, unknown>, key: string) => String(record[key] ?? "");

function points(value: string): string[] {
  return value.replace(/\r/g, "").split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((item) => item.replace(/^\s*(?:[•●▪◦*-]|\d+[.)])\s*/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function PreviewPanel({ draft, zoom, setZoom }: { draft: StudioDraft; zoom: number; setZoom: (zoom: number) => void }) {
  const show = (section: StudioSection) => !draft.hiddenSections.includes(section);
  const sections: Record<string, React.ReactNode> = {
    profile: null,
    summary: show("summary") && draft.profile.summary ? <Sec title="Professional Summary"><p>{draft.profile.summary}</p></Sec> : null,
    experience: show("experience") ? <Sec title="Professional Experience">{draft.experience.map((item, index) => <Entry key={index} title={v(item, "job_title")} sub={v(item, "company")} meta={[formatEmploymentPeriod(item), v(item, "location")].filter(Boolean).join(" · ")} description={v(item, "description")} pointForm />)}</Sec> : null,
    education: show("education") ? <Sec title="Education">{draft.education.map((item, index) => <Entry key={index} title={v(item, "qualification")} sub={v(item, "institution")} meta={[v(item, "start_date"), v(item, "end_date"), v(item, "field_of_study")].filter(Boolean).join(" · ")} description={v(item, "description")} />)}</Sec> : null,
    skills: show("skills") ? <Sec title="Core Skills"><ul className="studio-preview-skills">{draft.skills.map((item, index) => <li key={index}>{v(item, "name")}</li>)}</ul></Sec> : null,
    projects: show("projects") ? <Sec title="Projects">{draft.projects.map((item, index) => <Entry key={index} title={v(item, "name")} sub={v(item, "project_url")} meta="" description={v(item, "description")} />)}</Sec> : null,
    certifications: show("certifications") ? <Sec title="Certifications"><ul>{draft.certifications.map((item, index) => <li key={index}><strong>{v(item, "name")}</strong>{v(item, "issuer") ? ` — ${v(item, "issuer")}` : ""}</li>)}</ul></Sec> : null,
    languages: show("languages") ? <Sec title="Languages"><ul>{draft.languages.map((item, index) => <li key={index}><strong>{v(item, "name")}</strong>{v(item, "proficiency") ? ` — ${v(item, "proficiency")}` : ""}</li>)}</ul></Sec> : null,
    references: show("references") ? <Sec title="References"><div className="studio-reference-grid">{draft.references.map((item, index) => <div key={index}><strong>{v(item, "full_name")}</strong><p>{[v(item, "relationship"), v(item, "company")].filter(Boolean).join(", ")}</p><p>{[v(item, "email"), v(item, "phone")].filter(Boolean).join(" · ")}</p></div>)}</div></Sec> : null,
  };

  return <section className="studio-preview-panel"><header className="studio-preview-toolbar"><div><strong>Live preview</strong><span>A4 employer view</span></div><div className="studio-zoom-controls"><button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}>+</button><button onClick={() => setZoom(0.82)}>Fit</button></div></header><div className="studio-preview-canvas"><div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}><article className={`studio-cv-page studio-layout-${draft.layout} studio-header-${draft.headerStyle} studio-template-${draft.templateLayout || "default"}`} style={{ "--studio-accent": draft.accent, fontFamily: draft.fontFamily, fontSize: `${draft.fontSize}px`, lineHeight: draft.lineHeight, padding: draft.margin === "narrow" ? "34px 38px" : draft.margin === "wide" ? "72px 78px" : "54px 58px", "--studio-secondary": draft.secondaryAccent, "--studio-heading-font": draft.headingFont, "--studio-section-spacing": `${draft.sectionSpacing}px` } as React.CSSProperties}><header className="studio-cv-header">{draft.showPhoto && draft.photoUrl && <img src={draft.photoUrl} alt="" className={`studio-cv-photo ${draft.photoShape}`} />}<div className="studio-cv-heading"><h1>{draft.profile.fullName}</h1><p>{draft.targetRole || draft.profile.professionalTitle}</p><div>{[draft.profile.phone, draft.profile.email, draft.profile.location, draft.profile.linkedin, draft.profile.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></div></header><div className="studio-cv-content">{draft.sectionOrder.map((section) => <div key={section} className={`studio-section-${section}`}>{sections[section]}</div>)}</div><footer className="studio-cv-declaration"><h2>Declaration and POPIA Consent</h2><p>{CV_POPIA_DECLARATION}</p></footer></article></div></div></section>;
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="studio-cv-section"><h2>{title}</h2>{children}</section>;
}

function Entry({ title, sub, meta, description, pointForm = false }: { title: string; sub: string; meta: string; description: string; pointForm?: boolean }) {
  const items = pointForm ? points(description) : [];
  return <div className="studio-cv-entry"><div className="studio-cv-entry-heading"><div><h3>{title}</h3><strong>{sub}</strong></div><span>{meta}</span></div>{items.length ? <ul className="studio-duty-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : description ? <p>{description}</p> : null}</div>;
}
