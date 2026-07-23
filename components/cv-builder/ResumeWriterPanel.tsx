"use client";

import { useMemo, useState } from "react";

import {
  generateResumeContent,
  type ResumeSectionType,
  type ResumeTone,
} from "@/lib/resume-writer";

import styles from "./ResumeWriterPanel.module.css";

type ResumeWriterPanelProps = {
  targetRole: string;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
};

type SavedVersion = {
  id: string;
  section: ResumeSectionType;
  tone: ResumeTone;
  content: string;
  createdAt: string;
};

const SECTION_OPTIONS: Array<{
  value: ResumeSectionType;
  label: string;
  description: string;
}> = [
  {
    value: "summary",
    label: "Professional summary",
    description: "Create a focused opening profile for your CV.",
  },
  {
    value: "experience",
    label: "Experience section",
    description: "Rewrite duties as evidence-led, ATS-friendly bullets.",
  },
  {
    value: "achievement",
    label: "Achievement bullet",
    description: "Turn a result or responsibility into a measurable achievement.",
  },
  {
    value: "skills",
    label: "Skills section",
    description: "Organise relevant technical and transferable skills.",
  },
  {
    value: "linkedin",
    label: "LinkedIn About",
    description: "Create a credible professional LinkedIn introduction.",
  },
];

const QUICK_PROMPTS = [
  {
    label: "Add measurable impact",
    text: "Include verified numbers, percentages, volumes, turnaround times, quality measures or service levels where available.",
  },
  {
    label: "Strengthen action verbs",
    text: "Replace passive phrases such as responsible for with direct, role-relevant action verbs.",
  },
  {
    label: "Make it concise",
    text: "Remove repetition and keep each statement clear, specific and recruiter-friendly.",
  },
  {
    label: "Improve ATS relevance",
    text: "Use relevant terminology from the vacancy without keyword stuffing or adding unsupported claims.",
  },
];

function scoreClass(score: number): string {
  if (score >= 80) return styles.high;
  if (score >= 62) return styles.medium;
  return styles.low;
}

function formatMetricLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

export function ResumeWriterPanel({
  targetRole,
  jobDescription,
  onJobDescriptionChange,
}: ResumeWriterPanelProps) {
  const [sectionType, setSectionType] =
    useState<ResumeSectionType>("experience");
  const [rawContent, setRawContent] = useState("");
  const [selectedTone, setSelectedTone] =
    useState<ResumeTone>("professional");
  const [copied, setCopied] = useState("");
  const [editableOutput, setEditableOutput] = useState("");
  const [activeRewriteId, setActiveRewriteId] = useState("");
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [message, setMessage] = useState("");

  const result = useMemo(
    () =>
      generateResumeContent({
        targetRole,
        sectionType,
        tone: selectedTone,
        rawContent,
        jobDescription,
      }),
    [jobDescription, rawContent, sectionType, selectedTone, targetRole],
  );

  const selectedRewrite =
    result.rewrites.find((item) => item.tone === selectedTone) ??
    result.rewrites[0];

  const currentOutput =
    activeRewriteId === selectedRewrite.id && editableOutput
      ? editableOutput
      : selectedRewrite.content;

  const currentSection = SECTION_OPTIONS.find(
    (option) => option.value === sectionType,
  );

  async function copyText(id: string, value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setMessage("Improved content copied.");
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setMessage("Your browser could not copy the content.");
    }
  }

  function beginEditing(): void {
    setActiveRewriteId(selectedRewrite.id);
    setEditableOutput(selectedRewrite.content);
    setMessage("You can now refine the generated version before saving it.");
  }

  function saveVersion(): void {
    const content = currentOutput.trim();
    if (!content) return;

    const version: SavedVersion = {
      id: `${Date.now()}-${selectedTone}`,
      section: sectionType,
      tone: selectedTone,
      content,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setVersions((current) => [version, ...current].slice(0, 8));
    setMessage("Version saved in this writing session.");
  }

  function restoreVersion(version: SavedVersion): void {
    setSectionType(version.section);
    setSelectedTone(version.tone);
    setActiveRewriteId(selectedRewrite.id);
    setEditableOutput(version.content);
    setMessage(`Version from ${version.createdAt} restored.`);
  }

  function applyQuickPrompt(prompt: string): void {
    setRawContent((current) =>
      current.trim() ? `${current.trim()}\n\nWriting instruction: ${prompt}` : prompt,
    );
    setMessage("Writing instruction added to your source evidence.");
  }

  function clearWriter(): void {
    setRawContent("");
    setEditableOutput("");
    setActiveRewriteId("");
    setMessage("");
  }

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            AI Resume Writer Studio
          </span>
          <h2>Transform real career evidence into stronger CV content</h2>
          <p>
            Generate professional, ATS-focused and executive versions, compare
            the wording, refine the result and save versions without inventing
            qualifications, duties or achievements.
          </p>
        </div>

        <div className={styles.qualityCard}>
          <span>Current writing quality</span>
          <strong className={scoreClass(result.quality.overall)}>
            {result.quality.overall}/100
          </strong>
          <small>
            The score reflects clarity and evidence strength. Add verified
            facts to improve credibility.
          </small>
        </div>
      </section>

      <section className={styles.commandBar}>
        <div>
          <span className={styles.eyebrow}>Target position</span>
          <strong>{targetRole || "No target role selected"}</strong>
        </div>
        <div className={styles.commandActions}>
          <button type="button" onClick={saveVersion}>
            Save version
          </button>
          <button type="button" onClick={clearWriter}>
            Clear
          </button>
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.inputColumn}>
          <div className={styles.sectionSelector}>
            <span className={styles.eyebrow}>Choose what to improve</span>
            <div>
              {SECTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    sectionType === option.value ? styles.activeSection : ""
                  }
                  onClick={() => {
                    setSectionType(option.value);
                    setActiveRewriteId("");
                    setEditableOutput("");
                  }}
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </div>

          <label>
            <span>Raw career information</span>
            <small className={styles.fieldHelp}>
              Add duties, tools, projects, volumes, KPIs and results that are
              true and can be explained in an interview.
            </small>
            <textarea
              value={rawContent}
              onChange={(event) => setRawContent(event.target.value)}
              placeholder="Example: Managed warehouse staff, monitored stock, handled dispatch and improved order accuracy."
            />
          </label>

          <div className={styles.quickActions}>
            <span>Quick writing instructions</span>
            <div>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => applyQuickPrompt(prompt.text)}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span>Job description</span>
            <small className={styles.fieldHelp}>
              Paste the vacancy to improve role targeting and keyword relevance.
            </small>
            <textarea
              value={jobDescription}
              onChange={(event) =>
                onJobDescriptionChange(event.target.value)
              }
              placeholder="Paste the vacancy here."
            />
          </label>
        </div>

        <div className={styles.outputColumn}>
          <div className={styles.outputIntro}>
            <div>
              <span className={styles.eyebrow}>Live writing result</span>
              <h3>{currentSection?.label}</h3>
            </div>
            <span className={styles.liveBadge}>Updates instantly</span>
          </div>

          <div className={styles.toneTabs}>
            {result.rewrites.map((rewrite) => (
              <button
                key={rewrite.tone}
                type="button"
                className={
                  selectedTone === rewrite.tone ? styles.active : ""
                }
                onClick={() => {
                  setSelectedTone(rewrite.tone);
                  setActiveRewriteId("");
                  setEditableOutput("");
                }}
              >
                <span>{rewrite.title}</span>
                <strong>{rewrite.score}</strong>
              </button>
            ))}
          </div>

          <article className={styles.rewriteCard}>
            <div className={styles.rewriteHeader}>
              <div>
                <span className={styles.eyebrow}>Generated version</span>
                <h3>{selectedRewrite.title}</h3>
              </div>
              <div className={styles.rewriteActions}>
                <button type="button" onClick={beginEditing}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(selectedRewrite.id, currentOutput)
                  }
                >
                  {copied === selectedRewrite.id ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {activeRewriteId === selectedRewrite.id ? (
              <textarea
                className={styles.outputEditor}
                value={editableOutput}
                onChange={(event) => setEditableOutput(event.target.value)}
                aria-label="Editable AI resume content"
              />
            ) : (
              <pre>{currentOutput}</pre>
            )}

            <div className={styles.rewriteMeta}>
              <div>
                <h4>Strengths</h4>
                <ul>
                  {selectedRewrite.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Accuracy checks</h4>
                <ul>
                  {selectedRewrite.cautions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          {message ? <div className={styles.message}>{message}</div> : null}
        </div>
      </section>

      <section className={styles.qualityGrid}>
        {Object.entries(result.quality)
          .filter(([key]) => key !== "overall")
          .map(([key, score]) => (
            <article key={key}>
              <div>
                <span>{formatMetricLabel(key)}</span>
                <strong className={scoreClass(score)}>{score}</strong>
              </div>
              <div className={styles.track}>
                <i style={{ width: `${score}%` }} />
              </div>
            </article>
          ))}
      </section>

      <section className={styles.comparison}>
        <div>
          <span className={styles.eyebrow}>Original evidence</span>
          <pre>{result.before || "Your source content will appear here."}</pre>
        </div>
        <div>
          <span className={styles.eyebrow}>Improved version</span>
          <pre>{currentOutput}</pre>
        </div>
      </section>

      <section className={styles.insightGrid}>
        <article>
          <h3>Evidence questions</h3>
          <p>
            Answer these before treating the final wording as complete.
          </p>
          <div className={styles.questionList}>
            {result.evidenceQuestions.map((item) => (
              <div key={item.id} className={styles[item.priority]}>
                <span>{item.priority} priority</span>
                <strong>{item.question}</strong>
                <small>{item.reason}</small>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3>Evidence dashboard</h3>
          <div className={styles.evidenceBlock}>
            <h4>Signals detected</h4>
            <ul>
              {result.extractedSignals.length ? (
                result.extractedSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))
              ) : (
                <li>No strong evidence signals detected yet.</li>
              )}
            </ul>
          </div>

          <div className={styles.evidenceBlock}>
            <h4>Still missing</h4>
            <ul>
              {result.missingEvidence.length ? (
                result.missingEvidence.map((item) => (
                  <li key={item}>{item}</li>
                ))
              ) : (
                <li>No major evidence category is currently missing.</li>
              )}
            </ul>
          </div>
        </article>
      </section>

      <section className={styles.versionHistory}>
        <div className={styles.versionHeading}>
          <div>
            <span className={styles.eyebrow}>Session version history</span>
            <h3>Compare and restore recent improvements</h3>
          </div>
          <strong>{versions.length}/8 saved</strong>
        </div>

        {versions.length ? (
          <div className={styles.versionList}>
            {versions.map((version) => (
              <article key={version.id}>
                <div>
                  <strong>{version.section.replace("-", " ")}</strong>
                  <span>
                    {version.tone} · {version.createdAt}
                  </span>
                </div>
                <p>{version.content}</p>
                <button
                  type="button"
                  onClick={() => restoreVersion(version)}
                >
                  Restore
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyVersions}>
            Save a version after editing to keep it available during this
            writing session.
          </p>
        )}
      </section>

      <section className={styles.guardrail}>
        <div>
          <span className={styles.eyebrow}>Responsible AI standard</span>
          <h3>Strengthen the truth. Never manufacture it.</h3>
        </div>
        <ul>
          {result.methodology.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
