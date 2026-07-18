"use client";

import { useMemo, useState } from "react";

import {
  explainCareerFit,
  type CareerFitLevel,
} from "@/lib/career-fit-explanations";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

import styles from "./CareerFitExplanationsPanel.module.css";

type CareerFitExplanationsPanelProps = {
  cvContent: unknown;
  targetRole: string;
  opportunities: OpportunityInput[];
};

const FIT_LABELS: Record<CareerFitLevel, string> = {
  strong: "Strong fit",
  promising: "Promising fit",
  developing: "Developing fit",
  stretch: "Stretch fit",
};

export function CareerFitExplanationsPanel({
  cvContent,
  targetRole,
  opportunities,
}: CareerFitExplanationsPanelProps) {
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<
    "overview" | "application" | "interview"
  >("overview");

  const portfolio = useMemo(
    () => explainCareerFit(cvContent, targetRole, opportunities),
    [cvContent, opportunities, targetRole],
  );

  const selected =
    portfolio.explanations.find(
      (item) => item.opportunity.id === selectedId,
    ) ?? portfolio.strongestFit;

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 10.4 · Career Fit Explanations
          </span>
          <h2>Explain the score in language candidates can act on</h2>
          <p>
            Convert job-match results into clear role-fit reasoning,
            application positioning, recruiter concerns and interview
            preparation.
          </p>
        </div>

        <div className={styles.heroSummary}>
          <span>Strongest documented fit</span>
          <strong>
            {portfolio.strongestFit
              ? `${portfolio.strongestFit.overallScore}%`
              : "—"}
          </strong>
          <b>
            {portfolio.strongestFit?.opportunity.title ??
              "Add opportunities to begin"}
          </b>
        </div>
      </section>

      {portfolio.explanations.length ? (
        <>
          <section className={styles.portfolioSummary}>
            <div>
              <span className={styles.eyebrow}>Portfolio interpretation</span>
              <h3>What the opportunity set is showing</h3>
            </div>
            <p>{portfolio.portfolioSummary}</p>
          </section>

          <section className={styles.selector}>
            {portfolio.explanations.map((item, index) => (
              <button
                key={item.opportunity.id}
                type="button"
                className={
                  selected?.opportunity.id === item.opportunity.id
                    ? styles.selected
                    : ""
                }
                onClick={() => setSelectedId(item.opportunity.id)}
              >
                <span>#{index + 1}</span>
                <div>
                  <strong>{item.opportunity.title}</strong>
                  <small>
                    {item.opportunity.company} ·{" "}
                    {FIT_LABELS[item.fitLevel]}
                  </small>
                </div>
                <b>{item.overallScore}%</b>
              </button>
            ))}
          </section>

          {selected ? (
            <>
              <section className={styles.detailHero}>
                <div>
                  <span
                    className={`${styles.fitBadge} ${
                      styles[selected.fitLevel]
                    }`}
                  >
                    {FIT_LABELS[selected.fitLevel]}
                  </span>
                  <h3>{selected.headline}</h3>
                  <p>{selected.executiveSummary}</p>
                </div>

                <div className={styles.score}>
                  <strong>{selected.overallScore}%</strong>
                  <span>Documented alignment</span>
                </div>
              </section>

              <section className={styles.modeTabs}>
                <button
                  type="button"
                  className={mode === "overview" ? styles.active : ""}
                  onClick={() => setMode("overview")}
                >
                  Fit overview
                </button>
                <button
                  type="button"
                  className={mode === "application" ? styles.active : ""}
                  onClick={() => setMode("application")}
                >
                  Application strategy
                </button>
                <button
                  type="button"
                  className={mode === "interview" ? styles.active : ""}
                  onClick={() => setMode("interview")}
                >
                  Interview narrative
                </button>
              </section>

              {mode === "overview" ? (
                <section className={styles.twoColumn}>
                  <article>
                    <span className={styles.eyebrow}>Why this role fits</span>
                    <h3>Strongest documented evidence</h3>
                    <div className={styles.evidenceList}>
                      {selected.whyItFits.map((item) => (
                        <div key={item.label}>
                          <header>
                            <strong>{item.label}</strong>
                            {typeof item.score === "number" ? (
                              <b>{item.score}%</b>
                            ) : null}
                          </header>
                          <p>{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article>
                    <span className={styles.eyebrow}>Main fit risks</span>
                    <h3>What may concern a recruiter</h3>
                    <div className={styles.riskList}>
                      {selected.mainRisks.map((item) => (
                        <div key={item.label}>
                          <strong>{item.label}</strong>
                          <p>{item.explanation}</p>
                          <small>{item.action}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              ) : mode === "application" ? (
                <section className={styles.strategy}>
                  <article>
                    <span className={styles.eyebrow}>
                      Application positioning
                    </span>
                    <h3>How to present the candidate honestly</h3>
                    <ol>
                      {selected.applicationStrategy.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </article>

                  <article>
                    <span className={styles.eyebrow}>
                      Transferable value
                    </span>
                    <h3>Strengths worth carrying into the application</h3>
                    <div className={styles.tags}>
                      {selected.transferableValue.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </article>
                </section>
              ) : (
                <section className={styles.strategy}>
                  <article>
                    <span className={styles.eyebrow}>
                      Interview story
                    </span>
                    <h3>Examples the candidate should prepare</h3>
                    <ul>
                      {selected.interviewNarrative.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article>
                    <span className={styles.eyebrow}>
                      Recruiter questions
                    </span>
                    <h3>Likely areas of scrutiny</h3>
                    <ul>
                      {selected.recruiterQuestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </section>
              )}

              <section className={styles.decision}>
                <div>
                  <span className={styles.eyebrow}>Decision guidance</span>
                  <h3>{selected.decisionGuidance.recommendation}</h3>
                  <p>{selected.decisionGuidance.confidenceNote}</p>
                </div>

                <aside>
                  <span>Next best action</span>
                  <strong>
                    {selected.decisionGuidance.nextBestAction}
                  </strong>
                </aside>
              </section>
            </>
          ) : null}

          <section className={styles.portfolioSignals}>
            <article>
              <span className={styles.eyebrow}>Recurring advantages</span>
              <h3>Strengths supporting several roles</h3>
              <div className={styles.tags}>
                {portfolio.recurringAdvantages.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>

            <article>
              <span className={styles.eyebrow}>Recurring risks</span>
              <h3>Evidence gaps affecting several roles</h3>
              <div className={styles.tags}>
                {portfolio.recurringRisks.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.guardrail}>
            <div>
              <span className={styles.eyebrow}>Responsible explanation</span>
              <h3>Explain alignment without pretending to know the outcome</h3>
            </div>
            <p>
              Career-fit explanations describe evidence visible in the CV and
              vacancy. They do not infer personality, protected characteristics,
              culture fit, employer preferences or hiring probability.
            </p>
          </section>
        </>
      ) : (
        <section className={styles.empty}>
          <div>10.4</div>
          <h3>Add opportunities to generate career-fit explanations</h3>
          <p>
            The platform will explain why each role fits, what may concern a
            recruiter and how the candidate should position genuine evidence.
          </p>
        </section>
      )}
    </aside>
  );
}
