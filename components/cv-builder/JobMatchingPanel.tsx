"use client";

import { useMemo } from "react";

import { calculateJobMatch } from "@/lib/job-matching";

import styles from "./JobMatchingPanel.module.css";

type JobMatchingPanelProps = {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
};

function scoreClass(score: number): string {
  if (score >= 80) return styles.high;
  if (score >= 60) return styles.medium;
  return styles.low;
}

export function JobMatchingPanel({
  cvContent,
  targetRole,
  jobDescription,
  onJobDescriptionChange,
}: JobMatchingPanelProps) {
  const result = useMemo(
    () =>
      calculateJobMatch({
        cvContent,
        targetRole,
        jobDescription,
      }),
    [cvContent, jobDescription, targetRole],
  );

  const hasJob = jobDescription.trim().length > 20;

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 10.1 · Job Matching Engine
          </span>
          <h2>Measure role alignment using transparent career evidence</h2>
          <p>
            Compare the current CV with a vacancy across skills, experience,
            education, ATS language, leadership, technical capability,
            achievements and seniority.
          </p>
        </div>

        <div className={styles.scoreCard}>
          <span>Overall match</span>
          <strong className={scoreClass(result.overallScore)}>
            {hasJob ? result.overallScore : "—"}
          </strong>
          <b>{hasJob ? result.readinessBand : "Paste a vacancy"}</b>
          <small>
            This is an evidence-alignment score, not a hiring prediction.
          </small>
        </div>
      </section>

      <section className={styles.jobInput}>
        <label>
          <span>Target role</span>
          <strong>{targetRole || "Set a target role in the builder"}</strong>
        </label>

        <label>
          <span>Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) =>
              onJobDescriptionChange(event.target.value)
            }
            placeholder="Paste the complete vacancy, including responsibilities, minimum requirements and preferred skills."
          />
        </label>
      </section>

      {hasJob ? (
        <>
          <section className={styles.recommendation}>
            <div>
              <span className={styles.eyebrow}>Application recommendation</span>
              <h3>{result.recommendation}</h3>
              <p>{result.explanation}</p>
            </div>
            <div className={styles.recommendationBadge}>
              {result.readinessBand}
            </div>
          </section>

          <section className={styles.dimensionGrid}>
            {result.dimensions.map((item) => (
              <article key={item.key}>
                <div className={styles.dimensionHeader}>
                  <div>
                    <span>{item.label}</span>
                    <small>{item.weight}% weighting</small>
                  </div>
                  <strong className={scoreClass(item.score)}>
                    {item.score}
                  </strong>
                </div>

                <div className={styles.track}>
                  <i style={{ width: `${item.score}%` }} />
                </div>

                <p>{item.explanation}</p>

                <div className={styles.miniEvidence}>
                  <div>
                    <b>Matched</b>
                    <span>
                      {item.matched.slice(0, 3).join(" · ") ||
                        "No strong evidence detected"}
                    </span>
                  </div>
                  <div>
                    <b>Missing</b>
                    <span>
                      {item.missing.slice(0, 3).join(" · ") ||
                        "No major gap detected"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.insightGrid}>
            <article>
              <span className={styles.eyebrow}>Competitive strengths</span>
              <h3>Evidence supporting this application</h3>
              <ul>
                {result.strengths.length ? (
                  result.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))
                ) : (
                  <li>
                    Add more verified experience, skills and achievements to
                    establish stronger alignment.
                  </li>
                )}
              </ul>
            </article>

            <article>
              <span className={styles.eyebrow}>Priority gaps</span>
              <h3>What to strengthen before applying</h3>
              <ul>
                {result.gaps.length ? (
                  result.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))
                ) : (
                  <li>
                    No major evidence gaps were identified from the supplied
                    vacancy.
                  </li>
                )}
              </ul>
            </article>
          </section>

          <section className={styles.nextActions}>
            <div>
              <span className={styles.eyebrow}>Integrated workflow</span>
              <h3>Turn insight into application readiness</h3>
            </div>

            <div className={styles.actions}>
              <article>
                <b>1</b>
                <span>Use AI Resume Writer</span>
                <small>Strengthen weak CV evidence and vacancy language.</small>
              </article>
              <article>
                <b>2</b>
                <span>Run Career Intelligence</span>
                <small>Validate ATS, impact and interview readiness.</small>
              </article>
              <article>
                <b>3</b>
                <span>Run Recruiter Simulation</span>
                <small>Review shortlist strengths and rejection risks.</small>
              </article>
              <article>
                <b>4</b>
                <span>Open Application Copilot</span>
                <small>Prepare the tailored application package.</small>
              </article>
            </div>
          </section>

          <section className={styles.guardrail}>
            <div>
              <span className={styles.eyebrow}>Responsible matching</span>
              <h3>What this score does—and does not—mean</h3>
            </div>
            <ul>
              {result.integrityNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className={styles.emptyState}>
          <div>10.1</div>
          <h3>Paste a vacancy to activate job matching</h3>
          <p>
            The engine will compare the vacancy with the current CV and explain
            every major strength, gap and scoring dimension.
          </p>
        </section>
      )}
    </aside>
  );
}
