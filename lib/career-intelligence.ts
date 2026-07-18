export type IntelligenceSeverity = "critical" | "important" | "recommended" | "passed";

export type IntelligenceMetricKey =
  | "atsCompatibility"
  | "keywordMatch"
  | "kpiEvidence"
  | "measurableResults"
  | "businessImpact"
  | "leadership"
  | "executivePresence"
  | "readability"
  | "sectionCompleteness"
  | "interviewReadiness";

export type IntelligenceMetric = {
  key: IntelligenceMetricKey;
  label: string;
  score: number;
  explanation: string;
};

export type IntelligenceFinding = {
  id: string;
  severity: IntelligenceSeverity;
  title: string;
  explanation: string;
  evidence?: string;
  recommendation: string;
};

export type RewriteSuggestion = {
  id: string;
  current: string;
  suggestedStructure: string;
  whyItWorks: string;
  evidenceNeeded: string[];
};

export type CareerIntelligenceReport = {
  overallScore: number;
  verdict: "Application ready" | "Nearly ready" | "Needs strengthening";
  metrics: IntelligenceMetric[];
  findings: IntelligenceFinding[];
  missingKeywords: string[];
  matchedKeywords: string[];
  rewriteSuggestions: RewriteSuggestion[];
  strategicQuestions: string[];
};

const ACTION_VERBS = [
  "accelerated", "achieved", "automated", "built", "coordinated", "created",
  "delivered", "designed", "developed", "directed", "drove", "established",
  "executed", "generated", "grew", "implemented", "improved", "increased",
  "launched", "led", "managed", "negotiated", "optimized", "reduced",
  "resolved", "saved", "scaled", "streamlined", "strengthened", "transformed",
];

const LEADERSHIP_TERMS = [
  "led", "managed", "directed", "mentored", "coached", "supervised",
  "stakeholder", "cross-functional", "strategy", "strategic", "ownership",
  "decision", "governance", "budget", "team", "portfolio",
];

const IMPACT_TERMS = [
  "revenue", "profit", "cost", "saving", "efficiency", "productivity",
  "quality", "compliance", "risk", "safety", "customer satisfaction",
  "retention", "conversion", "growth", "downtime", "turnaround",
  "throughput", "accuracy", "delivery", "performance",
];

const WEAK_PHRASES = [
  "responsible for", "helped with", "worked on", "assisted with",
  "involved in", "duties included", "tasked with", "participated in",
];

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "your",
  "you", "are", "our", "their", "they", "has", "have", "had", "into",
  "using", "use", "job", "role", "work", "team", "years", "year",
  "experience", "required", "preferred", "candidate", "skills", "ability",
]);

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function flattenText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flattenText).join(" ");
  }
  return "";
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12);
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [];
}

function keywordFrequency(text: string): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const word of words(text)) {
    if (STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  return frequency;
}

function extractKeywords(jobDescription: string): string[] {
  const frequency = keywordFrequency(jobDescription);
  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 28)
    .map(([word]) => word);
}

function containsMeasurement(text: string): boolean {
  return /(?:\b\d+(?:[.,]\d+)?\s?%|\bR\s?\d|\b[$€£]\s?\d|\b\d+\s?(?:million|billion|thousand|k|m)\b|\b\d+\s?(?:days?|weeks?|months?|years?|hours?)\b|\b\d+\s?(?:people|employees|clients|customers|projects|sites|branches|systems|teams|users|applications|units|cases|tickets)\b)/i.test(text);
}

function calculateReadability(text: string): number {
  const sentenceList = sentences(text);
  if (!sentenceList.length) return 35;
  const wordList = words(text);
  const averageSentenceLength = wordList.length / sentenceList.length;
  const longSentencePenalty = Math.max(0, averageSentenceLength - 20) * 2.2;
  const veryLongWords = wordList.filter((word) => word.length > 13).length;
  const jargonPenalty = Math.min(18, (veryLongWords / Math.max(1, wordList.length)) * 120);
  return clamp(96 - longSentencePenalty - jargonPenalty);
}

function metric(
  key: IntelligenceMetricKey,
  label: string,
  score: number,
  explanation: string,
): IntelligenceMetric {
  return { key, label, score: clamp(score), explanation };
}

export function analyseCareerIntelligence(input: {
  cvContent: unknown;
  jobDescription: string;
  targetRole?: string;
  backendAtsScore?: number | null;
}): CareerIntelligenceReport {
  const cvText = flattenText(input.cvContent).replace(/\s+/g, " ").trim();
  const cvLower = cvText.toLowerCase();
  const jobText = input.jobDescription.trim();
  const jobKeywords = extractKeywords(jobText);
  const matchedKeywords = jobKeywords.filter((keyword) => cvLower.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !cvLower.includes(keyword));

  const cvSentences = sentences(cvText);
  const measurableSentences = cvSentences.filter(containsMeasurement);
  const actionSentences = cvSentences.filter((sentence) =>
    ACTION_VERBS.some((verb) => sentence.toLowerCase().includes(verb)),
  );
  const leadershipHits = LEADERSHIP_TERMS.filter((term) => cvLower.includes(term)).length;
  const impactHits = IMPACT_TERMS.filter((term) => cvLower.includes(term)).length;
  const weakSentenceList = cvSentences.filter((sentence) =>
    WEAK_PHRASES.some((phrase) => sentence.toLowerCase().includes(phrase)),
  );

  const keywordMatch = jobKeywords.length
    ? (matchedKeywords.length / jobKeywords.length) * 100
    : 55;

  const measurableResults = cvSentences.length
    ? (measurableSentences.length / cvSentences.length) * 190
    : 25;

  const kpiEvidence = clamp(
    measurableResults * 0.72 +
    Math.min(28, impactHits * 4),
  );

  const leadership = clamp(
    38 +
    leadershipHits * 6 +
    Math.min(18, actionSentences.length * 1.5),
  );

  const businessImpact = clamp(
    32 +
    impactHits * 6 +
    measurableSentences.length * 5,
  );

  const executivePresence = clamp(
    leadership * 0.44 +
    businessImpact * 0.36 +
    Math.min(20, actionSentences.length * 2),
  );

  const readability = calculateReadability(cvText);

  const likelySections = [
    /summary|profile|objective/i,
    /experience|employment|career history/i,
    /education|qualification/i,
    /skills|competenc/i,
  ];
  const detectedSections = likelySections.filter((pattern) => pattern.test(cvText)).length;
  const sectionCompleteness = clamp(45 + detectedSections * 13);

  const atsCompatibility = clamp(
    (input.backendAtsScore ?? keywordMatch) * 0.64 +
    readability * 0.14 +
    sectionCompleteness * 0.12 +
    kpiEvidence * 0.10,
  );

  const interviewReadiness = clamp(
    atsCompatibility * 0.32 +
    keywordMatch * 0.20 +
    measurableResults * 0.18 +
    leadership * 0.13 +
    businessImpact * 0.17,
  );

  const metrics = [
    metric("atsCompatibility", "ATS compatibility", atsCompatibility,
      "Combined job-match, readability, structure and evidence score."),
    metric("keywordMatch", "Keyword match", keywordMatch,
      "Coverage of the most important terms detected in the vacancy."),
    metric("kpiEvidence", "KPI evidence", kpiEvidence,
      "Strength of operational, financial, customer, quality and delivery indicators."),
    metric("measurableResults", "Measurable results", measurableResults,
      "Proportion of statements supported by numbers, scale, time or quantified outcomes."),
    metric("businessImpact", "Business impact", businessImpact,
      "Evidence that work improved revenue, cost, quality, risk, delivery or productivity."),
    metric("leadership", "Leadership", leadership,
      "Signals of ownership, decision-making, stakeholder influence and team leadership."),
    metric("executivePresence", "Executive presence", executivePresence,
      "Clarity, authority and strategic impact conveyed by the CV narrative."),
    metric("readability", "Readability", readability,
      "Sentence clarity, scanability and recruiter-friendly language."),
    metric("sectionCompleteness", "Section completeness", sectionCompleteness,
      "Presence of the essential CV sections expected by recruiters and ATS tools."),
    metric("interviewReadiness", "Interview readiness", interviewReadiness,
      "Overall strength of evidence, relevance and recruiter confidence."),
  ];

  const findings: IntelligenceFinding[] = [];

  if (missingKeywords.length >= 6) {
    findings.push({
      id: "keyword-gap",
      severity: "critical",
      title: "Material job-description keyword gap",
      explanation: `${missingKeywords.length} high-frequency vacancy terms do not appear in the CV.`,
      recommendation: "Add only keywords that truthfully reflect your experience, qualifications or tools used.",
      evidence: missingKeywords.slice(0, 8).join(", "),
    });
  } else if (missingKeywords.length) {
    findings.push({
      id: "keyword-opportunity",
      severity: "important",
      title: "Keyword coverage can improve",
      explanation: "Several relevant vacancy terms are not yet represented.",
      recommendation: "Integrate the relevant terms naturally into the summary, skills and experience sections.",
      evidence: missingKeywords.slice(0, 6).join(", "),
    });
  } else {
    findings.push({
      id: "keyword-pass",
      severity: "passed",
      title: "Strong keyword alignment",
      explanation: "The CV covers the priority terms detected in the job description.",
      recommendation: "Keep the language natural and avoid repeating keywords unnecessarily.",
    });
  }

  if (measurableSentences.length < Math.max(2, Math.ceil(cvSentences.length * 0.12))) {
    findings.push({
      id: "measurement-gap",
      severity: "critical",
      title: "Too few measurable outcomes",
      explanation: "Most statements describe responsibilities rather than evidence of impact.",
      recommendation: "Add truthful scale, volume, percentage, time, cost, revenue, quality or delivery indicators.",
    });
  } else {
    findings.push({
      id: "measurement-pass",
      severity: "passed",
      title: "Measurable evidence is present",
      explanation: `${measurableSentences.length} statements contain quantified evidence.`,
      recommendation: "Confirm that each figure is accurate and can be explained during an interview.",
    });
  }

  if (weakSentenceList.length) {
    findings.push({
      id: "weak-language",
      severity: "important",
      title: "Passive responsibility language detected",
      explanation: `${weakSentenceList.length} statements use weak phrases such as “responsible for” or “assisted with”.`,
      recommendation: "Lead with a precise action verb, then state scope, method and outcome.",
      evidence: weakSentenceList[0],
    });
  }

  if (leadership < 65) {
    findings.push({
      id: "leadership-gap",
      severity: "recommended",
      title: "Ownership and leadership signals are limited",
      explanation: "The CV does not consistently show decisions, stakeholder influence or ownership.",
      recommendation: "Clarify where you led, decided, improved, mentored, coordinated or took accountability.",
    });
  }

  if (readability < 72) {
    findings.push({
      id: "readability",
      severity: "important",
      title: "Recruiter scanability needs improvement",
      explanation: "Some sentences may be too long or dense for fast review.",
      recommendation: "Use concise bullets of one to two lines and keep one primary achievement per bullet.",
    });
  }

  const rewriteSuggestions: RewriteSuggestion[] = weakSentenceList.slice(0, 5).map((current, index) => ({
    id: `rewrite-${index}`,
    current,
    suggestedStructure:
      "[Strong action verb] + [what you owned or improved] + [scope/scale] + [method] + [verified result].",
    whyItWorks:
      "This structure demonstrates ownership and business impact without inventing unsupported achievements.",
    evidenceNeeded: [
      "Scale or volume",
      "Time period",
      "Percentage or absolute improvement",
      "Cost, revenue, quality, risk or customer outcome",
    ],
  }));

  if (!rewriteSuggestions.length && cvSentences.length) {
    rewriteSuggestions.push({
      id: "rewrite-opportunity",
      current: cvSentences.find((sentence) => !containsMeasurement(sentence)) ?? cvSentences[0],
      suggestedStructure:
        "[Action verb] + [initiative] + [scope] + [verified KPI outcome].",
      whyItWorks:
        "A quantified result gives recruiters evidence of performance rather than a list of duties.",
      evidenceNeeded: [
        "How many people, clients, projects, systems or sites?",
        "What changed after your work?",
        "How much time, cost or risk was reduced?",
      ],
    });
  }

  const strategicQuestions = [
    "What was the business problem before you became involved?",
    "What decision or action did you personally own?",
    "What was the scale: budget, users, clients, sites, projects or team size?",
    "Which KPI changed because of your contribution?",
    "How was success measured and over what period?",
    "Can every numerical claim be defended in an interview?",
    `Does the career story clearly support the target role${input.targetRole ? ` of ${input.targetRole}` : ""}?`,
  ];

  const overallScore = clamp(
    metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length,
  );

  return {
    overallScore,
    verdict:
      overallScore >= 82
        ? "Application ready"
        : overallScore >= 65
          ? "Nearly ready"
          : "Needs strengthening",
    metrics,
    findings,
    missingKeywords,
    matchedKeywords,
    rewriteSuggestions,
    strategicQuestions,
  };
}
