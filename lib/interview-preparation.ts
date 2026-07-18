export type InterviewMode = "hr" | "behavioural" | "technical";
export type InterviewDifficulty = "foundation" | "professional" | "advanced";

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  guidance: string;
  keywords: string[];
  suggestedSeconds: number;
}

export interface InterviewSession {
  id: string;
  role: string;
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string>;
  scores: Record<string, number>;
  averageScore: number;
}

export interface InterviewStudioPlan {
  role: string;
  readinessScore: number;
  confidenceScore: number;
  questions: InterviewQuestion[];
  focusAreas: string[];
  generatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function extractAchievements(cvContent: unknown): string[] {
  const content = asRecord(cvContent);
  const experience = asArray(content.experience);

  return experience
    .flatMap((entry) => {
      const record = asRecord(entry);

      return [
        text(record.achievements),
        text(record.description),
        text(record.responsibilities),
      ];
    })
    .filter(Boolean)
    .slice(0, 5);
}

function extractSkills(cvContent: unknown): string[] {
  const content = asRecord(cvContent);

  return asArray(content.skills)
    .flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      const record = asRecord(entry);

      return [
        text(record.name),
        text(record.skill_name),
        text(record.title),
      ];
    })
    .filter(Boolean)
    .slice(0, 10);
}

function createQuestion(
  id: string,
  category: string,
  question: string,
  guidance: string,
  keywords: string[],
  suggestedSeconds = 120,
): InterviewQuestion {
  return {
    id,
    category,
    question,
    guidance,
    keywords,
    suggestedSeconds,
  };
}

export function createInterviewStudioPlan(
  cvContent: unknown,
  targetRole: string,
  jobDescription: string,
  atsScore: number | null,
  mode: InterviewMode,
  difficulty: InterviewDifficulty,
): InterviewStudioPlan {
  const role = targetRole.trim() || "your target role";
  const achievements = extractAchievements(cvContent);
  const skills = extractSkills(cvContent);
  const safeAtsScore = atsScore === null ? 55 : clamp(atsScore);

  const difficultyAdjustment =
    difficulty === "advanced" ? -8 : difficulty === "professional" ? -3 : 3;

  const profileEvidence = Math.min(
    achievements.length * 6 + skills.length * 2,
    30,
  );

  const readinessScore = clamp(
    safeAtsScore * 0.55 + profileEvidence + difficultyAdjustment,
    25,
    95,
  );

  const confidenceScore = clamp(
    readinessScore * 0.78 + Math.min(achievements.length * 4, 16),
    20,
    94,
  );

  const commonQuestions: InterviewQuestion[] = [
    createQuestion(
      "intro",
      "Introduction",
      `Tell me about yourself and explain why you are pursuing a ${role} position.`,
      "Use a present–past–future structure. Keep the answer relevant to the role and end with the value you can bring.",
      ["experience", "strengths", "target role", "value"],
      90,
    ),
    createQuestion(
      "motivation",
      "Motivation",
      `Why are you interested in this ${role} opportunity?`,
      "Connect your career direction, relevant strengths and the organisation’s needs. Avoid focusing only on personal benefit.",
      ["motivation", "organisation", "contribution", "growth"],
      90,
    ),
    createQuestion(
      "strength",
      "Strengths",
      "What is your strongest professional capability, and how has it created a measurable result?",
      "Choose one capability, give a specific example and quantify the impact whenever possible.",
      ["strength", "evidence", "result", "impact"],
    ),
    createQuestion(
      "challenge",
      "Problem solving",
      "Describe a difficult professional challenge and how you resolved it.",
      "Use the STAR structure: Situation, Task, Action and Result. Focus most of the answer on your actions.",
      ["situation", "action", "result", "learning"],
      150,
    ),
    createQuestion(
      "teamwork",
      "Teamwork",
      "Tell me about a time you worked with different personalities to achieve a shared goal.",
      "Show communication, respect, adaptability and the final outcome.",
      ["collaboration", "communication", "conflict", "outcome"],
      140,
    ),
    createQuestion(
      "failure",
      "Growth",
      "Tell me about a mistake or setback and what you changed afterwards.",
      "Take responsibility, explain the lesson and show the permanent improvement you made.",
      ["accountability", "learning", "improvement", "reflection"],
      130,
    ),
  ];

  const behaviouralQuestions: InterviewQuestion[] = [
    createQuestion(
      "leadership",
      "Leadership",
      "Describe a situation where you took ownership without being asked.",
      "Explain why action was needed, what you initiated and how others benefited.",
      ["ownership", "initiative", "leadership", "result"],
      150,
    ),
    createQuestion(
      "priority",
      "Prioritisation",
      "How do you manage competing deadlines when everything appears urgent?",
      "Explain your decision criteria, communication process and method for tracking commitments.",
      ["priorities", "deadlines", "communication", "planning"],
      130,
    ),
    createQuestion(
      "feedback",
      "Feedback",
      "Tell me about critical feedback you received and how you responded.",
      "Show emotional maturity, action and evidence that the feedback improved your performance.",
      ["feedback", "self-awareness", "action", "development"],
      130,
    ),
  ];

  const technicalQuestions: InterviewQuestion[] = [
    createQuestion(
      "role-method",
      "Role expertise",
      `Walk me through how you would approach a complex ${role} assignment from beginning to completion.`,
      "Present a structured process, explain checkpoints and mention how you manage quality and risk.",
      ["process", "quality", "risk", "delivery"],
      180,
    ),
    createQuestion(
      "role-quality",
      "Quality",
      `How do you measure whether your work as a ${role} is successful?`,
      "Name concrete measures, explain how you monitor them and give an example from your experience.",
      ["metrics", "quality", "performance", "improvement"],
      150,
    ),
    createQuestion(
      "role-learning",
      "Technical growth",
      `Which skill is becoming most important for ${role} professionals, and how are you developing it?`,
      "Demonstrate market awareness and a specific learning plan with evidence of progress.",
      ["industry trend", "skill", "learning", "application"],
      140,
    ),
  ];

  const modeQuestions =
    mode === "technical"
      ? technicalQuestions
      : mode === "behavioural"
        ? behaviouralQuestions
        : [];

  const jobQuestion = jobDescription.trim()
    ? [
        createQuestion(
          "job-description",
          "Vacancy alignment",
          "Which requirements in this vacancy match your experience most strongly, and where would you need to develop?",
          "Reference the job description directly. Be confident about strengths and honest but proactive about development areas.",
          ["requirements", "evidence", "development", "alignment"],
          160,
        ),
      ]
    : [];

  const questions = [...commonQuestions, ...modeQuestions, ...jobQuestion];

  if (difficulty === "foundation") {
    questions.splice(6);
  } else if (difficulty === "professional") {
    questions.splice(9);
  }

  return {
    role,
    readinessScore,
    confidenceScore,
    questions,
    focusAreas: [
      "Use specific evidence rather than general claims.",
      "Structure behavioural answers using STAR.",
      `Connect every answer to the value required from a ${role}.`,
      "Keep answers focused and avoid unnecessary background.",
      "End achievement examples with a clear result or lesson.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function scoreInterviewAnswer(
  answer: string,
  question: InterviewQuestion,
): number {
  const normalised = answer.toLowerCase().trim();
  if (!normalised) return 0;

  const wordCount = normalised.split(/\s+/).filter(Boolean).length;
  const keywordMatches = question.keywords.filter((keyword) =>
    normalised.includes(keyword.toLowerCase()),
  ).length;

  const structureSignals = [
    "situation",
    "task",
    "action",
    "result",
    "because",
    "therefore",
    "learned",
    "improved",
  ].filter((signal) => normalised.includes(signal)).length;

  const lengthScore = Math.min(wordCount / 1.2, 45);
  const keywordScore =
    question.keywords.length > 0
      ? (keywordMatches / question.keywords.length) * 35
      : 0;
  const structureScore = Math.min(structureSignals * 4, 20);

  return clamp(lengthScore + keywordScore + structureScore);
}

export function answerFeedback(score: number): string {
  if (score >= 85) {
    return "Strong answer. It is detailed, relevant and supported by evidence.";
  }

  if (score >= 70) {
    return "Good foundation. Strengthen the measurable result and make your personal contribution clearer.";
  }

  if (score >= 50) {
    return "Develop this answer further with a specific example, structured actions and a clear outcome.";
  }

  if (score > 0) {
    return "The answer is too general. Use one real situation and explain exactly what you did and achieved.";
  }

  return "Write or practise an answer to receive coaching feedback.";
}
