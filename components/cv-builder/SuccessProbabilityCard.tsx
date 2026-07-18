import type { CareerGoalPlan } from "@/lib/career-goal-planner";

import styles from "./CareerGoalPlanner.module.css";

interface SuccessProbabilityCardProps {
  plan: CareerGoalPlan;
  progress: number;
}

export function SuccessProbabilityCard({
  plan,
  progress,
}: SuccessProbabilityCardProps) {
  return (
    <section className={styles.scoreGrid}>
      <article className={styles.scoreCard}>
        <span>Current readiness</span>
        <strong>{plan.readinessScore}%</strong>
        <small>Profile, ATS and experience strength</small>
      </article>

      <article className={styles.scoreCard}>
        <span>Success probability</span>
        <strong>{plan.successProbability}%</strong>
        <small>Estimated from readiness and weekly effort</small>
      </article>

      <article className={styles.scoreCard}>
        <span>Estimated timeline</span>
        <strong>{plan.estimatedWeeks} weeks</strong>
        <small>Adjusted to your selected commitment</small>
      </article>

      <article className={styles.scoreCard}>
        <span>Roadmap progress</span>
        <strong>{progress}%</strong>
        <small>Completed actions in this plan</small>
      </article>
    </section>
  );
}
