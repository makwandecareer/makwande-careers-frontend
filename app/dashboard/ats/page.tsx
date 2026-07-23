"use client";

import "./ats-intelligence-studio.css";

import { type FormEvent, useMemo, useState } from "react";

import { api } from "@/lib/client-api";
import type { ProfileBundle } from "@/lib/types";

type ATSResult = {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  recommendations: string[];
};

function normaliseScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 55) return "Competitive";
  if (score >= 40) return "Needs improvement";
  return "Low match";
}

function buildProfileContent(bundle: ProfileBundle): Record<string, unknown> {
  return {
    user: bundle.user,
    profile: bundle.profile,
    education: bundle.education,
    experience: bundle.experience,
    skills: bundle.skills,
    projects: bundle.projects,
    certifications: bundle.certifications,
    languages: bundle.languages,
    references: bundle.references,
  };
}

export default function ATSPage() {
  const [cvContent, setCVContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  const score = normaliseScore(result?.score ?? 0);
  const matchedCount = result?.matched_keywords?.length ?? 0;
  const missingCount = result?.missing_keywords?.length ?? 0;
  const keywordCoverage = useMemo(() => {
    const total = matchedCount + missingCount;
    return total ? Math.round((matchedCount / total) * 100) : 0;
  }, [matchedCount, missingCount]);

  async function loadProfile(): Promise<void> {
    setProfileBusy(true);
    setError("");
    setMessage("");

    try {
      const bundle = await api<ProfileBundle>("/api/profile/source-of-truth");
      setCVContent(JSON.stringify(buildProfileContent(bundle), null, 2));
      setMessage("Your saved Makwande Careers profile is ready for analysis.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load your saved career profile.",
      );
    } finally {
      setProfileBusy(false);
    }
  }

  function parseCVContent(): Record<string, unknown> {
    const trimmed = cvContent.trim();

    if (!trimmed) {
      throw new Error("Add your CV content or load your saved profile first.");
    }

    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "object" && parsed !== null
        ? parsed
        : { cv_text: trimmed };
    } catch {
      return { cv_text: trimmed };
    }
  }

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await api<ATSResult>("/api/ai-cv/ats-score", {
        method: "POST",
        body: JSON.stringify({
          cv_content: parseCVContent(),
          job_description: jobDescription.trim(),
          save_history: true,
        }),
      });

      setResult(response);
      setMessage("ATS analysis completed and saved to your history.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to score your CV.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyMissingKeywords(): Promise<void> {
    if (!result?.missing_keywords?.length) return;

    try {
      await navigator.clipboard.writeText(result.missing_keywords.join(", "));
      setMessage("Missing keywords copied.");
    } catch {
      setError("Your browser could not copy the keywords.");
    }
  }

  function resetScanner(): void {
    setResult(null);
    setError("");
    setMessage("");
    setJobDescription("");
  }

  return (
    <main className="ats-studio">
      <header className="ats-hero">
        <div>
          <span className="ats-eyebrow">Makwande ATS Intelligence</span>
          <h1>Know how recruiters and screening systems may read your CV</h1>
          <p>
            Compare your CV with a real vacancy, identify missing keywords and
            receive focused recommendations before you apply.
          </p>
        </div>

        <div className="ats-hero-badge">
          <span>Analysis mode</span>
          <strong>30-point career scan</strong>
        </div>
      </header>

      <section className="ats-metrics" aria-label="ATS analysis summary">
        <article>
          <span>Overall match</span>
          <strong>{result ? `${score}%` : "—"}</strong>
          <small>{result ? scoreLabel(score) : "Run an analysis"}</small>
        </article>
        <article>
          <span>Keyword coverage</span>
          <strong>{result ? `${keywordCoverage}%` : "—"}</strong>
          <small>{matchedCount} matched keywords</small>
        </article>
        <article>
          <span>Keyword gaps</span>
          <strong>{result ? missingCount : "—"}</strong>
          <small>Terms to review carefully</small>
        </article>
        <article>
          <span>Action plan</span>
          <strong>{result?.recommendations?.length ?? "—"}</strong>
          <small>Improvement recommendations</small>
        </article>
      </section>

      <div className="ats-workspace">
        <form className="ats-input-panel" onSubmit={submit}>
          <div className="ats-panel-heading">
            <div>
              <span>Step 1</span>
              <h2>Prepare your comparison</h2>
            </div>
            <button
              type="button"
              className="ats-secondary-button"
              onClick={loadProfile}
              disabled={profileBusy}
            >
              {profileBusy ? "Loading profile..." : "Use my saved profile"}
            </button>
          </div>

          <label className="ats-field">
            <span>CV content</span>
            <small>
              Paste normal CV text, paste JSON, or load your saved Makwande
              Careers profile.
            </small>
            <textarea
              value={cvContent}
              onChange={(event) => setCVContent(event.target.value)}
              placeholder="Paste your CV content here..."
              rows={13}
            />
          </label>

          <label className="ats-field">
            <span>Target job description</span>
            <small>
              Use the complete vacancy description for a more meaningful match.
            </small>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here..."
              rows={13}
              required
            />
          </label>

          {error ? <div className="ats-alert ats-alert-error">{error}</div> : null}
          {message ? (
            <div className="ats-alert ats-alert-success">{message}</div>
          ) : null}

          <div className="ats-form-actions">
            <button
              className="ats-primary-button"
              disabled={busy || !jobDescription.trim() || !cvContent.trim()}
            >
              {busy ? "Analysing your CV..." : "Run ATS analysis"}
            </button>
            <button
              type="button"
              className="ats-secondary-button"
              onClick={resetScanner}
            >
              Reset
            </button>
          </div>

          <p className="ats-disclaimer">
            ATS results are guidance, not a guarantee of selection. Keep every
            claim accurate and supported by your real experience.
          </p>
        </form>

        <section className="ats-results-panel" aria-live="polite">
          {result ? (
            <>
              <div className="ats-score-card">
                <div
                  className="ats-score-ring"
                  style={{ "--ats-score": `${score * 3.6}deg` } as React.CSSProperties}
                  aria-label={`ATS score ${score} percent`}
                >
                  <div>
                    <strong>{score}%</strong>
                    <span>{scoreLabel(score)}</span>
                  </div>
                </div>

                <div>
                  <span className="ats-result-kicker">Recruiter readiness</span>
                  <h2>Your targeted ATS report</h2>
                  <p>
                    Focus on relevant missing terms and stronger evidence. Do
                    not insert keywords that are unrelated to your background.
                  </p>
                </div>
              </div>

              <div className="ats-result-section">
                <div className="ats-result-heading">
                  <div>
                    <span>Matched</span>
                    <h3>Keywords already represented</h3>
                  </div>
                  <strong>{matchedCount}</strong>
                </div>
                <div className="ats-chip-list">
                  {result.matched_keywords.length ? (
                    result.matched_keywords.map((keyword) => (
                      <span className="ats-chip ats-chip-match" key={keyword}>
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p>No matched keywords were returned.</p>
                  )}
                </div>
              </div>

              <div className="ats-result-section">
                <div className="ats-result-heading">
                  <div>
                    <span>Missing</span>
                    <h3>Relevant terms to evaluate</h3>
                  </div>
                  <button
                    type="button"
                    className="ats-text-button"
                    onClick={copyMissingKeywords}
                  >
                    Copy keywords
                  </button>
                </div>
                <div className="ats-chip-list">
                  {result.missing_keywords.length ? (
                    result.missing_keywords.map((keyword) => (
                      <span className="ats-chip ats-chip-gap" key={keyword}>
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p>No major keyword gaps were returned.</p>
                  )}
                </div>
              </div>

              <div className="ats-result-section">
                <div className="ats-result-heading">
                  <div>
                    <span>Priority actions</span>
                    <h3>How to strengthen this application</h3>
                  </div>
                </div>
                <div className="ats-recommendations">
                  {result.recommendations.map((recommendation, index) => (
                    <article key={`${recommendation}-${index}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{recommendation}</p>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="ats-empty-state">
              <div className="ats-empty-icon" aria-hidden="true">
                30
              </div>
              <span>ATS analysis centre</span>
              <h2>Your report will appear here</h2>
              <p>
                Load your profile or paste a CV, add the job description and
                run the scan to see your match score, gaps and action plan.
              </p>
              <div>
                <span>Keyword matching</span>
                <span>Content recommendations</span>
                <span>Recruiter-readiness guidance</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
