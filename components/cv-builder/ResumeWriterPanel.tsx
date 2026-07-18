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

const SECTION_OPTIONS: Array<{
  value: ResumeSectionType;
  label: string;
}> = [
  { value: "summary", label: "Professional summary" },
  { value: "experience", label: "Experience section" },
  { value: "achievement", label: "Achievement bullet" },
  { value: "skills", label: "Skills section" },
  { value: "linkedin", label: "LinkedIn About" },
];

function scoreClass(score: number): string {
  if (score >= 80) return styles.high;
  if (score >= 62) return styles.medium;
  return styles.low;
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

  async function copyText(id: string, value: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1500);
  }

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 9 · AI Resume Writer
          </span>
          <h2>Turn raw career evidence into stronger CV content</h2>
          <p>
            Generate ATS-focused, professional and executive versions while
            protecting accuracy and prompting for missing evidence.
          </p>
        </div>

        <div className={styles.qualityCard}>
          <span>Current evidence quality</span>
          <strong className={scoreClass(result.quality.overall)}>
            {result.quality.overall}/100
          </strong>
          <small>
            Writing can be improved immediately. Evidence quality improves only
            when verified facts are added.
          </small>
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.inputColumn}>
          <label>
            <span>Section to write</span>
            <select
              value={sectionType}
              onChange={(event) =>
                setSectionType(event.target.value as ResumeSectionType)
              }
            >
              {SECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Raw career information</span>
            <textarea
              value={rawContent}
              onChange={(event) => setRawContent(event.target.value)}
              placeholder="Example: Managed warehouse staff, monitored stock, handled dispatch and improved order accuracy."
            />
          </label>

          <label>
            <span>Job description</span>
            <textarea
              value={jobDescription}
              onChange={(event) =>
                onJobDescriptionChange(event.target.value)
              }
              placeholder="Paste the vacancy to improve role targeting."
            />
          </label>
        </div>

        <div className={styles.outputColumn}>
          <div className={styles.toneTabs}>
            {result.rewrites.map((rewrite) => (
              <button
                key={rewrite.tone}
                type="button"
                className={
                  selectedTone === rewrite.tone ? styles.active : ""
                }
                onClick={() => setSelectedTone(rewrite.tone)}
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
              <button
                type="button"
                onClick={() =>
                  void copyText(selectedRewrite.id, selectedRewrite.content)
                }
              >
                {copied === selectedRewrite.id ? "Copied" : "Copy"}
              </button>
            </div>

            <pre>{selectedRewrite.content}</pre>

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
        </div>
      </section>

      <section className={styles.qualityGrid}>
        {Object.entries(result.quality)
          .filter(([key]) => key !== "overall")
          .map(([key, score]) => (
            <article key={key}>
              <div>
                <span>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                </span>
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
          <span className={styles.eyebrow}>Before</span>
          <pre>{result.before || "Your raw content will appear here."}</pre>
        </div>
        <div>
          <span className={styles.eyebrow}>After</span>
          <pre>{selectedRewrite.content}</pre>
        </div>
      </section>

      <section className={styles.insightGrid}>
        <article>
          <h3>Evidence questions</h3>
          <p>
            Answer these questions before treating the final wording as
            complete.
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
