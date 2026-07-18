"use client";

import { useMemo, useState } from "react";

import {
  createApplicationCopilotReport,
  type CopilotTone,
} from "@/lib/application-copilot";

import styles from "./ApplicationCopilotPanel.module.css";

type ApplicationCopilotPanelProps = {
  cvContent: unknown;
  jobDescription: string;
  targetRole: string;
  onJobDescriptionChange: (value: string) => void;
};

type CopilotView =
  | "cover-letter"
  | "recruiter"
  | "interview"
  | "plan"
  | "negotiation";

export function ApplicationCopilotPanel({
  cvContent,
  jobDescription,
  targetRole,
  onJobDescriptionChange,
}: ApplicationCopilotPanelProps) {
  const [companyName, setCompanyName] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [tone, setTone] = useState<CopilotTone>("professional");
  const [view, setView] = useState<CopilotView>("cover-letter");
  const [copied, setCopied] = useState(false);

  const report = useMemo(
    () =>
      createApplicationCopilotReport({
        cvContent,
        jobDescription,
        targetRole,
        companyName,
        hiringManager,
        tone,
      }),
    [
      companyName,
      cvContent,
      hiringManager,
      jobDescription,
      targetRole,
      tone,
    ],
  );

  async function copyCoverLetter(): Promise<void> {
    await navigator.clipboard.writeText(report.coverLetter);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Phase 7 · Application Copilot</span>
          <h2>Prepare the complete application journey</h2>
          <p>
            Create a tailored cover letter, recruiter brief, interview
            preparation, negotiation strategy and 30/60/90-day plan.
          </p>
        </div>

        <div className={styles.readiness}>
          <span>Application checks</span>
          <strong>
            {
              report.applicationChecklist.filter(
                (item) => item.status === "ready",
              ).length
            }
            /{report.applicationChecklist.length}
          </strong>
        </div>
      </section>

      <section className={styles.setup}>
        <label>
          <span>Company name</span>
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Organisation name"
          />
        </label>

        <label>
          <span>Hiring manager</span>
          <input
            value={hiringManager}
            onChange={(event) => setHiringManager(event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label>
          <span>Cover-letter tone</span>
          <select
            value={tone}
            onChange={(event) =>
              setTone(event.target.value as CopilotTone)
            }
          >
            <option value="professional">Professional</option>
            <option value="confident">Confident</option>
            <option value="executive">Executive</option>
            <option value="warm">Warm</option>
          </select>
        </label>

        <label className={styles.full}>
          <span>Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) =>
              onJobDescriptionChange(event.target.value)
            }
            placeholder="Paste the complete vacancy description."
          />
        </label>
      </section>

      <section className={styles.checklist}>
        {report.applicationChecklist.map((item) => (
          <article key={item.label} className={styles[item.status]}>
            <div>
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </div>
            <p>{item.explanation}</p>
          </article>
        ))}
      </section>

      <nav className={styles.tabs} aria-label="Application copilot tools">
        <button
          type="button"
          className={view === "cover-letter" ? styles.active : ""}
          onClick={() => setView("cover-letter")}
        >
          Cover letter
        </button>
        <button
          type="button"
          className={view === "recruiter" ? styles.active : ""}
          onClick={() => setView("recruiter")}
        >
          Recruiter brief
        </button>
        <button
          type="button"
          className={view === "interview" ? styles.active : ""}
          onClick={() => setView("interview")}
        >
          Interview coach
        </button>
        <button
          type="button"
          className={view === "plan" ? styles.active : ""}
          onClick={() => setView("plan")}
        >
          30/60/90 plan
        </button>
        <button
          type="button"
          className={view === "negotiation" ? styles.active : ""}
          onClick={() => setView("negotiation")}
        >
          Negotiation
        </button>
      </nav>

      {view === "cover-letter" ? (
        <section className={styles.output}>
          <div className={styles.outputHeader}>
            <div>
              <span className={styles.eyebrow}>Tailored document</span>
              <h3>Cover letter draft</h3>
            </div>
            <button type="button" onClick={() => void copyCoverLetter()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className={styles.letter}>{report.coverLetter}</pre>

          <p className={styles.guardrail}>
            Review every sentence before sending. The copilot does not
            invent achievements, salary information or company facts.
          </p>
        </section>
      ) : null}

      {view === "recruiter" ? (
        <section className={styles.output}>
          <span className={styles.eyebrow}>Hiring decision support</span>
          <h3>{report.recruiterBrief.headline}</h3>
          <p className={styles.summary}>
            {report.recruiterBrief.fitSummary}
          </p>

          <div className={styles.threeColumn}>
            <div>
              <h4>Strengths</h4>
              <ul>
                {report.recruiterBrief.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Risks</h4>
              <ul>
                {report.recruiterBrief.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Interview focus</h4>
              <ul>
                {report.recruiterBrief.interviewFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {view === "interview" ? (
        <section className={styles.output}>
          <span className={styles.eyebrow}>Structured preparation</span>
          <h3>Interview question bank</h3>

          <div className={styles.questionList}>
            {report.interviewQuestions.map((item) => (
              <article key={item.id}>
                <span>{item.category}</span>
                <h4>{item.question}</h4>
                <ol>
                  {item.answerFramework.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p>{item.evidencePrompt}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === "plan" ? (
        <section className={styles.output}>
          <span className={styles.eyebrow}>First 90 days</span>
          <h3>Role success plan</h3>

          <div className={styles.planGrid}>
            {report.successPlan.map((item) => (
              <article key={item.period}>
                <span>{item.period}</span>
                <h4>{item.objective}</h4>
                <strong>Actions</strong>
                <ul>
                  {item.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                <strong>Success indicators</strong>
                <ul>
                  {item.indicators.map((indicator) => (
                    <li key={indicator}>{indicator}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === "negotiation" ? (
        <section className={styles.output}>
          <span className={styles.eyebrow}>Offer confidence</span>
          <h3>Salary and offer discussion</h3>

          <ol className={styles.negotiationList}>
            {report.negotiationPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <p className={styles.guardrail}>
            Use current market research and your verified experience.
            Never misrepresent salary history or competing offers.
          </p>
        </section>
      ) : null}
    </aside>
  );
}
