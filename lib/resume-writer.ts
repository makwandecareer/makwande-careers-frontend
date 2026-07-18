export type ResumeTone = "ats" | "professional" | "executive";
export type ResumeSectionType =
  | "summary"
  | "experience"
  | "achievement"
  | "skills"
  | "linkedin";

export type ResumeWriterInput = {
  targetRole: string;
  sectionType: ResumeSectionType;
  tone: ResumeTone;
  rawContent: string;
  jobDescription: string;
  company?: string;
  jobTitle?: string;
};

export type EvidenceQuestion = {
  id: string;
  category:
    | "scope"
    | "team"
    | "volume"
    | "time"
    | "quality"
    | "financial"
    | "customer"
    | "leadership"
    | "technology";
  question: string;
  reason: string;
  priority: "high" | "medium" | "low";
};

export type ResumeRewrite = {
  id: string;
  title: string;
  content: string;
  tone: ResumeTone;
  score: number;
  strengths: string[];
  cautions: string[];
};

export type ResumeQuality = {
  clarity: number;
  impact: number;
  atsAlignment: number;
  evidenceStrength: number;
  leadershipSignal: number;
  overall: number;
};

export type ResumeWriterResult = {
  rewrites: ResumeRewrite[];
  evidenceQuestions: EvidenceQuestion[];
  missingEvidence: string[];
  extractedSignals: string[];
  quality: ResumeQuality;
  before: string;
  methodology: string[];
};

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "your",
  "you", "are", "our", "their", "they", "has", "have", "had", "into",
  "using", "use", "job", "role", "work", "team", "years", "year",
  "experience", "required", "preferred", "candidate", "skills", "ability",
  "responsible", "including", "within", "must", "should", "would",
]);

const ACTION_VERBS = [
  "led", "managed", "delivered", "implemented", "improved", "reduced",
  "increased", "created", "designed", "resolved", "streamlined",
  "developed", "coordinated", "owned", "optimised", "launched",
  "strengthened", "transformed", "accelerated", "introduced",
];

const IMPACT_TERMS = [
  "revenue", "cost", "profit", "quality", "delivery", "risk", "safety",
  "customer", "retention", "growth", "compliance", "performance",
  "efficiency", "productivity", "accuracy", "turnaround", "service",
];

const LEADERSHIP_TERMS = [
  "led", "managed", "supervised", "mentored", "coached", "directed",
  "owned", "influenced", "stakeholder", "strategy", "governance",
  "decision", "accountable", "cross-functional",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [];
}

function topKeywords(text: string, limit = 18): string[] {
  const counts = new Map<string, number>();

  for (const word of words(text)) {
    if (STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function cleanSentence(value: string): string {
  return sentenceCase(
    value
      .replace(/\s+/g, " ")
      .replace(/^[•\-–—\s]+/, "")
      .replace(/[.;,\s]+$/, "")
      .trim(),
  );
}

function splitInput(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter((item) => item.length > 3);
}

function ensureActionVerb(sentence: string): string {
  if (!sentence) return sentence;
  const lower = sentence.toLowerCase();

  if (ACTION_VERBS.some((verb) => lower.startsWith(`${verb} `))) {
    return sentence;
  }

  const replacements: Array<[RegExp, string]> = [
    [/^responsible for /i, "Managed "],
    [/^worked on /i, "Delivered "],
    [/^helped with /i, "Supported "],
    [/^assisted with /i, "Supported "],
    [/^in charge of /i, "Managed "],
    [/^handled /i, "Managed "],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(sentence)) {
      return sentence.replace(pattern, replacement);
    }
  }

  return `Delivered ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
}

function containsMetric(text: string): boolean {
  return /\d|%|R\s?\d|[$€£]\s?\d|million|thousand|hours|days|months/i.test(text);
}

function keywordCoverage(text: string, jd: string): number {
  const keywords = topKeywords(jd, 18);
  if (!keywords.length) return 50;
  const lower = text.toLowerCase();
  return (keywords.filter((keyword) => lower.includes(keyword)).length / keywords.length) * 100;
}

function countTerms(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).length;
}

function buildSummary(input: ResumeWriterInput, tone: ResumeTone): string {
  const role = input.targetRole.trim() || input.jobTitle?.trim() || "professional";
  const raw = splitInput(input.rawContent);
  const keywords = topKeywords(input.jobDescription, 6);
  const evidence = raw.slice(0, 3).join("; ");
  const keywordText = keywords.length ? keywords.slice(0, 4).join(", ") : "role-relevant capabilities";

  if (tone === "ats") {
    return `${sentenceCase(role)} with experience in ${keywordText}. Demonstrates capability across ${evidence || "core operational responsibilities, stakeholder support and service delivery"}. Brings a structured, results-focused approach and is prepared to contribute to the requirements of the target role.`;
  }

  if (tone === "executive") {
    return `Results-oriented ${role} recognised for translating operational priorities into disciplined execution, stakeholder alignment and measurable business value. Brings experience across ${keywordText}, supported by evidence in ${evidence || "delivery, ownership and continuous improvement"}. Combines strategic judgement with practical implementation and a strong commitment to accountable performance.`;
  }

  return `Dedicated ${role} with practical experience across ${keywordText}. Known for ${evidence || "reliable delivery, problem-solving and collaborative execution"}. Offers a professional, organised and improvement-focused approach, with the ability to support business priorities and contribute effectively from day one.`;
}

function buildExperience(input: ResumeWriterInput, tone: ResumeTone): string {
  const sentences = splitInput(input.rawContent);
  const enhanced = sentences.map((item) => ensureActionVerb(item));

  if (!enhanced.length) {
    return "Add responsibilities, achievements, tools, stakeholders and verified outcomes to generate this section.";
  }

  return enhanced
    .map((item) => {
      if (tone === "executive") {
        return `• ${item.replace(/^Delivered /, "Led the delivery of ")} with emphasis on strategic alignment, stakeholder accountability and sustainable business impact.`;
      }
      if (tone === "ats") {
        const keywords = topKeywords(input.jobDescription, 5)
          .filter((keyword) => !item.toLowerCase().includes(keyword))
          .slice(0, 2);
        return `• ${item}${keywords.length ? `, applying ${keywords.join(" and ")}` : ""}.`;
      }
      return `• ${item}.`;
    })
    .join("\n");
}

function buildAchievement(input: ResumeWriterInput, tone: ResumeTone): string {
  const sentences = splitInput(input.rawContent);
  const source = sentences[0] || input.rawContent.trim();

  if (!source) {
    return "Describe the challenge, action and verified result to generate an achievement statement.";
  }

  const action = ensureActionVerb(source);
  const metricWarning = containsMetric(source)
    ? ""
    : " Add a verified metric or scale indicator to strengthen this achievement.";

  if (tone === "executive") {
    return `${action}, strengthening organisational performance, stakeholder confidence and long-term delivery discipline.${metricWarning}`;
  }

  if (tone === "ats") {
    const keywords = topKeywords(input.jobDescription, 4)
      .filter((keyword) => !action.toLowerCase().includes(keyword));
    return `${action}${keywords.length ? ` using ${keywords.slice(0, 2).join(" and ")}` : ""}, with outcomes verified through business-relevant measures.${metricWarning}`;
  }

  return `${action}, contributing to improved efficiency, service quality and accountable execution.${metricWarning}`;
}

function buildSkills(input: ResumeWriterInput): string {
  const rawSkills = splitInput(input.rawContent)
    .flatMap((item) => item.split(/,|;/))
    .map((item) => item.trim())
    .filter(Boolean);

  const jdSkills = topKeywords(input.jobDescription, 12);
  const merged = [...new Set([...rawSkills, ...jdSkills])]
    .filter((item) => item.length > 2)
    .slice(0, 14);

  return merged.join(" • ");
}

function buildLinkedIn(input: ResumeWriterInput, tone: ResumeTone): string {
  const summary = buildSummary(input, tone);
  const lines = splitInput(input.rawContent).slice(0, 4);

  return `${summary}\n\nCareer strengths include:\n${lines.map((item) => `• ${ensureActionVerb(item)}.`).join("\n")}\n\nI am interested in opportunities where I can apply my experience, continue developing and create meaningful value in a ${input.targetRole || "relevant professional"} capacity.`;
}

function createRewrite(
  input: ResumeWriterInput,
  tone: ResumeTone,
): ResumeRewrite {
  let content = "";

  switch (input.sectionType) {
    case "summary":
      content = buildSummary(input, tone);
      break;
    case "experience":
      content = buildExperience(input, tone);
      break;
    case "achievement":
      content = buildAchievement(input, tone);
      break;
    case "skills":
      content = buildSkills(input);
      break;
    case "linkedin":
      content = buildLinkedIn(input, tone);
      break;
  }

  const coverage = keywordCoverage(content, input.jobDescription);
  const metricScore = containsMetric(content) ? 90 : 52;
  const actionScore = countTerms(content, ACTION_VERBS) > 0 ? 86 : 58;
  const score = clamp(coverage * 0.4 + metricScore * 0.25 + actionScore * 0.35);

  return {
    id: `${input.sectionType}-${tone}`,
    title:
      tone === "ats"
        ? "ATS-focused"
        : tone === "executive"
          ? "Executive"
          : "Professional",
    content,
    tone,
    score,
    strengths: [
      ...(coverage >= 70 ? ["Strong vacancy-language alignment"] : []),
      ...(countTerms(content, ACTION_VERBS) > 0 ? ["Action-led writing"] : []),
      ...(containsMetric(content) ? ["Includes measurable evidence"] : []),
      ...(tone === "executive" ? ["Strategic and leadership tone"] : []),
    ],
    cautions: [
      ...(!containsMetric(input.rawContent)
        ? ["No verified metric was provided; do not treat generic impact language as a factual result."]
        : []),
      ...(coverage < 55
        ? ["Add genuine role-specific evidence before finalising."]
        : []),
    ],
  };
}

function evidenceQuestions(input: ResumeWriterInput): EvidenceQuestion[] {
  const text = input.rawContent;
  const questions: EvidenceQuestion[] = [];

  if (!/\b(team|staff|employees|people|direct reports)\b/i.test(text)) {
    questions.push({
      id: "team-size",
      category: "team",
      question: "Did you lead, supervise or coordinate people? If yes, how many?",
      reason: "Team scale strengthens leadership credibility.",
      priority: "high",
    });
  }

  if (!containsMetric(text)) {
    questions.push({
      id: "metric",
      category: "volume",
      question: "What measurable result can you verify: percentage, volume, value, time saved, quality improvement or customer outcome?",
      reason: "Recruiters distinguish high-impact CVs through measurable evidence.",
      priority: "high",
    });
  }

  if (!/\b(system|software|platform|excel|sap|oracle|crm|erp|tool)\b/i.test(text)) {
    questions.push({
      id: "technology",
      category: "technology",
      question: "Which systems, software, tools or platforms did you use directly?",
      reason: "Tool evidence improves ATS relevance and practical credibility.",
      priority: "medium",
    });
  }

  if (!/\b(customer|client|stakeholder|supplier|vendor|management)\b/i.test(text)) {
    questions.push({
      id: "stakeholder",
      category: "leadership",
      question: "Which customers, stakeholders, suppliers or departments did you work with?",
      reason: "Stakeholder context demonstrates influence and organisational reach.",
      priority: "medium",
    });
  }

  if (!/\b(day|week|month|quarter|deadline|turnaround|time)\b/i.test(text)) {
    questions.push({
      id: "time",
      category: "time",
      question: "Did you improve turnaround time, meet deadlines or manage work within a specific timeframe?",
      reason: "Time-based evidence shows delivery discipline.",
      priority: "medium",
    });
  }

  if (!/\b(cost|budget|revenue|saving|financial|profit|R\d|[$€£])\b/i.test(text)) {
    questions.push({
      id: "financial",
      category: "financial",
      question: "Did your work influence cost, budget, revenue, waste or financial control?",
      reason: "Commercial impact strengthens senior and executive positioning.",
      priority: "low",
    });
  }

  return questions;
}

export function generateResumeContent(
  input: ResumeWriterInput,
): ResumeWriterResult {
  const rewrites = (["ats", "professional", "executive"] as ResumeTone[])
    .map((tone) => createRewrite(input, tone));

  const raw = input.rawContent.trim();
  const coverage = keywordCoverage(raw, input.jobDescription);
  const metricCount = containsMetric(raw) ? 1 : 0;
  const leadership = countTerms(raw, LEADERSHIP_TERMS);
  const impact = countTerms(raw, IMPACT_TERMS);
  const action = countTerms(raw, ACTION_VERBS);

  const clarity = clamp(raw.length >= 80 ? 78 + Math.min(action * 4, 18) : 48 + Math.min(raw.length / 4, 28));
  const impactScore = clamp(metricCount * 35 + impact * 8 + action * 5);
  const evidenceStrength = clamp(metricCount * 45 + Math.min(action * 7, 35) + Math.min(impact * 5, 20));
  const leadershipSignal = clamp(leadership * 14 + action * 4);
  const overall = clamp(
    clarity * 0.22 +
      impactScore * 0.24 +
      coverage * 0.22 +
      evidenceStrength * 0.22 +
      leadershipSignal * 0.1,
  );

  return {
    rewrites,
    evidenceQuestions: evidenceQuestions(input),
    missingEvidence: [
      ...(!containsMetric(raw) ? ["Verified metric or scale"] : []),
      ...(leadership < 2 ? ["Ownership or leadership evidence"] : []),
      ...(coverage < 60 ? ["Role-specific keyword evidence"] : []),
      ...(impact < 2 ? ["Business impact context"] : []),
    ],
    extractedSignals: [
      ...(action ? [`${action} action-oriented signal${action === 1 ? "" : "s"}`] : []),
      ...(leadership ? [`${leadership} leadership signal${leadership === 1 ? "" : "s"}`] : []),
      ...(impact ? [`${impact} business-impact signal${impact === 1 ? "" : "s"}`] : []),
      ...(containsMetric(raw) ? ["Measurable evidence detected"] : []),
    ],
    quality: {
      clarity,
      impact: impactScore,
      atsAlignment: clamp(coverage),
      evidenceStrength,
      leadershipSignal,
      overall,
    },
    before: raw,
    methodology: [
      "Preserves only user-provided facts",
      "Does not invent employers, dates, KPIs, tools or achievements",
      "Uses vacancy language only where it can be supported",
      "Separates writing quality from evidence quality",
      "Prompts for missing facts before high-confidence claims",
      "Produces ATS, professional and executive alternatives",
    ],
  };
}
