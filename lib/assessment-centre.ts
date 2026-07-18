export type AssessmentLevel =
  | "Graduate"
  | "Professional"
  | "Management"
  | "Executive";

export type ExerciseType =
  | "Case Study"
  | "Inbox Exercise"
  | "Presentation"
  | "Role Play"
  | "Group Exercise"
  | "Written Analysis"
  | "Prioritisation"
  | "Leadership Simulation"
  | "Commercial Exercise"
  | "Ethical Scenario";

export interface AssessmentCentreInput {
  targetRole: string;
  jobDescription: string;
  companyName: string;
  assessmentLevel: AssessmentLevel;
  exerciseCount: number;
  includeCaseStudy: boolean;
  includeInboxExercise: boolean;
  includePresentation: boolean;
  includeRolePlay: boolean;
  includeGroupExercise: boolean;
  includeLeadershipSimulation: boolean;
  includeCommercialExercise: boolean;
  includeEthicalScenario: boolean;
}

export interface AssessmentExercise {
  id: string;
  type: ExerciseType;
  title: string;
  scenario: string;
  instructions: string[];
  timeLimitMinutes: number;
  assessorIntent: string;
  evidenceExpected: string[];
  redFlags: string[];
  followUps: string[];
  scoringWeight: number;
}

export interface AssessmentScore {
  analysis: number;
  prioritisation: number;
  communication: number;
  decisionMaking: number;
  leadership: number;
  commercialAwareness: number;
  stakeholderManagement: number;
  execution: number;
  evidence: number;
  overall: number;
}

export interface AssessmentFeedback {
  score: AssessmentScore;
  strengths: string[];
  developmentAreas: string[];
  redFlags: string[];
  assessorFollowUp: string | null;
  coachingNote: string;
}

export interface AssessmentResponse {
  exerciseId: string;
  response: string;
  feedback: AssessmentFeedback;
}

export interface AssessmentCentreReport {
  overallScore: number;
  dimensions: Omit<AssessmentScore, "overall">;
  strongestCompetencies: string[];
  riskAreas: string[];
  developmentPriorities: string[];
  assessorSummary: string;
  generatedAt: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function countMatches(value: string, terms: string[]): number {
  const lower = value.toLowerCase();
  return terms.filter((term) => lower.includes(term)).length;
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(value: string): boolean {
  return /\b\d+([.,]\d+)?%?\b/.test(value);
}

function addExercise(
  exercises: AssessmentExercise[],
  type: ExerciseType,
  title: string,
  scenario: string,
  instructions: string[],
  timeLimitMinutes: number,
  assessorIntent: string,
  followUps: string[],
  scoringWeight: number,
): void {
  exercises.push({
    id: `assessment-${exercises.length + 1}`,
    type,
    title,
    scenario,
    instructions,
    timeLimitMinutes,
    assessorIntent,
    evidenceExpected: [
      "Clear structure",
      "Reasoned priorities",
      "Evidence-based decisions",
      "Awareness of stakeholders",
      "Commercial and operational judgement",
      "Realistic execution plan",
      "Concise communication",
    ],
    redFlags: [
      "No prioritisation",
      "Unsupported assumptions",
      "Ignoring stakeholders",
      "Overly theoretical response",
      "No measurable outcomes",
      "Weak risk awareness",
      "Failure to make a decision",
    ],
    followUps,
    scoringWeight,
  });
}

export function buildAssessmentCentre(
  input: AssessmentCentreInput,
): {
  exercises: AssessmentExercise[];
  challengeScore: number;
  assessmentProfile: string[];
} {
  const role = input.targetRole || "the target role";
  const company = input.companyName || "the organisation";
  const exercises: AssessmentExercise[] = [];

  if (input.includeCaseStudy) {
    addExercise(
      exercises,
      "Case Study",
      "Turnaround Strategy Case",
      `${company} has missed revenue targets for three consecutive quarters, customer complaints are rising and employee turnover has increased. You have been appointed into ${role} and must recommend a 90-day response.`,
      [
        "Identify the three most urgent issues.",
        "State the assumptions you are making.",
        "Recommend immediate and medium-term actions.",
        "Define success measures for the first 90 days.",
      ],
      45,
      "Assess structured analysis, prioritisation, judgement and execution planning.",
      [
        "Which action would you fund first?",
        "What would you stop immediately?",
        "What evidence could change your recommendation?",
      ],
      16,
    );
  }

  if (input.includeInboxExercise) {
    addExercise(
      exercises,
      "Inbox Exercise",
      "Executive Inbox Prioritisation",
      "You begin the day with twelve urgent messages: a customer escalation, a delayed supplier, a team conflict, a budget variance, a compliance query, a media request and a board deadline. You have 30 minutes before a critical meeting.",
      [
        "Rank the issues from highest to lowest priority.",
        "State what you would personally handle.",
        "State what you would delegate.",
        "Draft the first three messages you would send.",
      ],
      35,
      "Assess prioritisation, delegation, risk awareness and time management.",
      [
        "Which issue creates the greatest organisational risk?",
        "What can wait until tomorrow?",
        "What information would you request immediately?",
      ],
      15,
    );
  }

  if (input.includePresentation) {
    addExercise(
      exercises,
      "Presentation",
      "Board Recommendation Presentation",
      `Prepare a concise recommendation explaining how ${company} should improve performance in the next financial year.`,
      [
        "Open with the central business issue.",
        "Present no more than three strategic priorities.",
        "Explain financial and operational impact.",
        "Close with decisions required from the audience.",
      ],
      30,
      "Assess executive communication, strategic clarity and audience awareness.",
      [
        "What is the cost of doing nothing?",
        "Which recommendation is most difficult to implement?",
        "What decision do you need today?",
      ],
      14,
    );
  }

  if (input.includeRolePlay) {
    addExercise(
      exercises,
      "Role Play",
      "Difficult Stakeholder Meeting",
      "A senior stakeholder believes your team has failed and demands immediate action. The stakeholder is frustrated, interrupts frequently and rejects your initial explanation.",
      [
        "Acknowledge the concern without becoming defensive.",
        "Clarify facts and impact.",
        "Agree immediate actions and ownership.",
        "Protect the long-term relationship.",
      ],
      25,
      "Assess influence, conflict management, listening and composure.",
      [
        "What would you say if the stakeholder threatens escalation?",
        "Which concession would you make?",
        "What would you document afterwards?",
      ],
      14,
    );
  }

  if (input.includeGroupExercise) {
    addExercise(
      exercises,
      "Group Exercise",
      "Shared Resource Allocation",
      "A group must allocate a limited budget across customer service, technology, compliance, employee development and growth. Every option has strong supporters and no option can be fully funded.",
      [
        "State your preferred allocation.",
        "Explain the criteria behind your decision.",
        "Influence the group without dominating.",
        "Help the group reach a final decision.",
      ],
      40,
      "Assess collaboration, influence, listening and decision discipline.",
      [
        "What would you compromise on?",
        "How would you handle a dominant participant?",
        "What if the group chooses a different option?",
      ],
      13,
    );
  }

  if (input.includeLeadershipSimulation) {
    addExercise(
      exercises,
      "Leadership Simulation",
      "Underperforming Team Recovery",
      "You inherit a team with missed targets, low trust and unclear accountability. Two strong performers are considering leaving, while one long-serving employee is resisting change.",
      [
        "Set your first 30-day leadership priorities.",
        "Explain how you would rebuild trust.",
        "Define performance expectations.",
        "Address retention and resistance risks.",
      ],
      40,
      "Assess leadership judgement, performance management and culture building.",
      [
        "Who would you meet first?",
        "What behaviour would you challenge immediately?",
        "How would you measure team recovery?",
      ],
      15,
    );
  }

  if (input.includeCommercialExercise) {
    addExercise(
      exercises,
      "Commercial Exercise",
      "Growth Investment Decision",
      "The organisation can fund only one of three opportunities: a new market, a digital product or expansion of an existing service. Each option has different risk, return and capability requirements.",
      [
        "Select one option.",
        "Explain the decision criteria.",
        "Identify financial and operational risks.",
        "Describe the first implementation milestone.",
      ],
      35,
      "Assess commercial awareness, financial judgement and risk-adjusted decision making.",
      [
        "What return would make the investment worthwhile?",
        "What would cause you to stop the investment?",
        "Which capability gap matters most?",
      ],
      15,
    );
  }

  if (input.includeEthicalScenario) {
    addExercise(
      exercises,
      "Ethical Scenario",
      "Performance Reporting Dilemma",
      "A senior leader asks you to delay reporting a serious performance problem until after an important stakeholder meeting. The request is not explicitly illegal, but it could mislead decision-makers.",
      [
        "State what you would do.",
        "Explain the ethical and governance risks.",
        "Identify who should be informed.",
        "Describe how you would document the decision.",
      ],
      25,
      "Assess integrity, courage, governance and escalation judgement.",
      [
        "What if refusing damages your career?",
        "What if the issue can be fixed within a week?",
        "When would you escalate externally?",
      ],
      15,
    );
  }

  const levelMultiplier = {
    Graduate: 0.86,
    Professional: 0.96,
    Management: 1.08,
    Executive: 1.18,
  }[input.assessmentLevel];

  const count = Math.max(4, Math.min(20, Math.round(input.exerciseCount)));
  const result = exercises
    .map((exercise) => ({
      ...exercise,
      timeLimitMinutes: Math.max(
        20,
        Math.round(exercise.timeLimitMinutes / levelMultiplier),
      ),
      scoringWeight: clamp(exercise.scoringWeight * levelMultiplier),
    }))
    .sort((left, right) => right.scoringWeight - left.scoringWeight)
    .slice(0, count)
    .map((exercise, index) => ({
      ...exercise,
      id: `assessment-${index + 1}`,
    }));

  const challengeScore = clamp(
    48 +
      result.length * 4 +
      (input.assessmentLevel === "Management" ? 10 : 0) +
      (input.assessmentLevel === "Executive" ? 18 : 0),
  );

  const assessmentProfile = [
    input.includeCaseStudy ? "Case analysis" : "",
    input.includeInboxExercise ? "Inbox prioritisation" : "",
    input.includePresentation ? "Presentation assessment" : "",
    input.includeRolePlay ? "Stakeholder role play" : "",
    input.includeGroupExercise ? "Group exercise" : "",
    input.includeLeadershipSimulation ? "Leadership simulation" : "",
    input.includeCommercialExercise ? "Commercial judgement" : "",
    input.includeEthicalScenario ? "Ethical judgement" : "",
  ].filter(Boolean);

  return {
    exercises: result,
    challengeScore,
    assessmentProfile,
  };
}

export function scoreAssessmentResponse(
  exercise: AssessmentExercise,
  response: string,
): AssessmentFeedback {
  const value = response.trim();
  const lower = value.toLowerCase();
  const words = wordCount(value);

  const analysisMatches = countMatches(lower, [
    "because", "root cause", "evidence", "assumption", "data", "issue",
    "impact", "diagnose", "analyse", "factor",
  ]);

  const priorityMatches = countMatches(lower, [
    "first", "second", "third", "priority", "urgent", "critical", "sequence",
    "immediate", "later", "defer",
  ]);

  const communicationMatches = countMatches(lower, [
    "communicate", "message", "explain", "present", "listen", "clarify",
    "summarise", "audience", "brief",
  ]);

  const decisionMatches = countMatches(lower, [
    "decide", "recommend", "choose", "option", "trade-off", "criteria",
    "risk", "alternative", "approve",
  ]);

  const leadershipMatches = countMatches(lower, [
    "team", "delegate", "accountability", "coach", "performance", "trust",
    "ownership", "leader", "culture",
  ]);

  const commercialMatches = countMatches(lower, [
    "revenue", "customer", "margin", "cost", "profit", "return", "growth",
    "market", "value", "cash",
  ]);

  const stakeholderMatches = countMatches(lower, [
    "stakeholder", "customer", "employee", "board", "supplier", "regulator",
    "partner", "manager", "team",
  ]);

  const executionMatches = countMatches(lower, [
    "action", "owner", "deadline", "milestone", "measure", "kpi",
    "implementation", "review", "timeline", "follow-up",
  ]);

  const evidenceMatches = countMatches(lower, [
    "result", "measured", "data", "report", "verified", "baseline",
    "improved", "reduced", "increased",
  ]);

  const analysis = clamp(34 + analysisMatches * 7 + (words >= 100 ? 8 : 0));
  const prioritisation = clamp(32 + priorityMatches * 8);
  const communication = clamp(
    36 + communicationMatches * 7 + (words >= 80 && words <= 320 ? 8 : 0),
  );
  const decisionMaking = clamp(32 + decisionMatches * 8);
  const leadership = clamp(32 + leadershipMatches * 8);
  const commercialAwareness = clamp(28 + commercialMatches * 8);
  const stakeholderManagement = clamp(30 + stakeholderMatches * 7);
  const execution = clamp(30 + executionMatches * 8);
  const evidence = clamp(
    26 + evidenceMatches * 8 + (hasNumber(value) ? 18 : 0),
  );

  const overall = clamp(
    analysis * 0.13 +
      prioritisation * 0.12 +
      communication * 0.11 +
      decisionMaking * 0.13 +
      leadership * 0.11 +
      commercialAwareness * 0.11 +
      stakeholderManagement * 0.1 +
      execution * 0.11 +
      evidence * 0.08,
  );

  const strengths: string[] = [];
  const developmentAreas: string[] = [];
  const redFlags: string[] = [];

  if (analysis >= 72) strengths.push("The response demonstrates structured analysis.");
  else developmentAreas.push("Separate facts, assumptions, root causes and implications more clearly.");

  if (prioritisation >= 70) strengths.push("Priorities and sequence are clear.");
  else developmentAreas.push("Rank actions explicitly and explain why one comes before another.");

  if (decisionMaking >= 70) strengths.push("The response reaches a clear decision.");
  else developmentAreas.push("State the final recommendation and decision criteria.");

  if (execution >= 70) strengths.push("Execution ownership and milestones are visible.");
  else developmentAreas.push("Add owners, deadlines, milestones and success measures.");

  if (stakeholderManagement < 65) {
    developmentAreas.push("Identify affected stakeholders and explain how they will be engaged.");
  }

  if (commercialAwareness < 65) {
    developmentAreas.push("Connect the answer to customer, cost, growth, revenue or value.");
  }

  if (evidence < 65) {
    developmentAreas.push("Use measurable evidence, assumptions and verification methods.");
  }

  if (words < 70) redFlags.push("The response may be too brief for an assessment-centre exercise.");
  if (words > 420) redFlags.push("The response may be too detailed and difficult for assessors to follow.");
  if (!/\bI\b/.test(value)) redFlags.push("Personal ownership and decision responsibility are unclear.");
  if (countMatches(lower, ["maybe", "probably", "i guess", "not sure"]) > 1) {
    redFlags.push("Excessive uncertainty may weaken assessor confidence.");
  }

  const assessorFollowUp =
    priorityMatches === 0
      ? "Which action is your first priority, and why?"
      : decisionMatches === 0
        ? "What is your final recommendation?"
        : executionMatches === 0
          ? "Who owns the next action, and by when?"
          : exercise.followUps[0] || null;

  return {
    score: {
      analysis,
      prioritisation,
      communication,
      decisionMaking,
      leadership,
      commercialAwareness,
      stakeholderManagement,
      execution,
      evidence,
      overall,
    },
    strengths: unique(strengths),
    developmentAreas: unique(developmentAreas),
    redFlags: unique(redFlags),
    assessorFollowUp,
    coachingNote:
      "Use a disciplined structure: issue, evidence, priorities, decision, stakeholders, risks, execution, measures. Make your personal judgement visible and keep the response easy to score.",
  };
}

export function buildAssessmentCentreReport(
  responses: AssessmentResponse[],
): AssessmentCentreReport {
  const dimensions: Array<keyof Omit<AssessmentScore, "overall">> = [
    "analysis",
    "prioritisation",
    "communication",
    "decisionMaking",
    "leadership",
    "commercialAwareness",
    "stakeholderManagement",
    "execution",
    "evidence",
  ];

  const dimensionScores = dimensions.reduce((result, dimension) => {
    result[dimension] = responses.length
      ? clamp(
          responses.reduce(
            (sum, response) => sum + response.feedback.score[dimension],
            0,
          ) / responses.length,
        )
      : 0;
    return result;
  }, {} as Omit<AssessmentScore, "overall">);

  const overallScore = responses.length
    ? clamp(
        responses.reduce(
          (sum, response) => sum + response.feedback.score.overall,
          0,
        ) / responses.length,
      )
    : 0;

  const strongestCompetencies = unique(
    responses.flatMap((response) => response.feedback.strengths),
  ).slice(0, 8);

  const riskAreas = unique(
    responses.flatMap((response) => [
      ...response.feedback.developmentAreas,
      ...response.feedback.redFlags,
    ]),
  ).slice(0, 10);

  const developmentPriorities = [
    dimensionScores.analysis < 70
      ? "Practise separating facts, assumptions and root causes."
      : "",
    dimensionScores.prioritisation < 70
      ? "Use explicit ranking and time-sensitive prioritisation."
      : "",
    dimensionScores.decisionMaking < 70
      ? "Reach a clear recommendation more quickly."
      : "",
    dimensionScores.leadership < 70
      ? "Strengthen delegation, accountability and team leadership."
      : "",
    dimensionScores.commercialAwareness < 70
      ? "Connect recommendations to customer and financial value."
      : "",
    dimensionScores.execution < 70
      ? "Add owners, deadlines, milestones and measures."
      : "",
    dimensionScores.evidence < 70
      ? "Use stronger data, assumptions and measurable outcomes."
      : "",
  ].filter(Boolean);

  const assessorSummary =
    responses.length === 0
      ? "Complete assessment exercises to generate an assessor summary."
      : overallScore >= 80
        ? "The candidate demonstrates strong assessment-centre readiness with clear judgement, structure and execution."
        : overallScore >= 65
          ? "The candidate shows credible potential but should strengthen selected competencies before a formal assessment centre."
          : "The candidate requires further preparation in prioritisation, decision quality and evidence-based execution.";

  return {
    overallScore,
    dimensions: dimensionScores,
    strongestCompetencies,
    riskAreas,
    developmentPriorities,
    assessorSummary,
    generatedAt: new Date().toISOString(),
  };
}
