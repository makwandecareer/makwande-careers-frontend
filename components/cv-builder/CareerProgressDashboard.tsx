"use client";

import { useMemo, useState } from "react";

import type { CareerCoachDashboard } from "@/lib/career-coach";
import {
  createCareerProgressIntelligence,
  type ProgressPoint,
} from "@/lib/career-progress-intelligence";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

import styles from "./CareerProgressDashboard.module.css";

type CareerProgressDashboardProps = {
  dashboard: CareerCoachDashboard;
  opportunities: OpportunityInput[];
};

type TrendKey = "readiness" | "ats" | "evidence" | "market";

const trendLabels: Record<TrendKey, string> = {
  readiness: "Career Readiness",
  ats: "ATS readiness",
  evidence: "Impact evidence",
  market: "Market alignment",
};

function buildPolyline(
  points: ProgressPoint[],
  key: TrendKey,
): string {
  if (!points.length) return "";

  const width = 720;
  const height = 220;
  const xStep = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const value = point[key];
      const x = index * xStep;
      const y = height - (value / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function CareerProgressDashboard({
  dashboard,
  opportunities,
}: CareerProgressDashboardProps) {
  const [trendKey, setTrendKey] = useState<TrendKey>("readiness");

  const intelligence = useMemo(
    () => createCareerProgressIntelligence(dashboard, opportunities),
    [dashboard, opportunities],
  );

  const unlockedAchievements = intelligence.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <aside className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 11.2 · Progress Intelligence
          </span>
          <h2>Your career journey, measured over time</h2>
          <p>
            Track readiness growth, milestone progress, coaching momentum and
            achievements from one executive view.
          </p>
        </div>

        <div className={styles.momentumCard}>
          <div>
            <strong>{intelligence.momentumScore}</strong>
            <span>/100</span>
          </div>
          <b>{intelligence.momentumLabel}</b>
          <small>{intelligence.streakDays}-day activity streak</small>
        </div>
      </section>

      <section className={styles.kpiGrid}>
        <article>
          <span>Current milestone</span>
          <strong>{intelligence.currentMilestone}</strong>
          <small>{dashboard.overallScore}% readiness</small>
        </article>
        <article>
          <span>Next milestone</span>
          <strong>{intelligence.nextMilestone}</strong>
          <small>{dashboard.nextMilestone.pointsNeeded} points remaining</small>
        </article>
        <article>
          <span>Missions completed</span>
          <strong>
            {intelligence.completedMissions}/{intelligence.totalMissions}
          </strong>
          <small>Current coaching cycle</small>
        </article>
        <article>
          <span>Achievements unlocked</span>
          <strong>
            {unlockedAchievements}/{intelligence.achievements.length}
          </strong>
          <small>Career development badges</small>
        </article>
      </section>

      <section className={styles.milestoneCard}>
        <div>
          <span className={styles.eyebrow}>Milestone progression</span>
          <h3>
            {intelligence.currentMilestone} → {intelligence.nextMilestone}
          </h3>
        </div>
        <div className={styles.milestoneTrack}>
          <i style={{ width: `${intelligence.milestoneProgress}%` }} />
        </div>
        <strong>{intelligence.milestoneProgress}% complete</strong>
      </section>

      <section className={styles.trendSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Progress analytics</span>
            <h3>{trendLabels[trendKey]} trend</h3>
          </div>

          <div className={styles.trendTabs}>
            {(Object.keys(trendLabels) as TrendKey[]).map((key) => (
              <button
                type="button"
                key={key}
                className={trendKey === key ? styles.active : ""}
                onClick={() => setTrendKey(key)}
              >
                {trendLabels[key]}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.chart}>
          <div className={styles.axisLabels}>
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          <div className={styles.chartArea}>
            <svg viewBox="0 0 720 220" preserveAspectRatio="none">
              <defs>
                <linearGradient
                  id="progressArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0a7a55" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0a7a55" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0, 55, 110, 165, 220].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="720"
                  y1={y}
                  y2={y}
                  className={styles.gridLine}
                />
              ))}

              <polygon
                points={`0,220 ${buildPolyline(
                  intelligence.trend,
                  trendKey,
                )} 720,220`}
                fill="url(#progressArea)"
              />

              <polyline
                points={buildPolyline(intelligence.trend, trendKey)}
                className={styles.trendLine}
              />
            </svg>

            <div className={styles.chartLabels}>
              {intelligence.trend.map((point) => (
                <span key={point.label}>{point.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.timelineSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Career timeline</span>
            <h3>Your path from foundation to career readiness</h3>
          </div>
        </header>

        <div className={styles.timeline}>
          {intelligence.timeline.map((event, index) => (
            <article
              key={event.id}
              className={`${styles.timelineItem} ${
                styles[event.status]
              }`}
            >
              <div className={styles.timelineRail}>
                <span>{event.status === "complete" ? "✓" : index + 1}</span>
                {index < intelligence.timeline.length - 1 ? <i /> : null}
              </div>

              <div>
                <div className={styles.timelineMeta}>
                  <span>{event.dateLabel}</span>
                  {typeof event.score === "number" ? (
                    <b>{event.score}%</b>
                  ) : null}
                </div>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.reportHero}>
          <span className={styles.eyebrow}>Weekly progress report</span>
          <h3>{intelligence.weeklyReport.headline}</h3>
          <p>{intelligence.weeklyReport.summary}</p>
        </div>

        <div className={styles.reportColumns}>
          <article>
            <span>Progress gains</span>
            <ul>
              {intelligence.weeklyReport.gains.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article>
            <span>Current blockers</span>
            <ul>
              {intelligence.weeklyReport.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article>
            <span>Next actions</span>
            <ol>
              {intelligence.weeklyReport.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className={styles.achievementSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Achievement system</span>
            <h3>Milestones that recognise meaningful progress</h3>
          </div>
        </header>

        <div className={styles.achievementGrid}>
          {intelligence.achievements.map((achievement) => {
            const progress = Math.min(
              100,
              Math.round(
                (achievement.progress / Math.max(1, achievement.target)) *
                  100,
              ),
            );

            return (
              <article
                key={achievement.id}
                className={
                  achievement.unlocked ? styles.unlocked : styles.locked
                }
              >
                <div className={styles.badge}>
                  {achievement.unlocked ? "★" : "○"}
                </div>
                <span>{achievement.category}</span>
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                <div className={styles.achievementTrack}>
                  <i style={{ width: `${progress}%` }} />
                </div>
                <small>
                  {achievement.unlocked
                    ? "Unlocked"
                    : `${achievement.progress}/${achievement.target}`}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.integrity}>
        <div>
          <span className={styles.eyebrow}>Progress you can trust</span>
          <h3>Measured improvement—not manufactured success</h3>
        </div>
        <p>
          Progress intelligence tracks activity and score movement from the
          information available in the platform. It does not claim that a score
          increase guarantees interviews, offers or employment.
        </p>
      </section>
    </aside>
  );
}
