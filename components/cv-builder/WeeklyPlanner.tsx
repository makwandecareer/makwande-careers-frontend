import type { CareerGoalPlan } from "@/lib/career-goal-planner";

import styles from "./CareerGoalPlanner.module.css";

interface WeeklyPlannerProps {
  plan: CareerGoalPlan;
  completedTaskIds: string[];
}

export function WeeklyPlanner({
  plan,
  completedTaskIds,
}: WeeklyPlannerProps) {
  const completed = new Set(completedTaskIds);
  const nextTasks = plan.tasks
    .filter((task) => !completed.has(task.id))
    .slice(0, 4);

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Weekly action planner</span>
          <h2>Your next best actions</h2>
        </div>
        <span className={styles.stepBadge}>Step 3</span>
      </div>

      {nextTasks.length ? (
        <div className={styles.actionList}>
          {nextTasks.map((task, index) => (
            <article className={styles.actionItem} key={task.id}>
              <span className={styles.actionNumber}>{index + 1}</span>
              <div>
                <strong>{task.title}</strong>
                <p>{task.description}</p>
              </div>
              <span>{task.effortHours}h</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.completedState}>
          <strong>Roadmap complete</strong>
          <p>
            You completed every action in this plan. Generate a refreshed
            roadmap when your target or career data changes.
          </p>
        </div>
      )}
    </section>
  );
}
