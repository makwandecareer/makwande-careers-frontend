export type ExecutiveLevel =
  | "Senior Manager"
  | "Director"
  | "Executive"
  | "C-Suite";

export type ExecutiveQuestionCategory =
  | "Strategic Vision"
  | "Commercial Judgement"
  | "Financial Leadership"
  | "Transformation"
  | "Governance"
  | "Board Communication"
  | "Stakeholder Leadership"
  | "Crisis Leadership"
  | "Culture & People"
  | "Execution"
  | "Innovation"
  | "Executive Presence";

export interface ExecutiveInterviewInput {
  targetRole: string;
  jobDescription: string;
  companyName: string;
  executiveLevel: ExecutiveLevel;
  questionCount: number;
  includeBoardQuestions: boolean;
  includeFinancialQuestions: boolean;
  includeTransformationQuestions: boolean;
  includeCrisisQuestions: boolean;
  includeGovernanceQuestions: boolean;
  includePeopleQuestions: boolean;
}

export interface ExecutiveQuestion {
  id: string;
  category: ExecutiveQuestionCategory;
  question: string;
  boardIntent: string;
  expectedSignals: string[];
  redFlags: string[];
  followUps: string[];
  scoringWeight: number;
}

export interface ExecutiveAnswerScore {
  strategicThinking: number;
  commercialAcumen: number;
  financialJudgement: number;
  leadership: number;
  governance: number;
  stakeholderInfluence: number;
  executivePresence: number;
  evidence: number;
  overall: number;
}

export interface ExecutiveAnswerFeedback {
  score: ExecutiveAnswerScore;
  strengths: string[];
  improvements: string[];
  redFlags: string[];
  boardFollowUp: string | null;
  coachingNote: string;
}

export interface ExecutiveInterviewAnswer {
  questionId: string;
  answer: string;
  feedback: ExecutiveAnswerFeedback;
}

export interface ExecutiveReadinessReport {
  overallScore: number;
  dimensions: Omit<ExecutiveAnswerScore, "overall">;
  strongestSignals: string[];
  leadershipRisks: string[];
  boardReadinessRisks: string[];
  preparationPriorities: string[];
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

function createQuestion(
  questions: ExecutiveQuestion[],
  category: ExecutiveQuestionCategory,
  question: string,
  boardIntent: string,
  followUps: string[],
  scoringWeight: number,
): void {
  questions.push({
    id: `executive-${questions.length + 1}`,
    category,
    question,
    boardIntent,
    expectedSignals: [
      "Clear enterprise-level perspective",
      "Connection between strategy and execution",
      "Commercial and financial awareness",
      "Stakeholder alignment",
      "Risk and governance awareness",
      "Evidence of measurable impact",
      "Balanced confidence and humility",
    ],
    redFlags: [
      "Operational detail without strategic context",
      "Vision without execution discipline",
      "No financial or commercial evidence",
      "Blaming the board, team or market",
      "Weak governance awareness",
      "Inability to prioritise",
      "Overly tactical communication",
    ],
    followUps,
    scoringWeight,
  });
}

export function buildExecutiveInterview(
  input: ExecutiveInterviewInput,
): {
  questions: ExecutiveQuestion[];
  executiveReadinessBaseline: number;
  interviewProfile: string[];
} {
  const role = input.targetRole || "this executive role";
  const company = input.companyName || "the organisation";
  const questions: ExecutiveQuestion[] = [];

  createQuestion(
    questions,
    "Strategic Vision",
    `What should the strategic priorities for ${company} be over the next three years, and how would you determine them?`,
    "Assess strategic clarity, market awareness and prioritisation.",
    [
      "What would you stop doing?",
      "Which assumption is most likely to be wrong?",
      "How would you measure progress quarterly?",
    ],
    15,
  );

  createQuestion(
    questions,
    "Execution",
    `How would you translate a board-approved strategy into measurable execution across the organisation?`,
    "Test the ability to convert strategy into ownership, cadence and outcomes.",
    [
      "Which operating rhythm would you introduce?",
      "How would you handle underperforming business units?",
      "What would the board see each month?",
    ],
    15,
  );

  createQuestion(
    questions,
    "Commercial Judgement",
    `Describe a major commercial decision you made with incomplete information. What value did you create or protect?`,
    "Assess commercial judgement, risk appetite and outcome ownership.",
    [
      "What alternatives did you reject?",
      "What was the downside risk?",
      "What changed after the decision?",
    ],
    14,
  );

  createQuestion(
    questions,
    "Stakeholder Leadership",
    `How do you align senior stakeholders who have competing incentives and different definitions of success?`,
    "Assess influence, political intelligence and enterprise alignment.",
    [
      "Who was hardest to align?",
      "What did you compromise on?",
      "When would you escalate to the board?",
    ],
    13,
  );

  createQuestion(
    questions,
    "Executive Presence",
    `Why are you ready for ${role}, and what would make the board hesitate to appoint you?`,
    "Test self-awareness, confidence and board-level credibility.",
    [
      "What is the strongest concern?",
      "How would you reduce that concern?",
      "Which reference could support your readiness?",
    ],
    14,
  );

  if (input.includeFinancialQuestions) {
    createQuestion(
      questions,
      "Financial Leadership",
      "Which financial indicators do you rely on most when evaluating organisational health, and how do they influence decisions?",
      "Assess financial literacy and the connection between metrics and action.",
      [
        "Which indicator can be misleading?",
        "How do you balance growth and cash preservation?",
        "What would trigger immediate intervention?",
      ],
      15,
    );

    createQuestion(
      questions,
      "Commercial Judgement",
      "Revenue is growing, but profitability and cash conversion are weakening. What would you investigate first?",
      "Test diagnosis of growth quality, margin and cash risk.",
      [
        "Which data would you request?",
        "What actions could damage long-term value?",
        "How would you explain this to investors?",
      ],
      15,
    );
  }

  if (input.includeTransformationQuestions) {
    createQuestion(
      questions,
      "Transformation",
      "Describe how you would lead a major transformation when employees are tired of change and trust in leadership is low.",
      "Assess transformation discipline, trust rebuilding and delivery realism.",
      [
        "What would you communicate first?",
        "Which leaders might need to change?",
        "How would you measure adoption?",
      ],
      14,
    );

    createQuestion(
      questions,
      "Innovation",
      "How do you decide which innovations deserve investment and which should be stopped early?",
      "Assess innovation governance and portfolio judgement.",
      [
        "Which stage gates would you use?",
        "How do you protect experimentation?",
        "What failure rate is acceptable?",
      ],
      12,
    );
  }

  if (input.includeBoardQuestions) {
    createQuestion(
      questions,
      "Board Communication",
      "You must present a weak quarter to the board. How would you structure the discussion?",
      "Assess transparency, control, accountability and board communication.",
      [
        "What would you disclose before the meeting?",
        "Which questions should you expect?",
        "What action plan would you bring?",
      ],
      15,
    );

    createQuestion(
      questions,
      "Board Communication",
      "How would you respond if the board rejects a recommendation you strongly believe is necessary?",
      "Test board relationship maturity and principled influence.",
      [
        "Would you continue to challenge the decision?",
        "When would resignation become appropriate?",
        "How would you protect execution afterwards?",
      ],
      14,
    );
  }

  if (input.includeGovernanceQuestions) {
    createQuestion(
      questions,
      "Governance",
      "How do you balance speed, accountability and governance when the organisation is under pressure?",
      "Assess governance maturity without creating bureaucracy.",
      [
        "Which controls are non-negotiable?",
        "What can be delegated?",
        "How would you know governance is slowing execution?",
      ],
      14,
    );

    createQuestion(
      questions,
      "Governance",
      "A high-performing executive repeatedly ignores policy but delivers exceptional results. What do you do?",
      "Test consistency, ethics and consequences at senior level.",
      [
        "What if they threaten to resign?",
        "How would you document the decision?",
        "What message does your response send?",
      ],
      15,
    );
  }

  if (input.includeCrisisQuestions) {
    createQuestion(
      questions,
      "Crisis Leadership",
      "A serious operational crisis threatens customers, employees and the organisation's reputation. What are your first five actions?",
      "Assess crisis prioritisation, command, communication and recovery.",
      [
        "Who takes operational command?",
        "When do you notify the board?",
        "How do you prevent misinformation?",
      ],
      15,
    );

    createQuestion(
      questions,
      "Crisis Leadership",
      "During a crisis, your executive team disagrees publicly on the response. How do you regain control?",
      "Test authority, alignment and calm under executive pressure.",
      [
        "Would you remove anyone from the response team?",
        "How would you communicate externally?",
        "What happens after the crisis?",
      ],
      14,
    );
  }

  if (input.includePeopleQuestions) {
    createQuestion(
      questions,
      "Culture & People",
      "What culture would you intentionally build, and which behaviours would you refuse to tolerate from senior leaders?",
      "Assess cultural clarity and willingness to enforce standards.",
      [
        "How would you measure culture?",
        "What behaviour is most damaging?",
        "How would you handle a powerful offender?",
      ],
      13,
    );

    createQuestion(
      questions,
      "Culture & People",
      "How do you identify and develop future executives while still holding current leaders accountable?",
      "Assess succession, talent development and performance discipline.",
      [
        "What signals executive potential?",
        "How do you avoid favouritism?",
        "When is external hiring necessary?",
      ],
      12,
    );
  }

  const multiplier = {
    "Senior Manager": 0.88,
    Director: 1,
    Executive: 1.08,
    "C-Suite": 1.16,
  }[input.executiveLevel];

  const count = Math.max(8, Math.min(36, Math.round(input.questionCount)));
  const result = questions
    .map((question) => ({
      ...question,
      scoringWeight: clamp(question.scoringWeight * multiplier),
    }))
    .sort((left, right) => right.scoringWeight - left.scoringWeight)
    .slice(0, count)
    .map((question, index) => ({
      ...question,
      id: `executive-${index + 1}`,
    }));

  const executiveReadinessBaseline = clamp(
    50 +
      result.length * 1.25 +
      (input.executiveLevel === "Executive" ? 10 : 0) +
      (input.executiveLevel === "C-Suite" ? 16 : 0),
  );

  const interviewProfile = [
    input.includeBoardQuestions ? "Board communication" : "",
    input.includeFinancialQuestions ? "Financial leadership" : "",
    input.includeTransformationQuestions ? "Transformation leadership" : "",
    input.includeCrisisQuestions ? "Crisis leadership" : "",
    input.includeGovernanceQuestions ? "Governance and ethics" : "",
    input.includePeopleQuestions ? "Culture and succession" : "",
  ].filter(Boolean);

  return {
    questions: result,
    executiveReadinessBaseline,
    interviewProfile,
  };
}

export function scoreExecutiveAnswer(
  question: ExecutiveQuestion,
  answer: string,
): ExecutiveAnswerFeedback {
  const value = answer.trim();
  const lower = value.toLowerCase();
  const words = wordCount(value);

  const strategicMatches = countMatches(lower, [
    "strategy", "priority", "market", "competitive", "long term", "three year",
    "portfolio", "scenario", "assumption", "enterprise",
  ]);

  const commercialMatches = countMatches(lower, [
    "customer", "revenue", "margin", "growth", "value", "market share",
    "commercial", "cost", "pricing", "return",
  ]);

  const financialMatches = countMatches(lower, [
    "cash", "profit", "ebitda", "budget", "forecast", "working capital",
    "return on investment", "capital", "margin", "financial",
  ]);

  const leadershipMatches = countMatches(lower, [
    "team", "leaders", "accountability", "culture", "coach", "succession",
    "performance", "ownership", "align",
  ]);

  const governanceMatches = countMatches(lower, [
    "governance", "risk", "audit", "policy", "compliance", "board",
    "control", "ethics", "oversight",
  ]);

  const stakeholderMatches = countMatches(lower, [
    "stakeholder", "board", "investor", "employee", "customer", "regulator",
    "partner", "communicate", "influence",
  ]);

  const presenceMatches = countMatches(lower, [
    "i would", "i led", "i decided", "my responsibility", "the decision",
    "the outcome", "my role",
  ]);

  const evidenceMatches = countMatches(lower, [
    "result", "increased", "reduced", "improved", "delivered", "saved",
    "measured", "achieved", "verified",
  ]);

  const strategicThinking = clamp(
    34 + strategicMatches * 7 + (words >= 100 ? 10 : 0),
  );
  const commercialAcumen = clamp(32 + commercialMatches * 7);
  const financialJudgement = clamp(30 + financialMatches * 8);
  const leadership = clamp(34 + leadershipMatches * 7);
  const governance = clamp(30 + governanceMatches * 8);
  const stakeholderInfluence = clamp(34 + stakeholderMatches * 7);
  const executivePresence = clamp(
    40 + presenceMatches * 7 + (words >= 80 && words <= 260 ? 10 : 0),
  );
  const evidence = clamp(
    28 + evidenceMatches * 8 + (hasNumber(value) ? 20 : 0),
  );

  const overall = clamp(
    strategicThinking * 0.17 +
      commercialAcumen * 0.14 +
      financialJudgement * 0.12 +
      leadership * 0.14 +
      governance * 0.11 +
      stakeholderInfluence * 0.12 +
      executivePresence * 0.11 +
      evidence * 0.09,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  const redFlags: string[] = [];

  if (strategicThinking >= 72) strengths.push("The answer demonstrates enterprise-level strategic thinking.");
  else improvements.push("Move beyond operational detail and clarify enterprise priorities.");

  if (commercialAcumen >= 70) strengths.push("Commercial judgement is visible.");
  else improvements.push("Connect the recommendation to customers, growth, margin or value.");

  if (leadership >= 70) strengths.push("Leadership and organisational alignment are addressed.");
  else improvements.push("Explain how leaders, teams and accountability would be aligned.");

  if (governance < 65) improvements.push("Address governance, risk and board oversight more explicitly.");
  if (stakeholderInfluence < 68) improvements.push("Clarify how key stakeholders would be influenced and aligned.");
  if (evidence < 65) improvements.push("Add measurable outcomes and executive-level evidence.");

  if (words < 60) redFlags.push("The answer may be too brief for an executive interview.");
  if (words > 320) redFlags.push("The answer may be too detailed for board-level communication.");
  if (!/\bI\b/.test(value)) redFlags.push("Personal executive ownership is unclear.");
  if (countMatches(lower, ["always", "never", "guaranteed", "no risk"]) > 0) {
    redFlags.push("Absolute language may weaken executive credibility.");
  }

  const boardFollowUp =
    strategicMatches === 0
      ? "What is the strategic implication beyond the immediate operational issue?"
      : financialMatches === 0
        ? "What financial impact would this decision have?"
        : stakeholderMatches === 0
          ? "Which stakeholder could block this decision, and how would you gain support?"
          : question.followUps[0] || null;

  return {
    score: {
      strategicThinking,
      commercialAcumen,
      financialJudgement,
      leadership,
      governance,
      stakeholderInfluence,
      executivePresence,
      evidence,
      overall,
    },
    strengths: unique(strengths),
    improvements: unique(improvements),
    redFlags: unique(redFlags),
    boardFollowUp,
    coachingNote:
      "Lead with the enterprise issue, state the decision or recommendation, explain commercial and financial impact, identify key risks and stakeholders, then close with execution and measurable outcomes.",
  };
}

export function buildExecutiveReadinessReport(
  answers: ExecutiveInterviewAnswer[],
): ExecutiveReadinessReport {
  const dimensions: Array<keyof Omit<ExecutiveAnswerScore, "overall">> = [
    "strategicThinking",
    "commercialAcumen",
    "financialJudgement",
    "leadership",
    "governance",
    "stakeholderInfluence",
    "executivePresence",
    "evidence",
  ];

  const dimensionScores = dimensions.reduce((result, dimension) => {
    result[dimension] = answers.length
      ? clamp(
          answers.reduce(
            (sum, answer) => sum + answer.feedback.score[dimension],
            0,
          ) / answers.length,
        )
      : 0;
    return result;
  }, {} as Omit<ExecutiveAnswerScore, "overall">);

  const overallScore = answers.length
    ? clamp(
        answers.reduce(
          (sum, answer) => sum + answer.feedback.score.overall,
          0,
        ) / answers.length,
      )
    : 0;

  const strongestSignals = unique(
    answers.flatMap((answer) => answer.feedback.strengths),
  ).slice(0, 8);

  const leadershipRisks = unique(
    answers.flatMap((answer) => [
      ...answer.feedback.improvements,
      ...answer.feedback.redFlags,
    ]),
  ).slice(0, 10);

  const boardReadinessRisks = [
    dimensionScores.strategicThinking < 70
      ? "Strategic answers remain too operational."
      : "",
    dimensionScores.financialJudgement < 70
      ? "Financial and capital-allocation judgement needs stronger evidence."
      : "",
    dimensionScores.governance < 70
      ? "Governance and board oversight are not consistently addressed."
      : "",
    dimensionScores.executivePresence < 70
      ? "Executive communication needs to be more concise and decisive."
      : "",
  ].filter(Boolean);

  const preparationPriorities = [
    dimensionScores.strategicThinking < 70
      ? "Prepare three-year strategic priorities and key assumptions."
      : "",
    dimensionScores.commercialAcumen < 70
      ? "Strengthen examples involving growth, margin and customer value."
      : "",
    dimensionScores.financialJudgement < 70
      ? "Practise financial-health, cash and capital-allocation discussions."
      : "",
    dimensionScores.stakeholderInfluence < 70
      ? "Prepare senior stakeholder alignment and board-influence examples."
      : "",
    dimensionScores.evidence < 70
      ? "Add measurable enterprise-level outcomes."
      : "",
  ].filter(Boolean);

  return {
    overallScore,
    dimensions: dimensionScores,
    strongestSignals,
    leadershipRisks,
    boardReadinessRisks,
    preparationPriorities,
    generatedAt: new Date().toISOString(),
  };
}
