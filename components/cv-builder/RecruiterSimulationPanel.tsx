"use client";

import { useMemo, useState } from "react";

import {
  simulateRecruiterReview,
  type PersonaReview,
  type RecruiterSimulationReport,
} from "@/lib/recruiter-simulation";

import styles from "./RecruiterSimulationPanel.module.css";

type RecruiterSimulationPanelProps = {
  cvContent: unknown;
  jobDescription: string;
  targetRole: string;
  atsScore?: number | null;
  onJobDescriptionChange: (value: string) => void;
};

type ViewKey = "decision" | "personas" | "risks" | "method";

function scoreClass(score: number): string {
  if (score >= 80) return styles.high;
  if (score >= 62) return styles.medium;
  return styles.low;
}

function decisionClass(decision: RecruiterSimulationReport["decision"]): string {
  switch (decision) {
    case "strongly-recommend":
      return styles.strongDecision;
    case "recommend":
      return styles.recommendDecision;
    case "review":
      return styles.reviewDecision;
    default:
      return styles.holdDecision;
  }
}

function PersonaCard({ persona }: { persona: PersonaReview }) {
  return (
    <article className={styles.personaCard}>
      <div className={styles.personaHeader}>
        <div>
          <span>{persona.decision}</span>
          <h4>{persona.title}</h4>
        </div>
        <strong className={scoreClass(persona.confidence)}>
          {persona.confidence}
        </strong>
      </div>

      <p>{persona.summary}</p>

      <div className={styles.personaColumns}>
        <div>
          <h5>Positive signals</h5>
          <ul>
            {persona.positives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Concerns</h5>
          <ul>
            {persona.concerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.questions}>
        <h5>Likely interview questions</h5>
        <ol>
          {persona.questions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export function RecruiterSimulationPanel({
  cvContent,
  jobDescription,
  targetRole,
  atsScore,
  onJobDescriptionChange,
}: RecruiterSimulationPanelProps) {
  const [view, setView] = useState<ViewKey>("decision");

  const report = useMemo(
    () =>
      simulateRecruiterReview({
        cvContent,
        jobDescription,
        targetRole,
        atsScore,
      }),
    [atsScore, cvContent, jobDescription, targetRole],
  );

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 8 · AI Recruiter Simulation
          </span>
          <h2>See the application through the hiring team's eyes</h2>
          <p>
            Simulate recruiter, HR, hiring-manager, technical and executive
            reviews using transparent evidence-based scoring.
          </p>
        </div>

        <div className={`${styles.decisionCard} ${decisionClass(report.decision)}`}>
          <span>Final recommendation</span>
          <strong>{report.decisionLabel}</strong>
          <b>{report.overallScore}/100</b>
          <small>{report.scoreExplanation}</small>
        </div>
      </section>

      <section className={styles.jobInput}>
        <label>
          <span>Target role</span>
          <input value={targetRole} readOnly />
        </label>
        <label>
          <span>Full job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) =>
              onJobDescriptionChange(event.target.value)
            }
            placeholder="Paste the complete vacancy description to improve simulation quality."
          />
        </label>
      </section>

      <section className={styles.metricGrid}>
        {report.metrics.map((metric) => (
          <article key={metric.key}>
            <div>
              <span>{metric.label}</span>
              <strong className={scoreClass(metric.score)}>
                {metric.score}
              </strong>
            </div>
            <div className={styles.track}>
              <i style={{ width: `${metric.score}%` }} />
            </div>
            <p>{metric.rationale}</p>
          </article>
        ))}
      </section>

      <nav className={styles.tabs}>
        <button
          type="button"
          className={view === "decision" ? styles.active : ""}
          onClick={() => setView("decision")}
        >
          Hiring decision
        </button>
        <button
          type="button"
          className={view === "personas" ? styles.active : ""}
          onClick={() => setView("personas")}
        >
          Panel reviews
        </button>
        <button
          type="button"
          className={view === "risks" ? styles.active : ""}
          onClick={() => setView("risks")}
        >
          Risks and gaps
        </button>
        <button
          type="button"
          className={view === "method" ? styles.active : ""}
          onClick={() => setView("method")}
        >
          Methodology
        </button>
      </nav>

      {view === "decision" ? (
        <section className={styles.content}>
          <div className={styles.recommendation}>
            <span className={styles.eyebrow}>Executive conclusion</span>
            <h3>{report.finalRecommendation}</h3>
          </div>

          <div className={styles.signalGrid}>
            {report.candidateSignals.map((signal) => (
              <article key={signal.label} className={styles[signal.strength]}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
              </article>
            ))}
          </div>

          <div className={styles.twoColumn}>
            <article>
              <h4>Why this candidate may be shortlisted</h4>
              <ul>
                {report.shortlistReasons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h4>Potential rejection triggers</h4>
              <ul>
                {report.rejectionTriggers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className={styles.nextActions}>
            <h4>Next best actions</h4>
            <ol>
              {report.nextBestActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </section>
      ) : null}

      {view === "personas" ? (
        <section className={styles.personaList}>
          {report.personas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </section>
      ) : null}

      {view === "risks" ? (
        <section className={styles.content}>
          <div className={styles.twoColumn}>
            <article>
              <h4>Application strengths</h4>
              <ul>
                {report.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h4>Priority gaps</h4>
              <ul>
                {report.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className={styles.riskList}>
            {report.risks.map((risk) => (
              <article key={risk.id} className={styles[risk.severity]}>
                <div>
                  <span>{risk.severity} risk</span>
                  <h4>{risk.title}</h4>
                </div>
                <p>{risk.explanation}</p>
                <strong>Resolution</strong>
                <p>{risk.resolution}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === "method" ? (
        <section className={styles.content}>
          <div className={styles.method}>
            <span className={styles.eyebrow}>Transparent scoring</span>
            <h3>How the simulation works</h3>
            <p>
              The system evaluates the application evidence available in the
              CV and vacancy. It does not claim to know an employer's actual
              decision and does not use sensitive personal characteristics.
            </p>
            <ol>
              {report.methodology.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div className={styles.guardrail}>
            <strong>Responsible AI standard</strong>
            <p>
              Scores are application-readiness indicators, not guarantees of
              interviews, offers or hiring outcomes. Users should verify every
              claim and tailor the application honestly.
            </p>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
