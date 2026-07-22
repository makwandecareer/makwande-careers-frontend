"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client-api";
import type { ImportedCVDraft } from "./CVIntakeRevampCentre";
import styles from "./ClientCVRevampWizard.module.css";

interface Props {
  draft: ImportedCVDraft;
  targetRole: string;
  onDraftChange: (draft: ImportedCVDraft) => void;
  onChooseTemplate: () => void;
  onFinish: (draft: ImportedCVDraft) => void;
}

interface TextImprovementResponse {
  text: string;
  warnings?: string[];
}

type StepId =
  | "direction"
  | "heading"
  | "experience"
  | "education"
  | "skills"
  | "summary"
  | "extras"
  | "finalise";

const STEPS: Array<{ id: StepId; label: string; short: string }> = [
  { id: "direction", label: "Career direction", short: "1" },
  { id: "heading", label: "Contact details", short: "2" },
  { id: "experience", label: "Work history", short: "3" },
  { id: "education", label: "Education", short: "4" },
  { id: "skills", label: "Skills", short: "5" },
  { id: "summary", label: "Summary", short: "6" },
  { id: "extras", label: "Additional sections", short: "7" },
  { id: "finalise", label: "Finalise", short: "8" },
];

const LEVELS: Array<{ value: ImportedCVDraft["candidate_level"]; label: string; detail: string }> = [
  { value: "graduate", label: "No formal experience", detail: "Graduate, student, learner or first CV" },
  { value: "early-career", label: "Less than 3 years", detail: "Early-career professional" },
  { value: "mid-career", label: "3–5 years", detail: "Established specialist or professional" },
  { value: "senior", label: "5–10 years", detail: "Senior specialist, manager or leader" },
  { value: "executive", label: "10+ years", detail: "Executive or enterprise leader" },
];

const EDUCATION_LEVELS = [
  "Matric / National Senior Certificate",
  "Technical or vocational qualification",
  "Certificate or diploma",
  "Bachelor’s degree",
  "Honours or postgraduate diploma",
  "Master’s degree",
  "Doctoral degree",
];

function value(record: Record<string, unknown>, key: string): string {
  const current = record[key];
  return typeof current === "string" ? current : "";
}

function stringList(record: Record<string, unknown>, key: string): string[] {
  const current = record[key];
  return Array.isArray(current)
    ? current.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function completeness(draft: ImportedCVDraft): number {
  const checks = [
    draft.personal_details.full_name,
    draft.personal_details.email,
    draft.personal_details.phone,
    draft.professional_title,
    draft.professional_summary,
    draft.skills.length >= 6,
    draft.experience.length || draft.projects.length,
    draft.education.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function ClientCVRevampWizard({
  draft,
  targetRole,
  onDraftChange,
  onChooseTemplate,
  onFinish,
}: Props) {
  const [step, setStep] = useState<StepId>("direction");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const score = useMemo(() => completeness(draft), [draft]);

  useEffect(() => {
    localStorage.setItem("makwande-client-cv-revamp", JSON.stringify(draft));
  }, [draft]);

  function patch(next: Partial<ImportedCVDraft>): void {
    onDraftChange({ ...draft, ...next });
  }

  function patchContact(key: keyof ImportedCVDraft["personal_details"], next: string): void {
    patch({ personal_details: { ...draft.personal_details, [key]: next } });
  }

  function patchRecord(
    section: "experience" | "education" | "projects" | "certifications",
    index: number,
    key: string,
    next: unknown,
  ): void {
    const records = [...draft[section]];
    records[index] = { ...records[index], [key]: next };
    patch({ [section]: records });
  }

  function removeRecord(
    section: "experience" | "education" | "projects" | "certifications",
    index: number,
  ): void {
    patch({ [section]: draft[section].filter((_, itemIndex) => itemIndex !== index) });
  }

  function move(next: number): void {
    const target = STEPS[Math.max(0, Math.min(STEPS.length - 1, next))];
    setStep(target.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function improveSummary(): Promise<void> {
    if (!draft.professional_title.trim()) {
      setNotice("Add a target role before asking AI to improve the summary.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await api<TextImprovementResponse>("/api/ai-cv/improve-summary", {
        method: "POST",
        body: JSON.stringify({
          target_role: draft.professional_title,
          current_summary: draft.professional_summary,
          verified_strengths: [
            ...draft.skills,
            ...(draft.intake_answers ?? []),
          ].filter(Boolean).slice(0, 30),
          save_revision: true,
        }),
      });
      patch({ professional_summary: result.text });
      setNotice("AI rewrite added. Review it carefully and keep only accurate statements.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "AI assistance is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.shell}>
      <aside className={styles.steps} aria-label="CV revamp progress">
        <div className={styles.brandBlock}>
          <span>Makwande AI CV Revamp</span>
          <strong>{score}% ready</strong>
          <div><i style={{ width: `${score}%` }} /></div>
        </div>
        {STEPS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={item.id === step ? styles.activeStep : index < stepIndex ? styles.doneStep : ""}
            onClick={() => setStep(item.id)}
          >
            <span>{index < stepIndex ? "✓" : item.short}</span>
            {item.label}
          </button>
        ))}
        <p>Autosaved on this device</p>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.workspaceHeader}>
          <div>
            <span className={styles.eyebrow}>10-minute guided CV journey</span>
            <h2>{STEPS[stepIndex].label}</h2>
            <p>Extracted information is editable. AI recommendations remain suggestions until you accept them.</p>
          </div>
          <div className={styles.factKey}>
            <span><i className={styles.verified} /> Imported or verified</span>
            <span><i className={styles.suggested} /> AI recommendation</span>
          </div>
        </header>

        {step === "direction" ? (
          <div className={styles.stepBody}>
            <h3>How much experience should this CV represent?</h3>
            <p className={styles.lead}>We use this to recommend structure, evidence depth and the most suitable A4 template.</p>
            <div className={styles.optionGrid}>
              {LEVELS.map((level) => (
                <button
                  type="button"
                  key={level.value}
                  className={draft.candidate_level === level.value ? styles.selectedOption : ""}
                  onClick={() => patch({ candidate_level: level.value })}
                >
                  <strong>{level.label}</strong>
                  <span>{level.detail}</span>
                </button>
              ))}
            </div>
            <div className={styles.formGrid}>
              <label className={styles.full}>
                <span>Target role</span>
                <input
                  value={draft.professional_title}
                  onChange={(event) => patch({ professional_title: event.target.value })}
                  placeholder={targetRole || "e.g. Chemical Process Operator"}
                />
                <small>AI suggestions will align to this role without inventing experience.</small>
              </label>
            </div>
          </div>
        ) : null}

        {step === "heading" ? (
          <div className={styles.stepBody}>
            <h3>Confirm the client’s contact information</h3>
            <p className={styles.lead}>Only include details the client wants recruiters to use.</p>
            <div className={styles.formGrid}>
              {([
                ["full_name", "Full name", "Candidate name"],
                ["email", "Email address", "name@email.com"],
                ["phone", "Phone", "+27..."],
                ["location", "City / province", "Johannesburg, Gauteng"],
                ["linkedin_url", "LinkedIn URL", "linkedin.com/in/..."],
                ["portfolio_url", "Portfolio / website", "https://..."],
              ] as const).map(([key, label, placeholder]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    value={draft.personal_details[key]}
                    onChange={(event) => patchContact(key, event.target.value)}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === "experience" ? (
          <div className={styles.stepBody}>
            <div className={styles.sectionTitle}>
              <div><h3>Work history</h3><p>Turn responsibilities into evidence-led achievements.</p></div>
              <button type="button" onClick={() => patch({ experience: [...draft.experience, { company: "", job_title: "", start_date: "", end_date: "", description: "", achievements: [] }] })}>+ Add position</button>
            </div>
            {!draft.experience.length ? <div className={styles.empty}>No employment was detected. Add internships, learnerships, freelance, volunteer or project experience if accurate.</div> : null}
            {draft.experience.map((record, index) => (
              <article className={styles.recordCard} key={`experience-${index}`}>
                <div className={styles.recordHeading}><strong>Position {index + 1}</strong><button type="button" onClick={() => removeRecord("experience", index)}>Remove</button></div>
                <div className={styles.formGrid}>
                  <label><span>Job title</span><input value={value(record, "job_title")} onChange={(e) => patchRecord("experience", index, "job_title", e.target.value)} /></label>
                  <label><span>Employer</span><input value={value(record, "company")} onChange={(e) => patchRecord("experience", index, "company", e.target.value)} /></label>
                  <label><span>Start date</span><input value={value(record, "start_date")} onChange={(e) => patchRecord("experience", index, "start_date", e.target.value)} placeholder="MM/YYYY" /></label>
                  <label><span>End date</span><input value={value(record, "end_date")} onChange={(e) => patchRecord("experience", index, "end_date", e.target.value)} placeholder="Present or MM/YYYY" /></label>
                  <label className={styles.full}><span>Responsibilities</span><textarea value={value(record, "description")} onChange={(e) => patchRecord("experience", index, "description", e.target.value)} placeholder="What did the client actually do?" /></label>
                  <label className={styles.full}><span>Verified achievements — one per line</span><textarea value={stringList(record, "achievements").join("\n")} onChange={(e) => patchRecord("experience", index, "achievements", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} placeholder="Improved X by Y using Z. Add numbers only when verified." /></label>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {step === "education" ? (
          <div className={styles.stepBody}>
            <h3>Education and training</h3>
            <div className={styles.chipRow}>
              {EDUCATION_LEVELS.map((level) => <button type="button" key={level} className={educationLevel === level ? styles.selectedChip : ""} onClick={() => setEducationLevel(level)}>{level}</button>)}
            </div>
            <div className={styles.sectionTitle}><p>Add the most relevant and recent qualifications.</p><button type="button" onClick={() => patch({ education: [...draft.education, { institution: "", qualification: educationLevel, field_of_study: "", start_date: "", end_date: "", description: "" }] })}>+ Add qualification</button></div>
            {draft.education.map((record, index) => (
              <article className={styles.recordCard} key={`education-${index}`}>
                <div className={styles.recordHeading}><strong>Qualification {index + 1}</strong><button type="button" onClick={() => removeRecord("education", index)}>Remove</button></div>
                <div className={styles.formGrid}>
                  <label><span>Qualification</span><input value={value(record, "qualification")} onChange={(e) => patchRecord("education", index, "qualification", e.target.value)} /></label>
                  <label><span>Institution</span><input value={value(record, "institution")} onChange={(e) => patchRecord("education", index, "institution", e.target.value)} /></label>
                  <label><span>Field of study</span><input value={value(record, "field_of_study")} onChange={(e) => patchRecord("education", index, "field_of_study", e.target.value)} /></label>
                  <label><span>Completion year</span><input value={value(record, "end_date")} onChange={(e) => patchRecord("education", index, "end_date", e.target.value)} /></label>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {step === "skills" ? (
          <div className={styles.stepBody}>
            <h3>What skills should recruiters find?</h3>
            <p className={styles.lead}>Keep 6–12 role-relevant skills. The client must be able to demonstrate every selected skill.</p>
            <div className={styles.addRow}>
              <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a verified skill" />
              <button type="button" onClick={() => { const next = newSkill.trim(); if (next && !draft.skills.includes(next)) patch({ skills: [...draft.skills, next] }); setNewSkill(""); }}>Add skill</button>
            </div>
            <div className={styles.skillList}>
              {draft.skills.map((skill) => <button type="button" key={skill} onClick={() => patch({ skills: draft.skills.filter((item) => item !== skill) })}>{skill}<span>×</span></button>)}
            </div>
            <div className={styles.aiBox}>
              <strong>AI evidence check</strong>
              <p>Keywords should appear only when supported by work, education, projects or verified client answers. Missing job-description keywords are recommendations—not automatic additions.</p>
            </div>
          </div>
        ) : null}

        {step === "summary" ? (
          <div className={styles.stepBody}>
            <div className={styles.sectionTitle}>
              <div><h3>Professional summary</h3><p>A concise, targeted opening based on verified evidence.</p></div>
              <button type="button" disabled={busy} onClick={() => void improveSummary()}>{busy ? "Improving…" : "Improve with AI"}</button>
            </div>
            <label className={styles.editorLabel}>
              <span>Summary</span>
              <textarea value={draft.professional_summary} onChange={(e) => patch({ professional_summary: e.target.value })} placeholder="Write 3–5 lines covering role, level, strongest evidence and career direction." />
            </label>
            {notice ? <div className={styles.notice}>{notice}</div> : null}
            <div className={styles.aiBox}><strong>Safe AI rule</strong><p>AI may improve clarity, structure and keywords. It must not create employers, qualifications, dates, achievements or performance figures.</p></div>
          </div>
        ) : null}

        {step === "extras" ? (
          <div className={styles.stepBody}>
            <h3>Additional sections that strengthen the application</h3>
            <p className={styles.lead}>Add only sections that improve relevance. Empty sections will not appear in the final CV.</p>
            <div className={styles.extraGrid}>
              <article><strong>Projects</strong><span>{draft.projects.length} added</span><button type="button" onClick={() => patch({ projects: [...draft.projects, { name: "", description: "", technologies: [] }] })}>+ Add project</button></article>
              <article><strong>Certifications</strong><span>{draft.certifications.length} added</span><button type="button" onClick={() => patch({ certifications: [...draft.certifications, { name: "", issuer: "", date: "" }] })}>+ Add certification</button></article>
              <article><strong>Languages</strong><span>{draft.languages.length ? draft.languages.join(", ") : "None added"}</span><input placeholder="English, isiZulu..." value={draft.languages.join(", ")} onChange={(e) => patch({ languages: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></article>
              <article><strong>Professional links</strong><span>LinkedIn and portfolio links are managed in Contact details.</span><button type="button" onClick={() => setStep("heading")}>Review links</button></article>
            </div>
            {draft.projects.map((record, index) => (
              <article className={styles.recordCard} key={`project-${index}`}><div className={styles.recordHeading}><strong>Project {index + 1}</strong><button type="button" onClick={() => removeRecord("projects", index)}>Remove</button></div><div className={styles.formGrid}><label><span>Project name</span><input value={value(record, "name")} onChange={(e) => patchRecord("projects", index, "name", e.target.value)} /></label><label className={styles.full}><span>Verified contribution and outcome</span><textarea value={value(record, "description")} onChange={(e) => patchRecord("projects", index, "description", e.target.value)} /></label></div></article>
            ))}
            {draft.certifications.map((record, index) => (
              <article className={styles.recordCard} key={`cert-${index}`}><div className={styles.recordHeading}><strong>Certification {index + 1}</strong><button type="button" onClick={() => removeRecord("certifications", index)}>Remove</button></div><div className={styles.formGrid}><label><span>Name</span><input value={value(record, "name")} onChange={(e) => patchRecord("certifications", index, "name", e.target.value)} /></label><label><span>Issuer</span><input value={value(record, "issuer")} onChange={(e) => patchRecord("certifications", index, "issuer", e.target.value)} /></label><label><span>Date</span><input value={value(record, "date")} onChange={(e) => patchRecord("certifications", index, "date", e.target.value)} /></label></div></article>
            ))}
          </div>
        ) : null}

        {step === "finalise" ? (
          <div className={styles.stepBody}>
            <h3>Final quality review</h3>
            <p className={styles.lead}>Complete the checks below before generating the new CV.</p>
            <div className={styles.finalGrid}>
              <article><span>{draft.personal_details.full_name && draft.personal_details.email ? "✓" : "!"}</span><div><strong>Contact details</strong><p>Name and recruiter contact route confirmed.</p></div></article>
              <article><span>{draft.experience.length || draft.projects.length ? "✓" : "!"}</span><div><strong>Evidence</strong><p>Work history, learnership, volunteering or projects included.</p></div></article>
              <article><span>{draft.skills.length >= 6 ? "✓" : "!"}</span><div><strong>Skills</strong><p>{draft.skills.length} verified skills selected.</p></div></article>
              <article><span>{draft.professional_summary ? "✓" : "!"}</span><div><strong>Professional summary</strong><p>Targeted opening statement reviewed.</p></div></article>
            </div>
            {draft.facts_to_verify.length ? <div className={styles.warningBox}><strong>Client confirmation required</strong><ul>{draft.facts_to_verify.map((fact) => <li key={fact}>{fact}</li>)}</ul></div> : null}
            <div className={styles.finalActions}>
              <button type="button" onClick={onChooseTemplate}>Choose A4 template</button>
              <button type="button" className={styles.primary} onClick={() => onFinish(draft)}>Create final CV draft</button>
            </div>
          </div>
        ) : null}

        <footer className={styles.navigation}>
          <button type="button" onClick={() => move(stepIndex - 1)} disabled={stepIndex === 0}>← Back</button>
          <span>Step {stepIndex + 1} of {STEPS.length}</span>
          {stepIndex < STEPS.length - 1 ? <button type="button" className={styles.primary} onClick={() => move(stepIndex + 1)}>Save & continue →</button> : null}
        </footer>
      </div>
    </section>
  );
}
