"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createOpportunity,
  opportunityFromJobDescription,
  rankOpportunities,
  type CandidatePreferences,
  type EmploymentType,
  type OpportunityProfile,
  type Seniority,
  type WorkMode,
} from "@/lib/opportunity-intelligence";

import styles from "./OpportunityIntelligenceEngine.module.css";

interface OpportunityIntelligenceEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

interface PersistedState {
  opportunities: OpportunityProfile[];
  preferences: CandidatePreferences;
  selectedId: string;
}

const STORAGE_KEY = "makwande-opportunity-intelligence-v1";

const WORK_MODES: WorkMode[] = ["Remote", "Hybrid", "On-site", "Flexible"];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Permanent",
  "Contract",
  "Internship",
  "Learnership",
  "Graduate Programme",
];
const SENIORITIES: Seniority[] = [
  "Entry",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Executive",
];

function stringifyCV(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "";
  }
}

function formatSalary(opportunity: OpportunityProfile): string {
  if (!opportunity.salaryMin && !opportunity.salaryMax) return "Not disclosed";

  const formatter = new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 0,
  });

  if (opportunity.salaryMin && opportunity.salaryMax) {
    return `${opportunity.currency} ${formatter.format(opportunity.salaryMin)}–${formatter.format(opportunity.salaryMax)}`;
  }

  return `${opportunity.currency} ${formatter.format(
    opportunity.salaryMax || opportunity.salaryMin,
  )}`;
}

export function OpportunityIntelligenceEngine({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: OpportunityIntelligenceEngineProps) {
  const [opportunities, setOpportunities] = useState<OpportunityProfile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState<CandidatePreferences>({
    preferredLocations: "South Africa",
    preferredWorkModes: ["Remote", "Hybrid", "On-site"],
    preferredEmploymentTypes: ["Permanent", "Contract"],
    targetSalary: 0,
    yearsExperience: 3,
    targetSeniority: "Mid",
    targetIndustries: "",
  });
  const [draft, setDraft] = useState<OpportunityProfile>(() =>
    createOpportunity({
      role: targetRole,
      description: jobDescription,
      requirements: jobDescription,
    }),
  );

  const candidateText = useMemo(
    () => stringifyCV(cvContent),
    [cvContent],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistedState;
        if (Array.isArray(parsed.opportunities)) {
          setOpportunities(parsed.opportunities);
        }
        if (parsed.preferences) {
          setPreferences(parsed.preferences);
        }
        if (parsed.selectedId) {
          setSelectedId(parsed.selectedId);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ opportunities, preferences, selectedId }),
    );
  }, [hydrated, opportunities, preferences, selectedId]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      role: current.role || targetRole,
      description: current.description || jobDescription,
      requirements: current.requirements || jobDescription,
    }));
  }, [jobDescription, targetRole]);

  const ranked = useMemo(
    () =>
      rankOpportunities(
        candidateText,
        targetRole,
        atsScore,
        preferences,
        opportunities,
      ),
    [atsScore, candidateText, opportunities, preferences, targetRole],
  );

  const selected =
    ranked.find(({ opportunity }) => opportunity.id === selectedId) ??
    ranked[0] ??
    null;

  const portfolioScore = ranked.length
    ? Math.round(
        ranked.reduce((sum, item) => sum + item.match.overallScore, 0) /
          ranked.length,
      )
    : 0;

  function updatePreference<K extends keyof CandidatePreferences>(
    key: K,
    value: CandidatePreferences[K],
  ): void {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiValue<T extends string>(
    key: "preferredWorkModes" | "preferredEmploymentTypes",
    value: T,
  ): void {
    setPreferences((current) => {
      const existing = current[key] as T[];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];

      return { ...current, [key]: next };
    });
  }

  function addOpportunity(): void {
    if (!draft.role.trim() || !draft.description.trim()) return;

    const opportunity = createOpportunity({
      ...draft,
      role: draft.role.trim(),
      company: draft.company.trim() || "Confidential employer",
    });

    setOpportunities((current) => [opportunity, ...current]);
    setSelectedId(opportunity.id);
    setDraft(
      createOpportunity({
        role: targetRole,
        description: "",
        requirements: "",
      }),
    );
  }

  function addCurrentTarget(): void {
    if (!jobDescription.trim()) return;

    const opportunity = opportunityFromJobDescription(
      targetRole,
      jobDescription,
    );

    setOpportunities((current) => [opportunity, ...current]);
    setSelectedId(opportunity.id);
  }

  function toggleOpportunityFlag(
    id: string,
    key: "saved" | "applied",
  ): void {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === id
          ? { ...opportunity, [key]: !opportunity[key] }
          : opportunity,
      ),
    );
  }

  function removeOpportunity(id: string): void {
    setOpportunities((current) =>
      current.filter((opportunity) => opportunity.id !== id),
    );
    if (selectedId === id) setSelectedId("");
  }

  return (
    <div className={styles.engine}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 14 · AI job matching & opportunity intelligence
          </span>
          <h1>Identify the opportunities most likely to advance a career</h1>
          <p>
            Rank vacancies against the candidate’s CV, ATS readiness,
            experience, preferences, compensation expectations and target
            career direction. Every score includes evidence, risk analysis and
            an application strategy.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          <article>
            <span>Portfolio fit</span>
            <strong>{portfolioScore}%</strong>
          </article>
          <article>
            <span>Opportunities</span>
            <strong>{ranked.length}</strong>
          </article>
          <article>
            <span>Apply now</span>
            <strong>
              {
                ranked.filter(
                  ({ match }) => match.applicationDecision === "Apply now",
                ).length
              }
            </strong>
          </article>
        </div>
      </header>

      <section className={styles.preferencePanel}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Matching preferences</span>
            <h2>Define the opportunity profile</h2>
          </div>
          <span>ATS readiness: {atsScore ?? "Not scored"}{atsScore !== null ? "%" : ""}</span>
        </div>

        <div className={styles.preferenceGrid}>
          <label>
            <span>Preferred locations</span>
            <input
              value={preferences.preferredLocations}
              onChange={(event) =>
                updatePreference("preferredLocations", event.target.value)
              }
              placeholder="Johannesburg, Cape Town, Remote"
            />
          </label>

          <label>
            <span>Target industries</span>
            <input
              value={preferences.targetIndustries}
              onChange={(event) =>
                updatePreference("targetIndustries", event.target.value)
              }
              placeholder="Technology, Banking, Logistics"
            />
          </label>

          <label>
            <span>Years of experience</span>
            <input
              type="number"
              min={0}
              max={50}
              value={preferences.yearsExperience}
              onChange={(event) =>
                updatePreference("yearsExperience", Number(event.target.value))
              }
            />
          </label>

          <label>
            <span>Target seniority</span>
            <select
              value={preferences.targetSeniority}
              onChange={(event) =>
                updatePreference(
                  "targetSeniority",
                  event.target.value as Seniority,
                )
              }
            >
              {SENIORITIES.map((seniority) => (
                <option key={seniority}>{seniority}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Target annual salary</span>
            <input
              type="number"
              min={0}
              step={10000}
              value={preferences.targetSalary}
              onChange={(event) =>
                updatePreference("targetSalary", Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className={styles.preferenceChoices}>
          <div>
            <strong>Work modes</strong>
            <div>
              {WORK_MODES.map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={
                    preferences.preferredWorkModes.includes(mode)
                      ? styles.activeChoice
                      : ""
                  }
                  onClick={() =>
                    toggleMultiValue<WorkMode>("preferredWorkModes", mode)
                  }
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <strong>Employment types</strong>
            <div>
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={
                    preferences.preferredEmploymentTypes.includes(type)
                      ? styles.activeChoice
                      : ""
                  }
                  onClick={() =>
                    toggleMultiValue<EmploymentType>(
                      "preferredEmploymentTypes",
                      type,
                    )
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.addPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Opportunity intake</span>
            <h2>Add and analyse a vacancy</h2>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!jobDescription.trim()}
            onClick={addCurrentTarget}
          >
            Analyse current target
          </button>
        </div>

        <div className={styles.addGrid}>
          <label>
            <span>Company</span>
            <input
              value={draft.company}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Role</span>
            <input
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  role: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Location</span>
            <input
              value={draft.location}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Work mode</span>
            <select
              value={draft.workMode}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  workMode: event.target.value as WorkMode,
                }))
              }
            >
              {WORK_MODES.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Employment type</span>
            <select
              value={draft.employmentType}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  employmentType: event.target.value as EmploymentType,
                }))
              }
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Seniority</span>
            <select
              value={draft.seniority}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seniority: event.target.value as Seniority,
                }))
              }
            >
              {SENIORITIES.map((seniority) => (
                <option key={seniority}>{seniority}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Minimum salary</span>
            <input
              type="number"
              min={0}
              value={draft.salaryMin}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  salaryMin: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            <span>Maximum salary</span>
            <input
              type="number"
              min={0}
              value={draft.salaryMax}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  salaryMax: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className={styles.fullWidth}>
            <span>Job description</span>
            <textarea
              rows={6}
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Paste the full vacancy description..."
            />
          </label>

          <label className={styles.fullWidth}>
            <span>Requirements and preferred skills</span>
            <textarea
              rows={4}
              value={draft.requirements}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  requirements: event.target.value,
                }))
              }
              placeholder="Paste mandatory qualifications, skills and experience..."
            />
          </label>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={!draft.role.trim() || !draft.description.trim()}
          onClick={addOpportunity}
        >
          Add and score opportunity
        </button>
      </section>

      <div className={styles.workspace}>
        <section className={styles.rankingPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Opportunity ranking</span>
              <h2>Best-fit opportunities</h2>
            </div>
          </div>

          {ranked.length ? (
            <div className={styles.rankingList}>
              {ranked.map(({ opportunity, match }, index) => (
                <article
                  key={opportunity.id}
                  className={
                    selected?.opportunity.id === opportunity.id
                      ? styles.selectedOpportunity
                      : ""
                  }
                  onClick={() => setSelectedId(opportunity.id)}
                >
                  <div className={styles.rankNumber}>{index + 1}</div>

                  <div className={styles.opportunitySummary}>
                    <span>{opportunity.company}</span>
                    <h3>{opportunity.role}</h3>
                    <p>
                      {opportunity.location || "Location not specified"} ·{" "}
                      {opportunity.workMode} · {opportunity.employmentType}
                    </p>
                    <div className={styles.badgeRow}>
                      <span>{match.verdict}</span>
                      <span>{match.applicationDecision}</span>
                    </div>
                  </div>

                  <div className={styles.matchScore}>
                    <strong>{match.overallScore}%</strong>
                    <small>match</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>No opportunities analysed yet</strong>
              <p>
                Add a job description to receive evidence-based matching,
                shortlist probability and application guidance.
              </p>
            </div>
          )}
        </section>

        <section className={styles.analysisPanel}>
          {selected ? (
            <>
              <div className={styles.analysisHeader}>
                <div>
                  <span className={styles.eyebrow}>Match intelligence</span>
                  <h2>{selected.opportunity.role}</h2>
                  <p>
                    {selected.opportunity.company} ·{" "}
                    {formatSalary(selected.opportunity)}
                  </p>
                </div>

                <div className={styles.decisionCard}>
                  <strong>{selected.match.overallScore}%</strong>
                  <span>{selected.match.applicationDecision}</span>
                  <small>
                    {selected.match.shortlistProbability}% estimated shortlist
                    potential
                  </small>
                </div>
              </div>

              <div className={styles.actionBar}>
                <button
                  type="button"
                  onClick={() =>
                    toggleOpportunityFlag(
                      selected.opportunity.id,
                      "saved",
                    )
                  }
                >
                  {selected.opportunity.saved ? "★ Saved" : "☆ Save"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleOpportunityFlag(
                      selected.opportunity.id,
                      "applied",
                    )
                  }
                >
                  {selected.opportunity.applied
                    ? "✓ Applied"
                    : "Mark applied"}
                </button>
                <button
                  type="button"
                  onClick={() => removeOpportunity(selected.opportunity.id)}
                >
                  Remove
                </button>
              </div>

              <div className={styles.dimensionGrid}>
                {selected.match.dimensions.map((dimension) => (
                  <article key={dimension.key}>
                    <div>
                      <strong>{dimension.label}</strong>
                      <span>{dimension.score}%</span>
                    </div>
                    <div className={styles.track}>
                      <span style={{ width: `${dimension.score}%` }} />
                    </div>
                    {dimension.evidence[0] ? (
                      <p>{dimension.evidence[0]}</p>
                    ) : dimension.gaps[0] ? (
                      <p>{dimension.gaps[0]}</p>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className={styles.insightGrid}>
                <article>
                  <span className={styles.eyebrow}>Matched strengths</span>
                  <h3>Why the candidate fits</h3>
                  {selected.match.strengths.length ? (
                    selected.match.strengths.map((item) => (
                      <p key={item}>✓ {item}</p>
                    ))
                  ) : (
                    <p>No strong evidence detected yet.</p>
                  )}
                </article>

                <article>
                  <span className={styles.eyebrow}>Recruiter risks</span>
                  <h3>What may block a shortlist</h3>
                  {selected.match.risks.length ? (
                    selected.match.risks.map((item) => (
                      <p key={item}>⚠ {item}</p>
                    ))
                  ) : (
                    <p>✓ No major matching risks detected.</p>
                  )}
                </article>

                <article>
                  <span className={styles.eyebrow}>CV tailoring plan</span>
                  <h3>Improve before applying</h3>
                  {selected.match.cvActions.map((item) => (
                    <p key={item}>→ {item}</p>
                  ))}
                </article>

                <article>
                  <span className={styles.eyebrow}>Interview preparation</span>
                  <h3>Prepare evidence for the role</h3>
                  {selected.match.interviewFocus.map((item) => (
                    <p key={item}>→ {item}</p>
                  ))}
                </article>
              </div>

              <div className={styles.skillClouds}>
                <div>
                  <strong>Matched skills</strong>
                  <div>
                    {selected.match.matchedSkills.slice(0, 14).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Missing skills and keywords</strong>
                  <div>
                    {[
                      ...selected.match.missingSkills,
                      ...selected.match.keywordGaps,
                    ]
                      .slice(0, 14)
                      .map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                  </div>
                </div>
              </div>

              <footer className={styles.analysisFooter}>
                Match confidence: {selected.match.confidence}% · Generated{" "}
                {new Date(selected.match.generatedAt).toLocaleString()}
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>Select an opportunity</strong>
              <p>
                The detailed match report will show evidence, gaps, recruiter
                risks, CV actions and interview priorities.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
