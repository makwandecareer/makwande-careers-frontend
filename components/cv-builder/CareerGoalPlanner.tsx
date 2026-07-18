"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { OpportunityInput } from "@/lib/opportunity-dashboard";
import {
  calculateGoalProgress,
  createCareerGoalPlan,
  formatGoalHorizon,
  type CareerGoalInput,
  type CareerGoalPlan,
} from "@/lib/career-goal-planner";

import { GoalWizard } from "./GoalWizard";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { SuccessProbabilityCard } from "./SuccessProbabilityCard";
import { WeeklyPlanner } from "./WeeklyPlanner";
import styles from "./CareerGoalPlanner.module.css";

interface CareerGoalPlannerProps {
  cvContent: unknown;
  targetRole: string;
  atsScore: number | null;
  opportunities: OpportunityInput[];
  dashboard: unknown;
}

interface StoredGoalState {
  goal: CareerGoalInput;
  plan: CareerGoalPlan | null;
  completedTaskIds: string[];
}

const STORAGE_KEY = "makwande-career-goal-planner-v1";

function createDefaultGoal(targetRole: string): CareerGoalInput {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 6);

  return {
    title: targetRole,
    industry: "",
    horizon: "medium",
    targetDate: targetDate.toISOString().slice(0, 10),
    weeklyHours: 6,
  };
}

export function CareerGoalPlanner({
  cvContent,
  targetRole,
  atsScore,
  opportunities,
}: CareerGoalPlannerProps) {
  const [goal, setGoal] = useState<CareerGoalInput>(() =>
    createDefaultGoal(targetRole),
  );
  const [plan, setPlan] = useState<CareerGoalPlan | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        const stored = JSON.parse(storedValue) as StoredGoalState;
        setGoal(stored.goal);
        setPlan(stored.plan);
        setCompletedTaskIds(stored.completedTaskIds ?? []);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const state: StoredGoalState = {
      goal,
      plan,
      completedTaskIds,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [completedTaskIds, goal, hydrated, plan]);

  useEffect(() => {
    if (!hydrated || goal.title.trim() || !targetRole.trim()) return;

    setGoal((current) => ({
      ...current,
      title: targetRole,
    }));
  }, [goal.title, hydrated, targetRole]);

  const progress = useMemo(
    () => (plan ? calculateGoalProgress(plan, completedTaskIds) : 0),
    [completedTaskIds, plan],
  );

  function generatePlan(): void {
    const nextPlan = createCareerGoalPlan(
      cvContent,
      goal,
      atsScore,
      opportunities.length,
    );

    setPlan(nextPlan);
    setCompletedTaskIds([]);
  }

  function toggleTask(taskId: string): void {
    setCompletedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.heroEyebrow}>
            Phase 11.3 · Career execution intelligence
          </span>
          <h1>Turn your career ambition into a measurable success plan</h1>
          <p>
            Define your destination, generate a personalised roadmap and track
            the weekly actions that move you closer to your target role.
          </p>
        </div>

        {plan ? (
          <div className={styles.goalSnapshot}>
            <span>Active goal</span>
            <strong>{plan.goal.title}</strong>
            <small>
              {formatGoalHorizon(plan.goal.horizon)} · {progress}% complete
            </small>
          </div>
        ) : null}
      </header>

      <GoalWizard
        value={goal}
        onChange={setGoal}
        onGenerate={generatePlan}
      />

      {plan ? (
        <>
          <SuccessProbabilityCard plan={plan} progress={progress} />

          <section className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Top priorities</span>
                <h2>What will create the greatest momentum</h2>
              </div>
            </div>

            <div className={styles.priorityGrid}>
              {plan.priorities.map((priority, index) => (
                <article key={priority}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{priority}</p>
                </article>
              ))}
            </div>
          </section>

          <WeeklyPlanner
            plan={plan}
            completedTaskIds={completedTaskIds}
          />

          <RoadmapTimeline
            plan={plan}
            completedTaskIds={completedTaskIds}
            onToggleTask={toggleTask}
          />

          <section className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Milestones</span>
                <h2>Your success checkpoints</h2>
              </div>
            </div>

            <div className={styles.milestoneGrid}>
              {plan.milestones.map((milestone) => {
                const completedTasks = milestone.taskIds.filter((taskId) =>
                  completedTaskIds.includes(taskId),
                ).length;
                const complete =
                  completedTasks === milestone.taskIds.length;

                return (
                  <article
                    className={complete ? styles.milestoneComplete : ""}
                    key={milestone.id}
                  >
                    <span>Week {milestone.targetWeek}</span>
                    <strong>{milestone.title}</strong>
                    <p>{milestone.description}</p>
                    <small>
                      {completedTasks}/{milestone.taskIds.length} actions
                      complete
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className={styles.emptyState}>
          <span>🎯</span>
          <h2>Your career roadmap is ready to be created</h2>
          <p>
            Enter your target role and generate a plan based on your current
            CV, ATS readiness and available opportunities.
          </p>
        </section>
      )}
    </div>
  );
}
