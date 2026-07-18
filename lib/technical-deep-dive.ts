export type TechnicalQuestionCategory =
  | "Core Knowledge"
  | "Applied Practice"
  | "Troubleshooting"
  | "Architecture & Design"
  | "Tools & Systems"
  | "Quality & Standards"
  | "Security & Risk"
  | "Performance"
  | "Scenario"
  | "Trade-offs"
  | "Technical Leadership"
  | "Evidence Verification";

export type TechnicalDifficulty =
  | "Foundation"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export interface TechnicalDeepDiveInput {
  targetRole: string;
  jobDescription: string;
  companyName: string;
  difficulty: TechnicalDifficulty;
  questionCount: number;
  includeScenarios: boolean;
  includeTroubleshooting: boolean;
  includeArchitecture: boolean;
  includeSecurityRisk: boolean;
  includeLeadership: boolean;
  includeEvidenceVerification: boolean;
}

export interface TechnicalSkillProfile {
  name: string;
  source: "CV" | "Job Specification" | "Both";
  cvEvidence: string[];
  jobEvidence: string[];
  confidence: number;
  relevance: number;
  depthSignal: number;
  riskFlags: string[];
}

export interface TechnicalQuestion {
  id: string;
  skill: string;
  category: TechnicalQuestionCategory;
  difficulty: TechnicalDifficulty;
  question: string;
  interviewerIntent: string;
  expectedConcepts: string[];
  practicalEvidence: string[];
  strongSignals: string[];
  redFlags: string[];
  followUps: string[];
  scoringWeight: number;
}

export interface TechnicalAnswerScore {
  accuracy: number;
  depth: number;
  practicalApplication: number;
  troubleshooting: number;
  tradeOffReasoning: number;
  communication: number;
  evidence: number;
  overall: number;
}

export interface TechnicalAnswerFeedback {
  score: TechnicalAnswerScore;
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  redFlags: string[];
  suggestedStructure: string;
  adaptiveFollowUp: string | null;
}

export interface TechnicalInterviewAnswer {
  questionId: string;
  answer: string;
  feedback: TechnicalAnswerFeedback;
}

export interface TechnicalDeepDiveReport {
  overallScore: number;
  dimensions: Omit<TechnicalAnswerScore, "overall">;
  skillScores: Array<{
    skill: string;
    score: number;
    answerCount: number;
  }>;
  strongestSkills: string[];
  technicalGaps: string[];
  riskAreas: string[];
  preparationPriorities: string[];
  generatedAt: string;
}

type AnyRecord = Record<string, unknown>;

const TECHNICAL_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "java",
  "c#",
  ".net",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "google cloud",
  "docker",
  "kubernetes",
  "terraform",
  "git",
  "github",
  "ci/cd",
  "rest api",
  "graphql",
  "microservices",
  "system design",
  "data analysis",
  "power bi",
  "excel",
  "sap",
  "salesforce",
  "cybersecurity",
  "networking",
  "linux",
  "windows server",
  "cloud computing",
  "machine learning",
  "artificial intelligence",
  "project management",
  "agile",
  "scrum",
  "devops",
  "testing",
  "quality assurance",
  "automation",
  "technical support",
  "troubleshooting",
  "procurement",
  "supply chain",
  "logistics",
  "finance",
  "accounting",
  "compliance",
  "risk management",
  "operations",
  "maintenance",
  "engineering",
];

const GENERIC_STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "between", "could", "every",
  "first", "from", "have", "into", "other", "should", "their", "there",
  "these", "they", "this", "those", "through", "using", "where", "which",
  "while", "with", "would", "years", "role", "work", "working", "responsible",
]);

function record(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function flattenStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === "object") {
    return Object.values(value as AnyRecord).flatMap(flattenStrings);
  }
  return [];
}

function tokenize(value: string): string[] {
  return unique(
    value
      .toLowerCase()
      .replace(/[^\w+#./-]+/g, " ")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(
        (item) =>
          item.length >= 3 &&
          !GENERIC_STOP_WORDS.has(item) &&
          !/^\d+$/.test(item),
      ),
  );
}

function phrases(value: string): string[] {
  const lower = value.toLowerCase();
  const matches = TECHNICAL_SKILLS.filter((skill) => lower.includes(skill));
  const tokens = tokenize(value).filter((token) =>
    /[+#./-]/.test(token) || token.length >= 5,
  );
  return unique([...matches, ...tokens]);
}

function findEvidence(source: string, skill: string): string[] {
  const chunks = source
    .split(/\n|•|;|\r|\.(?=\s|$)/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);

  return chunks
    .filter((item) => item.toLowerCase().includes(skill.toLowerCase()))
    .slice(0, 5);
}

function skillDepthSignal(skill: string, evidence: string[]): number {
  const joined = evidence.join(" ").toLowerCase();
  const actionTerms = [
    "built", "designed", "implemented", "configured", "deployed", "maintained",
    "optimised", "optimized", "debugged", "tested", "integrated", "automated",
    "led", "architected", "migrated", "secured", "scaled", "monitored",
  ].filter((term) => joined.includes(term)).length;

  const numberSignals = (joined.match(/\b\d+([.,]\d+)?%?\b/g) || []).length;
  const complexitySignals = [
    "production", "enterprise", "high availability", "distributed",
    "performance", "security", "scale", "architecture", "integration",
  ].filter((term) => joined.includes(term)).length;

  return clamp(
    28 +
      Math.min(evidence.length, 5) * 8 +
      Math.min(actionTerms, 8) * 5 +
      Math.min(numberSignals, 5) * 4 +
      Math.min(complexitySignals, 6) * 4,
  );
}

export function buildTechnicalSkillProfile(
  cvContent: unknown,
  targetRole: string,
  jobDescription: string,
): TechnicalSkillProfile[] {
  const cvText = flattenStrings(cvContent).join(" ");
  const roleAndJob = `${targetRole} ${jobDescription}`;
  const cvSkills = phrases(cvText);
  const jobSkills = phrases(roleAndJob);

  const relevant = unique([...cvSkills, ...jobSkills]).slice(0, 40);

  return relevant
    .map((skill) => {
      const cvEvidence = findEvidence(cvText, skill);
      const jobEvidence = findEvidence(roleAndJob, skill);
      const inCv = cvSkills.includes(skill);
      const inJob = jobSkills.includes(skill);
      const source: TechnicalSkillProfile["source"] =
        inCv && inJob ? "Both" : inCv ? "CV" : "Job Specification";

      const confidence = clamp(
        35 +
          cvEvidence.length * 11 +
          jobEvidence.length * 7 +
          (source === "Both" ? 18 : 0),
      );

      const relevance = clamp(
        35 +
          (inJob ? 36 : 0) +
          (inCv ? 16 : 0) +
          Math.min(jobEvidence.length, 3) * 5,
      );

      const depthSignal = skillDepthSignal(skill, cvEvidence);
      const riskFlags: string[] = [];

      if (inJob && !inCv) {
        riskFlags.push("Required by the job specification but not evidenced in the CV.");
      }
      if (inCv && cvEvidence.length === 0) {
        riskFlags.push("Skill is listed but supporting project or achievement evidence is weak.");
      }
      if (inCv && depthSignal < 55) {
        riskFlags.push("Technical depth may be challenged by follow-up questions.");
      }
      if (source === "CV" && !inJob) {
        riskFlags.push("Skill may be less relevant to the target role.");
      }

      return {
        name: skill,
        source,
        cvEvidence,
        jobEvidence,
        confidence,
        relevance,
        depthSignal,
        riskFlags,
      };
    })
    .sort(
      (left, right) =>
        right.relevance +
        right.depthSignal -
        (left.relevance + left.depthSignal),
    )
    .slice(0, 24);
}

function difficultyRank(difficulty: TechnicalDifficulty): number {
  return {
    Foundation: 1,
    Intermediate: 2,
    Advanced: 3,
    Expert: 4,
  }[difficulty];
}

function addQuestion(
  questions: TechnicalQuestion[],
  skill: TechnicalSkillProfile,
  input: TechnicalDeepDiveInput,
  category: TechnicalQuestionCategory,
  question: string,
  intent: string,
  expectedConcepts: string[],
  followUps: string[],
  weight: number,
): void {
  questions.push({
    id: `technical-${questions.length + 1}`,
    skill: skill.name,
    category,
    difficulty: input.difficulty,
    question,
    interviewerIntent: intent,
    expectedConcepts,
    practicalEvidence: skill.cvEvidence,
    strongSignals: [
      "Correct terminology used in context",
      "Clear explanation of how and why",
      "Practical example from real work",
      "Awareness of limitations and trade-offs",
      "Testing, validation or monitoring method",
      "Connection to business or user impact",
    ],
    redFlags: [
      "Memorised definition without practical application",
      "Confusing related concepts",
      "No evidence of hands-on use",
      "Ignoring failure modes, security or quality",
      "Claiming certainty where trade-offs exist",
    ],
    followUps,
    scoringWeight: weight,
  });
}

function questionsForSkill(
  skill: TechnicalSkillProfile,
  input: TechnicalDeepDiveInput,
): TechnicalQuestion[] {
  const questions: TechnicalQuestion[] = [];
  const rank = difficultyRank(input.difficulty);

  addQuestion(
    questions,
    skill,
    input,
    "Core Knowledge",
    `Explain ${skill.name} to a technically informed interviewer. What problem does it solve, and where should it not be used?`,
    "Test conceptual accuracy, boundaries and practical judgement.",
    [
      "Purpose and core concepts",
      "Typical use cases",
      "Limitations",
      "Alternatives",
    ],
    [
      `What is the most common misconception about ${skill.name}?`,
      `Which alternative would you choose instead of ${skill.name}, and why?`,
      `How would you explain ${skill.name} to a non-technical stakeholder?`,
    ],
    10,
  );

  addQuestion(
    questions,
    skill,
    input,
    "Applied Practice",
    `Describe the most complex way you have applied ${skill.name} in practice. What did you personally design, configure, build or improve?`,
    "Separate hands-on technical competence from surface familiarity.",
    [
      "Problem context",
      "Personal ownership",
      "Implementation steps",
      "Constraints",
      "Outcome and validation",
    ],
    [
      "Which part was technically most difficult?",
      "What failed during implementation?",
      "How did you validate that the solution worked?",
      "What would you redesign today?",
    ],
    14,
  );

  if (input.includeTroubleshooting) {
    addQuestion(
      questions,
      skill,
      input,
      "Troubleshooting",
      `A production issue involving ${skill.name} appears intermittently and cannot be reproduced immediately. Walk me through your diagnostic process.`,
      "Assess structured troubleshooting, evidence collection and risk control.",
      [
        "Clarify impact and severity",
        "Reproduce or isolate",
        "Logs and observability",
        "Hypothesis-driven testing",
        "Rollback or containment",
        "Root-cause analysis",
      ],
      [
        "What would you check first and why?",
        "How would you avoid making the incident worse?",
        "What evidence would confirm the root cause?",
        "What permanent prevention would you implement?",
      ],
      14,
    );
  }

  if (input.includeArchitecture && rank >= 2) {
    addQuestion(
      questions,
      skill,
      input,
      "Architecture & Design",
      `Design a reliable solution using ${skill.name} for a growing organisation. Explain the architecture, dependencies, failure points and scaling strategy.`,
      "Test design thinking, systems awareness and operational readiness.",
      [
        "Requirements and assumptions",
        "Architecture components",
        "Data or process flow",
        "Failure handling",
        "Scalability",
        "Maintainability",
        "Observability",
      ],
      [
        "Which component is the likely bottleneck?",
        "How would the design change at ten times the current scale?",
        "What would you build versus buy?",
        "How would you migrate from the current state?",
      ],
      15,
    );
  }

  addQuestion(
    questions,
    skill,
    input,
    "Tools & Systems",
    `Which tools, platforms or supporting systems do you normally use with ${skill.name}, and how do you select between them?`,
    "Assess ecosystem knowledge and tool-selection judgement.",
    [
      "Tool purpose",
      "Selection criteria",
      "Integration",
      "Operational cost",
      "Team capability",
    ],
    [
      "Which tool would you avoid for this context?",
      "How do licensing and operational costs influence the decision?",
      "How would you standardise usage across a team?",
    ],
    9,
  );

  addQuestion(
    questions,
    skill,
    input,
    "Quality & Standards",
    `How do you ensure quality when delivering work involving ${skill.name}?`,
    "Assess testing, standards, review discipline and reliability.",
    [
      "Acceptance criteria",
      "Testing strategy",
      "Peer review",
      "Documentation",
      "Monitoring",
      "Continuous improvement",
    ],
    [
      "Which defect is easiest to miss?",
      "What would block release or sign-off?",
      "How do you measure quality after implementation?",
    ],
    11,
  );

  if (input.includeSecurityRisk) {
    addQuestion(
      questions,
      skill,
      input,
      "Security & Risk",
      `What security, compliance, safety or operational risks are associated with ${skill.name}, and how would you reduce them?`,
      "Test risk awareness and responsible technical practice.",
      [
        "Threats or failure modes",
        "Access and permissions",
        "Data protection",
        "Change control",
        "Auditability",
        "Incident response",
      ],
      [
        "Which risk would you prioritise first?",
        "How would you demonstrate compliance?",
        "What controls could create new operational problems?",
      ],
      13,
    );
  }

  if (rank >= 3) {
    addQuestion(
      questions,
      skill,
      input,
      "Performance",
      `How would you identify and resolve a performance bottleneck involving ${skill.name}?`,
      "Assess measurement discipline and optimisation judgement.",
      [
        "Baseline measurement",
        "Profiling",
        "Bottleneck isolation",
        "Load or stress testing",
        "Optimisation trade-offs",
        "Post-change validation",
      ],
      [
        "Which metric would you monitor?",
        "How would you prove the optimisation caused the improvement?",
        "When would optimisation be premature?",
      ],
      13,
    );
  }

  if (input.includeScenarios) {
    addQuestion(
      questions,
      skill,
      input,
      "Scenario",
      `You inherit a poorly documented implementation of ${skill.name} that is business-critical and unstable. What do you do in your first 30 days?`,
      "Test prioritisation, stabilisation, discovery and improvement planning.",
      [
        "Stakeholder discovery",
        "Risk assessment",
        "Technical audit",
        "Immediate stabilisation",
        "Documentation",
        "Improvement roadmap",
      ],
      [
        "What would you refuse to change immediately?",
        "How would you build trust with users and technical teams?",
        "Which quick win would you target?",
      ],
      14,
    );
  }

  if (rank >= 2) {
    addQuestion(
      questions,
      skill,
      input,
      "Trade-offs",
      `Describe an important trade-off you have made when using ${skill.name}. What did you optimise for, and what did you deliberately accept?`,
      "Assess mature technical judgement rather than preference-based answers.",
      [
        "Competing priorities",
        "Decision criteria",
        "Consequences",
        "Risk acceptance",
        "Review point",
      ],
      [
        "Who challenged the decision?",
        "What evidence supported the choice?",
        "Under what conditions would you reverse it?",
      ],
      13,
    );
  }

  if (input.includeLeadership && rank >= 3) {
    addQuestion(
      questions,
      skill,
      input,
      "Technical Leadership",
      `How would you raise the capability and consistency of a team working with ${skill.name}?`,
      "Assess technical leadership, standards and coaching ability.",
      [
        "Capability assessment",
        "Standards and patterns",
        "Mentoring",
        "Review process",
        "Knowledge sharing",
        "Outcome measurement",
      ],
      [
        "How would you handle a strong performer who ignores standards?",
        "How would you assess whether training improved performance?",
        "Which decisions should remain decentralised?",
      ],
      12,
    );
  }

  if (input.includeEvidenceVerification) {
    addQuestion(
      questions,
      skill,
      input,
      "Evidence Verification",
      `Which claim about your experience with ${skill.name} could a former colleague or manager verify, and what evidence would support it?`,
      "Test credibility and consistency with technical reference checks.",
      [
        "Named project or responsibility",
        "Personal contribution",
        "Measurable outcome",
        "Independent verification",
      ],
      [
        "Who could verify this claim?",
        "Which record, report, repository or system would support it?",
        "What would that person say your actual contribution was?",
      ],
      12,
    );
  }

  return questions;
}

export function buildTechnicalDeepDive(
  cvContent: unknown,
  input: TechnicalDeepDiveInput,
): {
  skills: TechnicalSkillProfile[];
  questions: TechnicalQuestion[];
  readinessScore: number;
  strongestSkills: TechnicalSkillProfile[];
  riskAreas: string[];
} {
  const skills = buildTechnicalSkillProfile(
    cvContent,
    input.targetRole,
    input.jobDescription,
  );

  const questionPool = skills.flatMap((skill) => questionsForSkill(skill, input));
  const questionCount = Math.max(6, Math.min(60, Math.round(input.questionCount)));

  const questions = questionPool
    .sort((left, right) => right.scoringWeight - left.scoringWeight)
    .slice(0, questionCount)
    .map((question, index) => ({
      ...question,
      id: `technical-${index + 1}`,
    }));

  const readinessScore = skills.length
    ? clamp(
        skills.reduce(
          (sum, skill) =>
            sum +
            skill.relevance * 0.38 +
            skill.depthSignal * 0.42 +
            skill.confidence * 0.2,
          0,
        ) / skills.length,
      )
    : 0;

  const strongestSkills = [...skills]
    .sort(
      (left, right) =>
        right.depthSignal +
        right.relevance -
        (left.depthSignal + left.relevance),
    )
    .slice(0, 5);

  const riskAreas = unique(
    skills.flatMap((skill) =>
      skill.riskFlags.map((flag) => `${skill.name}: ${flag}`),
    ),
  );

  return {
    skills,
    questions,
    readinessScore,
    strongestSkills,
    riskAreas,
  };
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

export function scoreTechnicalAnswer(
  question: TechnicalQuestion,
  answer: string,
): TechnicalAnswerFeedback {
  const value = answer.trim();
  const words = wordCount(value);
  const lower = value.toLowerCase();

  const expectedMatches = question.expectedConcepts.filter((concept) =>
    concept
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5)
      .some((word) => lower.includes(word)),
  ).length;

  const practicalMatches = countMatches(lower, [
    "i built", "i designed", "i implemented", "i configured", "i deployed",
    "i tested", "i monitored", "i debugged", "i integrated", "i automated",
    "in production", "on a project", "for a client", "for the team",
  ]);

  const troubleshootingMatches = countMatches(lower, [
    "log", "metric", "monitor", "reproduce", "isolate", "hypothesis",
    "root cause", "rollback", "incident", "diagnostic", "test",
  ]);

  const tradeOffMatches = countMatches(lower, [
    "trade-off", "tradeoff", "however", "depends", "alternative",
    "cost", "complexity", "maintainability", "performance", "risk",
    "scalability", "security",
  ]);

  const communicationMatches = countMatches(lower, [
    "first", "second", "then", "finally", "because", "therefore",
    "for example", "the result", "in summary",
  ]);

  const evidenceMatches = countMatches(lower, [
    "result", "improved", "reduced", "increased", "saved", "achieved",
    "measured", "verified", "report", "dashboard", "kpi", "audit",
  ]);

  const accuracy = clamp(
    35 +
      expectedMatches * 12 +
      Math.min(question.expectedConcepts.length, 5) * 2 -
      countMatches(lower, ["always", "never fails", "no risk", "guaranteed"]) * 8,
  );

  const depth = clamp(
    28 +
      Math.min(words, 220) * 0.16 +
      tradeOffMatches * 5 +
      (words >= 100 ? 10 : 0),
  );

  const practicalApplication = clamp(
    30 +
      practicalMatches * 11 +
      (question.practicalEvidence.length && words >= 80 ? 8 : 0),
  );

  const troubleshooting = clamp(30 + troubleshootingMatches * 8);
  const tradeOffReasoning = clamp(30 + tradeOffMatches * 8);
  const communication = clamp(
    38 +
      communicationMatches * 6 +
      (words >= 60 && words <= 240 ? 12 : 0),
  );
  const evidence = clamp(
    28 +
      evidenceMatches * 8 +
      (hasNumber(value) ? 20 : 0),
  );

  const overall = clamp(
    accuracy * 0.22 +
      depth * 0.18 +
      practicalApplication * 0.18 +
      troubleshooting * 0.12 +
      tradeOffReasoning * 0.12 +
      communication * 0.08 +
      evidence * 0.1,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missingConcepts: string[] = [];
  const redFlags: string[] = [];

  if (accuracy >= 72) strengths.push("The answer covers relevant technical concepts.");
  else improvements.push("Define the core concept more precisely and avoid broad claims.");

  if (depth >= 72) strengths.push("The explanation shows useful technical depth.");
  else improvements.push("Explain the mechanism, constraints and failure modes in more depth.");

  if (practicalApplication >= 70) strengths.push("Hands-on application is clearly demonstrated.");
  else improvements.push("Add a real implementation example and explain your personal contribution.");

  if (troubleshooting >= 70) strengths.push("The answer uses a structured diagnostic approach.");
  else if (question.category === "Troubleshooting") {
    improvements.push("Use a hypothesis-driven troubleshooting sequence with evidence.");
  }

  if (tradeOffReasoning < 65) {
    improvements.push("Discuss alternatives and the trade-offs behind your choice.");
  }

  if (evidence < 65) {
    improvements.push("Add measurable impact, validation or an independently verifiable outcome.");
  }

  question.expectedConcepts.forEach((concept) => {
    const matched = concept
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5)
      .some((word) => lower.includes(word));

    if (!matched) missingConcepts.push(concept);
  });

  if (words < 45) redFlags.push("The answer may be too brief for a technical deep dive.");
  if (/\bwe\b/i.test(value) && !/\bI\b/.test(value)) {
    redFlags.push("Personal technical ownership is unclear.");
  }
  if (countMatches(lower, ["always", "never fails", "no risk", "guaranteed"]) > 0) {
    redFlags.push("Absolute claims may indicate weak awareness of limitations.");
  }
  if (!question.practicalEvidence.length && practicalMatches === 0) {
    redFlags.push("No practical evidence was detected.");
  }

  const adaptiveFollowUp =
    missingConcepts.length
      ? `You did not fully address ${missingConcepts[0]}. Explain how it affects your approach.`
      : practicalMatches === 0
        ? `Give a real example where you personally used ${question.skill}.`
        : tradeOffMatches === 0
          ? "What alternative approach did you consider, and why did you reject it?"
          : question.followUps[0] || null;

  return {
    score: {
      accuracy,
      depth,
      practicalApplication,
      troubleshooting,
      tradeOffReasoning,
      communication,
      evidence,
      overall,
    },
    strengths: unique(strengths),
    improvements: unique(improvements),
    missingConcepts: unique(missingConcepts),
    redFlags: unique(redFlags),
    suggestedStructure:
      "Use this structure: define the technical problem, explain the relevant concept, describe your implementation or diagnostic method, discuss trade-offs and risks, then close with validation and measurable impact.",
    adaptiveFollowUp,
  };
}

export function buildTechnicalDeepDiveReport(
  skills: TechnicalSkillProfile[],
  questions: TechnicalQuestion[],
  answers: TechnicalInterviewAnswer[],
): TechnicalDeepDiveReport {
  const dimensions: Array<keyof Omit<TechnicalAnswerScore, "overall">> = [
    "accuracy",
    "depth",
    "practicalApplication",
    "troubleshooting",
    "tradeOffReasoning",
    "communication",
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
  }, {} as Omit<TechnicalAnswerScore, "overall">);

  const overallScore = answers.length
    ? clamp(
        answers.reduce(
          (sum, answer) => sum + answer.feedback.score.overall,
          0,
        ) / answers.length,
      )
    : 0;

  const skillScores = skills.map((skill) => {
    const questionIds = questions
      .filter((question) => question.skill === skill.name)
      .map((question) => question.id);
    const skillAnswers = answers.filter((answer) =>
      questionIds.includes(answer.questionId),
    );

    return {
      skill: skill.name,
      score: skillAnswers.length
        ? clamp(
            skillAnswers.reduce(
              (sum, answer) => sum + answer.feedback.score.overall,
              0,
            ) / skillAnswers.length,
          )
        : 0,
      answerCount: skillAnswers.length,
    };
  });

  const strongestSkills = [...skills]
    .sort((left, right) => right.depthSignal - left.depthSignal)
    .slice(0, 6)
    .map(
      (skill) =>
        `${skill.name}: ${skill.depthSignal}% depth signal and ${skill.relevance}% relevance`,
    );

  const technicalGaps = unique(
    answers.flatMap((answer) => answer.feedback.missingConcepts),
  ).slice(0, 12);

  const riskAreas = unique([
    ...skills.flatMap((skill) =>
      skill.riskFlags.map((flag) => `${skill.name}: ${flag}`),
    ),
    ...answers.flatMap((answer) => answer.feedback.redFlags),
  ]).slice(0, 12);

  const preparationPriorities = [
    dimensionScores.accuracy < 70
      ? "Strengthen definitions, core concepts and technical correctness."
      : "",
    dimensionScores.depth < 70
      ? "Practise explaining mechanisms, dependencies and failure modes."
      : "",
    dimensionScores.practicalApplication < 70
      ? "Prepare stronger hands-on examples with personal ownership."
      : "",
    dimensionScores.troubleshooting < 70
      ? "Use a structured, evidence-led troubleshooting method."
      : "",
    dimensionScores.tradeOffReasoning < 70
      ? "Prepare alternatives, trade-offs and decision criteria."
      : "",
    dimensionScores.evidence < 70
      ? "Add measurable results and methods of technical validation."
      : "",
  ].filter(Boolean);

  return {
    overallScore,
    dimensions: dimensionScores,
    skillScores,
    strongestSkills,
    technicalGaps,
    riskAreas,
    preparationPriorities,
    generatedAt: new Date().toISOString(),
  };
}
