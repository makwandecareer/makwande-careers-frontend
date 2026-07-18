export type GoalHorizon = "short" | "medium" | "long";
export type GoalStatus = "not-started" | "in-progress" | "completed";

export interface CareerGoalInput {
  title: string;
  industry: string;
  horizon: GoalHorizon;
  targetDate: string;
  weeklyHours: number;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  category:
    | "profile"
    | "skills"
    | "certification"
    | "portfolio"
    | "networking"
    | "applications"
    | "interview";
  week: number;
  effortHours: number;
  priority: "high" | "medium" | "low";
}

export interface CareerMilestone {
  id: string;
  title: string;
  targetWeek: number;
  description: string;
  taskIds: string[];
}

export interface CareerGoalPlan {
  goal: CareerGoalInput;
  readinessScore: number;
  successProbability: number;
  estimatedWeeks: number;
  summary: string;
  priorities: string[];
  tasks: RoadmapTask[];
  milestones: CareerMilestone[];
  generatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function normaliseText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function extractSkillNames(cvContent: unknown): string[] {
  const content = asRecord(cvContent);
  const skills = asArray(content.skills);

  return unique(
    skills.flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      const skill = asRecord(entry);

      return [
        normaliseText(skill.name),
        normaliseText(skill.skill_name),
        normaliseText(skill.title),
      ];
    }),
  );
}

function extractProfileStrength(cvContent: unknown): number {
  const content = asRecord(cvContent);
  const profile = asRecord(content.profile);

  const sections = [
    asArray(content.experience).length > 0,
    asArray(content.education).length > 0,
    asArray(content.skills).length >= 5,
    asArray(content.projects).length > 0,
    asArray(content.certifications).length > 0,
    Boolean(
      normaliseText(profile.professional_summary) ||
        normaliseText(profile.summary),
    ),
  ];

  return Math.round(
    (sections.filter(Boolean).length / sections.length) * 100,
  );
}

function horizonWeeks(horizon: GoalHorizon): number {
  if (horizon === "short") return 12;
  if (horizon === "medium") return 32;
  return 52;
}

function makeTask(
  id: string,
  title: string,
  description: string,
  category: RoadmapTask["category"],
  week: number,
  effortHours: number,
  priority: RoadmapTask["priority"],
): RoadmapTask {
  return {
    id,
    title,
    description,
    category,
    week,
    effortHours,
    priority,
  };
}

export function createCareerGoalPlan(
  cvContent: unknown,
  goal: CareerGoalInput,
  atsScore: number | null,
  opportunityCount: number,
): CareerGoalPlan {
  const skills = extractSkillNames(cvContent);
  const profileStrength = extractProfileStrength(cvContent);
  const safeAtsScore = atsScore === null ? 55 : clamp(atsScore);
  const weeklyHours = Math.max(1, Math.min(40, goal.weeklyHours || 5));
  const baseWeeks = horizonWeeks(goal.horizon);

  const readinessScore = clamp(
    profileStrength * 0.45 +
      safeAtsScore * 0.35 +
      Math.min(skills.length * 2.5, 15) +
      Math.min(opportunityCount * 1.5, 5),
  );

  const timeAdjustment = weeklyHours >= 10 ? 0.8 : weeklyHours >= 6 ? 0.95 : 1.15;
  const estimatedWeeks = Math.max(
    6,
    Math.round(baseWeeks * timeAdjustment * (1.15 - readinessScore / 250)),
  );

  const successProbability = clamp(
    readinessScore * 0.72 +
      Math.min(weeklyHours * 1.6, 16) +
      Math.min(opportunityCount * 1.2, 8),
    20,
    95,
  );

  const target = goal.title.trim() || "your target role";
  const industry = goal.industry.trim() || "your chosen industry";

  const tasks: RoadmapTask[] = [
    makeTask(
      "goal-profile",
      "Strengthen your professional profile",
      `Align your headline, summary and CV positioning with ${target} opportunities in ${industry}.`,
      "profile",
      1,
      2,
      "high",
    ),
    makeTask(
      "goal-skills",
      "Close the highest-impact skill gaps",
      "Choose two priority skills from your skill-gap analysis and create a focused learning schedule.",
      "skills",
      1,
      4,
      "high",
    ),
    makeTask(
      "goal-project",
      "Build proof of capability",
      `Complete a practical portfolio project that demonstrates the core responsibilities of a ${target}.`,
      "portfolio",
      2,
      6,
      "high",
    ),
    makeTask(
      "goal-network",
      "Expand your professional network",
      `Connect with professionals and recruiters working in ${industry}, and start five meaningful conversations.`,
      "networking",
      2,
      2,
      "medium",
    ),
    makeTask(
      "goal-certification",
      "Select a relevant credential",
      "Research one respected certification or short course that strengthens your target-role credibility.",
      "certification",
      3,
      2,
      "medium",
    ),
    makeTask(
      "goal-applications",
      "Launch a targeted application sprint",
      `Identify and apply to well-matched ${target} vacancies using tailored CV and application materials.`,
      "applications",
      3,
      4,
      "high",
    ),
    makeTask(
      "goal-interview",
      "Prepare role-specific interview stories",
      "Write and practise six STAR-format examples covering achievements, leadership, problem-solving and teamwork.",
      "interview",
      4,
      3,
      "high",
    ),
    makeTask(
      "goal-review",
      "Review evidence and adjust the roadmap",
      "Assess completed work, application responses, ATS readiness and market feedback, then update priorities.",
      "profile",
      4,
      1,
      "medium",
    ),
  ];

  const milestones: CareerMilestone[] = [
    {
      id: "milestone-foundation",
      title: "Career foundation ready",
      targetWeek: 1,
      description: "Your goal, profile positioning and priority skill plan are clearly defined.",
      taskIds: ["goal-profile", "goal-skills"],
    },
    {
      id: "milestone-proof",
      title: "Market proof created",
      targetWeek: 2,
      description: "You have visible evidence of capability and stronger professional connections.",
      taskIds: ["goal-project", "goal-network"],
    },
    {
      id: "milestone-market",
      title: "Market campaign active",
      targetWeek: 3,
      description: "Your learning, credential and targeted application strategy are active.",
      taskIds: ["goal-certification", "goal-applications"],
    },
    {
      id: "milestone-interview",
      title: "Interview ready",
      targetWeek: 4,
      description: "You can clearly communicate your value and adjust your plan using real feedback.",
      taskIds: ["goal-interview", "goal-review"],
    },
  ];

  const priorities = [
    `Position your CV and professional profile for ${target}.`,
    "Develop visible evidence through projects and measurable achievements.",
    "Close the most important role-specific skill gaps.",
    "Build a focused networking and application routine.",
    "Practise interview examples before opportunities arrive.",
  ];

  return {
    goal: {
      ...goal,
      title: target,
      industry,
      weeklyHours,
    },
    readinessScore,
    successProbability,
    estimatedWeeks,
    summary: `Your roadmap converts your current career data into a practical ${estimatedWeeks}-week plan for progressing toward ${target}.`,
    priorities,
    tasks,
    milestones,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateGoalProgress(
  plan: CareerGoalPlan,
  completedTaskIds: string[],
): number {
  if (!plan.tasks.length) return 0;

  const completed = new Set(completedTaskIds);
  const completedCount = plan.tasks.filter((task) =>
    completed.has(task.id),
  ).length;

  return clamp((completedCount / plan.tasks.length) * 100);
}

export function formatGoalHorizon(horizon: GoalHorizon): string {
  if (horizon === "short") return "30–90 days";
  if (horizon === "medium") return "6–12 months";
  return "1–5 years";
}
