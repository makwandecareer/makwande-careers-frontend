import type {
  CareerGoalPlan,
  RoadmapTask,
} from "@/lib/career-goal-planner";

import styles from "./CareerGoalPlanner.module.css";

interface RoadmapTimelineProps {
  plan: CareerGoalPlan;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
}

function groupByWeek(tasks: RoadmapTask[]): Array<[number, RoadmapTask[]]> {
  const groups = new Map<number, RoadmapTask[]>();

  tasks.forEach((task) => {
    const existing = groups.get(task.week) ?? [];
    existing.push(task);
    groups.set(task.week, existing);
  });

  return [...groups.entries()].sort(([left], [right]) => left - right);
}

export function RoadmapTimeline({
  plan,
  completedTaskIds,
  onToggleTask,
}: RoadmapTimelineProps) {
  const completed = new Set(completedTaskIds);

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>AI success roadmap</span>
          <h2>Your first four weeks</h2>
        </div>
        <span className={styles.stepBadge}>Step 2</span>
      </div>

      <p className={styles.summary}>{plan.summary}</p>

      <div className={styles.timeline}>
        {groupByWeek(plan.tasks).map(([week, tasks]) => (
          <article className={styles.weekBlock} key={week}>
            <div className={styles.weekMarker}>
              <strong>Week {week}</strong>
              <span>
                {tasks.reduce((total, task) => total + task.effortHours, 0)}h
              </span>
            </div>

            <div className={styles.taskList}>
              {tasks.map((task) => {
                const isCompleted = completed.has(task.id);

                return (
                  <label
                    className={`${styles.taskCard} ${
                      isCompleted ? styles.taskComplete : ""
                    }`}
                    key={task.id}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => onToggleTask(task.id)}
                    />
                    <span className={styles.taskBody}>
                      <span className={styles.taskMeta}>
                        <span>{task.category}</span>
                        <span>{task.priority} priority</span>
                      </span>
                      <strong>{task.title}</strong>
                      <small>{task.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
