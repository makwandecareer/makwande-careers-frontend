"use client";

import type {
  CareerGoalInput,
  GoalHorizon,
} from "@/lib/career-goal-planner";

import styles from "./CareerGoalPlanner.module.css";

interface GoalWizardProps {
  value: CareerGoalInput;
  onChange: (value: CareerGoalInput) => void;
  onGenerate: () => void;
}

export function GoalWizard({
  value,
  onChange,
  onGenerate,
}: GoalWizardProps) {
  function update<Key extends keyof CareerGoalInput>(
    key: Key,
    nextValue: CareerGoalInput[Key],
  ): void {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Goal wizard</span>
          <h2>Define your next career destination</h2>
        </div>
        <span className={styles.stepBadge}>Step 1</span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Target role</span>
          <input
            value={value.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />
        </label>

        <label className={styles.field}>
          <span>Target industry</span>
          <input
            value={value.industry}
            onChange={(event) => update("industry", event.target.value)}
            placeholder="e.g. Financial Technology"
          />
        </label>

        <label className={styles.field}>
          <span>Goal horizon</span>
          <select
            value={value.horizon}
            onChange={(event) =>
              update("horizon", event.target.value as GoalHorizon)
            }
          >
            <option value="short">Short term · 30–90 days</option>
            <option value="medium">Medium term · 6–12 months</option>
            <option value="long">Long term · 1–5 years</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Target date</span>
          <input
            type="date"
            value={value.targetDate}
            onChange={(event) => update("targetDate", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Weekly commitment</span>
          <input
            type="number"
            min={1}
            max={40}
            value={value.weeklyHours}
            onChange={(event) =>
              update("weeklyHours", Number(event.target.value))
            }
          />
          <small>Hours available each week</small>
        </label>
      </div>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={onGenerate}
        disabled={!value.title.trim()}
      >
        Generate AI success roadmap
      </button>
    </section>
  );
}
