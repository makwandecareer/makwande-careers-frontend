"use client";

import { useMemo, useState } from "react";

import {
  createOpportunityId,
  parseOpportunityBatch,
  rankOpportunities,
  type OpportunityInput,
  type OpportunityStatus,
} from "@/lib/opportunity-dashboard";

import styles from "./OpportunityDashboardPanel.module.css";

type OpportunityDashboardPanelProps = {
  cvContent: unknown;
  targetRole: string;
  opportunities?: OpportunityInput[];
  onOpportunitiesChange?: (value: OpportunityInput[]) => void;
};

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  employmentType: "",
  description: "",
  source: "",
  closingDate: "",
  salaryLabel: "",
};

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  saved: "Saved",
  reviewing: "Reviewing",
  ready: "Ready to apply",
  applied: "Applied",
  archived: "Archived",
};

function scoreClass(score: number): string {
  if (score >= 80) return styles.high;
  if (score >= 60) return styles.medium;
  return styles.low;
}

export function OpportunityDashboardPanel({
  cvContent,
  targetRole,
  opportunities: controlledOpportunities,
  onOpportunitiesChange,
}: OpportunityDashboardPanelProps) {
  const [localOpportunities, setLocalOpportunities] = useState<OpportunityInput[]>([]);
  const opportunities = controlledOpportunities ?? localOpportunities;

  function setOpportunities(
    updater:
      | OpportunityInput[]
      | ((current: OpportunityInput[]) => OpportunityInput[]),
  ): void {
    const next =
      typeof updater === "function"
        ? updater(opportunities)
        : updater;

    if (onOpportunitiesChange) {
      onOpportunitiesChange(next);
    } else {
      setLocalOpportunities(next);
    }
  }
  const [form, setForm] = useState(EMPTY_FORM);
  const [batch, setBatch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<"cards" | "compare">("cards");

  const result = useMemo(
    () => rankOpportunities(cvContent, targetRole, opportunities),
    [cvContent, opportunities, targetRole],
  );

  const selected =
    result.ranked.find((item) => item.opportunity.id === selectedId) ??
    result.bestMatch;

  function addOpportunity(): void {
    if (!form.title.trim() || form.description.trim().length < 20) return;

    const item: OpportunityInput = {
      id: createOpportunityId(opportunities.length),
      title: form.title.trim(),
      company: form.company.trim() || "Company not specified",
      location: form.location.trim() || "Location not specified",
      employmentType: form.employmentType.trim() || "Not specified",
      description: form.description.trim(),
      source: form.source.trim() || undefined,
      closingDate: form.closingDate || undefined,
      salaryLabel: form.salaryLabel.trim() || undefined,
      status: "reviewing",
    };

    setOpportunities((current) => [...current, item]);
    setSelectedId(item.id);
    setForm(EMPTY_FORM);
  }

  function addBatch(): void {
    const parsed = parseOpportunityBatch(batch);
    if (!parsed.length) return;
    setOpportunities((current) => [...current, ...parsed]);
    setSelectedId(parsed[0].id);
    setBatch("");
  }

  function updateStatus(id: string, status: OpportunityStatus): void {
    setOpportunities((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  function removeOpportunity(id: string): void {
    setOpportunities((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId("");
  }

  return (
    <aside className={styles.panel}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 10.2 · Opportunity Dashboard
          </span>
          <h2>Compare, rank and manage multiple job opportunities</h2>
          <p>
            Turn individual vacancy analysis into a practical opportunity
            pipeline with transparent ranking, gap comparison and application
            readiness.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <article>
            <span>Opportunities</span>
            <strong>{result.ranked.length}</strong>
          </article>
          <article>
            <span>Average match</span>
            <strong>{result.ranked.length ? `${result.averageMatch}%` : "—"}</strong>
          </article>
          <article>
            <span>Ready to apply</span>
            <strong>{result.readyCount}</strong>
          </article>
        </div>
      </section>

      <section className={styles.addSection}>
        <div className={styles.formGrid}>
          <label>
            <span>Job title</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Operations Manager"
            />
          </label>

          <label>
            <span>Company</span>
            <input
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
              placeholder="Company name"
            />
          </label>

          <label>
            <span>Location</span>
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Johannesburg, Gauteng"
            />
          </label>

          <label>
            <span>Employment type</span>
            <input
              value={form.employmentType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  employmentType: event.target.value,
                }))
              }
              placeholder="Permanent"
            />
          </label>

          <label>
            <span>Source</span>
            <input
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source: event.target.value,
                }))
              }
              placeholder="LinkedIn, company careers page"
            />
          </label>

          <label>
            <span>Salary label</span>
            <input
              value={form.salaryLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  salaryLabel: event.target.value,
                }))
              }
              placeholder="Only enter published salary"
            />
          </label>

          <label className={styles.full}>
            <span>Complete job description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Paste the complete vacancy here."
            />
          </label>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={addOpportunity}
          disabled={!form.title.trim() || form.description.trim().length < 20}
        >
          Add opportunity
        </button>

        <details className={styles.batch}>
          <summary>Bulk-add opportunities</summary>
          <p>
            Separate opportunities with a line containing <strong>---</strong>.
            Use title, company and location as the first three lines.
          </p>
          <textarea
            value={batch}
            onChange={(event) => setBatch(event.target.value)}
            placeholder={"Operations Manager\nABC Logistics\nJohannesburg\nFull job description...\n---\nSupply Chain Coordinator\nXYZ Group\nPretoria\nFull job description..."}
          />
          <button type="button" onClick={addBatch}>
            Import batch
          </button>
        </details>
      </section>

      {result.ranked.length ? (
        <>
          <section className={styles.toolbar}>
            <div>
              <span className={styles.eyebrow}>Ranked pipeline</span>
              <h3>Best opportunities based on documented evidence</h3>
            </div>

            <div className={styles.viewSwitch}>
              <button
                type="button"
                className={view === "cards" ? styles.active : ""}
                onClick={() => setView("cards")}
              >
                Cards
              </button>
              <button
                type="button"
                className={view === "compare" ? styles.active : ""}
                onClick={() => setView("compare")}
              >
                Compare
              </button>
            </div>
          </section>

          {view === "cards" ? (
            <section className={styles.cardGrid}>
              {result.ranked.map((item) => (
                <article
                  key={item.opportunity.id}
                  className={
                    selected?.opportunity.id === item.opportunity.id
                      ? styles.selectedCard
                      : ""
                  }
                  onClick={() => setSelectedId(item.opportunity.id)}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.rank}>#{item.rank}</span>
                    <strong className={scoreClass(item.match.overallScore)}>
                      {item.match.overallScore}%
                    </strong>
                  </div>

                  <h3>{item.opportunity.title}</h3>
                  <p>
                    {item.opportunity.company} · {item.opportunity.location}
                  </p>

                  <div className={styles.meta}>
                    <span>{item.opportunity.employmentType}</span>
                    <span>{STATUS_LABELS[item.opportunity.status ?? "reviewing"]}</span>
                  </div>

                  <div className={styles.track}>
                    <i style={{ width: `${item.match.overallScore}%` }} />
                  </div>

                  <small>{item.match.recommendation}</small>

                  <div className={styles.cardActions}>
                    <select
                      value={item.opportunity.status ?? "reviewing"}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        updateStatus(
                          item.opportunity.id,
                          event.target.value as OpportunityStatus,
                        )
                      }
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeOpportunity(item.opportunity.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={styles.compareTableWrap}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Overall</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>ATS</th>
                    <th>Leadership</th>
                    <th>Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ranked.map((item) => {
                    const byKey = Object.fromEntries(
                      item.match.dimensions.map((dimension) => [
                        dimension.key,
                        dimension.score,
                      ]),
                    ) as Record<string, number>;

                    return (
                      <tr key={item.opportunity.id}>
                        <td>
                          <strong>{item.opportunity.title}</strong>
                          <span>{item.opportunity.company}</span>
                        </td>
                        <td>{item.match.overallScore}%</td>
                        <td>{byKey.skills ?? 0}%</td>
                        <td>{byKey.experience ?? 0}%</td>
                        <td>{byKey.ats ?? 0}%</td>
                        <td>{byKey.leadership ?? 0}%</td>
                        <td>{item.readiness}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {selected ? (
            <section className={styles.detail}>
              <div className={styles.detailHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    Selected opportunity · Rank #{selected.rank}
                  </span>
                  <h3>{selected.opportunity.title}</h3>
                  <p>
                    {selected.opportunity.company} ·{" "}
                    {selected.opportunity.location}
                  </p>
                </div>

                <div className={styles.bigScore}>
                  <strong className={scoreClass(selected.match.overallScore)}>
                    {selected.match.overallScore}%
                  </strong>
                  <span>{selected.match.readinessBand}</span>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <article>
                  <h4>Strongest dimensions</h4>
                  {selected.strongestDimensions.map((item) => (
                    <div key={item.key} className={styles.dimensionRow}>
                      <span>{item.label}</span>
                      <strong>{item.score}%</strong>
                    </div>
                  ))}
                </article>

                <article>
                  <h4>Weakest dimensions</h4>
                  {selected.weakestDimensions.map((item) => (
                    <div key={item.key} className={styles.dimensionRow}>
                      <span>{item.label}</span>
                      <strong>{item.score}%</strong>
                    </div>
                  ))}
                </article>

                <article>
                  <h4>Application strengths</h4>
                  <ul>
                    {selected.match.strengths.slice(0, 6).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article>
                  <h4>Priority improvements</h4>
                  <ul>
                    {selected.match.gaps.slice(0, 6).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className={styles.detailActions}>
                <button type="button">Tailor with AI Resume Writer</button>
                <button type="button">Review in Recruiter Simulation</button>
                <button type="button">Prepare with Application Copilot</button>
              </div>
            </section>
          ) : null}

          <section className={styles.portfolioInsights}>
            <article>
              <span className={styles.eyebrow}>Common strengths</span>
              <h3>Evidence helping across several opportunities</h3>
              <ul>
                {result.commonStrengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <span className={styles.eyebrow}>Portfolio gaps</span>
              <h3>Improvements with the widest application value</h3>
              <ul>
                {result.priorityGaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className={styles.guardrail}>
            <div>
              <span className={styles.eyebrow}>Responsible ranking</span>
              <h3>Rank opportunities, not people</h3>
            </div>
            <p>
              Rankings reflect documented CV-to-vacancy alignment only. They do
              not estimate hiring probability, salary entitlement, personality
              fit or employer preference.
            </p>
          </section>
        </>
      ) : (
        <section className={styles.empty}>
          <div>10.2</div>
          <h3>Add two or more opportunities to create a ranked dashboard</h3>
          <p>
            Each opportunity will be analysed using the Phase 10.1 matching
            engine and compared across the same transparent dimensions.
          </p>
        </section>
      )}
    </aside>
  );
}
