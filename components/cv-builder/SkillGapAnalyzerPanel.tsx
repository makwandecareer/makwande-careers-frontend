"use client";

import { useMemo, useState } from "react";

import {
  analyzeSkillGaps,
  type GapCategory,
  type GapPriority,
  type GapResolutionType,
} from "@/lib/skill-gap-analyzer";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

import styles from "./SkillGapAnalyzerPanel.module.css";

type SkillGapAnalyzerPanelProps = {
  cvContent: unknown;
  targetRole: string;
  opportunities: OpportunityInput[];
};

const CATEGORY_LABELS: Record<GapCategory, string> = {
  skill: "Skill",
  tool: "Tool",
  certification: "Certification",
  experience: "Experience",
  education: "Education",
  leadership: "Leadership",
  achievement: "Achievement",
  ats: "ATS evidence",
};

const RESOLUTION_LABELS: Record<GapResolutionType, string> = {
  "cv-evidence": "Improve CV evidence",
  learning: "Targeted learning",
  project: "Build a project",
  experience: "Gain practical exposure",
  verification: "Verify requirement",
};

const PRIORITY_LABELS: Record<GapPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function SkillGapAnalyzerPanel({
  cvContent,
  targetRole,
  opportunities,
}: SkillGapAnalyzerPanelProps) {
  const [category, setCategory] = useState<GapCategory | "all">("all");
  const [selectedId, setSelectedId] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const analysis = useMemo(
    () => analyzeSkillGaps(cvContent, targetRole, opportunities),
    [cvContent, opportunities, targetRole],
  );

  const filteredGaps = analysis.gaps.filter(
    (gap) => category === "all" || gap.category === category,
  );

  const selected =
    analysis.gaps.find((gap) => gap.id === selectedId) ??
    analysis.topPriorities[0];

  const progress = analysis.gaps.length
    ? Math.round(
        (Object.values(completed).filter(Boolean).length /
          analysis.gaps.length) *
          100,
      )
    : 0;

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 10.3 · AI Skill Gap Analyzer
          </span>
          <h2>Turn repeated vacancy gaps into a practical development plan</h2>
          <p>
            Separate missing CV evidence from genuine learning, experience and
            qualification gaps across all saved opportunities.
          </p>
        </div>

        <div className={styles.scoreCard}>
          <span>Portfolio readiness</span>
          <strong>
            {opportunities.length ? `${analysis.readinessScore}%` : "—"}
          </strong>
          <b>{analysis.summary}</b>
        </div>
      </section>

      <section className={styles.metricGrid}>
        <article>
          <span>Total gaps</span>
          <strong>{analysis.gaps.length}</strong>
          <small>Distinct development areas</small>
        </article>
        <article>
          <span>CV evidence gaps</span>
          <strong>{analysis.evidenceGapCount}</strong>
          <small>May be solved using verified existing evidence</small>
        </article>
        <article>
          <span>Learning gaps</span>
          <strong>{analysis.learningGapCount}</strong>
          <small>Skills, tools and project development</small>
        </article>
        <article>
          <span>Experience gaps</span>
          <strong>{analysis.experienceGapCount}</strong>
          <small>Require practical exposure or responsibility</small>
        </article>
      </section>

      {opportunities.length ? (
        <>
          <section className={styles.progressSection}>
            <div>
              <span className={styles.eyebrow}>Development progress</span>
              <h3>{progress}% of identified gaps reviewed</h3>
            </div>
            <div className={styles.track}>
              <i style={{ width: `${progress}%` }} />
            </div>
          </section>

          <section className={styles.toolbar}>
            <div>
              <span className={styles.eyebrow}>Gap inventory</span>
              <h3>Prioritised by frequency and potential impact</h3>
            </div>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as GapCategory | "all")
              }
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </section>

          <section className={styles.gapLayout}>
            <div className={styles.gapList}>
              {filteredGaps.length ? (
                filteredGaps.map((gap) => (
                  <article
                    key={gap.id}
                    className={
                      selected?.id === gap.id ? styles.selectedGap : ""
                    }
                    onClick={() => setSelectedId(gap.id)}
                  >
                    <div className={styles.gapHeader}>
                      <div>
                        <span
                          className={`${styles.priority} ${
                            styles[gap.priority]
                          }`}
                        >
                          {PRIORITY_LABELS[gap.priority]}
                        </span>
                        <h4>{gap.label}</h4>
                      </div>
                      <strong>{gap.impactScore}</strong>
                    </div>

                    <div className={styles.badges}>
                      <span>{CATEGORY_LABELS[gap.category]}</span>
                      <span>{RESOLUTION_LABELS[gap.resolutionType]}</span>
                      <span>
                        {gap.opportunityCount} opportunit
                        {gap.opportunityCount === 1 ? "y" : "ies"}
                      </span>
                    </div>

                    <p>{gap.explanation}</p>

                    <label
                      className={styles.complete}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={completed[gap.id] ?? false}
                        onChange={(event) =>
                          setCompleted((current) => ({
                            ...current,
                            [gap.id]: event.target.checked,
                          }))
                        }
                      />
                      Reviewed
                    </label>
                  </article>
                ))
              ) : (
                <div className={styles.noResults}>
                  No gaps match the selected category.
                </div>
              )}
            </div>

            {selected ? (
              <article className={styles.detail}>
                <span className={styles.eyebrow}>Selected development area</span>
                <h3>{selected.label}</h3>
                <p>{selected.explanation}</p>

                <div className={styles.detailMeta}>
                  <span>{CATEGORY_LABELS[selected.category]}</span>
                  <span>{RESOLUTION_LABELS[selected.resolutionType]}</span>
                  <span>{PRIORITY_LABELS[selected.priority]} priority</span>
                </div>

                <section>
                  <h4>Evidence question</h4>
                  <blockquote>{selected.evidencePrompt}</blockquote>
                </section>

                <section>
                  <h4>Recommended actions</h4>
                  <ol>
                    {selected.recommendedActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h4>Relevant target roles</h4>
                  <div className={styles.roleTags}>
                    {selected.matchedRoles.map((role) => (
                      <span key={role}>{role}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>Interview preparation</h4>
                  <ul>
                    {selected.interviewTopics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </article>
            ) : null}
          </section>

          <section className={styles.roadmap}>
            <div className={styles.sectionHeader}>
              <span className={styles.eyebrow}>Development roadmap</span>
              <h3>Now, next 30 days and next 90 days</h3>
            </div>

            <div className={styles.roadmapGrid}>
              {analysis.roadmap.map((item) => (
                <article key={item.id}>
                  <span>{item.horizon}</span>
                  <h4>{item.title}</h4>
                  <p>{item.objective}</p>
                  <ul>
                    {item.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                  <b>{item.measurableOutcome}</b>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.insightGrid}>
            <article>
              <span className={styles.eyebrow}>Transferable strengths</span>
              <h3>Capabilities supporting several target roles</h3>
              <ul>
                {analysis.transferableStrengths.length ? (
                  analysis.transferableStrengths.map((item) => (
                    <li key={item.label}>
                      <strong>{item.label}</strong>
                      <span>{item.explanation}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    Add stronger verified skills and achievements to identify
                    transferable strengths.
                  </li>
                )}
              </ul>
            </article>

            <article>
              <span className={styles.eyebrow}>Interview focus</span>
              <h3>Topics to prepare from recurring gaps</h3>
              <ul>
                {analysis.interviewTopics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className={styles.integration}>
            <div>
              <span className={styles.eyebrow}>Integrated improvement workflow</span>
              <h3>Use the right tool for each kind of gap</h3>
            </div>

            <div className={styles.integrationGrid}>
              <article>
                <b>CV evidence</b>
                <span>AI Resume Writer</span>
                <small>
                  Improve wording only when genuine evidence already exists.
                </small>
              </article>
              <article>
                <b>Application relevance</b>
                <span>Job Matching</span>
                <small>Recalculate alignment after verified improvements.</small>
              </article>
              <article>
                <b>Recruiter risk</b>
                <span>Recruiter Simulation</span>
                <small>Test whether gaps remain visible during review.</small>
              </article>
              <article>
                <b>Interview readiness</b>
                <span>Application Copilot</span>
                <small>Prepare examples for recurring weak areas.</small>
              </article>
            </div>
          </section>

          <section className={styles.guardrail}>
            <div>
              <span className={styles.eyebrow}>Evidence-first development</span>
              <h3>Never convert a gap into an invented claim</h3>
            </div>
            <ul>
              {analysis.integrityNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className={styles.empty}>
          <div>10.3</div>
          <h3>Add opportunities before analysing cross-job skill gaps</h3>
          <p>
            Use the Opportunities tab to add vacancies. This analyzer will then
            identify repeated development priorities across those roles.
          </p>
        </section>
      )}
    </aside>
  );
}
