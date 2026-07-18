"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildCareerCopilotPlan,
  type CareerCopilotInput,
  type CareerGoal,
  type CareerStage,
  type CopilotRecommendation,
} from "@/lib/career-copilot";

import styles from "./CareerCopilotEngine.module.css";

interface CareerCopilotEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-career-copilot-v1";

const CAREER_STAGES: CareerStage[] = [
  "Student",
  "Graduate",
  "Early Career",
  "Mid Career",
  "Senior Professional",
  "Executive",
];

const CAREER_GOALS: CareerGoal[] = [
  "Find a job",
  "Change careers",
  "Earn a promotion",
  "Improve interview performance",
  "Build leadership readiness",
  "Strengthen employability",
];

export function CareerCopilotEngine({
  targetRole,
  jobDescription,
  atsScore,
}: CareerCopilotEngineProps) {
  const [input, setInput] = useState<CareerCopilotInput>({
    targetRole,
    jobDescription,
    careerStage: "Mid Career",
    careerGoal: "Find a job",
    targetIndustry: "",
    targetTimelineWeeks: 8,
    weeklyHoursAvailable: 6,
    profileCompleteness: 65,
    confidenceLevel: 60,
    networkingStrength: 55,
    interviewReadiness: 55,
    technicalReadiness: 60,
    leadershipReadiness: 50,
  });
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<CareerCopilotInput>;
          completedIds?: string[];
        };
        setInput((current) => ({ ...current, ...parsed.input }));
        if (Array.isArray(parsed.completedIds)) {
          setCompletedIds(parsed.completedIds);
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
      JSON.stringify({ input, completedIds }),
    );
  }, [completedIds, hydrated, input]);

  const plan = useMemo(
    () => buildCareerCopilotPlan(input, atsScore),
    [atsScore, input],
  );

  const recommendations = useMemo(
    () =>
      plan.recommendations.map((item) => ({
        ...item,
        completed: completedIds.includes(item.id),
      })),
    [completedIds, plan.recommendations],
  );

  const completedCount = recommendations.filter(
    (item) => item.completed,
  ).length;

  const progress = recommendations.length
    ? Math.round((completedCount / recommendations.length) * 100)
    : 0;

  function updateInput<K extends keyof CareerCopilotInput>(
    field: K,
    value: CareerCopilotInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function toggleRecommendation(item: CopilotRecommendation): void {
    setCompletedIds((current) =>
      current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [...current, item.id],
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Phase 13 · AI career copilot</span>
          <h1>Turn career data into a personalised readiness roadmap</h1>
          <p>
            Analyse CV readiness, role alignment, interviews, technical
            capability, leadership, confidence and market visibility—then
            convert the gaps into a prioritised weekly action plan.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Career readiness</span>
          <strong>{plan.overallReadiness}%</strong>
          <small>{input.careerGoal}</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Career strategy profile</span>
            <h2>Define the candidate’s objective and constraints</h2>
          </div>
          <span>{progress}% roadmap completed</span>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Target role</span>
            <input
              value={input.targetRole}
              onChange={(event) =>
                updateInput("targetRole", event.target.value)
              }
            />
          </label>

          <label>
            <span>Target industry</span>
            <input
              value={input.targetIndustry}
              onChange={(event) =>
                updateInput("targetIndustry", event.target.value)
              }
              placeholder="e.g. Financial Services"
            />
          </label>

          <label>
            <span>Career stage</span>
            <select
              value={input.careerStage}
              onChange={(event) =>
                updateInput(
                  "careerStage",
                  event.target.value as CareerStage,
                )
              }
            >
              {CAREER_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Primary career goal</span>
            <select
              value={input.careerGoal}
              onChange={(event) =>
                updateInput("careerGoal", event.target.value as CareerGoal)
              }
            >
              {CAREER_GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Target timeline</span>
            <input
              type="number"
              min={2}
              max={24}
              value={input.targetTimelineWeeks}
              onChange={(event) =>
                updateInput(
                  "targetTimelineWeeks",
                  Number(event.target.value),
                )
              }
            />
            <small>Weeks</small>
          </label>

          <label>
            <span>Weekly preparation time</span>
            <input
              type="number"
              min={1}
              max={40}
              value={input.weeklyHoursAvailable}
              onChange={(event) =>
                updateInput(
                  "weeklyHoursAvailable",
                  Number(event.target.value),
                )
              }
            />
            <small>Hours</small>
          </label>

          <label className={styles.fullWidth}>
            <span>Target job specification</span>
            <textarea
              rows={5}
              value={input.jobDescription}
              onChange={(event) =>
                updateInput("jobDescription", event.target.value)
              }
            />
          </label>
        </div>

        <div className={styles.sliderGrid}>
          {[
            ["profileCompleteness", "Profile completeness"],
            ["confidenceLevel", "Career confidence"],
            ["networkingStrength", "Market visibility"],
            ["interviewReadiness", "Interview readiness"],
            ["technicalReadiness", "Technical readiness"],
            ["leadershipReadiness", "Leadership readiness"],
          ].map(([field, label]) => {
            const value =
              input[
                field as
                  | "profileCompleteness"
                  | "confidenceLevel"
                  | "networkingStrength"
                  | "interviewReadiness"
                  | "technicalReadiness"
                  | "leadershipReadiness"
              ];

            return (
              <label className={styles.sliderCard} key={field}>
                <div>
                  <span>{label}</span>
                  <strong>{value}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(event) =>
                    updateInput(
                      field as
                        | "profileCompleteness"
                        | "confidenceLevel"
                        | "networkingStrength"
                        | "interviewReadiness"
                        | "technicalReadiness"
                        | "leadershipReadiness",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className={styles.nextAction}>
        <div>
          <span className={styles.eyebrow}>Next best action</span>
          <h2>{plan.nextBestAction}</h2>
        </div>
        <strong>{recommendations[0]?.priority || "Ready"}</strong>
      </section>

      <section className={styles.dimensionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Readiness intelligence</span>
            <h2>Career readiness by dimension</h2>
          </div>
        </div>

        <div className={styles.dimensionGrid}>
          {plan.readinessDimensions.map((dimension) => (
            <article key={dimension.key}>
              <div className={styles.dimensionHeader}>
                <div>
                  <strong>{dimension.label}</strong>
                  <small>{dimension.status}</small>
                </div>
                <span>{dimension.score}%</span>
              </div>
              <div className={styles.track}>
                <span style={{ width: `${dimension.score}%` }} />
              </div>
              <p>{dimension.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.recommendationSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Personalised roadmap</span>
            <h2>Prioritised career actions</h2>
          </div>
          <span>
            {completedCount}/{recommendations.length} completed
          </span>
        </div>

        <div className={styles.recommendationList}>
          {recommendations.map((item) => (
            <article
              key={item.id}
              className={item.completed ? styles.completedCard : ""}
            >
              <button
                type="button"
                aria-label={`Mark ${item.title} as ${
                  item.completed ? "not completed" : "completed"
                }`}
                onClick={() => toggleRecommendation(item)}
              >
                {item.completed ? "✓" : ""}
              </button>

              <div className={styles.recommendationBody}>
                <div className={styles.recommendationHeader}>
                  <div>
                    <span>{item.module}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <strong data-priority={item.priority}>
                    {item.priority}
                  </strong>
                </div>

                <p>{item.description}</p>

                <div className={styles.metaRow}>
                  <span>{item.estimatedHours} estimated hours</span>
                  <span>{item.reason}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.roadmapSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Weekly execution plan</span>
            <h2>{input.targetTimelineWeeks}-week career roadmap</h2>
          </div>
        </div>

        <div className={styles.weekGrid}>
          {plan.weeklyMilestones.map((milestone) => (
            <article key={milestone.week}>
              <div className={styles.weekBadge}>Week {milestone.week}</div>
              <h3>{milestone.title}</h3>
              <strong>{milestone.focus}</strong>
              <div>
                {milestone.actions.map((action) => (
                  <p key={action}>→ {action}</p>
                ))}
              </div>
              <small>{milestone.expectedOutcome}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.insightGrid}>
        <article>
          <span className={styles.eyebrow}>Recurring risks</span>
          <h2>What may block progress</h2>
          {plan.recurringRisks.length ? (
            plan.recurringRisks.map((risk) => <p key={risk}>⚠ {risk}</p>)
          ) : (
            <p>✓ No major recurring readiness risk detected.</p>
          )}
        </article>

        <article>
          <span className={styles.eyebrow}>Strongest signals</span>
          <h2>What currently supports success</h2>
          {plan.strongestSignals.length ? (
            plan.strongestSignals.map((signal) => (
              <p key={signal}>✓ {signal}</p>
            ))
          ) : (
            <p>Complete more readiness areas to establish strong signals.</p>
          )}
        </article>
      </section>
    </div>
  );
}
