"use client";

import { useMemo } from "react";

import {
  analyseCareerIntelligence,
  type IntelligenceSeverity,
} from "@/lib/career-intelligence";
import type { ATSResult } from "@/lib/types";

import styles from "./CareerIntelligencePanel.module.css";

type CareerIntelligencePanelProps = {
  jobDescription: string;
  targetRole: string;
  cvContent: unknown;
  ats: ATSResult | null;
  busy: string;
  onJobDescriptionChange: (value: string) => void;
  onAnalyse: () => void;
};

const severityLabels: Record<IntelligenceSeverity, string> = {
  critical: "Critical",
  important: "Important",
  recommended: "Recommended",
  passed: "Passed",
};

export function CareerIntelligencePanel({
  jobDescription,
  targetRole,
  cvContent,
  ats,
  busy,
  onJobDescriptionChange,
  onAnalyse,
}: CareerIntelligencePanelProps) {
  const report = useMemo(
    () =>
      analyseCareerIntelligence({
        cvContent,
        jobDescription,
        targetRole,
        backendAtsScore: ats?.score ?? null,
      }),
    [ats?.score, cvContent, jobDescription, targetRole],
  );

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Phase 6 · Career Intelligence</span>
          <h2>Deep recruiter and KPI analysis</h2>
          <p>
            Evaluate job alignment, measurable results, business impact,
            leadership and interview readiness without inventing achievements.
          </p>
        </div>

        <div className={styles.overallScore}>
          <strong>{report.overallScore}%</strong>
          <span>{report.verdict}</span>
        </div>
      </section>

      <label className={styles.field}>
        <span>Target job description</span>
        <textarea
          value={jobDescription}
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          placeholder="Paste the complete vacancy description to activate job-specific keyword and recruiter analysis."
        />
      </label>

      <button
        type="button"
        className={styles.analyseButton}
        disabled={busy === "ats" || !jobDescription.trim()}
        onClick={onAnalyse}
      >
        {busy === "ats" ? "Running deep analysis..." : "Run ATS and career analysis"}
      </button>

      <div className={styles.metricGrid}>
        {report.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.key}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.score}%</strong>
            </div>
            <div className={styles.progress}>
              <span style={{ width: `${metric.score}%` }} />
            </div>
            <p>{metric.explanation}</p>
          </article>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Decision support</span>
            <h3>Priority findings</h3>
          </div>
          <span>{report.findings.length}</span>
        </div>

        <div className={styles.findingList}>
          {report.findings.map((finding) => (
            <article
              className={`${styles.finding} ${styles[finding.severity]}`}
              key={finding.id}
            >
              <div className={styles.findingTop}>
                <span>{severityLabels[finding.severity]}</span>
                <strong>{finding.title}</strong>
              </div>
              <p>{finding.explanation}</p>
              {finding.evidence ? (
                <blockquote>{finding.evidence}</blockquote>
              ) : null}
              <small>{finding.recommendation}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Evidence builder</span>
            <h3>KPI and measurable-result rewrites</h3>
          </div>
          <span>{report.rewriteSuggestions.length}</span>
        </div>

        <div className={styles.rewriteList}>
          {report.rewriteSuggestions.map((suggestion) => (
            <article className={styles.rewriteCard} key={suggestion.id}>
              <div>
                <span>Current statement</span>
                <p>{suggestion.current}</p>
              </div>
              <div>
                <span>World-class structure</span>
                <strong>{suggestion.suggestedStructure}</strong>
              </div>
              <p>{suggestion.whyItWorks}</p>
              <ul>
                {suggestion.evidenceNeeded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Deep thinking</span>
            <h3>Questions that strengthen credibility</h3>
          </div>
        </div>

        <ol className={styles.questionList}>
          {report.strategicQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      {jobDescription.trim() ? (
        <section className={styles.keywordSection}>
          <div>
            <h3>Matched keywords</h3>
            <div className={styles.tags}>
              {report.matchedKeywords.slice(0, 16).map((keyword) => (
                <span className={styles.matched} key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3>Missing keywords</h3>
            <div className={styles.tags}>
              {report.missingKeywords.slice(0, 16).map((keyword) => (
                <span className={styles.missing} key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
