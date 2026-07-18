import { rankOpportunities } from "@/lib/opportunity-dashboard";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";
import { analyzeSkillGaps } from "@/lib/skill-gap-analyzer";

export type ReadinessBand =
  | "Exceptional"
  | "Career ready"
  | "Competitive"
  | "Developing"
  | "Foundation";

export type CoachMetricKey =
  | "profile"
  | "cv"
  | "ats"
  | "market"
  | "evidence"
  | "interview";

export type CoachMetric = {
  key: CoachMetricKey;
  label: string;
  score: number;
  weight: number;
  explanation: string;
  action: string;
};

export type CoachMission = {
  id: string;
  title: string;
  description: string;
  category: CoachMetricKey;
  impact: number;
  effort: "10 min" | "20 min" | "30 min" | "1 hour";
  priority: "Critical" | "High" | "Medium";
  destination:
    | "build"
    | "writer"
    | "career-fit"
    | "skill-gaps"
    | "opportunities"
    | "matching"
    | "ats"
    | "recruiter";
};

export type CoachSignal = {
  tone: "positive" | "attention" | "neutral";
  title: string;
  detail: string;
};

export type CareerCoachDashboard = {
  overallScore: number;
  band: ReadinessBand;
  confidence: number;
  metrics: CoachMetric[];
  missions: CoachMission[];
  signals: CoachSignal[];
  bestOpportunity: {
    title: string;
    company: string;
    score: number;
    readiness: number;
  } | null;
  opportunityCount: number;
  readyOpportunityCount: number;
  averageMatch: number;
  profileCompleteness: number;
  coachingMessage: string;
  weeklyFocus: string;
  projectedScore: number;
  nextMilestone: {
    score: number;
    label: string;
    pointsNeeded: number;
  };
  integrityNote: string;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function countArray(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const item = (value as Record<string, unknown>)[key];
  return Array.isArray(item) ? item.length : 0;
}

function hasMeaningfulText(text: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (total, pattern) => total + (pattern.test(text) ? 1 : 0),
    0,
  );
}

function readinessBand(score: number): ReadinessBand {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Career ready";
  if (score >= 68) return "Competitive";
  if (score >= 50) return "Developing";
  return "Foundation";
}

function nextMilestone(score: number): {
  score: number;
  label: string;
  pointsNeeded: number;
} {
  const milestones = [
    { score: 50, label: "Developing" },
    { score: 68, label: "Competitive" },
    { score: 80, label: "Career ready" },
    { score: 90, label: "Exceptional" },
    { score: 100, label: "Complete" },
  ];
  const next = milestones.find((item) => item.score > score) ?? milestones[4];
  return {
    ...next,
    pointsNeeded: Math.max(0, next.score - score),
  };
}

function uniqueMissions(missions: CoachMission[]): CoachMission[] {
  const seen = new Set<string>();
  return missions.filter((mission) => {
    if (seen.has(mission.id)) return false;
    seen.add(mission.id);
    return true;
  });
}

export function createCareerCoachDashboard(
  cvContent: unknown,
  targetRole: string,
  opportunities: OpportunityInput[],
  atsScore?: number | null,
): CareerCoachDashboard {
  const text = stringify(cvContent);
  const normalized = text.toLowerCase();

  const profileSections = [
    countArray(cvContent, "experience"),
    countArray(cvContent, "education"),
    countArray(cvContent, "skills"),
    countArray(cvContent, "projects"),
    countArray(cvContent, "certifications"),
    countArray(cvContent, "languages"),
  ];

  const completedSections = profileSections.filter((count) => count > 0).length;
  const profileCompleteness = clamp(
    completedSections * 13 +
      (targetRole.trim() ? 12 : 0) +
      (text.length > 900 ? 10 : text.length > 350 ? 5 : 0),
  );

  const evidenceSignals = hasMeaningfulText(normalized, [
    /\b\d+%/,
    /\br\d[\d,\s.]*/,
    /\b(increased|reduced|improved|saved|grew|delivered|achieved|exceeded)\b/,
    /\b(led|managed|supervised|mentored|coached|owned)\b/,
    /\b(project|portfolio|case study)\b/,
  ]);
  const evidenceScore = clamp(35 + evidenceSignals * 11);

  const cvSignals = hasMeaningfulText(normalized, [
    /\b(summary|profile|objective)\b/,
    /\bexperience\b/,
    /\beducation\b/,
    /\bskills\b/,
    /\bachievement/,
    /\bcertification/,
    /\b(project|portfolio)\b/,
  ]);
  const cvScore = clamp(34 + cvSignals * 8 + (text.length > 1600 ? 8 : 0));

  const safeAtsScore =
    typeof atsScore === "number" && Number.isFinite(atsScore)
      ? clamp(atsScore)
      : clamp(
          42 +
            (targetRole.trim() ? 11 : 0) +
            (normalized.includes("skills") ? 8 : 0) +
            (normalized.includes("experience") ? 8 : 0) +
            (evidenceSignals >= 2 ? 9 : 0),
        );

  const opportunityDashboard = rankOpportunities(
    cvContent,
    targetRole,
    opportunities,
  );

  const gapAnalysis = analyzeSkillGaps(
    cvContent,
    targetRole,
    opportunities,
  );

  const marketScore = opportunities.length
    ? clamp(
        opportunityDashboard.averageMatch * 0.7 +
          Math.min(opportunities.length, 5) * 4 +
          opportunityDashboard.readyCount * 3,
      )
    : 35;

  const interviewScore = clamp(
    38 +
      Math.min(evidenceSignals, 5) * 9 +
      (gapAnalysis.interviewTopics.length >= 3 ? 8 : 0) +
      (targetRole.trim() ? 5 : 0),
  );

  const metrics: CoachMetric[] = [
    {
      key: "profile",
      label: "Profile foundation",
      score: profileCompleteness,
      weight: 0.18,
      explanation:
        "Measures whether the core career profile contains enough structured information to support coaching and CV generation.",
      action:
        profileCompleteness >= 80
          ? "Keep your profile current as your experience grows."
          : "Complete missing career profile sections.",
    },
    {
      key: "cv",
      label: "CV quality",
      score: cvScore,
      weight: 0.2,
      explanation:
        "Measures CV structure, coverage and the visibility of relevant career information.",
      action:
        cvScore >= 80
          ? "Tailor the strongest version to each priority role."
          : "Strengthen structure, achievements and role relevance.",
    },
    {
      key: "ats",
      label: "ATS readiness",
      score: safeAtsScore,
      weight: 0.18,
      explanation:
        "Estimates whether the CV presents role-relevant evidence in a format suitable for automated screening.",
      action:
        safeAtsScore >= 80
          ? "Protect keyword relevance while keeping the writing natural."
          : "Run Career Intelligence against a target vacancy.",
    },
    {
      key: "market",
      label: "Market alignment",
      score: marketScore,
      weight: 0.17,
      explanation:
        "Measures how strongly the current CV aligns with saved opportunities and the target role.",
      action:
        opportunities.length
          ? "Prioritise the strongest opportunities and close repeated gaps."
          : "Add real job descriptions to unlock market alignment coaching.",
    },
    {
      key: "evidence",
      label: "Impact evidence",
      score: evidenceScore,
      weight: 0.15,
      explanation:
        "Measures the visibility of quantified outcomes, ownership, leadership and credible proof of contribution.",
      action:
        evidenceScore >= 78
          ? "Prepare the strongest evidence for interviews."
          : "Add verified outcomes and measurable achievements.",
    },
    {
      key: "interview",
      label: "Interview readiness",
      score: interviewScore,
      weight: 0.12,
      explanation:
        "Measures whether the CV contains enough examples to support clear, evidence-based interview answers.",
      action:
        interviewScore >= 78
          ? "Practise concise STAR stories for your priority role."
          : "Prepare examples for strengths, gaps and measurable results.",
    },
  ];

  const overallScore = clamp(
    metrics.reduce(
      (sum, metric) => sum + metric.score * metric.weight,
      0,
    ),
  );

  const missions: CoachMission[] = [];

  if (profileCompleteness < 80) {
    missions.push({
      id: "complete-profile",
      title: "Complete your career foundation",
      description:
        "Add the missing profile sections so the coach can generate more accurate guidance.",
      category: "profile",
      impact: Math.min(8, Math.max(3, Math.round((80 - profileCompleteness) / 5))),
      effort: "20 min",
      priority: profileCompleteness < 55 ? "Critical" : "High",
      destination: "build",
    });
  }

  if (evidenceScore < 78) {
    missions.push({
      id: "strengthen-evidence",
      title: "Turn responsibilities into proof",
      description:
        "Add two verified achievements with scope, action and measurable outcome.",
      category: "evidence",
      impact: 6,
      effort: "30 min",
      priority: "High",
      destination: "writer",
    });
  }

  if (safeAtsScore < 80) {
    missions.push({
      id: "run-ats",
      title: "Complete a vacancy-specific ATS review",
      description:
        "Analyse the CV against one real vacancy and resolve the highest-impact keyword or evidence gap.",
      category: "ats",
      impact: 5,
      effort: "20 min",
      priority: safeAtsScore < 60 ? "Critical" : "High",
      destination: "ats",
    });
  }

  if (!opportunities.length) {
    missions.push({
      id: "add-opportunities",
      title: "Create your opportunity shortlist",
      description:
        "Add at least three real vacancies to unlock ranking, fit explanations and repeated gap analysis.",
      category: "market",
      impact: 7,
      effort: "20 min",
      priority: "Critical",
      destination: "opportunities",
    });
  } else {
    if (gapAnalysis.topPriorities[0]) {
      const gap = gapAnalysis.topPriorities[0];
      missions.push({
        id: `close-gap-${gap.id}`,
        title: `Resolve: ${gap.label}`,
        description: gap.recommendedActions[0] ?? gap.explanation,
        category: "market",
        impact: Math.max(3, Math.min(8, Math.round(gap.impactScore / 14))),
        effort: gap.resolutionType === "cv-evidence" ? "20 min" : "1 hour",
        priority:
          gap.priority === "critical"
            ? "Critical"
            : gap.priority === "high"
              ? "High"
              : "Medium",
        destination: "skill-gaps",
      });
    }

    missions.push({
      id: "review-best-fit",
      title: "Build a priority application strategy",
      description:
        "Review the strongest opportunity, its recruiter risks and the next best action before applying.",
      category: "market",
      impact: 4,
      effort: "20 min",
      priority: "High",
      destination: "career-fit",
    });
  }

  if (interviewScore < 80) {
    missions.push({
      id: "prepare-star-stories",
      title: "Prepare three interview stories",
      description:
        "Create concise STAR examples for impact, challenge and collaboration.",
      category: "interview",
      impact: 4,
      effort: "30 min",
      priority: "Medium",
      destination: "recruiter",
    });
  }

  const finalMissions = uniqueMissions(missions)
    .sort((a, b) => {
      const priority = { Critical: 3, High: 2, Medium: 1 };
      if (priority[b.priority] !== priority[a.priority]) {
        return priority[b.priority] - priority[a.priority];
      }
      return b.impact - a.impact;
    })
    .slice(0, 5);

  const projectedScore = clamp(
    overallScore +
      finalMissions.slice(0, 3).reduce((sum, mission) => sum + mission.impact, 0),
  );

  const signals: CoachSignal[] = [];

  const strongest = [...metrics].sort((a, b) => b.score - a.score)[0];
  const weakest = [...metrics].sort((a, b) => a.score - b.score)[0];

  signals.push({
    tone: "positive",
    title: `${strongest.label} is your strongest area`,
    detail: `${strongest.score}% readiness. ${strongest.action}`,
  });

  signals.push({
    tone: "attention",
    title: `${weakest.label} offers the greatest upside`,
    detail: `${weakest.score}% readiness. ${weakest.action}`,
  });

  if (opportunityDashboard.bestMatch) {
    signals.push({
      tone: "neutral",
      title: `${opportunityDashboard.bestMatch.opportunity.title} leads your shortlist`,
      detail: `${opportunityDashboard.bestMatch.match.overallScore}% documented match at ${opportunityDashboard.bestMatch.opportunity.company}.`,
    });
  } else {
    signals.push({
      tone: "neutral",
      title: "Your market view is not active yet",
      detail:
        "Add real vacancies to compare fit, identify repeated requirements and prioritise applications.",
    });
  }

  const weeklyFocus =
    weakest.key === "market"
      ? "Build a real opportunity shortlist and tailor evidence to the strongest role."
      : weakest.key === "evidence"
        ? "Convert duties into credible, measurable proof of contribution."
        : weakest.key === "ats"
          ? "Improve vacancy-specific ATS alignment without keyword stuffing."
          : weakest.key === "interview"
            ? "Prepare concise examples that prove readiness for the target role."
            : weakest.key === "profile"
              ? "Complete the career profile so every AI tool works from stronger data."
              : "Strengthen the CV structure and the relevance of its strongest evidence.";

  const coachingMessage =
    overallScore >= 85
      ? "You have a strong career foundation. The next level comes from precision: prioritise the best-fit roles and make every application evidence-led."
      : overallScore >= 70
        ? "You are competitive, but a few focused improvements could materially strengthen your applications this week."
        : overallScore >= 50
          ? "Your foundation is taking shape. Complete the highest-impact missions before increasing application volume."
          : "Start with the career foundation. Strong structured information will improve every score and recommendation that follows.";

  return {
    overallScore,
    band: readinessBand(overallScore),
    confidence: clamp(
      48 +
        completedSections * 6 +
        Math.min(opportunities.length, 4) * 5 +
        (typeof atsScore === "number" ? 8 : 0),
    ),
    metrics,
    missions: finalMissions,
    signals,
    bestOpportunity: opportunityDashboard.bestMatch
      ? {
          title: opportunityDashboard.bestMatch.opportunity.title,
          company: opportunityDashboard.bestMatch.opportunity.company,
          score: opportunityDashboard.bestMatch.match.overallScore,
          readiness: opportunityDashboard.bestMatch.readiness,
        }
      : null,
    opportunityCount: opportunityDashboard.ranked.length,
    readyOpportunityCount: opportunityDashboard.readyCount,
    averageMatch: opportunityDashboard.averageMatch,
    profileCompleteness,
    coachingMessage,
    weeklyFocus,
    projectedScore,
    nextMilestone: nextMilestone(overallScore),
    integrityNote:
      "Career Readiness is a coaching indicator based on information currently available in the platform. It is not a hiring probability, employment guarantee or assessment of personal worth.",
  };
}
