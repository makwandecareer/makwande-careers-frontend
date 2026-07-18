export type SimulationPersona =
  | "HR Recruiter"
  | "Hiring Manager"
  | "Technical Interviewer"
  | "Executive"
  | "Panel";

export type SimulationDifficulty =
  | "Foundation"
  | "Professional"
  | "Advanced"
  | "Executive";

export type SimulationCategory =
  | "Opening"
  | "Motivation"
  | "Behavioural"
  | "Competency"
  | "Technical"
  | "Scenario"
  | "Company"
  | "Pressure"
  | "Closing";

export interface SimulationInput {
  companyName: string;
  industry: string;
  companyValues: string;
  companyPriorities: string;
  recruiterPersona: SimulationPersona;
  difficulty: SimulationDifficulty;
  totalQuestions: number;
  answerTimeLimit: number;
  includeTechnical: boolean;
  includePressure: boolean;
  includeCompanyQuestions: boolean;
  includeAdaptiveFollowUps: boolean;
}

export interface SimulationQuestion {
  id: string;
  category: SimulationCategory;
  question: string;
  interviewerIntent: string;
  idealSignals: string[];
  riskSignals: string[];
  followUps: string[];
  candidateEvidence: string[];
  scoringWeight: number;
}

export interface AnswerScore {
  communication: number;
  structure: number;
  evidence: number;
  relevance: number;
  confidence: number;
  technicalDepth: number;
  businessUnderstanding: number;
  leadership: number;
  cultureFit: number;
  overall: number;
}

export interface AnswerFeedback {
  score: AnswerScore;
  strengths: string[];
  improvements: string[];
  missedOpportunities: string[];
  detectedSignals: string[];
  suggestedRewrite: string;
  nextFollowUp: string | null;
}

export interface SimulationAnswer {
  questionId: string;
  question: string;
  answer: string;
  feedback: AnswerFeedback;
  answeredAt: string;
}

export interface SimulationReport {
  role: string;
  companyName: string;
  persona: SimulationPersona;
  difficulty: SimulationDifficulty;
  completedQuestions: number;
  overallScore: number;
  dimensionScores: Omit<AnswerScore, "overall">;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  recommendedActions: string[];
  answers: SimulationAnswer[];
  generatedAt: string;
}

type AnyRecord = Record<string, unknown>;

function record(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function splitSentences(value: string): string[] {
  return unique(
    value
      .split(/\n|•|;|\r|\.(?=\s|$)/g)
      .map((item) => item.replace(/^[-–—\s]+/, "").trim())
      .filter((item) => item.length >= 4),
  );
}

function containsAny(source: string, terms: string[]): boolean {
  const lower = source.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function candidateProfile(cvContent: unknown) {
  const cv = record(cvContent);
  const experience = array(cv.experience).map(record);

  const skills = unique(
    array(cv.skills).flatMap((item) => {
      if (typeof item === "string") return [item];
      const entry = record(item);
      return [text(entry.name), text(entry.skill_name), text(entry.title)];
    }),
  );

  const achievements = unique(
    experience.flatMap((entry) => [
      text(entry.achievements),
      text(entry.description),
      text(entry.responsibilities),
      text(entry.summary),
    ]),
  );

  const roles = unique(
    experience.flatMap((entry) => [
      text(entry.job_title),
      text(entry.position),
      text(entry.title),
      text(entry.role),
    ]),
  );

  const qualifications = unique(
    array(cv.education).flatMap((item) => {
      const entry = record(item);
      return [
        text(entry.qualification),
        text(entry.degree),
        text(entry.programme),
        text(entry.field_of_study),
      ];
    }),
  );

  return {
    skills,
    achievements,
    roles,
    qualifications,
    experienceCount: experience.length,
  };
}

function candidateEvidenceFor(
  cvContent: unknown,
  terms: string[],
): string[] {
  const profile = candidateProfile(cvContent);
  return unique([
    ...profile.achievements,
    ...profile.skills,
    ...profile.roles,
    ...profile.qualifications,
  ])
    .filter((item) =>
      terms.some((term) => item.toLowerCase().includes(term.toLowerCase())),
    )
    .slice(0, 4);
}

const COMPETENCIES = [
  {
    name: "Leadership",
    terms: ["lead", "manage", "supervise", "coach", "mentor", "team"],
    question: "Tell me about a time you had to lead people through a difficult objective or change.",
    intent: "Test leadership judgement, accountability and influence.",
  },
  {
    name: "Problem Solving",
    terms: ["problem", "analyse", "analyze", "root cause", "resolve", "decision"],
    question: "Describe a complex problem you solved when the right answer was not immediately clear.",
    intent: "Assess structured thinking, judgement and evidence-based problem solving.",
  },
  {
    name: "Customer Focus",
    terms: ["customer", "client", "service", "stakeholder"],
    question: "Give an example of how you improved an outcome for a customer or important stakeholder.",
    intent: "Test whether the candidate understands needs, expectations and value creation.",
  },
  {
    name: "Collaboration",
    terms: ["collaborate", "cross-functional", "liaise", "stakeholder", "team"],
    question: "Tell me about a time you achieved a result through people who did not report to you.",
    intent: "Assess influence, communication and cross-functional execution.",
  },
  {
    name: "Operational Excellence",
    terms: ["process", "quality", "efficiency", "operation", "delivery"],
    question: "Describe a process you improved and explain the measurable impact.",
    intent: "Test practical improvement capability and result orientation.",
  },
  {
    name: "Risk & Compliance",
    terms: ["risk", "compliance", "safety", "audit", "policy", "control"],
    question: "Tell me about a time you identified a serious risk before it became a larger problem.",
    intent: "Assess integrity, escalation judgement and control awareness.",
  },
  {
    name: "Commercial Awareness",
    terms: ["budget", "cost", "revenue", "profit", "commercial", "market"],
    question: "Describe a decision you made that improved cost, revenue or commercial performance.",
    intent: "Test whether the candidate connects work to measurable business outcomes.",
  },
  {
    name: "Adaptability",
    terms: ["change", "adapt", "learn", "transformation", "innovation"],
    question: "Tell me about a time you had to adapt quickly to a major change.",
    intent: "Assess learning agility, resilience and effectiveness under uncertainty.",
  },
];

function jobSignals(jobDescription: string): string[] {
  return splitSentences(jobDescription)
    .filter((item) =>
      containsAny(item, [
        "experience",
        "skill",
        "knowledge",
        "manage",
        "deliver",
        "develop",
        "ensure",
        "responsible",
        "ability",
      ]),
    )
    .slice(0, 10);
}

function buildQuestion(
  id: string,
  category: SimulationCategory,
  question: string,
  interviewerIntent: string,
  candidateEvidence: string[],
  followUps: string[],
  scoringWeight: number,
): SimulationQuestion {
  return {
    id,
    category,
    question,
    interviewerIntent,
    candidateEvidence,
    idealSignals: [
      "Direct answer to the question",
      "Specific context",
      "Clear personal responsibility",
      "Logical actions",
      "Measured result",
      "Relevant reflection or lesson",
    ],
    riskSignals: [
      "Generic or hypothetical response",
      "No clear personal contribution",
      "Weak connection to the role",
      "No evidence or outcome",
      "Excessive blame or negativity",
    ],
    followUps,
    scoringWeight,
  };
}

export function createSimulationQuestions(
  input: SimulationInput,
  targetRole: string,
  jobDescription: string,
  cvContent: unknown,
): SimulationQuestion[] {
  const role = targetRole.trim() || "Target Role";
  const company = input.companyName.trim();
  const source = `${jobDescription} ${input.companyValues} ${input.companyPriorities}`.toLowerCase();
  const questions: SimulationQuestion[] = [];

  questions.push(
    buildQuestion(
      "opening-1",
      "Opening",
      `Please introduce yourself and explain why your background is relevant to the ${role} position.`,
      "Assess communication, relevance and professional narrative.",
      candidateEvidenceFor(cvContent, ["experience", "qualification", "skill"]),
      [
        "Which part of your background is most relevant?",
        "What achievement best represents your capability?",
      ],
      8,
    ),
  );

  questions.push(
    buildQuestion(
      "motivation-1",
      "Motivation",
      `Why are you interested in this ${role} opportunity${company ? ` at ${company}` : ""}?`,
      "Assess motivation, research quality and career alignment.",
      [],
      [
        "Why now?",
        "What would make this role the right next step?",
      ],
      8,
    ),
  );

  const competencyMatches = COMPETENCIES.map((item) => ({
    ...item,
    hits: item.terms.filter((term) => source.includes(term)).length,
  }))
    .sort((left, right) => right.hits - left.hits)
    .filter((item) => item.hits > 0);

  const selectedCompetencies = (
    competencyMatches.length ? competencyMatches : COMPETENCIES.slice(0, 5)
  ).slice(0, 5);

  selectedCompetencies.forEach((item, index) => {
    questions.push(
      buildQuestion(
        `competency-${index + 1}`,
        index % 2 === 0 ? "Competency" : "Behavioural",
        item.question,
        item.intent,
        candidateEvidenceFor(cvContent, item.terms),
        [
          "What was the most difficult decision you made?",
          "What would you do differently now?",
          "How did you measure success?",
        ],
        11,
      ),
    );
  });

  jobSignals(jobDescription).slice(0, 4).forEach((requirement, index) => {
    questions.push(
      buildQuestion(
        `requirement-${index + 1}`,
        "Competency",
        `The role requires: "${requirement}". Which experience from your background provides the strongest evidence that you can deliver this?`,
        "Validate direct evidence against a stated requirement.",
        candidateEvidenceFor(
          cvContent,
          requirement
            .toLowerCase()
            .split(/\W+/)
            .filter((word) => word.length >= 5),
        ),
        [
          "How recent is this experience?",
          "What was the scale and complexity?",
          "What result did you personally influence?",
        ],
        11,
      ),
    );
  });

  if (input.includeTechnical) {
    const profile = candidateProfile(cvContent);
    const matchedSkills = profile.skills.filter((skill) =>
      jobDescription.toLowerCase().includes(skill.toLowerCase()),
    );

    unique(matchedSkills).slice(0, 4).forEach((skill, index) => {
      questions.push(
        buildQuestion(
          `technical-${index + 1}`,
          "Technical",
          `Explain your practical experience with ${skill}. How have you used it to produce a business or operational result?`,
          "Test practical depth, credibility and ability to connect technical work to outcomes.",
          candidateEvidenceFor(cvContent, [skill]),
          [
            "What alternatives did you consider?",
            "What went wrong and how did you correct it?",
            "How would you apply this in the target role?",
          ],
          13,
        ),
      );
    });
  }

  const scenarioSource = `${jobDescription} ${input.companyPriorities}`.toLowerCase();

  if (containsAny(scenarioSource, ["customer", "client", "service"])) {
    questions.push(
      buildQuestion(
        "scenario-customer",
        "Scenario",
        `A major customer is dissatisfied, the team disputes responsibility and the issue is escalating. As the ${role}, how would you respond?`,
        "Test customer judgement, escalation and accountability.",
        [],
        [
          "What would you do in the first hour?",
          "How would you prevent recurrence?",
        ],
        13,
      ),
    );
  }

  if (containsAny(scenarioSource, ["project", "deadline", "delivery", "programme"])) {
    questions.push(
      buildQuestion(
        "scenario-delivery",
        "Scenario",
        "A critical delivery is behind schedule, resources are limited and senior stakeholders expect immediate recovery. What would you do?",
        "Test recovery planning, prioritisation and stakeholder communication.",
        [],
        [
          "Which trade-off would you make first?",
          "How would you communicate bad news?",
        ],
        13,
      ),
    );
  }

  if (containsAny(scenarioSource, ["risk", "safety", "quality", "compliance"])) {
    questions.push(
      buildQuestion(
        "scenario-risk",
        "Scenario",
        "You discover a serious safety, quality or compliance weakness shortly before an important deadline. What would you do?",
        "Test integrity, risk judgement and escalation.",
        [],
        [
          "Who would you involve first?",
          "Would you stop the work?",
        ],
        13,
      ),
    );
  }

  if (!questions.some((item) => item.category === "Scenario")) {
    questions.push(
      buildQuestion(
        "scenario-general",
        "Scenario",
        `You join as the ${role} and discover unclear priorities, inconsistent processes and conflicting stakeholder expectations. What would your first 30 days look like?`,
        "Test diagnosis, prioritisation and structured onboarding.",
        [],
        [
          "Who would you meet first?",
          "What would you measure?",
        ],
        12,
      ),
    );
  }

  if (input.includeCompanyQuestions) {
    questions.push(
      buildQuestion(
        "company-1",
        "Company",
        `What do you understand about ${company || "our organisation"}, and how would you contribute as a ${role}?`,
        "Distinguish serious research from generic interest.",
        [],
        [
          "Which company priority interests you most?",
          "Which challenge do you think the organisation must solve?",
        ],
        10,
      ),
    );

    if (input.companyValues.trim()) {
      questions.push(
        buildQuestion(
          "company-2",
          "Company",
          `Our stated values include: ${input.companyValues}. Which value best reflects how you work, and what evidence supports that?`,
          "Assess evidence-based culture alignment.",
          [],
          [
            "Which value would challenge you most?",
            "How have you handled a values conflict?",
          ],
          10,
        ),
      );
    }
  }

  if (input.includePressure) {
    questions.push(
      buildQuestion(
        "pressure-1",
        "Pressure",
        `Why should we choose you over another strong candidate for this ${role} position?`,
        "Test differentiation, confidence and concise evidence.",
        [],
        [
          "What is the strongest evidence for that claim?",
          "What is the biggest risk in hiring you?",
        ],
        9,
      ),
    );

    questions.push(
      buildQuestion(
        "pressure-2",
        "Pressure",
        `Which requirement for this ${role} position is your weakest, and why should that not prevent us from hiring you?`,
        "Test self-awareness, honesty and development planning.",
        [],
        [
          "What are you doing about it now?",
          "How quickly can you close the gap?",
        ],
        9,
      ),
    );
  }

  questions.push(
    buildQuestion(
      "closing-1",
      "Closing",
      `What questions would you like to ask us about the ${role} opportunity?`,
      "Assess preparation, judgement and seriousness.",
      [],
      ["Is there anything else you would like us to know?"],
      7,
    ),
  );

  const requested = Math.max(6, Math.min(20, Math.round(input.totalQuestions)));
  const opening = questions.filter((item) =>
    ["Opening", "Motivation"].includes(item.category),
  );
  const closing = questions.find((item) => item.category === "Closing");
  const middle = questions.filter(
    (item) =>
      !opening.some((openingQuestion) => openingQuestion.id === item.id) &&
      item.id !== closing?.id,
  );

  const selected: SimulationQuestion[] = [...opening];
  while (selected.length < requested - 1 && middle.length) {
    selected.push(middle.shift() as SimulationQuestion);
  }
  if (closing && selected.length < requested) selected.push(closing);

  return selected.slice(0, requested).map((item) => ({
    ...item,
    followUps: input.includeAdaptiveFollowUps ? item.followUps : [],
  }));
}

function countMatches(answer: string, patterns: string[]): number {
  const lower = answer.toLowerCase();
  return patterns.filter((pattern) => lower.includes(pattern)).length;
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(value: string): number {
  return value
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function hasNumbers(value: string): boolean {
  return /\b\d+([.,]\d+)?%?\b/.test(value);
}

function makeSuggestedRewrite(
  question: SimulationQuestion,
  answer: string,
  evidence: string[],
): string {
  const firstEvidence = evidence[0] || "a relevant professional example";
  const resultPrompt = hasNumbers(answer)
    ? "Retain the measurable outcome already included."
    : "Add a measurable result such as time saved, revenue protected, quality improved or risk reduced.";

  return [
    `Start with a direct one-sentence answer to: "${question.question}"`,
    `Use ${firstEvidence} as the core example.`,
    "Explain the situation and your individual responsibility.",
    "Describe two or three specific actions and the judgement behind them.",
    resultPrompt,
    "End by connecting the lesson to the target role and company.",
  ].join(" ");
}

export function evaluateSimulationAnswer(
  question: SimulationQuestion,
  answer: string,
  targetRole: string,
  jobDescription: string,
  companyValues: string,
): AnswerFeedback {
  const trimmed = answer.trim();
  const words = wordCount(trimmed);
  const sentences = sentenceCount(trimmed);
  const lower = trimmed.toLowerCase();

  const actionMatches = countMatches(lower, [
    "i led",
    "i managed",
    "i developed",
    "i created",
    "i implemented",
    "i analysed",
    "i analyzed",
    "i resolved",
    "i improved",
    "i delivered",
    "i decided",
  ]);

  const resultMatches = countMatches(lower, [
    "result",
    "outcome",
    "increased",
    "reduced",
    "improved",
    "saved",
    "achieved",
    "completed",
    "delivered",
  ]);

  const structureMatches = countMatches(lower, [
    "situation",
    "task",
    "action",
    "result",
    "reflection",
    "first",
    "then",
    "finally",
  ]);

  const confidencePenalty = countMatches(lower, [
    "maybe",
    "i think i could",
    "probably",
    "i guess",
    "not sure",
  ]);

  const roleTerms = unique(
    `${targetRole} ${jobDescription}`
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5),
  ).slice(0, 40);

  const relevanceMatches = roleTerms.filter((term) => lower.includes(term)).length;
  const evidenceMatches = question.candidateEvidence.filter((item) =>
    item
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5)
      .some((word) => lower.includes(word)),
  ).length;

  const communication = clamp(
    35 +
      Math.min(words, 180) * 0.22 +
      Math.min(sentences, 10) * 2 -
      Math.max(0, words - 260) * 0.08,
  );

  const structure = clamp(
    30 +
      structureMatches * 9 +
      (words >= 70 ? 12 : 0) +
      (sentences >= 4 ? 8 : 0),
  );

  const evidenceScore = clamp(
    28 +
      actionMatches * 9 +
      resultMatches * 7 +
      evidenceMatches * 8 +
      (hasNumbers(trimmed) ? 18 : 0),
  );

  const relevance = clamp(
    38 +
      relevanceMatches * 3 +
      (lower.includes(targetRole.toLowerCase()) ? 10 : 0),
  );

  const confidence = clamp(
    60 +
      actionMatches * 4 +
      (words >= 60 ? 10 : 0) -
      confidencePenalty * 12,
  );

  const technicalDepth = clamp(
    35 +
      (question.category === "Technical" ? relevanceMatches * 4 : relevanceMatches * 2) +
      countMatches(lower, ["because", "trade-off", "risk", "method", "system", "process"]) * 6,
  );

  const businessUnderstanding = clamp(
    35 +
      countMatches(lower, [
        "customer",
        "cost",
        "revenue",
        "quality",
        "risk",
        "productivity",
        "stakeholder",
        "business",
        "performance",
      ]) *
        7 +
      (hasNumbers(trimmed) ? 8 : 0),
  );

  const leadership = clamp(
    35 +
      countMatches(lower, [
        "team",
        "stakeholder",
        "delegate",
        "coach",
        "influence",
        "communicate",
        "accountable",
        "decision",
      ]) *
        6,
  );

  const valueTerms = unique(
    companyValues
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5),
  );

  const cultureFit = clamp(
    40 +
      valueTerms.filter((term) => lower.includes(term)).length * 8 +
      countMatches(lower, [
        "integrity",
        "collaboration",
        "customer",
        "safety",
        "respect",
        "innovation",
        "accountability",
      ]) *
        5,
  );

  const weights = {
    communication: 0.13,
    structure: 0.15,
    evidence: 0.18,
    relevance: 0.16,
    confidence: 0.1,
    technicalDepth: question.category === "Technical" ? 0.13 : 0.07,
    businessUnderstanding: 0.1,
    leadership: 0.06,
    cultureFit: 0.05,
  };

  const overall = clamp(
    communication * weights.communication +
      structure * weights.structure +
      evidenceScore * weights.evidence +
      relevance * weights.relevance +
      confidence * weights.confidence +
      technicalDepth * weights.technicalDepth +
      businessUnderstanding * weights.businessUnderstanding +
      leadership * weights.leadership +
      cultureFit * weights.cultureFit,
  );

  const score: AnswerScore = {
    communication,
    structure,
    evidence: evidenceScore,
    relevance,
    confidence,
    technicalDepth,
    businessUnderstanding,
    leadership,
    cultureFit,
    overall,
  };

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missedOpportunities: string[] = [];
  const detectedSignals: string[] = [];

  if (communication >= 70) strengths.push("Clear and sufficiently developed response.");
  else improvements.push("Improve clarity and answer length without becoming repetitive.");

  if (structure >= 70) strengths.push("The answer shows a logical structure.");
  else improvements.push("Use STAR or STARR more explicitly.");

  if (evidenceScore >= 70) strengths.push("Good use of specific actions and evidence.");
  else improvements.push("Add a real example, personal actions and a measurable result.");

  if (relevance >= 70) strengths.push("Strong connection to the target role.");
  else improvements.push("Connect the example more directly to the target role and job requirements.");

  if (confidence >= 70) strengths.push("Confident and ownership-focused language.");
  else improvements.push("Replace hesitant language with clear, evidence-based statements.");

  if (!hasNumbers(trimmed)) {
    missedOpportunities.push("No measurable result or scale was detected.");
  }

  if (actionMatches === 0) {
    missedOpportunities.push("The answer does not clearly show what you personally did.");
  }

  if (resultMatches === 0) {
    missedOpportunities.push("The outcome is unclear.");
  }

  if (words < 45) {
    missedOpportunities.push("The answer may be too brief for a strong interview response.");
  }

  if (question.candidateEvidence.length && evidenceMatches === 0) {
    missedOpportunities.push("Available CV evidence was not used.");
  }

  if (structureMatches > 0) detectedSignals.push("Structured answer language detected.");
  if (actionMatches > 0) detectedSignals.push("Personal ownership language detected.");
  if (resultMatches > 0) detectedSignals.push("Outcome language detected.");
  if (hasNumbers(trimmed)) detectedSignals.push("Quantified evidence detected.");
  if (relevanceMatches > 2) detectedSignals.push("Role-specific language detected.");

  let nextFollowUp: string | null = null;
  if (question.followUps.length) {
    if (!hasNumbers(trimmed)) {
      nextFollowUp =
        question.followUps.find((item) =>
          containsAny(item, ["measure", "result", "scale"]),
        ) || question.followUps[0];
    } else if (actionMatches === 0) {
      nextFollowUp =
        question.followUps.find((item) =>
          containsAny(item, ["you", "personally", "decision"]),
        ) || question.followUps[0];
    } else {
      nextFollowUp = question.followUps[0];
    }
  }

  return {
    score,
    strengths: unique(strengths),
    improvements: unique(improvements),
    missedOpportunities: unique(missedOpportunities),
    detectedSignals: unique(detectedSignals),
    suggestedRewrite: makeSuggestedRewrite(
      question,
      trimmed,
      question.candidateEvidence,
    ),
    nextFollowUp,
  };
}

export function createSimulationReport(
  input: SimulationInput,
  targetRole: string,
  answers: SimulationAnswer[],
): SimulationReport {
  const dimensions: Array<keyof Omit<AnswerScore, "overall">> = [
    "communication",
    "structure",
    "evidence",
    "relevance",
    "confidence",
    "technicalDepth",
    "businessUnderstanding",
    "leadership",
    "cultureFit",
  ];

  const dimensionScores = dimensions.reduce(
    (accumulator, dimension) => {
      const average = answers.length
        ? answers.reduce(
            (sum, answer) => sum + answer.feedback.score[dimension],
            0,
          ) / answers.length
        : 0;

      accumulator[dimension] = clamp(average);
      return accumulator;
    },
    {} as Omit<AnswerScore, "overall">,
  );

  const overallScore = answers.length
    ? clamp(
        answers.reduce(
          (sum, answer) => sum + answer.feedback.score.overall,
          0,
        ) / answers.length,
      )
    : 0;

  const strengths = unique(
    answers.flatMap((answer) => answer.feedback.strengths),
  ).slice(0, 8);

  const weaknesses = unique(
    answers.flatMap((answer) => answer.feedback.improvements),
  ).slice(0, 8);

  const missedOpportunities = unique(
    answers.flatMap((answer) => answer.feedback.missedOpportunities),
  ).slice(0, 10);

  const recommendedActions = [
    dimensionScores.structure < 70
      ? "Practise answering behavioural questions using STAR or STARR."
      : "",
    dimensionScores.evidence < 70
      ? "Prepare at least six quantified career examples."
      : "",
    dimensionScores.relevance < 70
      ? "Map each interview example directly to a job requirement."
      : "",
    dimensionScores.confidence < 70
      ? "Practise concise ownership language and remove hesitant phrases."
      : "",
    dimensionScores.technicalDepth < 70
      ? "Prepare deeper explanations of tools, methods, decisions and trade-offs."
      : "",
    dimensionScores.businessUnderstanding < 70
      ? "Connect technical and operational work to cost, customer, risk, quality or growth."
      : "",
    dimensionScores.cultureFit < 70
      ? "Research the company's values and prepare evidence for each important behaviour."
      : "",
  ].filter(Boolean);

  return {
    role: targetRole.trim() || "Target Role",
    companyName: input.companyName.trim() || "Target company",
    persona: input.recruiterPersona,
    difficulty: input.difficulty,
    completedQuestions: answers.length,
    overallScore,
    dimensionScores,
    strengths,
    weaknesses,
    missedOpportunities,
    recommendedActions,
    answers,
    generatedAt: new Date().toISOString(),
  };
}
