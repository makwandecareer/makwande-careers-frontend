export type CareerStage =
  | "Student"
  | "Graduate"
  | "Early Career"
  | "Mid Career"
  | "Senior Professional"
  | "Executive";

export type CareerGoal =
  | "Find a job"
  | "Change careers"
  | "Earn a promotion"
  | "Improve interview performance"
  | "Build leadership readiness"
  | "Strengthen employability";

export type RoadmapPriority = "Critical" | "High" | "Medium" | "Low";

export interface CareerCopilotInput {
  targetRole: string;
  jobDescription: string;
  careerStage: CareerStage;
  careerGoal: CareerGoal;
  targetIndustry: string;
  targetTimelineWeeks: number;
  weeklyHoursAvailable: number;
  profileCompleteness: number;
  confidenceLevel: number;
  networkingStrength: number;
  interviewReadiness: number;
  technicalReadiness: number;
  leadershipReadiness: number;
}

export interface CareerReadinessDimension {
  key: string;
  label: string;
  score: number;
  status: "Strong" | "Developing" | "At Risk";
  explanation: string;
}

export interface CopilotRecommendation {
  id: string;
  title: string;
  description: string;
  priority: RoadmapPriority;
  estimatedHours: number;
  module: string;
  reason: string;
  completed: boolean;
}

export interface WeeklyMilestone {
  week: number;
  title: string;
  focus: string;
  actions: string[];
  expectedOutcome: string;
}

export interface CareerCopilotPlan {
  overallReadiness: number;
  readinessDimensions: CareerReadinessDimension[];
  recommendations: CopilotRecommendation[];
  weeklyMilestones: WeeklyMilestone[];
  recurringRisks: string[];
  strongestSignals: string[];
  nextBestAction: string;
  generatedAt: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function buildDimension(
  key: string,
  label: string,
  score: number,
  explanation: string,
): CareerReadinessDimension {
  const normalized = clamp(score);
  return {
    key,
    label,
    score: normalized,
    status:
      normalized >= 75 ? "Strong" : normalized >= 55 ? "Developing" : "At Risk",
    explanation,
  };
}

function recommendation(
  id: string,
  title: string,
  description: string,
  priority: RoadmapPriority,
  estimatedHours: number,
  module: string,
  reason: string,
): CopilotRecommendation {
  return {
    id,
    title,
    description,
    priority,
    estimatedHours,
    module,
    reason,
    completed: false,
  };
}

export function buildCareerCopilotPlan(
  input: CareerCopilotInput,
  atsScore: number | null,
): CareerCopilotPlan {
  const ats = atsScore ?? 55;
  const roleFit = clamp(
    45 +
      (input.targetRole.trim() ? 15 : 0) +
      (input.jobDescription.trim().length > 120 ? 15 : 0) +
      (input.targetIndustry.trim() ? 10 : 0),
  );

  const dimensions = [
    buildDimension(
      "ats",
      "ATS readiness",
      ats,
      "How effectively the CV is likely to pass automated screening.",
    ),
    buildDimension(
      "profile",
      "Profile completeness",
      input.profileCompleteness,
      "How complete and credible the candidate profile appears.",
    ),
    buildDimension(
      "roleFit",
      "Role alignment",
      roleFit,
      "How clearly the current profile is aligned with the target role.",
    ),
    buildDimension(
      "interview",
      "Interview readiness",
      input.interviewReadiness,
      "Preparedness for behavioural, technical and pressure interviews.",
    ),
    buildDimension(
      "technical",
      "Technical readiness",
      input.technicalReadiness,
      "Evidence of role-specific capability and technical confidence.",
    ),
    buildDimension(
      "leadership",
      "Leadership readiness",
      input.leadershipReadiness,
      "Readiness for management, executive and stakeholder expectations.",
    ),
    buildDimension(
      "network",
      "Market visibility",
      input.networkingStrength,
      "Strength of professional visibility, relationships and opportunity access.",
    ),
    buildDimension(
      "confidence",
      "Career confidence",
      input.confidenceLevel,
      "Confidence in positioning, decision-making and career communication.",
    ),
  ];

  const recommendations: CopilotRecommendation[] = [];

  if (ats < 75) {
    recommendations.push(
      recommendation(
        "ats-upgrade",
        "Strengthen ATS alignment",
        "Improve keywords, role alignment, section structure and measurable evidence.",
        ats < 55 ? "Critical" : "High",
        3,
        "ATS Optimisation",
        `Current ATS readiness is ${clamp(ats)}%.`,
      ),
    );
  }

  if (input.profileCompleteness < 80) {
    recommendations.push(
      recommendation(
        "profile-complete",
        "Complete the candidate profile",
        "Fill missing experience, education, skills, projects and achievement evidence.",
        input.profileCompleteness < 55 ? "Critical" : "High",
        2,
        "Profile Builder",
        "Incomplete profiles weaken credibility and matching accuracy.",
      ),
    );
  }

  if (roleFit < 75) {
    recommendations.push(
      recommendation(
        "role-fit",
        "Build a role-specific positioning strategy",
        "Translate experience into the language, priorities and outcomes of the target role.",
        "High",
        3,
        "Career Strategy",
        "The target role and evidence base are not yet strongly connected.",
      ),
    );
  }

  if (input.interviewReadiness < 75) {
    recommendations.push(
      recommendation(
        "interview-practice",
        "Complete structured interview practice",
        "Use behavioural, experience-based and pressure interview modules.",
        input.interviewReadiness < 50 ? "Critical" : "High",
        5,
        "Interview Suite",
        "Interview readiness remains below the recommended level.",
      ),
    );
  }

  if (input.technicalReadiness < 70) {
    recommendations.push(
      recommendation(
        "technical-proof",
        "Strengthen technical evidence",
        "Prepare role-specific examples, technical explanations and proof of outcomes.",
        "High",
        4,
        "Technical Deep Dive",
        "Technical readiness is not yet strong enough for confident evaluation.",
      ),
    );
  }

  if (
    ["Senior Professional", "Executive"].includes(input.careerStage) &&
    input.leadershipReadiness < 75
  ) {
    recommendations.push(
      recommendation(
        "leadership-readiness",
        "Build leadership and executive readiness",
        "Practise strategic, stakeholder, commercial and governance scenarios.",
        "High",
        5,
        "Executive Interview",
        "Leadership expectations rise sharply at senior career stages.",
      ),
    );
  }

  if (input.networkingStrength < 65) {
    recommendations.push(
      recommendation(
        "visibility",
        "Increase professional visibility",
        "Improve LinkedIn positioning, recruiter outreach and relationship-building activity.",
        "Medium",
        3,
        "Career Visibility",
        "Weak market visibility reduces access to opportunities.",
      ),
    );
  }

  if (input.confidenceLevel < 65) {
    recommendations.push(
      recommendation(
        "confidence",
        "Build career communication confidence",
        "Prepare a clear professional story, value proposition and evidence bank.",
        "Medium",
        3,
        "Career Coaching",
        "Low confidence can weaken CV, networking and interview performance.",
      ),
    );
  }

  recommendations.push(
    recommendation(
      "assessment-centre",
      "Complete an assessment-centre simulation",
      "Practise a case study, inbox exercise, presentation and decision scenario.",
      "Medium",
      4,
      "Assessment Centre",
      "Assessment-centre practice improves structured decision-making and communication.",
    ),
  );

  const sorted = recommendations.sort((left, right) => {
    const rank: Record<RoadmapPriority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };
    return rank[right.priority] - rank[left.priority];
  });

  const timeline = Math.max(2, Math.min(24, Math.round(input.targetTimelineWeeks)));
  const availableHours = Math.max(1, Math.min(40, Math.round(input.weeklyHoursAvailable)));

  const weeklyMilestones: WeeklyMilestone[] = Array.from(
    { length: timeline },
    (_, index) => {
      const week = index + 1;
      const selected = sorted.filter(
        (_, recommendationIndex) =>
          recommendationIndex % timeline === index % timeline,
      );
      const fallback = sorted[index % Math.max(sorted.length, 1)];

      const actions = (selected.length ? selected : fallback ? [fallback] : [])
        .slice(0, 3)
        .map(
          (item) =>
            `${item.title} — allocate up to ${Math.min(item.estimatedHours, availableHours)} hours.`,
        );

      return {
        week,
        title:
          week === 1
            ? "Career readiness foundation"
            : week === timeline
              ? "Final readiness and application launch"
              : `Readiness sprint ${week}`,
        focus:
          selected[0]?.module ||
          fallback?.module ||
          "Career readiness consolidation",
        actions:
          actions.length > 0
            ? actions
            : ["Review progress and complete outstanding preparation tasks."],
        expectedOutcome:
          week === timeline
            ? "A complete, targeted and interview-ready candidate profile."
            : "Measurable improvement in the selected readiness area.",
      };
    },
  );

  const recurringRisks = dimensions
    .filter((dimension) => dimension.score < 60)
    .map(
      (dimension) =>
        `${dimension.label} remains a recurring risk at ${dimension.score}%.`,
    );

  const strongestSignals = dimensions
    .filter((dimension) => dimension.score >= 75)
    .sort((left, right) => right.score - left.score)
    .map(
      (dimension) =>
        `${dimension.label} is a current strength at ${dimension.score}%.`,
    );

  const overallReadiness = clamp(
    average(dimensions.map((dimension) => dimension.score)),
  );

  const nextBestAction =
    sorted[0]?.title ||
    "Complete the candidate profile and define a clear target role.";

  return {
    overallReadiness,
    readinessDimensions: dimensions,
    recommendations: sorted,
    weeklyMilestones,
    recurringRisks,
    strongestSignals,
    nextBestAction,
    generatedAt: new Date().toISOString(),
  };
}
