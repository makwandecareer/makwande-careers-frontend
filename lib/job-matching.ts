export type JobMatchDimension =
  | "skills"
  | "experience"
  | "education"
  | "ats"
  | "leadership"
  | "technical"
  | "achievements"
  | "seniority";

export type JobMatchInput = {
  cvContent: unknown;
  jobDescription: string;
  targetRole: string;
};

export type MatchEvidence = {
  term: string;
  source: "cv" | "job";
  category: JobMatchDimension;
};

export type MatchDimensionResult = {
  key: JobMatchDimension;
  label: string;
  score: number;
  weight: number;
  matched: string[];
  missing: string[];
  explanation: string;
};

export type JobMatchResult = {
  overallScore: number;
  readinessBand:
    | "Excellent alignment"
    | "Strong alignment"
    | "Moderate alignment"
    | "Developing alignment";
  recommendation:
    | "Priority application"
    | "Apply with targeted improvements"
    | "Strengthen before applying"
    | "Consider adjacent roles";
  dimensions: MatchDimensionResult[];
  strengths: string[];
  gaps: string[];
  evidence: MatchEvidence[];
  explanation: string;
  integrityNotes: string[];
};

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "your",
  "you", "are", "our", "their", "they", "has", "have", "had", "into",
  "using", "use", "job", "role", "work", "team", "years", "year",
  "experience", "required", "preferred", "candidate", "skills", "ability",
  "responsible", "including", "within", "must", "should", "would", "who",
  "where", "when", "which", "what", "been", "being", "about", "more",
  "than", "also", "such", "other", "all", "any", "not", "can", "may",
]);

const SKILL_TERMS = [
  "excel", "power bi", "tableau", "sap", "oracle", "salesforce", "crm",
  "erp", "python", "sql", "javascript", "typescript", "react", "next.js",
  "project management", "procurement", "inventory", "logistics",
  "supply chain", "customer service", "data analysis", "reporting",
  "budgeting", "forecasting", "compliance", "quality assurance",
  "risk management", "stakeholder management", "operations",
  "marketing", "sales", "recruitment", "human resources", "payroll",
  "administration", "communication", "negotiation", "leadership",
];

const LEADERSHIP_TERMS = [
  "led", "managed", "supervised", "mentored", "coached", "directed",
  "owned", "influenced", "stakeholder", "strategy", "governance",
  "decision", "accountable", "cross-functional", "team lead",
  "manager", "head of", "executive", "director",
];

const ACHIEVEMENT_TERMS = [
  "increased", "reduced", "improved", "saved", "grew", "delivered",
  "achieved", "exceeded", "accelerated", "streamlined", "optimised",
  "optimized", "launched", "transformed", "resolved",
];

const EDUCATION_TERMS = [
  "degree", "diploma", "certificate", "certification", "bachelor",
  "master", "mba", "phd", "matric", "nqf", "university", "college",
];

const SENIORITY_TERMS = [
  "intern", "junior", "assistant", "officer", "coordinator", "specialist",
  "senior", "supervisor", "manager", "head", "director", "executive",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function extractPhrases(value: string): string[] {
  const normalized = normalize(value);
  const explicit = SKILL_TERMS.filter((term) => normalized.includes(term));
  const tokenCounts = new Map<string, number>();

  for (const token of tokens(value)) {
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
  }

  const frequent = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([token]) => token);

  return unique([...explicit, ...frequent]).slice(0, 36);
}

function overlap(cvText: string, jobText: string): {
  matched: string[];
  missing: string[];
  score: number;
} {
  const requirements = extractPhrases(jobText);
  const cv = normalize(cvText);

  if (!requirements.length) {
    return { matched: [], missing: [], score: 50 };
  }

  const matched = requirements.filter((term) => cv.includes(term));
  const missing = requirements.filter((term) => !cv.includes(term));

  return {
    matched,
    missing,
    score: clamp((matched.length / requirements.length) * 100),
  };
}

function termScore(cvText: string, jobText: string, terms: string[]): {
  matched: string[];
  missing: string[];
  score: number;
} {
  const cv = normalize(cvText);
  const job = normalize(jobText);
  const required = terms.filter((term) => job.includes(term));

  if (!required.length) {
    const present = terms.filter((term) => cv.includes(term));
    return {
      matched: present.slice(0, 8),
      missing: [],
      score: present.length ? clamp(58 + present.length * 5) : 50,
    };
  }

  const matched = required.filter((term) => cv.includes(term));
  const missing = required.filter((term) => !cv.includes(term));

  return {
    matched,
    missing,
    score: clamp((matched.length / required.length) * 100),
  };
}

function experienceScore(cvText: string, jobText: string): {
  matched: string[];
  missing: string[];
  score: number;
} {
  const cvYears = [...cvText.matchAll(/(\d+)\+?\s+years?/gi)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const jobYears = [...jobText.matchAll(/(\d+)\+?\s+years?/gi)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);

  const cvMax = cvYears.length ? Math.max(...cvYears) : 0;
  const jobMax = jobYears.length ? Math.max(...jobYears) : 0;

  if (!jobMax) {
    const hasExperience = /\bexperience|employment|worked|managed|delivered\b/i.test(cvText);
    return {
      matched: hasExperience ? ["Relevant experience evidence detected"] : [],
      missing: hasExperience ? [] : ["Clear experience evidence"],
      score: hasExperience ? 72 : 42,
    };
  }

  const score = cvMax
    ? clamp((Math.min(cvMax, jobMax) / jobMax) * 100)
    : 35;

  return {
    matched: cvMax ? [`${cvMax} year experience signal`] : [],
    missing: cvMax < jobMax ? [`Job indicates approximately ${jobMax} years`] : [],
    score,
  };
}

function atsScore(cvText: string, jobText: string): {
  matched: string[];
  missing: string[];
  score: number;
} {
  const result = overlap(cvText, jobText);
  const hasHeadings = /\b(summary|experience|education|skills|certifications)\b/i.test(cvText);
  const metric = /\d|%|R\s?\d|[$€£]\s?\d/.test(cvText);
  const score = clamp(result.score * 0.72 + (hasHeadings ? 16 : 7) + (metric ? 12 : 4));

  return {
    matched: [
      ...result.matched.slice(0, 8),
      ...(hasHeadings ? ["Recognisable CV structure"] : []),
      ...(metric ? ["Quantified evidence"] : []),
    ],
    missing: [
      ...result.missing.slice(0, 8),
      ...(!hasHeadings ? ["Standard CV section headings"] : []),
      ...(!metric ? ["Quantified achievements"] : []),
    ],
    score,
  };
}

function explanationFor(
  label: string,
  score: number,
  matched: string[],
  missing: string[],
): string {
  if (score >= 80) {
    return `${label} is strongly supported by ${matched.slice(0, 3).join(", ") || "the available CV evidence"}.`;
  }
  if (score >= 60) {
    return `${label} shows useful alignment, but ${missing.slice(0, 2).join(" and ") || "additional evidence"} would strengthen the application.`;
  }
  return `${label} is currently under-evidenced. Add verified proof for ${missing.slice(0, 3).join(", ") || "the role requirements"}.`;
}

function dimension(
  key: JobMatchDimension,
  label: string,
  weight: number,
  result: { matched: string[]; missing: string[]; score: number },
): MatchDimensionResult {
  return {
    key,
    label,
    weight,
    score: result.score,
    matched: result.matched,
    missing: result.missing,
    explanation: explanationFor(label, result.score, result.matched, result.missing),
  };
}

export function calculateJobMatch(input: JobMatchInput): JobMatchResult {
  const cvText = stringify(input.cvContent);
  const jobText = `${input.targetRole}\n${input.jobDescription}`.trim();

  const skillResult = termScore(cvText, jobText, SKILL_TERMS);
  const experienceResult = experienceScore(cvText, jobText);
  const educationResult = termScore(cvText, jobText, EDUCATION_TERMS);
  const atsResult = atsScore(cvText, jobText);
  const leadershipResult = termScore(cvText, jobText, LEADERSHIP_TERMS);
  const technicalResult = overlap(
    SKILL_TERMS.filter((term) => normalize(jobText).includes(term)).join(" "),
    cvText,
  );
  const achievementResult = termScore(cvText, jobText, ACHIEVEMENT_TERMS);
  const seniorityResult = termScore(cvText, jobText, SENIORITY_TERMS);

  const dimensions: MatchDimensionResult[] = [
    dimension("skills", "Skills match", 24, skillResult),
    dimension("experience", "Experience fit", 18, experienceResult),
    dimension("education", "Education alignment", 8, educationResult),
    dimension("ats", "ATS compatibility", 18, atsResult),
    dimension("leadership", "Leadership evidence", 10, leadershipResult),
    dimension("technical", "Technical capability", 9, technicalResult),
    dimension("achievements", "Achievement evidence", 8, achievementResult),
    dimension("seniority", "Seniority fit", 5, seniorityResult),
  ];

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const overallScore = clamp(
    dimensions.reduce((sum, item) => sum + item.score * item.weight, 0) /
      totalWeight,
  );

  const readinessBand =
    overallScore >= 82
      ? "Excellent alignment"
      : overallScore >= 68
        ? "Strong alignment"
        : overallScore >= 52
          ? "Moderate alignment"
          : "Developing alignment";

  const recommendation =
    overallScore >= 82
      ? "Priority application"
      : overallScore >= 68
        ? "Apply with targeted improvements"
        : overallScore >= 52
          ? "Strengthen before applying"
          : "Consider adjacent roles";

  const strengths = dimensions
    .filter((item) => item.score >= 70)
    .flatMap((item) => item.matched.slice(0, 2))
    .filter(Boolean)
    .slice(0, 8);

  const gaps = dimensions
    .filter((item) => item.score < 70)
    .flatMap((item) => item.missing.slice(0, 2))
    .filter(Boolean)
    .slice(0, 10);

  const evidence: MatchEvidence[] = dimensions.flatMap((item) =>
    item.matched.slice(0, 5).map((term) => ({
      term,
      source: "cv" as const,
      category: item.key,
    })),
  );

  const leading = dimensions
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase());

  const weakest = dimensions
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase());

  return {
    overallScore,
    readinessBand,
    recommendation,
    dimensions,
    strengths,
    gaps,
    evidence,
    explanation:
      overallScore >= 68
        ? `The application shows its strongest alignment in ${leading.join(" and ")}. The most valuable improvements are in ${weakest.join(" and ")}.`
        : `The current CV provides partial evidence for the role. Strengthening ${weakest.join(" and ")} would create a more defensible application.`,
    integrityNotes: [
      "The score measures documented alignment, not the probability of being hired.",
      "Only evidence found in the supplied CV and job description is assessed.",
      "Missing evidence does not prove the candidate lacks a skill.",
      "Salary, culture fit and employer decision-making are not inferred.",
      "Users should verify every claim before submitting an application.",
    ],
  };
}
