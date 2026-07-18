"use client";

import type { ATSResult } from "@/lib/types";

type ATSIntelligencePanelProps = {
  jobDescription: string;
  ats: ATSResult | null;
  busy: string;
  onJobDescriptionChange: (value: string) => void;
  onAnalyse: () => void;
};

function scoreTone(score: number): string {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "critical";
}

export function ATSIntelligencePanel({
  jobDescription,
  ats,
  busy,
  onJobDescriptionChange,
  onAnalyse,
}: ATSIntelligencePanelProps) {
  const score = Math.max(0, Math.min(100, ats?.score ?? 0));

  return (
    <aside className="builder-panel">
      <section className="card form ats-intelligence">
        <div className="ats-intelligence-header">
          <div>
            <span className="eyebrow">ATS Intelligence</span>
            <h3>Job-specific CV matching</h3>
          </div>
          {ats ? (
            <div className={`ats-score-badge ${scoreTone(score)}`}>
              <strong>{score}%</strong>
              <span>match</span>
            </div>
          ) : null}
        </div>

        <label className="field">
          <span>Paste job description</span>
          <textarea
            className="input ats-job-description"
            value={jobDescription}
            onChange={(event) =>
              onJobDescriptionChange(event.target.value)
            }
            placeholder="Paste the complete vacancy description here. The analysis compares your CV against responsibilities, skills and role-specific keywords."
          />
        </label>

        <button
          type="button"
          className="button button-primary button-wide"
          disabled={busy === "ats" || !jobDescription.trim()}
          onClick={onAnalyse}
        >
          {busy === "ats"
            ? "Analysing your CV..."
            : "Analyse CV against job"}
        </button>

        {!ats ? (
          <div className="ats-empty-state">
            <strong>Get a recruiter-style assessment</strong>
            <p>
              Add a job description to identify missing keywords and
              prioritised improvements before submitting your application.
            </p>
          </div>
        ) : (
          <div className="ats-results">
            <div className="ats-progress" aria-label={`ATS score ${score}%`}>
              <span style={{ width: `${score}%` }} />
            </div>

            <section className="ats-result-section">
              <div className="ats-section-heading">
                <h4>Missing keywords</h4>
                <span>{ats.missing_keywords?.length ?? 0}</span>
              </div>

              <div className="tag-row">
                {ats.missing_keywords?.length ? (
                  ats.missing_keywords.map((keyword) => (
                    <span className="tag" key={keyword}>
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="ats-pass-message">
                    Strong keyword coverage detected.
                  </p>
                )}
              </div>
            </section>

            <section className="ats-result-section">
              <div className="ats-section-heading">
                <h4>Priority recommendations</h4>
                <span>{ats.recommendations?.length ?? 0}</span>
              </div>

              {ats.recommendations?.length ? (
                <ol className="ats-recommendation-list">
                  {ats.recommendations.map((recommendation, index) => (
                    <li key={`${recommendation}-${index}`}>
                      <span>{index + 1}</span>
                      <p>{recommendation}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="ats-pass-message">
                  No critical improvements were returned.
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </aside>
  );
}
