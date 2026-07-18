import { calculateJobMatch } from "@/lib/job-matching";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";

export type GapCategory =
  | "skill"
  | "tool"
  | "certification"
  | "experience"
  | "education"
  | "leadership"
  | "achievement"
  | "ats";

export type GapPriority = "critical" | "high" | "medium" | "low";

export type GapResolutionType =
  | "cv-evidence"
  | "learning"
  | "project"
  | "experience"
  | "verification";

export type SkillGapItem = {
  id: string;
  label: string;
  category: GapCategory;
  priority: GapPriority;
  frequency: number;
  opportunityCount: number;
  impactScore: number;
  resolutionType: GapResolutionType;
  matchedRoles: string[];
  explanation: string;
  evidencePrompt: string;
  recommendedActions: string[];
  interviewTopics: string[];
};

export type TransferableStrength = {
  label: string;
  frequency: number;
  opportunityCount: number;
  explanation: string;
};

export type DevelopmentRoadmapItem = {
  id: string;
  horizon: "Now" | "Next 30 days" | "Next 90 days";
  title: string;
  objective: string;
  actions: string[];
  measurableOutcome: string;
  relatedGapIds: string[];
};

export type SkillGapAnalysis = {
  gaps: SkillGapItem[];
  transferableStrengths: TransferableStrength[];
  roadmap: DevelopmentRoadmapItem[];
  readinessScore: number;
  evidenceGapCount: number;
  learningGapCount: number;
  experienceGapCount: number;
  topPriorities: SkillGapItem[];
  interviewTopics: string[];
  summary: string;
  integrityNotes: string[];
};

const TOOL_TERMS = [
  "excel",
  "power bi",
  "tableau",
  "sap",
  "oracle",
  "salesforce",
  "crm",
  "erp",
  "python",
  "sql",
  "javascript",
  "typescript",
  "react",
  "next.js",
  "jira",
  "asana",
  "microsoft project",
  "google analytics",
  "adobe",
  "autocad",
];

const CERTIFICATION_TERMS = [
  "certificate",
  "certification",
  "pmp",
  "prince2",
  "scrum",
  "cips",
  "six sigma",
  "lean",
  "comptia",
  "aws",
  "azure",
  "google certification",
  "saps",
  "nqf",
];

const LEADERSHIP_TERMS = [
  "leadership",
  "managed",
  "supervised",
  "mentored",
  "coached",
  "stakeholder",
  "strategy",
  "governance",
  "decision-making",
  "team leadership",
];

const ACHIEVEMENT_TERMS = [
  "quantified achievements",
  "cost savings",
  "revenue growth",
  "efficiency improvement",
  "performance improvement",
  "delivery impact",
  "measurable results",
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function classifyGap(label: string): GapCategory {
  const term = normalize(label);

  if (TOOL_TERMS.some((item) => term.includes(item))) return "tool";
  if (CERTIFICATION_TERMS.some((item) => term.includes(item))) {
    return "certification";
  }
  if (
    term.includes("year") ||
    term.includes("experience") ||
    term.includes("industry exposure")
  ) {
    return "experience";
  }
  if (
    term.includes("degree") ||
    term.includes("diploma") ||
    term.includes("education") ||
    term.includes("qualification")
  ) {
    return "education";
  }
  if (LEADERSHIP_TERMS.some((item) => term.includes(item))) {
    return "leadership";
  }
  if (ACHIEVEMENT_TERMS.some((item) => term.includes(item))) {
    return "achievement";
  }
  if (
    term.includes("heading") ||
    term.includes("keyword") ||
    term.includes("ats") ||
    term.includes("cv structure")
  ) {
    return "ats";
  }
  return "skill";
}

function resolutionTypeFor(
  category: GapCategory,
  cvText: string,
  label: string,
): GapResolutionType {
  const normalizedCV = normalize(cvText);
  const normalizedLabel = normalize(label);

  if (
    category === "achievement" ||
    category === "ats" ||
    normalizedCV.includes(normalizedLabel)
  ) {
    return "cv-evidence";
  }

  if (category === "certification" || category === "education") {
    return "verification";
  }

  if (category === "experience" || category === "leadership") {
    return "experience";
  }

  if (category === "tool" || category === "skill") {
    return "learning";
  }

  return "project";
}

function priorityFor(impactScore: number): GapPriority {
  if (impactScore >= 82) return "critical";
  if (impactScore >= 65) return "high";
  if (impactScore >= 45) return "medium";
  return "low";
}

function actionTemplates(
  label: string,
  category: GapCategory,
  resolutionType: GapResolutionType,
): string[] {
  const actions: Record<GapResolutionType, string[]> = {
    "cv-evidence": [
      `Review your existing work for verified evidence of ${label}.`,
      `Add a concise achievement or responsibility showing where ${label} was used.`,
      "Quantify the result where accurate figures are available.",
    ],
    learning: [
      `Complete focused introductory learning in ${label}.`,
      `Practise ${label} through a small role-relevant exercise.`,
      `Add ${label} to the CV only after gaining genuine working evidence.`,
    ],
    project: [
      `Create a small portfolio project demonstrating ${label}.`,
      "Document the objective, process, tools used and measurable outcome.",
      "Add the completed project to the CV and interview examples.",
    ],
    experience: [
      `Seek practical exposure involving ${label} in your current role, volunteering or project work.`,
      "Ask to support a relevant team activity or responsibility.",
      "Record the scope, contribution and outcome for future CV evidence.",
    ],
    verification: [
      `Confirm whether ${label} is mandatory or preferred in the vacancy.`,
      "List only qualifications or certifications you genuinely hold.",
      "Consider a recognised learning route only where it supports your target roles.",
    ],
  };

  if (category === "leadership") {
    return [
      "Identify examples where you coordinated people, influenced decisions or owned delivery.",
      "Describe leadership scope without inflating job titles.",
      "Prepare one interview example using situation, action and result.",
    ];
  }

  return actions[resolutionType];
}

function interviewTopicsFor(
  label: string,
  category: GapCategory,
): string[] {
  const base = [
    `How you would apply ${label} in the target role`,
    `A practical example related to ${label}`,
  ];

  if (category === "tool") {
    return [...base, `Your current proficiency level in ${label}`];
  }
  if (category === "leadership") {
    return [
      `A time you led or influenced others`,
      "How you handled accountability and competing priorities",
      "How you communicated with stakeholders",
    ];
  }
  if (category === "experience") {
    return [
      "How your existing experience transfers to the target environment",
      "How you would close the experience gap quickly",
      "A comparable challenge you have already handled",
    ];
  }
  if (category === "achievement") {
    return [
      "Your most measurable professional result",
      "How you improved cost, quality, speed or customer outcomes",
      "How you verified the result",
    ];
  }

  return base;
}

function createGapId(label: string): string {
  return `gap-${normalize(label).replace(/\s+/g, "-").slice(0, 48)}`;
}

function buildRoadmap(gaps: SkillGapItem[]): DevelopmentRoadmapItem[] {
  const now = gaps.filter(
    (gap) =>
      gap.resolutionType === "cv-evidence" ||
      gap.resolutionType === "verification",
  );
  const next30 = gaps.filter(
    (gap) =>
      gap.resolutionType === "learning" || gap.resolutionType === "project",
  );
  const next90 = gaps.filter(
    (gap) => gap.resolutionType === "experience",
  );

  const fallback = gaps.slice(0, 3);

  return [
    {
      id: "roadmap-now",
      horizon: "Now",
      title: "Strengthen documented evidence",
      objective:
        "Improve the accuracy and visibility of evidence already available.",
      actions: (now.length ? now : fallback)
        .slice(0, 3)
        .flatMap((gap) => gap.recommendedActions.slice(0, 1)),
      measurableOutcome:
        "A revised CV with verified evidence for the highest-priority gaps.",
      relatedGapIds: (now.length ? now : fallback)
        .slice(0, 3)
        .map((gap) => gap.id),
    },
    {
      id: "roadmap-30",
      horizon: "Next 30 days",
      title: "Build practical capability",
      objective:
        "Develop working familiarity in the most valuable missing skills or tools.",
      actions: (next30.length ? next30 : fallback)
        .slice(0, 3)
        .flatMap((gap) => gap.recommendedActions.slice(0, 1)),
      measurableOutcome:
        "At least one completed learning activity or evidence-based project.",
      relatedGapIds: (next30.length ? next30 : fallback)
        .slice(0, 3)
        .map((gap) => gap.id),
    },
    {
      id: "roadmap-90",
      horizon: "Next 90 days",
      title: "Create stronger experience evidence",
      objective:
        "Gain practical exposure that improves competitiveness across target roles.",
      actions: (next90.length ? next90 : fallback)
        .slice(0, 3)
        .flatMap((gap) => gap.recommendedActions.slice(0, 1)),
      measurableOutcome:
        "New verified examples demonstrating responsibility, delivery or leadership.",
      relatedGapIds: (next90.length ? next90 : fallback)
        .slice(0, 3)
        .map((gap) => gap.id),
    },
  ];
}

export function analyzeSkillGaps(
  cvContent: unknown,
  targetRole: string,
  opportunities: OpportunityInput[],
): SkillGapAnalysis {
  const cvText = stringify(cvContent);
  const active = opportunities.filter(
    (item) => item.description.trim().length > 20,
  );

  const matches = active.map((opportunity) => ({
    opportunity,
    match: calculateJobMatch({
      cvContent,
      targetRole: opportunity.title || targetRole,
      jobDescription: opportunity.description,
    }),
  }));

  const gapMap = new Map<
    string,
    {
      label: string;
      frequency: number;
      roles: Set<string>;
      scoreImpact: number;
    }
  >();

  const strengthMap = new Map<
    string,
    {
      label: string;
      frequency: number;
      roles: Set<string>;
    }
  >();

  for (const { opportunity, match } of matches) {
    for (const dimension of match.dimensions) {
      for (const missing of dimension.missing) {
        const key = normalize(missing);
        if (!key) continue;
        const existing = gapMap.get(key) ?? {
          label: missing,
          frequency: 0,
          roles: new Set<string>(),
          scoreImpact: 0,
        };
        existing.frequency += 1;
        existing.roles.add(opportunity.title);
        existing.scoreImpact += Math.max(0, 100 - dimension.score);
        gapMap.set(key, existing);
      }
    }

    for (const strength of match.strengths) {
      const key = normalize(strength);
      if (!key) continue;
      const existing = strengthMap.get(key) ?? {
        label: strength,
        frequency: 0,
        roles: new Set<string>(),
      };
      existing.frequency += 1;
      existing.roles.add(opportunity.title);
      strengthMap.set(key, existing);
    }
  }

  const denominator = Math.max(1, active.length);

  const gaps = [...gapMap.values()]
    .map((item): SkillGapItem => {
      const category = classifyGap(item.label);
      const resolutionType = resolutionTypeFor(category, cvText, item.label);
      const frequencyScore = (item.roles.size / denominator) * 60;
      const severityScore =
        item.frequency > 0 ? item.scoreImpact / item.frequency : 0;
      const impactScore = Math.round(
        Math.min(100, frequencyScore + severityScore * 0.4),
      );

      return {
        id: createGapId(item.label),
        label: item.label,
        category,
        priority: priorityFor(impactScore),
        frequency: item.frequency,
        opportunityCount: item.roles.size,
        impactScore,
        resolutionType,
        matchedRoles: [...item.roles],
        explanation:
          item.roles.size > 1
            ? `${item.label} appears across ${item.roles.size} target opportunities, making it a high-leverage development area.`
            : `${item.label} is under-evidenced for one selected opportunity and should be verified before action is taken.`,
        evidencePrompt: `What genuine example, result, project, training or responsibility can prove ${item.label}?`,
        recommendedActions: actionTemplates(
          item.label,
          category,
          resolutionType,
        ),
        interviewTopics: interviewTopicsFor(item.label, category),
      };
    })
    .sort((a, b) => {
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }
      return b.opportunityCount - a.opportunityCount;
    });

  const transferableStrengths = [...strengthMap.values()]
    .map((item): TransferableStrength => ({
      label: item.label,
      frequency: item.frequency,
      opportunityCount: item.roles.size,
      explanation:
        item.roles.size > 1
          ? `${item.label} supports several target roles and should remain prominent in the CV.`
          : `${item.label} provides useful evidence for a selected role.`,
    }))
    .sort((a, b) => {
      if (b.opportunityCount !== a.opportunityCount) {
        return b.opportunityCount - a.opportunityCount;
      }
      return b.frequency - a.frequency;
    })
    .slice(0, 12);

  const readinessScore = active.length
    ? Math.round(
        matches.reduce(
          (sum, item) => sum + item.match.overallScore,
          0,
        ) / active.length,
      )
    : 0;

  const topPriorities = gaps.slice(0, 6);
  const interviewTopics = unique(
    topPriorities.flatMap((gap) => gap.interviewTopics),
  ).slice(0, 12);

  return {
    gaps,
    transferableStrengths,
    roadmap: buildRoadmap(gaps),
    readinessScore,
    evidenceGapCount: gaps.filter(
      (gap) => gap.resolutionType === "cv-evidence",
    ).length,
    learningGapCount: gaps.filter(
      (gap) =>
        gap.resolutionType === "learning" ||
        gap.resolutionType === "project",
    ).length,
    experienceGapCount: gaps.filter(
      (gap) => gap.resolutionType === "experience",
    ).length,
    topPriorities,
    interviewTopics,
    summary:
      active.length === 0
        ? "Add target opportunities to activate cross-job skill gap analysis."
        : gaps.length === 0
          ? "No major repeated gaps were detected from the supplied opportunities."
          : `${gaps.length} development areas were identified across ${active.length} opportunities. Focus first on repeated gaps that can be resolved through verified CV evidence, targeted learning or practical experience.`,
    integrityNotes: [
      "A missing term does not prove the candidate lacks the capability.",
      "Recommendations are based only on the supplied CV and vacancies.",
      "Qualifications and certifications must never be claimed without verification.",
      "Learning suggestions are developmental guidance, not guaranteed hiring requirements.",
      "Users should prioritise genuine evidence over keyword insertion.",
    ],
  };
}
