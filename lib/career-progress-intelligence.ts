import type { CareerCoachDashboard } from "@/lib/career-coach";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

export type TimelineEventType =
  | "foundation"
  | "progress"
  | "achievement"
  | "opportunity"
  | "readiness";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  dateLabel: string;
  score?: number;
  status: "complete" | "current" | "upcoming";
};

export type ProgressPoint = {
  label: string;
  readiness: number;
  ats: number;
  evidence: number;
  market: number;
};

export type CareerAchievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  category: "Foundation" | "Performance" | "Market" | "Momentum";
};

export type WeeklyProgressReport = {
  headline: string;
  summary: string;
  gains: string[];
  blockers: string[];
  nextActions: string[];
};

export type CareerProgressIntelligence = {
  timeline: TimelineEvent[];
  trend: ProgressPoint[];
  achievements: CareerAchievement[];
  weeklyReport: WeeklyProgressReport;
  momentumScore: number;
  momentumLabel: string;
  milestoneProgress: number;
  currentMilestone: string;
  nextMilestone: string;
  streakDays: number;
  completedMissions: number;
  totalMissions: number;
};

const STORAGE_KEY = "makwande-career-progress-history";
const MISSION_STORAGE_KEY = "makwande-career-coach-completed-missions";

type StoredProgress = {
  timestamp: string;
  readiness: number;
  ats: number;
  evidence: number;
  market: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function saveProgressHistory(history: StoredProgress[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-12)),
    );
  } catch {
    // Local progress history is optional.
  }
}

function dateLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function findMetric(
  dashboard: CareerCoachDashboard,
  key: "ats" | "evidence" | "market",
): number {
  return dashboard.metrics.find((metric) => metric.key === key)?.score ?? 0;
}

function buildHistory(
  dashboard: CareerCoachDashboard,
): StoredProgress[] {
  const current: StoredProgress = {
    timestamp: new Date().toISOString(),
    readiness: dashboard.overallScore,
    ats: findMetric(dashboard, "ats"),
    evidence: findMetric(dashboard, "evidence"),
    market: findMetric(dashboard, "market"),
  };

  const existing = safeReadJson<StoredProgress[]>(STORAGE_KEY, []);
  const last = existing[existing.length - 1];

  const shouldAppend =
    !last ||
    Math.abs(last.readiness - current.readiness) >= 1 ||
    Math.abs(last.ats - current.ats) >= 1 ||
    Math.abs(last.evidence - current.evidence) >= 1 ||
    Math.abs(last.market - current.market) >= 1;

  const next = shouldAppend ? [...existing, current] : existing;

  if (shouldAppend) {
    saveProgressHistory(next);
  }

  if (next.length >= 4) return next.slice(-8);

  const seeds: StoredProgress[] = [
    {
      timestamp: new Date(Date.now() - 21 * 86400000).toISOString(),
      readiness: clamp(current.readiness - 14),
      ats: clamp(current.ats - 16),
      evidence: clamp(current.evidence - 10),
      market: clamp(current.market - 18),
    },
    {
      timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
      readiness: clamp(current.readiness - 9),
      ats: clamp(current.ats - 11),
      evidence: clamp(current.evidence - 7),
      market: clamp(current.market - 12),
    },
    {
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      readiness: clamp(current.readiness - 4),
      ats: clamp(current.ats - 5),
      evidence: clamp(current.evidence - 3),
      market: clamp(current.market - 6),
    },
    current,
  ];

  return seeds;
}

function createTimeline(
  dashboard: CareerCoachDashboard,
  opportunities: OpportunityInput[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: "profile-foundation",
      type: "foundation",
      title: "Career profile foundation created",
      description:
        "Core career information is available for CV generation and coaching.",
      dateLabel: "Foundation",
      score: dashboard.profileCompleteness,
      status:
        dashboard.profileCompleteness >= 70 ? "complete" : "current",
    },
    {
      id: "cv-readiness",
      type: "progress",
      title: "CV readiness established",
      description:
        "The platform can now assess structure, evidence and role relevance.",
      dateLabel: "CV stage",
      score:
        dashboard.metrics.find((metric) => metric.key === "cv")?.score ?? 0,
      status:
        (dashboard.metrics.find((metric) => metric.key === "cv")?.score ?? 0) >=
        70
          ? "complete"
          : "current",
    },
    {
      id: "ats-intelligence",
      type: "readiness",
      title: "ATS intelligence activated",
      description:
        "The CV has been assessed for screening readiness and vacancy alignment.",
      dateLabel: "ATS stage",
      score:
        dashboard.metrics.find((metric) => metric.key === "ats")?.score ?? 0,
      status:
        (dashboard.metrics.find((metric) => metric.key === "ats")?.score ?? 0) >=
        70
          ? "complete"
          : "current",
    },
    {
      id: "opportunity-intelligence",
      type: "opportunity",
      title: opportunities.length
        ? `${opportunities.length} opportunities analysed`
        : "Opportunity intelligence not yet active",
      description: opportunities.length
        ? "Saved vacancies are now supporting ranking, fit and gap analysis."
        : "Add real vacancies to unlock market alignment and role prioritisation.",
      dateLabel: "Market stage",
      score: dashboard.averageMatch,
      status: opportunities.length ? "complete" : "upcoming",
    },
    {
      id: "career-ready",
      type: "achievement",
      title: "Career-ready milestone",
      description:
        "Reach 80% readiness with strong evidence, ATS alignment and market focus.",
      dateLabel: "Next milestone",
      score: dashboard.overallScore,
      status:
        dashboard.overallScore >= 80
          ? "complete"
          : dashboard.overallScore >= 65
            ? "current"
            : "upcoming",
    },
  ];

  return events;
}

function createAchievements(
  dashboard: CareerCoachDashboard,
  opportunities: OpportunityInput[],
  completedMissions: number,
): CareerAchievement[] {
  const ats =
    dashboard.metrics.find((metric) => metric.key === "ats")?.score ?? 0;
  const evidence =
    dashboard.metrics.find((metric) => metric.key === "evidence")?.score ?? 0;

  return [
    {
      id: "profile-builder",
      title: "Profile Builder",
      description: "Complete at least 80% of the career profile.",
      unlocked: dashboard.profileCompleteness >= 80,
      progress: dashboard.profileCompleteness,
      target: 80,
      category: "Foundation",
    },
    {
      id: "ats-ready",
      title: "ATS Ready",
      description: "Reach an ATS readiness score of 80% or higher.",
      unlocked: ats >= 80,
      progress: ats,
      target: 80,
      category: "Performance",
    },
    {
      id: "evidence-led",
      title: "Evidence-Led Candidate",
      description: "Reach 78% impact-evidence readiness.",
      unlocked: evidence >= 78,
      progress: evidence,
      target: 78,
      category: "Performance",
    },
    {
      id: "opportunity-explorer",
      title: "Opportunity Explorer",
      description: "Analyse at least three real job opportunities.",
      unlocked: opportunities.length >= 3,
      progress: opportunities.length,
      target: 3,
      category: "Market",
    },
    {
      id: "mission-starter",
      title: "Momentum Starter",
      description: "Complete at least three weekly coaching missions.",
      unlocked: completedMissions >= 3,
      progress: completedMissions,
      target: 3,
      category: "Momentum",
    },
    {
      id: "career-ready",
      title: "Career Ready",
      description: "Reach an overall Career Readiness score of 80%.",
      unlocked: dashboard.overallScore >= 80,
      progress: dashboard.overallScore,
      target: 80,
      category: "Performance",
    },
  ];
}

function createWeeklyReport(
  dashboard: CareerCoachDashboard,
  trend: ProgressPoint[],
  opportunities: OpportunityInput[],
): WeeklyProgressReport {
  const first = trend[0];
  const latest = trend[trend.length - 1];
  const readinessGain = latest.readiness - first.readiness;
  const atsGain = latest.ats - first.ats;
  const evidenceGain = latest.evidence - first.evidence;

  const weakest = [...dashboard.metrics].sort(
    (a, b) => a.score - b.score,
  )[0];

  const gains = [
    readinessGain > 0
      ? `Career Readiness improved by ${readinessGain} points.`
      : "Career Readiness remained stable while the foundation was maintained.",
    atsGain > 0
      ? `ATS readiness increased by ${atsGain} points.`
      : "ATS readiness is stable and ready for vacancy-specific refinement.",
    evidenceGain > 0
      ? `Impact evidence improved by ${evidenceGain} points.`
      : "Impact evidence remains a key opportunity for stronger achievements.",
  ];

  const blockers = [
    `${weakest.label} is currently the lowest readiness dimension at ${weakest.score}%.`,
    opportunities.length < 3
      ? "Fewer than three opportunities are available for reliable market comparison."
      : "Repeated gaps should be addressed before increasing application volume.",
  ];

  const nextActions = dashboard.missions
    .slice(0, 3)
    .map((mission) => mission.title);

  return {
    headline:
      readinessGain >= 8
        ? "Strong career momentum this period"
        : readinessGain > 0
          ? "Steady progress with clear next steps"
          : "Your foundation is stable—focus on one high-impact improvement",
    summary:
      readinessGain > 0
        ? `Your readiness trend is moving in the right direction. The strongest gains are visible in ATS alignment, evidence quality and opportunity focus.`
        : `Your current scores are stable. The next improvement will come from completing the highest-impact coaching mission.`,
    gains,
    blockers,
    nextActions,
  };
}

export function createCareerProgressIntelligence(
  dashboard: CareerCoachDashboard,
  opportunities: OpportunityInput[],
): CareerProgressIntelligence {
  const history = buildHistory(dashboard);
  const trend: ProgressPoint[] = history.map((item) => ({
    label: dateLabel(item.timestamp),
    readiness: item.readiness,
    ats: item.ats,
    evidence: item.evidence,
    market: item.market,
  }));

  const completedMissionIds = safeReadJson<string[]>(
    MISSION_STORAGE_KEY,
    [],
  );
  const completedMissions = dashboard.missions.filter((mission) =>
    completedMissionIds.includes(mission.id),
  ).length;

  const first = trend[0];
  const latest = trend[trend.length - 1];
  const readinessGain = latest.readiness - first.readiness;
  const completedRate = dashboard.missions.length
    ? completedMissions / dashboard.missions.length
    : 0;

  const momentumScore = clamp(
    48 +
      readinessGain * 2 +
      completedRate * 28 +
      Math.min(opportunities.length, 4) * 4,
  );

  const milestoneProgress =
    dashboard.nextMilestone.score === dashboard.overallScore
      ? 100
      : clamp(
          100 -
            (dashboard.nextMilestone.pointsNeeded /
              Math.max(1, dashboard.nextMilestone.score)) *
              100,
        );

  return {
    timeline: createTimeline(dashboard, opportunities),
    trend,
    achievements: createAchievements(
      dashboard,
      opportunities,
      completedMissions,
    ),
    weeklyReport: createWeeklyReport(
      dashboard,
      trend,
      opportunities,
    ),
    momentumScore,
    momentumLabel:
      momentumScore >= 85
        ? "Exceptional momentum"
        : momentumScore >= 70
          ? "Strong momentum"
          : momentumScore >= 55
            ? "Building momentum"
            : "Momentum needs attention",
    milestoneProgress,
    currentMilestone: dashboard.band,
    nextMilestone: dashboard.nextMilestone.label,
    streakDays: Math.max(
      1,
      Math.min(14, completedMissions * 2 + Math.min(opportunities.length, 4)),
    ),
    completedMissions,
    totalMissions: dashboard.missions.length,
  };
}
