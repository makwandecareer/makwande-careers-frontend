export type PressureLevel = "Controlled" | "Challenging" | "Intense" | "Executive";

export type PressureQuestionType =
  | "Rapid Fire"
  | "Challenge"
  | "Objection"
  | "Contradiction"
  | "Failure"
  | "Accountability"
  | "Ambiguity"
  | "Conflict"
  | "Ethics"
  | "Resilience"
  | "Decision Under Pressure"
  | "Consistency Check";

export interface PressureInterviewInput {
  targetRole: string;
  jobDescription: string;
  companyName: string;
  pressureLevel: PressureLevel;
  questionCount: number;
  includeRapidFire: boolean;
  includeContradictions: boolean;
  includeEthics: boolean;
  includeFailure: boolean;
  includeConflict: boolean;
  includeConsistencyChecks: boolean;
}

export interface PressureQuestion {
  id: string;
  type: PressureQuestionType;
  question: string;
  interviewerIntent: string;
  pressureTactic: string;
  strongSignals: string[];
  redFlags: string[];
  followUps: string[];
  scoringWeight: number;
}

export interface PressureAnswerScore {
  composure: number;
  clarity: number;
  ownership: number;
  consistency: number;
  judgement: number;
  evidence: number;
  resilience: number;
  overall: number;
}

export interface PressureAnswerFeedback {
  score: PressureAnswerScore;
  strengths: string[];
  improvements: string[];
  redFlags: string[];
  credibilityChecks: string[];
  adaptiveFollowUp: string | null;
  coachingNote: string;
}

export interface PressureInterviewAnswer {
  questionId: string;
  answer: string;
  feedback: PressureAnswerFeedback;
}

export interface PressureInterviewReport {
  overallScore: number;
  dimensions: Omit<PressureAnswerScore, "overall">;
  strongestSignals: string[];
  riskAreas: string[];
  consistencyRisks: string[];
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

function baseQuestions(input: PressureInterviewInput): PressureQuestion[] {
  const role = input.targetRole || "this role";
  const company = input.companyName || "our organisation";
  const questions: PressureQuestion[] = [];

  function add(
    type: PressureQuestionType,
    question: string,
    interviewerIntent: string,
    pressureTactic: string,
    followUps: string[],
    scoringWeight: number,
  ): void {
    questions.push({
      id: `pressure-${questions.length + 1}`,
      type,
      question,
      interviewerIntent,
      pressureTactic,
      strongSignals: [
        "Calm and direct response",
        "Clear personal ownership",
        "Specific evidence",
        "Balanced judgement",
        "No hostility or defensiveness",
        "Consistent facts and chronology",
      ],
      redFlags: [
        "Blaming others",
        "Avoiding the question",
        "Contradicting previous claims",
        "Aggressive or defensive tone",
        "Unsupported certainty",
        "No measurable evidence",
      ],
      followUps,
      scoringWeight,
    });
  }

  add(
    "Challenge",
    `Why should we believe you are ready for ${role} when other candidates may have stronger direct experience?`,
    "Test confidence without arrogance and the ability to defend fit with evidence.",
    "Direct challenge to credibility and comparative value.",
    [
      "What is your strongest proof?",
      "Which requirement are you weakest against?",
      "Why should we take that risk?",
    ],
    14,
  );

  add(
    "Accountability",
    "Tell me about a result that was below expectation. What part of the failure was personally yours?",
    "Test accountability, honesty and learning under discomfort.",
    "Removes the option to hide behind the team.",
    [
      "What did you do too late?",
      "What would your manager say you got wrong?",
      "What did you change afterwards?",
    ],
    14,
  );

  add(
    "Objection",
    `Your CV sounds impressive, but some of the claims are broad. Which achievement can you prove most clearly?`,
    "Test evidence quality and resistance to vague self-promotion.",
    "Challenges the credibility of the CV.",
    [
      "Who could verify it?",
      "What was the exact baseline?",
      "What was your personal contribution?",
    ],
    13,
  );

  add(
    "Decision Under Pressure",
    `A critical decision must be made today, but the information is incomplete and stakeholders disagree. What do you do?`,
    "Assess decision quality, risk control and communication under time pressure.",
    "Forces action without complete certainty.",
    [
      "What would make you delay?",
      "Who has final authority?",
      "How would you communicate the risk?",
    ],
    15,
  );

  add(
    "Ambiguity",
    `You join ${company} and discover that priorities change weekly. How would you remain effective without waiting for perfect clarity?`,
    "Test adaptability, prioritisation and ownership in ambiguity.",
    "Creates uncertainty and shifting expectations.",
    [
      "What would you document?",
      "How would you protect delivery?",
      "When would you escalate?",
    ],
    11,
  );

  add(
    "Resilience",
    "Describe a time when your work was criticised publicly or rejected. How did you respond in the moment?",
    "Test emotional control, professionalism and recovery.",
    "Introduces embarrassment and personal challenge.",
    [
      "What did you say immediately?",
      "Was the criticism fair?",
      "How did the relationship change afterwards?",
    ],
    12,
  );

  if (input.includeConflict) {
    add(
      "Conflict",
      "A senior stakeholder dismisses your recommendation and questions your competence in front of others. What do you do?",
      "Assess conflict management, confidence and respect for hierarchy.",
      "Combines status pressure with public disagreement.",
      [
        "Would you challenge them in the room?",
        "What evidence would you use?",
        "How would you preserve the relationship?",
      ],
      13,
    );
  }

  if (input.includeFailure) {
    add(
      "Failure",
      "What is the most serious professional mistake you have made, and why should it not concern us now?",
      "Test honesty, accountability and proof of changed behaviour.",
      "Frames past failure as a current hiring risk.",
      [
        "What was the consequence?",
        "Who was affected?",
        "What control prevents repetition?",
      ],
      14,
    );
  }

  if (input.includeEthics) {
    add(
      "Ethics",
      "A manager asks you to present incomplete information in a way that makes performance look better. What do you do?",
      "Assess ethical judgement, courage and escalation discipline.",
      "Creates pressure from authority and potential career risk.",
      [
        "What if refusing damages your career?",
        "Who would you involve?",
        "How would you document the issue?",
      ],
      15,
    );
  }

  if (input.includeContradictions) {
    add(
      "Contradiction",
      "You say you are collaborative, but your example suggests you made the key decision alone. Which description is accurate?",
      "Test consistency, nuance and the ability to correct an oversimplified claim.",
      "Introduces an apparent contradiction.",
      [
        "Who did you consult?",
        "What decision remained yours?",
        "Why did collaboration not slow delivery?",
      ],
      12,
    );
  }

  if (input.includeConsistencyChecks) {
    add(
      "Consistency Check",
      "Earlier you described yourself as highly detail-oriented. Tell me about a preventable detail you missed.",
      "Test whether positive claims remain credible under counter-evidence.",
      "Challenges a stated strength with contradictory evidence.",
      [
        "How was it discovered?",
        "What was the impact?",
        "What system did you introduce afterwards?",
      ],
      12,
    );
  }

  if (input.includeRapidFire) {
    [
      "What is your biggest professional weakness?",
      "Why did you leave your last role?",
      "What would your former manager criticise?",
      "What salary do you believe you are worth?",
      "What have you failed to learn quickly enough?",
      "Which part of this role concerns you most?",
      "What decision do you regret?",
      "Why might we reject you?",
    ].forEach((question) =>
      add(
        "Rapid Fire",
        question,
        "Test concise thinking and composure under fast questioning.",
        "Minimal preparation time and direct wording.",
        [
          "Give one example.",
          "What is the evidence?",
          "What changed afterwards?",
        ],
        9,
      ),
    );
  }

  return questions;
}

export function buildPressureInterview(input: PressureInterviewInput): {
  questions: PressureQuestion[];
  intensityScore: number;
  pressureProfile: string[];
} {
  const pool = baseQuestions(input);
  const levelMultiplier = {
    Controlled: 0.82,
    Challenging: 1,
    Intense: 1.12,
    Executive: 1.2,
  }[input.pressureLevel];

  const count = Math.max(6, Math.min(40, Math.round(input.questionCount)));
  const questions = pool
    .map((question) => ({
      ...question,
      scoringWeight: clamp(question.scoringWeight * levelMultiplier),
    }))
    .sort((left, right) => right.scoringWeight - left.scoringWeight)
    .slice(0, count)
    .map((question, index) => ({
      ...question,
      id: `pressure-${index + 1}`,
    }));

  const intensityScore = clamp(
    45 +
      questions.length * 1.6 +
      (input.pressureLevel === "Intense" ? 14 : 0) +
      (input.pressureLevel === "Executive" ? 20 : 0),
  );

  const pressureProfile = [
    input.includeRapidFire ? "Rapid-fire questioning" : "",
    input.includeContradictions ? "Contradiction testing" : "",
    input.includeFailure ? "Failure and accountability pressure" : "",
    input.includeEthics ? "Ethical judgement pressure" : "",
    input.includeConflict ? "Conflict and stakeholder pressure" : "",
    input.includeConsistencyChecks ? "Cross-answer consistency checks" : "",
  ].filter(Boolean);

  return { questions, intensityScore, pressureProfile };
}

export function scorePressureAnswer(
  question: PressureQuestion,
  answer: string,
  previousAnswers: PressureInterviewAnswer[],
): PressureAnswerFeedback {
  const value = answer.trim();
  const lower = value.toLowerCase();
  const words = wordCount(value);

  const ownershipMatches = countMatches(lower, [
    "i decided", "i led", "i was responsible", "my mistake", "i should have",
    "i changed", "i learned", "i escalated", "i communicated",
  ]);

  const composureMatches = countMatches(lower, [
    "first", "calmly", "professionally", "clarify", "listen", "acknowledge",
    "separate the issue", "focus on facts",
  ]);

  const judgementMatches = countMatches(lower, [
    "risk", "priority", "trade-off", "evidence", "stakeholder", "escalate",
    "document", "alternative", "impact", "decision",
  ]);

  const evidenceMatches = countMatches(lower, [
    "result", "measured", "improved", "reduced", "increased", "verified",
    "report", "kpi", "feedback", "reference",
  ]);

  const resilienceMatches = countMatches(lower, [
    "learned", "recovered", "adapted", "improved", "changed", "feedback",
    "reflection", "next time", "afterwards",
  ]);

  const defensiveMatches = countMatches(lower, [
    "not my fault", "they failed", "everyone else", "unfair", "their problem",
    "i did nothing wrong", "always", "never",
  ]);

  const repeatedClaims = previousAnswers
    .flatMap((item) => item.answer.toLowerCase().split(/\W+/))
    .filter((word) => word.length >= 7 && lower.includes(word)).length;

  const composure = clamp(
    42 +
      composureMatches * 7 +
      (words >= 50 && words <= 220 ? 12 : 0) -
      defensiveMatches * 10,
  );
  const clarity = clamp(
    38 +
      Math.min(words, 180) * 0.18 +
      countMatches(lower, ["first", "second", "then", "finally", "because"]) * 5,
  );
  const ownership = clamp(30 + ownershipMatches * 12 - defensiveMatches * 8);
  const consistency = clamp(
    48 +
      Math.min(repeatedClaims, 8) * 3 -
      countMatches(lower, ["maybe", "i think", "probably", "approximately"]) * 4,
  );
  const judgement = clamp(32 + judgementMatches * 8);
  const evidence = clamp(
    28 + evidenceMatches * 8 + (hasNumber(value) ? 20 : 0),
  );
  const resilience = clamp(34 + resilienceMatches * 9);

  const overall = clamp(
    composure * 0.18 +
      clarity * 0.12 +
      ownership * 0.16 +
      consistency * 0.14 +
      judgement * 0.17 +
      evidence * 0.11 +
      resilience * 0.12,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  const redFlags: string[] = [];
  const credibilityChecks: string[] = [];

  if (composure >= 72) strengths.push("The response remains calm and professional.");
  else improvements.push("Slow the response down and answer the challenge directly.");

  if (ownership >= 70) strengths.push("Personal accountability is clear.");
  else improvements.push("State what was personally yours without blaming others.");

  if (judgement >= 70) strengths.push("The answer demonstrates balanced judgement.");
  else improvements.push("Explain the risks, options and decision criteria.");

  if (evidence >= 68) strengths.push("The answer includes useful supporting evidence.");
  else improvements.push("Add a concrete example, result or verification method.");

  if (resilience < 65) {
    improvements.push("Explain how you recovered, changed behaviour or prevented repetition.");
  }

  if (defensiveMatches > 0) redFlags.push("Defensive or blame-oriented language was detected.");
  if (words < 40) redFlags.push("The answer may be too brief for a pressure follow-up.");
  if (words > 260) redFlags.push("The answer may become less credible because it is overly long.");
  if (!/\bI\b/.test(value)) redFlags.push("Personal ownership is unclear.");
  if (!hasNumber(value)) {
    credibilityChecks.push("Be ready to provide scale, timing or measurable impact.");
  }
  credibilityChecks.push("Keep dates, scope and responsibility consistent with earlier answers.");

  const adaptiveFollowUp =
    defensiveMatches > 0
      ? "Remove blame from the answer. What part was personally yours?"
      : ownershipMatches === 0
        ? "What did you personally decide or do?"
        : evidenceMatches === 0
          ? "What evidence proves that this response produced a good outcome?"
          : question.followUps[0] || null;

  return {
    score: {
      composure,
      clarity,
      ownership,
      consistency,
      judgement,
      evidence,
      resilience,
      overall,
    },
    strengths: unique(strengths),
    improvements: unique(improvements),
    redFlags: unique(redFlags),
    credibilityChecks: unique(credibilityChecks),
    adaptiveFollowUp,
    coachingNote:
      "Pause briefly, acknowledge the challenge, answer directly, take ownership, provide evidence and close with what changed. Do not argue with the interviewer.",
  };
}

export function buildPressureInterviewReport(
  answers: PressureInterviewAnswer[],
): PressureInterviewReport {
  const dimensions: Array<keyof Omit<PressureAnswerScore, "overall">> = [
    "composure",
    "clarity",
    "ownership",
    "consistency",
    "judgement",
    "evidence",
    "resilience",
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
  }, {} as Omit<PressureAnswerScore, "overall">);

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

  const riskAreas = unique(
    answers.flatMap((answer) => [
      ...answer.feedback.redFlags,
      ...answer.feedback.improvements,
    ]),
  ).slice(0, 10);

  const consistencyRisks = unique(
    answers.flatMap((answer) => answer.feedback.credibilityChecks),
  ).slice(0, 8);

  const preparationPriorities = [
    dimensionScores.composure < 70
      ? "Practise pausing and answering challenges without defensiveness."
      : "",
    dimensionScores.ownership < 70
      ? "Strengthen personal accountability in difficult examples."
      : "",
    dimensionScores.consistency < 70
      ? "Check chronology, scope and repeated claims across answers."
      : "",
    dimensionScores.judgement < 70
      ? "Explain options, risks and decision criteria more clearly."
      : "",
    dimensionScores.evidence < 70
      ? "Prepare measurable and reference-ready proof."
      : "",
    dimensionScores.resilience < 70
      ? "Prepare stronger recovery and learning examples."
      : "",
  ].filter(Boolean);

  return {
    overallScore,
    dimensions: dimensionScores,
    strongestSignals,
    riskAreas,
    consistencyRisks,
    preparationPriorities,
    generatedAt: new Date().toISOString(),
  };
}
