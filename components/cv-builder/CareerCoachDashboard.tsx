"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createCareerCoachDashboard,
  type CoachMetricKey,
  type CoachMission,
} from "@/lib/career-coach";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

import styles from "./CareerCoachDashboard.module.css";

type CoachDestination =
  | "build"
  | "writer"
  | "career-fit"
  | "skill-gaps"
  | "opportunities"
  | "matching"
  | "ats"
  | "recruiter";

type CareerCoachDashboardProps = {
  cvContent: unknown;
  targetRole: string;
  opportunities: OpportunityInput[];
  atsScore?: number | null;
  onNavigate: (destination: CoachDestination) => void;
};

const STORAGE_KEY = "makwande-career-coach-completed-missions";

const metricInitials: Record<CoachMetricKey, string> = {
  profile: "PF",
  cv: "CV",
  ats: "AT",
  market: "MA",
  evidence: "EV",
  interview: "IN",
};

function scoreTone(score: number): string {
  if (score >= 80) return styles.excellent;
  if (score >= 68) return styles.strong;
  if (score >= 50) return styles.developing;
  return styles.foundation;
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function CareerCoachDashboard({
  cvContent,
  targetRole,
  opportunities,
  atsScore,
  onNavigate,
}: CareerCoachDashboardProps) {
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [activeMetric, setActiveMetric] = useState<CoachMetricKey | null>(null);

  const dashboard = useMemo(
    () =>
      createCareerCoachDashboard(
        cvContent,
        targetRole,
        opportunities,
        atsScore,
      ),
    [atsScore, cvContent, opportunities, targetRole],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompletedMissionIds(
            parsed.filter((item): item is string => typeof item === "string"),
          );
        }
      }
    } catch {
      // Local progress is optional. The dashboard remains usable without it.
    }
  }, []);

  function toggleMission(mission: CoachMission): void {
    setCompletedMissionIds((current) => {
      const next = current.includes(mission.id)
        ? current.filter((id) => id !== mission.id)
        : [...current, mission.id];

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors; state remains available for the session.
      }

      return next;
    });
  }

  const completedCount = dashboard.missions.filter((mission) =>
    completedMissionIds.includes(mission.id),
  ).length;
  const missionProgress = dashboard.missions.length
    ? Math.round((completedCount / dashboard.missions.length) * 100)
    : 0;
  const selectedMetric =
    dashboard.metrics.find((metric) => metric.key === activeMetric) ??
    dashboard.metrics[0];

  return (
    <aside className={styles.shell}>
      <section className={styles.commandCenter}>
        <div className={styles.commandCopy}>
          <span className={styles.eyebrow}>
            Phase 11.1 · AI Career Coach
          </span>
          <p className={styles.date}>{todayLabel()}</p>
          <h2>
            Your career command centre
            {targetRole.trim() ? (
              <span> for {targetRole}</span>
            ) : null}
          </h2>
          <p className={styles.coachingMessage}>
            {dashboard.coachingMessage}
          </p>

          <div className={styles.commandActions}>
            <button
              type="button"
              onClick={() =>
                dashboard.missions[0]
                  ? onNavigate(dashboard.missions[0].destination)
                  : onNavigate("build")
              }
            >
              Start highest-impact action
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onNavigate("opportunities")}
            >
              Review opportunities
            </button>
          </div>

          <div className={styles.trustLine}>
            <span>{dashboard.confidence}% data confidence</span>
            <span>{dashboard.opportunityCount} analysed opportunities</span>
            <span>{completedCount} missions completed</span>
          </div>
        </div>

        <div className={styles.scoreCard}>
          <div
            className={styles.scoreRing}
            style={{
              background: `conic-gradient(#0a7a55 ${dashboard.overallScore * 3.6}deg, #dfe9e3 0deg)`,
            }}
          >
            <div>
              <strong>{dashboard.overallScore}</strong>
              <span>/100</span>
            </div>
          </div>
          <span className={styles.scoreLabel}>Career Readiness</span>
          <b>{dashboard.band}</b>
          <small>
            {dashboard.nextMilestone.pointsNeeded > 0
              ? `${dashboard.nextMilestone.pointsNeeded} points to ${dashboard.nextMilestone.label}`
              : "Highest milestone reached"}
          </small>
        </div>
      </section>

      <section className={styles.executiveGrid}>
        <article>
          <span>Projected readiness</span>
          <strong>{dashboard.projectedScore}%</strong>
          <small>After top three missions</small>
        </article>
        <article>
          <span>Profile foundation</span>
          <strong>{dashboard.profileCompleteness}%</strong>
          <small>Structured career data</small>
        </article>
        <article>
          <span>Average job match</span>
          <strong>
            {dashboard.opportunityCount ? `${dashboard.averageMatch}%` : "—"}
          </strong>
          <small>Across analysed roles</small>
        </article>
        <article>
          <span>Application-ready roles</span>
          <strong>{dashboard.readyOpportunityCount}</strong>
          <small>Based on current evidence</small>
        </article>
      </section>

      <section className={styles.focusBanner}>
        <div>
          <span className={styles.eyebrow}>Coach priority</span>
          <h3>This week’s strategic focus</h3>
        </div>
        <p>{dashboard.weeklyFocus}</p>
      </section>

      <section className={styles.metricSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Readiness architecture</span>
            <h3>Six dimensions shaping your competitiveness</h3>
          </div>
          <span>Click a dimension for coaching guidance</span>
        </header>

        <div className={styles.metricGrid}>
          {dashboard.metrics.map((metric) => (
            <button
              type="button"
              key={metric.key}
              className={`${styles.metricCard} ${
                activeMetric === metric.key ? styles.metricActive : ""
              }`}
              onClick={() => setActiveMetric(metric.key)}
            >
              <div className={styles.metricTop}>
                <span>{metricInitials[metric.key]}</span>
                <strong className={scoreTone(metric.score)}>
                  {metric.score}%
                </strong>
              </div>
              <h4>{metric.label}</h4>
              <div className={styles.miniTrack}>
                <i style={{ width: `${metric.score}%` }} />
              </div>
            </button>
          ))}
        </div>

        <article className={styles.metricExplanation}>
          <div>
            <span className={styles.eyebrow}>Coach interpretation</span>
            <h3>{selectedMetric.label}</h3>
            <p>{selectedMetric.explanation}</p>
          </div>
          <aside>
            <span>Recommended action</span>
            <strong>{selectedMetric.action}</strong>
          </aside>
        </article>
      </section>

      <section className={styles.missionSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Weekly missions</span>
            <h3>Focused actions, ranked by career impact</h3>
          </div>
          <div className={styles.missionProgress}>
            <span>{missionProgress}% complete</span>
            <div>
              <i style={{ width: `${missionProgress}%` }} />
            </div>
          </div>
        </header>

        <div className={styles.missionList}>
          {dashboard.missions.map((mission, index) => {
            const complete = completedMissionIds.includes(mission.id);
            return (
              <article
                key={mission.id}
                className={complete ? styles.missionComplete : ""}
              >
                <button
                  type="button"
                  className={styles.checkButton}
                  aria-label={
                    complete
                      ? `Mark ${mission.title} incomplete`
                      : `Mark ${mission.title} complete`
                  }
                  onClick={() => toggleMission(mission)}
                >
                  {complete ? "✓" : index + 1}
                </button>

                <div className={styles.missionCopy}>
                  <div className={styles.missionMeta}>
                    <span className={styles[mission.priority.toLowerCase()]}>
                      {mission.priority}
                    </span>
                    <span>{mission.effort}</span>
                    <span>+{mission.impact} potential points</span>
                  </div>
                  <h4>{mission.title}</h4>
                  <p>{mission.description}</p>
                </div>

                <button
                  type="button"
                  className={styles.missionAction}
                  onClick={() => onNavigate(mission.destination)}
                >
                  Open workspace
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.intelligenceGrid}>
        <article className={styles.signalsPanel}>
          <span className={styles.eyebrow}>Live coaching signals</span>
          <h3>What deserves your attention now</h3>
          <div>
            {dashboard.signals.map((signal) => (
              <section key={signal.title}>
                <i className={styles[signal.tone]} />
                <div>
                  <strong>{signal.title}</strong>
                  <p>{signal.detail}</p>
                </div>
              </section>
            ))}
          </div>
        </article>

        <article className={styles.opportunityPanel}>
          <span className={styles.eyebrow}>Priority opportunity</span>
          {dashboard.bestOpportunity ? (
            <>
              <h3>{dashboard.bestOpportunity.title}</h3>
              <p>{dashboard.bestOpportunity.company}</p>
              <div className={styles.opportunityScores}>
                <div>
                  <strong>{dashboard.bestOpportunity.score}%</strong>
                  <span>Match</span>
                </div>
                <div>
                  <strong>{dashboard.bestOpportunity.readiness}%</strong>
                  <span>Readiness</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("career-fit")}
              >
                Open fit explanation
              </button>
            </>
          ) : (
            <>
              <h3>Activate market intelligence</h3>
              <p>
                Add real vacancies to rank opportunities and receive
                evidence-based application guidance.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("opportunities")}
              >
                Add opportunities
              </button>
            </>
          )}
        </article>
      </section>

      <section className={styles.integrity}>
        <div>
          <span className={styles.eyebrow}>Responsible AI coaching</span>
          <h3>Progress guidance without false promises</h3>
        </div>
        <p>{dashboard.integrityNote}</p>
      </section>
    </aside>
  );
}
