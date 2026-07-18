export type ExperienceQuestionType =
  | "Role Scope"
  | "Achievement"
  | "Challenge"
  | "Decision"
  | "Leadership"
  | "Stakeholder"
  | "Failure & Learning"
  | "Technical Depth"
  | "Career Progression"
  | "Transition"
  | "Evidence Verification";

export type ExperienceDepth = "Foundation" | "Professional" | "Advanced" | "Executive";

export interface ExperienceInterviewInput {
  targetRole: string;
  jobDescription: string;
  companyName: string;
  depth: ExperienceDepth;
  questionsPerRole: number;
  includeCareerTransitions: boolean;
  includeFailureQuestions: boolean;
  includeLeadershipQuestions: boolean;
  includeTechnicalQuestions: boolean;
  includeEvidenceVerification: boolean;
}

export interface CareerExperience {
  id: string;
  role: string;
  employer: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  durationMonths: number | null;
  seniorityLevel: number;
  extractedSkills: string[];
  evidenceStrength: number;
  relevanceScore: number;
  progressionSignal: string;
  riskFlags: string[];
}

export interface ExperienceQuestion {
  id: string;
  experienceId: string | null;
  role: string;
  employer: string;
  type: ExperienceQuestionType;
  question: string;
  interviewerIntent: string;
  evidencePrompts: string[];
  strongAnswerSignals: string[];
  weakAnswerSignals: string[];
  followUps: string[];
  scoringWeight: number;
}

export interface ExperienceAnswerScore {
  specificity: number;
  ownership: number;
  resultEvidence: number;
  roleRelevance: number;
  depth: number;
  credibility: number;
  reflection: number;
  overall: number;
}

export interface ExperienceAnswerFeedback {
  score: ExperienceAnswerScore;
  strengths: string[];
  improvements: string[];
  missingEvidence: string[];
  credibilityChecks: string[];
  suggestedStructure: string;
  adaptiveFollowUp: string | null;
}

export interface ExperienceInterviewAnswer {
  questionId: string;
  answer: string;
  feedback: ExperienceAnswerFeedback;
}

export interface ExperienceInterviewReport {
  overallScore: number;
  experienceScores: Array<{
    experienceId: string;
    role: string;
    employer: string;
    score: number;
    answerCount: number;
  }>;
  dimensions: Omit<ExperienceAnswerScore, "overall">;
  strongestEvidence: string[];
  evidenceGaps: string[];
  careerRisks: string[];
  preparationPriorities: string[];
  generatedAt: string;
}

type AnyRecord = Record<string, unknown>;

const SENIORITY_TERMS = [
  ["intern", "trainee", "assistant", "junior"],
  ["officer", "coordinator", "administrator", "specialist", "analyst"],
  ["senior", "supervisor", "team lead", "foreman"],
  ["manager", "head", "principal", "lead"],
  ["director", "executive", "chief", "vice president", "vp"],
];

const SKILL_TERMS = [
  "leadership",
  "operations",
  "project management",
  "stakeholder management",
  "customer service",
  "sales",
  "finance",
  "budget",
  "risk",
  "compliance",
  "quality",
  "safety",
  "procurement",
  "supply chain",
  "logistics",
  "data",
  "analytics",
  "reporting",
  "strategy",
  "training",
  "coaching",
  "process improvement",
  "technical support",
  "software",
  "engineering",
  "maintenance",
];

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

function splitContent(value: string): string[] {
  return unique(
    value
      .split(/\n|•|;|\r|\.(?=\s|$)/g)
      .map((item) => item.replace(/^[-–—\s]+/, "").trim())
      .filter((item) => item.length >= 5),
  );
}

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  if (/present|current|now/i.test(value)) return new Date();

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const year = value.match(/\b(19|20)\d{2}\b/);
  if (!year) return null;

  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const lower = value.toLowerCase();
  const monthIndex = monthNames.findIndex((month) => lower.includes(month));
  return new Date(Number(year[0]), monthIndex >= 0 ? monthIndex : 0, 1);
}

function monthsBetween(start: string, end: string, isCurrent: boolean): number | null {
  const startDate = parseDate(start);
  const endDate = isCurrent ? new Date() : parseDate(end);
  if (!startDate || !endDate || endDate < startDate) return null;

  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth()
  );
}

function seniorityLevel(role: string): number {
  const lower = role.toLowerCase();
  let level = 1;
  SENIORITY_TERMS.forEach((terms, index) => {
    if (terms.some((term) => lower.includes(term))) {
      level = Math.max(level, index + 1);
    }
  });
  return level;
}

function extractSkills(content: string): string[] {
  const lower = content.toLowerCase();
  return SKILL_TERMS.filter((skill) => lower.includes(skill));
}

function wordTerms(value: string): string[] {
  return unique(
    value
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 5),
  );
}

function relevanceScore(
  experience: string,
  targetRole: string,
  jobDescription: string,
): number {
  const source = experience.toLowerCase();
  const roleTerms = wordTerms(`${targetRole} ${jobDescription}`).slice(0, 80);
  const matches = roleTerms.filter((term) => source.includes(term)).length;
  const directRole = targetRole
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 4)
    .filter((word) => source.includes(word)).length;

  return clamp(30 + matches * 3 + directRole * 7);
}

function evidenceStrength(
  responsibilities: string[],
  achievements: string[],
  description: string,
): number {
  const combined = `${description} ${responsibilities.join(" ")} ${achievements.join(" ")}`;
  const quantified = (combined.match(/\b\d+([.,]\d+)?%?\b/g) || []).length;
  const actionWords = [
    "led", "managed", "developed", "implemented", "improved", "reduced",
    "increased", "delivered", "achieved", "created", "resolved", "saved",
  ].filter((term) => combined.toLowerCase().includes(term)).length;

  return clamp(
    28 +
      Math.min(responsibilities.length, 6) * 4 +
      Math.min(achievements.length, 6) * 7 +
      Math.min(quantified, 5) * 8 +
      Math.min(actionWords, 8) * 3,
  );
}

function pick(entry: AnyRecord, keys: string[]): string {
  for (const key of keys) {
    const value = text(entry[key]);
    if (value) return value;
  }
  return "";
}

function listFrom(entry: AnyRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = entry[key];
    if (Array.isArray(value)) {
      const values = unique(
        value.flatMap((item) => {
          if (typeof item === "string") return splitContent(item);
          const itemRecord = record(item);
          return [
            text(itemRecord.description),
            text(itemRecord.text),
            text(itemRecord.title),
          ];
        }),
      );
      if (values.length) return values;
    }

    const valueText = text(value);
    if (valueText) {
      const values = splitContent(valueText);
      if (values.length) return values;
    }
  }

  return [];
}

function experienceRiskFlags(
  role: string,
  employer: string,
  durationMonths: number | null,
  achievements: string[],
  responsibilities: string[],
  startDate: string,
  endDate: string,
): string[] {
  const flags: string[] = [];

  if (!role) flags.push("Role title is missing.");
  if (!employer) flags.push("Employer name is missing.");
  if (!startDate) flags.push("Start date is missing.");
  if (!endDate) flags.push("End date or current-role status is unclear.");
  if (durationMonths !== null && durationMonths < 6) {
    flags.push("Short tenure may attract transition or performance questions.");
  }
  if (!achievements.length) {
    flags.push("No clear achievement evidence is recorded.");
  }
  if (!responsibilities.length) {
    flags.push("Role scope and responsibilities are not clearly documented.");
  }

  return flags;
}

export function extractCareerExperiences(
  cvContent: unknown,
  targetRole: string,
  jobDescription: string,
): CareerExperience[] {
  const cv = record(cvContent);
  const rawExperience = array(cv.experience);

  const extracted = rawExperience.map((item, index) => {
    const entry = record(item);
    const role = pick(entry, ["job_title", "position", "title", "role"]);
    const employer = pick(entry, ["company", "employer", "organisation", "organization"]);
    const startDate = pick(entry, ["start_date", "startDate", "from_date", "from"]);
    const endDate = pick(entry, ["end_date", "endDate", "to_date", "to"]);
    const currentFlag =
      entry.is_current === true ||
      entry.current === true ||
      /present|current/i.test(endDate);

    const description = pick(entry, [
      "description",
      "summary",
      "role_description",
      "job_description",
    ]);

    const responsibilities = listFrom(entry, [
      "responsibilities",
      "duties",
      "key_responsibilities",
      "description",
    ]);

    const achievements = listFrom(entry, [
      "achievements",
      "accomplishments",
      "key_achievements",
      "results",
    ]);

    const durationMonths = monthsBetween(startDate, endDate, currentFlag);
    const content = [
      role,
      employer,
      description,
      ...responsibilities,
      ...achievements,
    ].join(" ");

    return {
      id: `experience-${index + 1}`,
      role: role || `Experience ${index + 1}`,
      employer: employer || "Employer not specified",
      startDate,
      endDate: currentFlag ? "Present" : endDate,
      isCurrent: currentFlag,
      description,
      responsibilities,
      achievements,
      durationMonths,
      seniorityLevel: seniorityLevel(role),
      extractedSkills: extractSkills(content),
      evidenceStrength: evidenceStrength(
        responsibilities,
        achievements,
        description,
      ),
      relevanceScore: relevanceScore(content, targetRole, jobDescription),
      progressionSignal: "",
      riskFlags: experienceRiskFlags(
        role,
        employer,
        durationMonths,
        achievements,
        responsibilities,
        startDate,
        currentFlag ? "Present" : endDate,
      ),
    };
  });

  return extracted.map((experience, index) => {
    const nextOlder = extracted[index + 1];
    let progressionSignal = "Career progression cannot be fully assessed.";

    if (nextOlder) {
      if (experience.seniorityLevel > nextOlder.seniorityLevel) {
        progressionSignal = `Progression from ${nextOlder.role} to ${experience.role}.`;
      } else if (experience.seniorityLevel === nextOlder.seniorityLevel) {
        progressionSignal = "Lateral or specialist career movement.";
      } else {
        progressionSignal =
          "Role sequence may require explanation because title seniority appears lower.";
      }
    } else {
      progressionSignal = "Earliest recorded role in the current CV.";
    }

    return { ...experience, progressionSignal };
  });
}

function roleQuestions(
  experience: CareerExperience,
  input: ExperienceInterviewInput,
): ExperienceQuestion[] {
  const questions: ExperienceQuestion[] = [];
  const roleLabel = `${experience.role} at ${experience.employer}`;

  function add(
    type: ExperienceQuestionType,
    question: string,
    intent: string,
    evidencePrompts: string[],
    followUps: string[],
    scoringWeight = 10,
  ): void {
    questions.push({
      id: `${experience.id}-${questions.length + 1}`,
      experienceId: experience.id,
      role: experience.role,
      employer: experience.employer,
      type,
      question,
      interviewerIntent: intent,
      evidencePrompts,
      strongAnswerSignals: [
        "Clear scope and context",
        "Specific personal responsibility",
        "Detailed actions and judgement",
        "Scale or complexity",
        "Measurable result",
        "Relevant learning",
      ],
      weakAnswerSignals: [
        "Only repeating the CV",
        "Using 'we' without explaining personal ownership",
        "No measurable result",
        "Vague or generic actions",
        "Inconsistent dates, scope or numbers",
      ],
      followUps,
      scoringWeight,
    });
  }

  add(
    "Role Scope",
    `Walk me through your role as ${roleLabel}. What were you accountable for, and how was success measured?`,
    "Establish the true level, scope and accountability of the role.",
    [
      ...experience.responsibilities.slice(0, 3),
      `Duration: ${experience.durationMonths ?? "not calculated"} months`,
      `Relevant skills: ${experience.extractedSkills.join(", ") || "not clearly listed"}`,
    ],
    [
      "How large was the team, budget, portfolio or operational scope?",
      "Which decisions could you make independently?",
      "What were your most important KPIs?",
    ],
    11,
  );

  const achievement = experience.achievements[0];
  add(
    "Achievement",
    achievement
      ? `Your CV states: "${achievement}". Explain exactly how you achieved this result.`
      : `What was your most important achievement as ${roleLabel}, and what measurable result did it produce?`,
    "Verify achievement ownership, method, scale and measurable impact.",
    experience.achievements.slice(0, 4),
    [
      "What was the baseline before your intervention?",
      "Which action had the greatest effect?",
      "How was the result measured and verified?",
      "What portion of the result was directly attributable to you?",
    ],
    14,
  );

  add(
    "Challenge",
    `Describe the most difficult challenge you faced as ${roleLabel}. Why was it difficult, and what did you do?`,
    "Assess judgement, resilience and structured problem solving in a real context.",
    [...experience.responsibilities.slice(0, 2), ...experience.achievements.slice(0, 2)],
    [
      "What alternatives did you consider?",
      "What risk did you accept?",
      "Who disagreed with your approach?",
      "What happened after your decision?",
    ],
    12,
  );

  add(
    "Decision",
    `Tell me about an important decision you made in this role with incomplete or conflicting information.`,
    "Test decision quality, use of evidence and accountability.",
    experience.achievements.slice(0, 3),
    [
      "What information was unavailable?",
      "What trade-off did you make?",
      "What would have happened if you delayed the decision?",
    ],
    12,
  );

  if (input.includeLeadershipQuestions) {
    add(
      "Leadership",
      `How did you lead, influence or support other people while working as ${roleLabel}?`,
      "Assess real leadership behaviour regardless of formal title.",
      experience.responsibilities.filter((item) =>
        /team|lead|manage|coach|train|stakeholder/i.test(item),
      ),
      [
        "How did you handle underperformance?",
        "How did you influence people who did not report to you?",
        "What feedback did you receive about your leadership?",
      ],
      11,
    );
  }

  add(
    "Stakeholder",
    `Which stakeholder relationship was most important in this role, and how did you manage competing expectations?`,
    "Assess communication, influence and stakeholder judgement.",
    experience.responsibilities.filter((item) =>
      /customer|client|stakeholder|supplier|team|manager/i.test(item),
    ),
    [
      "Describe a disagreement with that stakeholder.",
      "How did you communicate bad news?",
      "How did you rebuild trust after a problem?",
    ],
    10,
  );

  if (input.includeFailureQuestions) {
    add(
      "Failure & Learning",
      `Tell me about a mistake, failure or result you were not satisfied with during this role.`,
      "Test honesty, self-awareness, accountability and learning agility.",
      experience.riskFlags,
      [
        "What was your personal contribution to the problem?",
        "When did you realise the approach was failing?",
        "What did you change permanently afterwards?",
      ],
      12,
    );
  }

  if (input.includeTechnicalQuestions) {
    add(
      "Technical Depth",
      `Which technical, operational or professional capability was most important in your ${experience.role} position? Explain how you applied it in practice.`,
      "Separate practical expertise from surface-level terminology.",
      [
        ...experience.extractedSkills,
        ...experience.responsibilities.slice(0, 3),
      ],
      [
        "Explain the method step by step.",
        "What common mistake do less experienced people make?",
        "Which tools, systems or standards did you use?",
        "How did you check quality?",
      ],
      13,
    );
  }

  if (input.includeEvidenceVerification) {
    add(
      "Evidence Verification",
      `Which claim about your work as ${roleLabel} would be easiest for a former manager to verify, and what evidence would support it?`,
      "Test credibility, precision and consistency with reference checks.",
      experience.achievements,
      [
        "Who could verify this?",
        "Which report, KPI or record would support it?",
        "Would your former manager describe your contribution the same way?",
      ],
      13,
    );
  }

  return questions;
}

function careerQuestions(
  experiences: CareerExperience[],
  input: ExperienceInterviewInput,
): ExperienceQuestion[] {
  if (experiences.length < 2) return [];

  const latest = experiences[0];
  const earliest = experiences[experiences.length - 1];
  const questions: ExperienceQuestion[] = [
    {
      id: "career-progression-1",
      experienceId: null,
      role: "Career history",
      employer: "",
      type: "Career Progression",
      question: `Explain how your career developed from ${earliest.role} to ${latest.role}. Which decisions and achievements drove that progression?`,
      interviewerIntent:
        "Assess career direction, ambition, learning and consistency of progression.",
      evidencePrompts: experiences.map((item) => item.progressionSignal),
      strongAnswerSignals: [
        "Clear career narrative",
        "Intentional decisions",
        "Increasing responsibility",
        "Evidence of learning",
        "Connection to target role",
      ],
      weakAnswerSignals: [
        "Disconnected career moves",
        "Blaming employers",
        "No explanation of development",
        "Weak connection to target role",
      ],
      followUps: [
        "Which move accelerated your career most?",
        "Which move would you reconsider?",
        "What capability did each role add?",
      ],
      scoringWeight: 12,
    },
  ];

  if (input.includeCareerTransitions) {
    experiences.slice(0, -1).forEach((experience, index) => {
      const older = experiences[index + 1];
      questions.push({
        id: `transition-${index + 1}`,
        experienceId: experience.id,
        role: experience.role,
        employer: experience.employer,
        type: "Transition",
        question: `Why did you move from ${older.role} at ${older.employer} to ${experience.role} at ${experience.employer}?`,
        interviewerIntent:
          "Understand motivation, judgement and possible retention risks.",
        evidencePrompts: [
          older.progressionSignal,
          experience.progressionSignal,
        ],
        strongAnswerSignals: [
          "Positive explanation",
          "Career development logic",
          "Professional treatment of former employer",
          "Clear link to long-term direction",
        ],
        weakAnswerSignals: [
          "Negative comments about former employer",
          "Only salary-based motivation",
          "Unclear chronology",
          "Repeated short-tenure pattern",
        ],
        followUps: [
          "What did you expect from the new role?",
          "Did the move meet those expectations?",
          "What would make you leave your next role?",
        ],
        scoringWeight: 10,
      });
    });
  }

  return questions;
}

export function buildExperienceInterview(
  cvContent: unknown,
  input: ExperienceInterviewInput,
): {
  experiences: CareerExperience[];
  questions: ExperienceQuestion[];
  readinessScore: number;
  strongestRoles: CareerExperience[];
  preparationRisks: string[];
} {
  const experiences = extractCareerExperiences(
    cvContent,
    input.targetRole,
    input.jobDescription,
  );

  const perRole = Math.max(2, Math.min(8, Math.round(input.questionsPerRole)));
  const questions = experiences.flatMap((experience) =>
    roleQuestions(experience, input).slice(0, perRole),
  );

  questions.push(...careerQuestions(experiences, input));

  const readinessScore = experiences.length
    ? clamp(
        experiences.reduce(
          (sum, experience) =>
            sum +
            experience.evidenceStrength * 0.58 +
            experience.relevanceScore * 0.42,
          0,
        ) / experiences.length,
      )
    : 0;

  const strongestRoles = [...experiences]
    .sort(
      (left, right) =>
        right.evidenceStrength +
        right.relevanceScore -
        (left.evidenceStrength + left.relevanceScore),
    )
    .slice(0, 3);

  const preparationRisks = unique(
    experiences.flatMap((experience) =>
      experience.riskFlags.map(
        (flag) => `${experience.role}: ${flag}`,
      ),
    ),
  );

  return {
    experiences,
    questions,
    readinessScore,
    strongestRoles,
    preparationRisks,
  };
}

function countMatches(answer: string, terms: string[]): number {
  const lower = answer.toLowerCase();
  return terms.filter((term) => lower.includes(term)).length;
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function containsNumber(value: string): boolean {
  return /\b\d+([.,]\d+)?%?\b/.test(value);
}

export function scoreExperienceAnswer(
  question: ExperienceQuestion,
  answer: string,
  targetRole: string,
  jobDescription: string,
): ExperienceAnswerFeedback {
  const value = answer.trim();
  const lower = value.toLowerCase();
  const words = wordCount(value);

  const ownershipMatches = countMatches(lower, [
    "i led", "i managed", "i created", "i developed", "i implemented",
    "i decided", "i analysed", "i analyzed", "i resolved", "i delivered",
    "my responsibility", "i was accountable",
  ]);

  const resultMatches = countMatches(lower, [
    "result", "outcome", "increased", "reduced", "saved", "improved",
    "achieved", "delivered", "completed", "revenue", "cost", "quality",
  ]);

  const depthMatches = countMatches(lower, [
    "because", "therefore", "trade-off", "risk", "alternative", "method",
    "process", "root cause", "stakeholder", "constraint", "priority",
  ]);

  const reflectionMatches = countMatches(lower, [
    "learned", "would do differently", "reflection", "afterwards",
    "since then", "improved my", "next time",
  ]);

  const credibilityMatches = countMatches(lower, [
    "report", "dashboard", "kpi", "manager", "audit", "record", "data",
    "customer feedback", "performance review", "reference",
  ]);

  const relevanceTerms = wordTerms(`${targetRole} ${jobDescription}`).slice(0, 70);
  const relevanceMatches = relevanceTerms.filter((term) => lower.includes(term)).length;

  const specificity = clamp(
    30 +
      Math.min(words, 180) * 0.18 +
      (containsNumber(value) ? 18 : 0) +
      depthMatches * 3,
  );

  const ownership = clamp(30 + ownershipMatches * 11 + (/\bI\b/.test(value) ? 8 : 0));
  const resultEvidence = clamp(
    25 +
      resultMatches * 8 +
      (containsNumber(value) ? 22 : 0) +
      credibilityMatches * 4,
  );
  const roleRelevance = clamp(35 + relevanceMatches * 4);
  const depth = clamp(30 + depthMatches * 8 + (words >= 100 ? 12 : 0));
  const credibility = clamp(
    40 +
      credibilityMatches * 8 +
      (containsNumber(value) ? 10 : 0) -
      countMatches(lower, ["maybe", "approximately", "i think", "probably"]) * 6,
  );
  const reflection = clamp(35 + reflectionMatches * 12);

  const overall = clamp(
    specificity * 0.16 +
      ownership * 0.17 +
      resultEvidence * 0.2 +
      roleRelevance * 0.15 +
      depth * 0.14 +
      credibility * 0.11 +
      reflection * 0.07,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missingEvidence: string[] = [];
  const credibilityChecks: string[] = [];

  if (specificity >= 70) strengths.push("The answer contains useful detail and context.");
  else improvements.push("Add more concrete context, scope and constraints.");

  if (ownership >= 70) strengths.push("Personal responsibility is clearly explained.");
  else improvements.push("Explain what you personally decided, led or delivered.");

  if (resultEvidence >= 70) strengths.push("The outcome is supported by evidence.");
  else improvements.push("Add a measurable result and explain how it was verified.");

  if (roleRelevance >= 70) strengths.push("The example connects well to the target role.");
  else improvements.push("Connect the experience directly to a target-role requirement.");

  if (depth < 65) improvements.push("Explain the reasoning, trade-offs and method in greater depth.");
  if (reflection < 60) improvements.push("End with what you learned or would improve.");

  if (!containsNumber(value)) {
    missingEvidence.push("No number, scale, percentage, duration or measurable result was detected.");
  }
  if (ownershipMatches === 0) {
    missingEvidence.push("Personal ownership is unclear.");
  }
  if (resultMatches === 0) {
    missingEvidence.push("The final outcome is unclear.");
  }
  if (words < 55) {
    missingEvidence.push("The response may be too brief for experience verification.");
  }

  if (credibilityMatches === 0) {
    credibilityChecks.push("Be ready to explain who or what could verify this claim.");
  }
  if (containsNumber(value)) {
    credibilityChecks.push("Ensure every number is accurate and consistent with reference checks.");
  }
  credibilityChecks.push("Keep dates, team size, job title and scope consistent with the CV.");

  const adaptiveFollowUp =
    !containsNumber(value)
      ? "What measurable result, scale or before-and-after evidence can you provide?"
      : ownershipMatches === 0
        ? "Which actions were personally yours rather than the wider team's?"
        : credibilityMatches === 0
          ? "Who or what could independently verify this result?"
          : question.followUps[0] || null;

  return {
    score: {
      specificity,
      ownership,
      resultEvidence,
      roleRelevance,
      depth,
      credibility,
      reflection,
      overall,
    },
    strengths: unique(strengths),
    improvements: unique(improvements),
    missingEvidence: unique(missingEvidence),
    credibilityChecks: unique(credibilityChecks),
    suggestedStructure:
      "Answer in six parts: context, scope, personal responsibility, decision or action, measurable result, and reflection. Use exact numbers only when they are accurate and defensible.",
    adaptiveFollowUp,
  };
}

export function buildExperienceInterviewReport(
  experiences: CareerExperience[],
  questions: ExperienceQuestion[],
  answers: ExperienceInterviewAnswer[],
): ExperienceInterviewReport {
  const dimensions: Array<keyof Omit<ExperienceAnswerScore, "overall">> = [
    "specificity",
    "ownership",
    "resultEvidence",
    "roleRelevance",
    "depth",
    "credibility",
    "reflection",
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
  }, {} as Omit<ExperienceAnswerScore, "overall">);

  const overallScore = answers.length
    ? clamp(
        answers.reduce(
          (sum, answer) => sum + answer.feedback.score.overall,
          0,
        ) / answers.length,
      )
    : 0;

  const experienceScores = experiences.map((experience) => {
    const ids = questions
      .filter((question) => question.experienceId === experience.id)
      .map((question) => question.id);
    const roleAnswers = answers.filter((answer) => ids.includes(answer.questionId));

    return {
      experienceId: experience.id,
      role: experience.role,
      employer: experience.employer,
      score: roleAnswers.length
        ? clamp(
            roleAnswers.reduce(
              (sum, answer) => sum + answer.feedback.score.overall,
              0,
            ) / roleAnswers.length,
          )
        : 0,
      answerCount: roleAnswers.length,
    };
  });

  const strongestEvidence = unique(
    experiences
      .sort((left, right) => right.evidenceStrength - left.evidenceStrength)
      .flatMap((experience) =>
        experience.achievements.slice(0, 2).map(
          (achievement) => `${experience.role}: ${achievement}`,
        ),
      ),
  ).slice(0, 8);

  const evidenceGaps = unique(
    answers.flatMap((answer) => answer.feedback.missingEvidence),
  ).slice(0, 10);

  const careerRisks = unique(
    experiences.flatMap((experience) =>
      experience.riskFlags.map((flag) => `${experience.role}: ${flag}`),
    ),
  ).slice(0, 10);

  const preparationPriorities = [
    dimensionScores.ownership < 70
      ? "Prepare stronger explanations of personal responsibility."
      : "",
    dimensionScores.resultEvidence < 70
      ? "Add verified numbers and measurable outcomes to career examples."
      : "",
    dimensionScores.roleRelevance < 70
      ? "Map each past role directly to the target job requirements."
      : "",
    dimensionScores.depth < 70
      ? "Practise deeper follow-up questions about decisions, risks and trade-offs."
      : "",
    dimensionScores.credibility < 70
      ? "Check that dates, scope, titles and numbers are reference-ready."
      : "",
    dimensionScores.reflection < 70
      ? "Prepare lessons learned and what you would do differently."
      : "",
  ].filter(Boolean);

  return {
    overallScore,
    experienceScores,
    dimensions: dimensionScores,
    strongestEvidence,
    evidenceGaps,
    careerRisks,
    preparationPriorities,
    generatedAt: new Date().toISOString(),
  };
}
