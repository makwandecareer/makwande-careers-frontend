export type RecruiterDecision =
  | "strongly-recommend"
  | "recommend"
  | "review"
  | "not-ready";

export type RecruiterMetricKey =
  | "roleAlignment"
  | "evidenceStrength"
  | "atsReadiness"
  | "recruiterConfidence"
  | "hiringManagerConfidence"
  | "technicalConfidence"
  | "executivePotential"
  | "interviewReadiness";

export type RecruiterMetric = {
  key: RecruiterMetricKey;
  label: string;
  score: number;
  rationale: string;
};

export type PersonaReview = {
  id: "recruiter" | "hr" | "hiring-manager" | "technical" | "executive";
  title: string;
  decision: "advance" | "consider" | "hold";
  confidence: number;
  summary: string;
  positives: string[];
  concerns: string[];
  questions: string[];
};

export type RecruiterRisk = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  resolution: string;
};

export type CandidateSignal = {
  label: string;
  value: string;
  strength: "strong" | "moderate" | "weak";
};

export type RecruiterSimulationInput = {
  cvContent: unknown;
  jobDescription: string;
  targetRole: string;
  atsScore?: number | null;
};

export type RecruiterSimulationReport = {
  decision: RecruiterDecision;
  decisionLabel: string;
  overallScore: number;
  scoreExplanation: string;
  metrics: RecruiterMetric[];
  personas: PersonaReview[];
  strengths: string[];
  gaps: string[];
  risks: RecruiterRisk[];
  shortlistReasons: string[];
  rejectionTriggers: string[];
  candidateSignals: CandidateSignal[];
  finalRecommendation: string;
  nextBestActions: string[];
  methodology: string[];
};

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "your",
  "you", "are", "our", "their", "they", "has", "have", "had", "into",
  "using", "use", "job", "role", "work", "team", "years", "year",
  "experience", "required", "preferred", "candidate", "skills", "ability",
  "responsible", "including", "within", "must", "should", "would",
]);

const LEADERSHIP_TERMS = [
  "led", "managed", "supervised", "mentored", "directed", "owned",
  "influenced", "coached", "delegated", "stakeholder", "strategy",
  "strategic", "governance", "decision", "accountable",
];

const IMPACT_TERMS = [
  "reduced", "increased", "improved", "saved", "revenue", "cost",
  "productivity", "efficiency", "quality", "delivery", "risk", "safety",
  "customer", "retention", "growth", "profit", "compliance", "performance",
];

const TECH_TERMS = [
  "software", "system", "platform", "technology", "tool", "certification",
  "certified", "sql", "python", "excel", "sap", "oracle", "cloud", "api",
  "analytics", "data", "engineering", "technical", "project",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function flattenText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenText)
      .join(" ");
  }
  return "";
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

function termCoverage(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).length;
}

function measurableStatements(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 25)
    .filter((item) =>
      /\d|%|R\s?\d|[$€£]\s?\d|million|thousand|hours|days|months/i.test(item),
    );
}

function actionStatements(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) =>
      /\b(led|managed|delivered|implemented|improved|reduced|increased|created|designed|resolved|streamlined|developed|coordinated|owned)\b/i.test(item),
    );
}

function sectionPresence(text: string): number {
  const sections = [
    "summary", "profile", "experience", "education", "skills",
    "project", "certification", "language", "reference",
  ];
  return sections.filter((section) => text.toLowerCase().includes(section)).length;
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Strong";
  if (score >= 58) return "Developing";
  return "Needs attention";
}

function deriveDecision(score: number): RecruiterDecision {
  if (score >= 86) return "strongly-recommend";
  if (score >= 72) return "recommend";
  if (score >= 58) return "review";
  return "not-ready";
}

function decisionLabel(decision: RecruiterDecision): string {
  switch (decision) {
    case "strongly-recommend":
      return "Strongly recommend interview";
    case "recommend":
      return "Recommend interview";
    case "review":
      return "Further review required";
    default:
      return "Not yet shortlist-ready";
  }
}

export function simulateRecruiterReview(
  input: RecruiterSimulationInput,
): RecruiterSimulationReport {
  const cvText = flattenText(input.cvContent).replace(/\s+/g, " ").trim();
  const jdText = input.jobDescription.trim();
  const cvLower = cvText.toLowerCase();

  const keywords = topKeywords(jdText, 18);
  const matchedKeywords = keywords.filter((keyword) => cvLower.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !cvLower.includes(keyword));

  const keywordRate = keywords.length
    ? (matchedKeywords.length / keywords.length) * 100
    : 50;

  const quantified = measurableStatements(cvText);
  const actions = actionStatements(cvText);
  const leadershipCount = termCoverage(cvText, LEADERSHIP_TERMS);
  const impactCount = termCoverage(cvText, IMPACT_TERMS);
  const technicalCount = termCoverage(cvText, TECH_TERMS);
  const sections = sectionPresence(cvText);
  const wordCount = words(cvText).length;

  const roleAlignment = clamp(
    keywordRate * 0.72 +
      Math.min(actions.length * 3, 15) +
      Math.min(impactCount * 1.5, 13),
  );

  const evidenceStrength = clamp(
    Math.min(quantified.length * 12, 55) +
      Math.min(actions.length * 4, 25) +
      Math.min(impactCount * 2, 20),
  );

  const atsReadiness = clamp(
    input.atsScore != null
      ? input.atsScore
      : keywordRate * 0.75 + Math.min(sections * 4, 25),
  );

  const recruiterConfidence = clamp(
    roleAlignment * 0.38 +
      evidenceStrength * 0.27 +
      atsReadiness * 0.25 +
      Math.min(sections * 2, 10),
  );

  const hiringManagerConfidence = clamp(
    evidenceStrength * 0.42 +
      roleAlignment * 0.28 +
      Math.min(leadershipCount * 4, 18) +
      Math.min(impactCount * 3, 12),
  );

  const technicalConfidence = clamp(
    roleAlignment * 0.43 +
      Math.min(technicalCount * 6, 35) +
      evidenceStrength * 0.22,
  );

  const executivePotential = clamp(
    Math.min(leadershipCount * 7, 42) +
      Math.min(impactCount * 5, 35) +
      evidenceStrength * 0.23,
  );

  const interviewReadiness = clamp(
    recruiterConfidence * 0.34 +
      hiringManagerConfidence * 0.28 +
      technicalConfidence * 0.18 +
      evidenceStrength * 0.2,
  );

  const overallScore = clamp(
    roleAlignment * 0.2 +
      evidenceStrength * 0.2 +
      atsReadiness * 0.13 +
      recruiterConfidence * 0.17 +
      hiringManagerConfidence * 0.15 +
      technicalConfidence * 0.07 +
      executivePotential * 0.08,
  );

  const metrics: RecruiterMetric[] = [
    {
      key: "roleAlignment",
      label: "Role alignment",
      score: roleAlignment,
      rationale: `${matchedKeywords.length} of ${keywords.length || 0} priority vacancy terms are evidenced in the CV.`,
    },
    {
      key: "evidenceStrength",
      label: "Evidence strength",
      score: evidenceStrength,
      rationale: `${quantified.length} quantified statements and ${actions.length} action-led statements were detected.`,
    },
    {
      key: "atsReadiness",
      label: "ATS readiness",
      score: atsReadiness,
      rationale:
        input.atsScore != null
          ? "Uses the latest ATS score supplied by the platform."
          : "Estimated from keyword coverage and document structure.",
    },
    {
      key: "recruiterConfidence",
      label: "Recruiter confidence",
      score: recruiterConfidence,
      rationale: "Balances relevance, clarity, evidence and ATS suitability.",
    },
    {
      key: "hiringManagerConfidence",
      label: "Hiring manager confidence",
      score: hiringManagerConfidence,
      rationale: "Prioritises ownership, measurable impact and role-specific delivery.",
    },
    {
      key: "technicalConfidence",
      label: "Technical confidence",
      score: technicalConfidence,
      rationale: "Assesses tools, systems, projects and technical vocabulary present in the profile.",
    },
    {
      key: "executivePotential",
      label: "Executive potential",
      score: executivePotential,
      rationale: "Assesses leadership, commercial impact, influence and strategic language.",
    },
    {
      key: "interviewReadiness",
      label: "Interview readiness",
      score: interviewReadiness,
      rationale: "Reflects whether the CV contains enough defensible material for structured interview answers.",
    },
  ];

  const strengths = [
    ...(matchedKeywords.length
      ? [`Strongest role matches: ${matchedKeywords.slice(0, 6).join(", ")}.`]
      : []),
    ...(quantified.length
      ? [`Contains ${quantified.length} measurable achievement statement${quantified.length === 1 ? "" : "s"}.`]
      : []),
    ...(leadershipCount >= 3
      ? ["Shows visible leadership, ownership or stakeholder-management signals."]
      : []),
    ...(impactCount >= 3
      ? ["Demonstrates business-impact language beyond routine responsibilities."]
      : []),
    ...(technicalCount >= 3
      ? ["Includes credible technical, systems or project-delivery signals."]
      : []),
  ];

  if (!strengths.length) {
    strengths.push("The profile provides a usable foundation for targeted improvement.");
  }

  const gaps = [
    ...(missingKeywords.length
      ? [`Priority vacancy terms not yet evidenced: ${missingKeywords.slice(0, 8).join(", ")}.`]
      : []),
    ...(quantified.length < 2
      ? ["Insufficient verified KPI evidence to support high-confidence shortlisting."]
      : []),
    ...(leadershipCount < 2
      ? ["Leadership and ownership are not yet strongly demonstrated."]
      : []),
    ...(wordCount < 180
      ? ["The profile may be too brief to demonstrate full role depth."]
      : []),
  ];

  const risks: RecruiterRisk[] = [];
  if (quantified.length === 0) {
    risks.push({
      id: "no-kpis",
      severity: "high",
      title: "No measurable outcomes detected",
      explanation:
        "Recruiters may struggle to distinguish responsibilities from real performance.",
      resolution:
        "Add truthful results such as cost, time, quality, revenue, volume, risk or customer outcomes.",
    });
  }
  if (missingKeywords.length >= Math.max(5, Math.ceil(keywords.length * 0.45))) {
    risks.push({
      id: "keyword-gap",
      severity: "high",
      title: "Large role-alignment gap",
      explanation:
        "A significant portion of the vacancy's priority language is not supported by the CV.",
      resolution:
        "Add only the missing skills and responsibilities that the candidate can genuinely evidence.",
    });
  }
  if (leadershipCount < 2) {
    risks.push({
      id: "leadership-gap",
      severity: "medium",
      title: "Limited ownership evidence",
      explanation:
        "The CV may read as participation rather than accountability.",
      resolution:
        "Clarify decisions made, stakeholders influenced, problems solved and outcomes owned.",
    });
  }
  if (sections < 4) {
    risks.push({
      id: "structure",
      severity: "medium",
      title: "Incomplete career evidence",
      explanation:
        "Important sections may be missing or too lightly represented.",
      resolution:
        "Review summary, experience, skills, education, projects and certifications for completeness.",
    });
  }
  if (!risks.length) {
    risks.push({
      id: "verification",
      severity: "low",
      title: "Evidence verification",
      explanation:
        "The application appears strong, but all claims must remain defensible.",
      resolution:
        "Prepare supporting examples, dates, context and references before interview.",
    });
  }

  const personas: PersonaReview[] = [
    {
      id: "recruiter",
      title: "Recruiter review",
      decision: recruiterConfidence >= 75 ? "advance" : recruiterConfidence >= 58 ? "consider" : "hold",
      confidence: recruiterConfidence,
      summary:
        recruiterConfidence >= 75
          ? "The application is clear, relevant and suitable for recruiter shortlisting."
          : "The application has potential but needs stronger alignment and evidence before confident shortlisting.",
      positives: strengths.slice(0, 3),
      concerns: gaps.slice(0, 3),
      questions: [
        "Which achievement best demonstrates readiness for this role?",
        "What is the candidate's direct contribution versus team contribution?",
        "Why is this the right next career move?",
      ],
    },
    {
      id: "hr",
      title: "HR review",
      decision: atsReadiness >= 72 && sections >= 4 ? "advance" : "consider",
      confidence: clamp(atsReadiness * 0.65 + Math.min(sections * 5, 35)),
      summary:
        "Assesses professional presentation, completeness, consistency and interview preparedness.",
      positives: [
        `${scoreLabel(atsReadiness)} ATS and structure readiness.`,
        "The application can be evaluated without relying on sensitive personal attributes.",
      ],
      concerns: [
        ...(sections < 4 ? ["Some standard career sections may require completion."] : []),
        "Employment dates, qualifications and claims should be checked for consistency.",
      ],
      questions: [
        "Are employment dates and qualifications fully verifiable?",
        "What working environment helps the candidate perform at their best?",
        "What support or development would enable early success?",
      ],
    },
    {
      id: "hiring-manager",
      title: "Hiring manager review",
      decision: hiringManagerConfidence >= 75 ? "advance" : hiringManagerConfidence >= 58 ? "consider" : "hold",
      confidence: hiringManagerConfidence,
      summary:
        "Focuses on ownership, business results, decision-making and practical delivery.",
      positives: [
        ...strengths.filter((item) =>
          /measurable|leadership|impact|ownership/i.test(item),
        ),
        `${scoreLabel(evidenceStrength)} level of evidence for competency-based interviewing.`,
      ].slice(0, 3),
      concerns: [
        ...gaps.filter((item) =>
          /KPI|leadership|brief|depth/i.test(item),
        ),
        "Business impact should be explained with context, scale and personal accountability.",
      ].slice(0, 3),
      questions: [
        "What difficult decision did the candidate personally make?",
        "Which KPI improved and how was success measured?",
        "What would the candidate prioritise in the first 90 days?",
      ],
    },
    {
      id: "technical",
      title: "Technical review",
      decision: technicalConfidence >= 74 ? "advance" : technicalConfidence >= 55 ? "consider" : "hold",
      confidence: technicalConfidence,
      summary:
        "Assesses practical tools, systems, projects, domain depth and evidence of application.",
      positives: [
        `${technicalCount} technical or systems-related signals were detected.`,
        ...matchedKeywords
          .filter((keyword) => TECH_TERMS.some((term) => keyword.includes(term)))
          .slice(0, 2)
          .map((keyword) => `Relevant technical signal: ${keyword}.`),
      ],
      concerns: [
        ...(technicalCount < 3
          ? ["Technical depth may not yet be sufficiently evidenced."]
          : []),
        "Tools should be supported by examples of how they were applied.",
      ],
      questions: [
        "Which systems or tools did the candidate use directly?",
        "What was the most technically difficult problem solved?",
        "How does the candidate validate quality and accuracy?",
      ],
    },
    {
      id: "executive",
      title: "Executive review",
      decision: executivePotential >= 78 ? "advance" : executivePotential >= 58 ? "consider" : "hold",
      confidence: executivePotential,
      summary:
        "Evaluates strategic judgement, influence, commercial awareness and leadership maturity.",
      positives: [
        ...(leadershipCount >= 3
          ? ["Visible leadership and stakeholder signals."]
          : []),
        ...(impactCount >= 3
          ? ["Demonstrates awareness of business outcomes."]
          : []),
        `${scoreLabel(executivePotential)} executive-potential signal.`,
      ],
      concerns: [
        ...(executivePotential < 70
          ? ["Strategic and commercial contribution could be articulated more clearly."]
          : []),
        "Executive potential should be demonstrated through decisions and outcomes, not titles alone.",
      ],
      questions: [
        "How has the candidate influenced strategy or organisational priorities?",
        "What trade-off did the candidate manage between cost, quality, risk and speed?",
        "How does the candidate create accountability across stakeholders?",
      ],
    },
  ];

  const decision = deriveDecision(overallScore);

  return {
    decision,
    decisionLabel: decisionLabel(decision),
    overallScore,
    scoreExplanation:
      "This is an application-readiness assessment, not a prediction of an employer's final decision.",
    metrics,
    personas,
    strengths,
    gaps,
    risks,
    shortlistReasons: [
      ...strengths.slice(0, 4),
      ...(roleAlignment >= 75 ? ["High vacancy-language alignment."] : []),
      ...(evidenceStrength >= 75 ? ["Strong evidence base for structured interviews."] : []),
    ],
    rejectionTriggers: [
      ...(quantified.length === 0 ? ["Responsibilities without measurable outcomes."] : []),
      ...(missingKeywords.length >= 6 ? ["Insufficient evidence for core vacancy requirements."] : []),
      ...(leadershipCount < 2 ? ["Unclear ownership and decision-making."] : []),
      "Any inconsistent, exaggerated or unverifiable claim.",
    ],
    candidateSignals: [
      {
        label: "Seniority signal",
        value:
          executivePotential >= 78
            ? "Senior leadership potential"
            : leadershipCount >= 3
              ? "Emerging leadership"
              : "Individual contributor / developing leader",
        strength:
          executivePotential >= 78
            ? "strong"
            : leadershipCount >= 3
              ? "moderate"
              : "weak",
      },
      {
        label: "Evidence profile",
        value:
          quantified.length >= 4
            ? "KPI-rich"
            : quantified.length >= 2
              ? "Some measurable evidence"
              : "Primarily responsibility-based",
        strength:
          quantified.length >= 4
            ? "strong"
            : quantified.length >= 2
              ? "moderate"
              : "weak",
      },
      {
        label: "Role fit",
        value:
          roleAlignment >= 82
            ? "Highly aligned"
            : roleAlignment >= 65
              ? "Moderately aligned"
              : "Requires stronger targeting",
        strength:
          roleAlignment >= 82
            ? "strong"
            : roleAlignment >= 65
              ? "moderate"
              : "weak",
      },
      {
        label: "Interview evidence",
        value:
          interviewReadiness >= 80
            ? "Ready for structured interview"
            : interviewReadiness >= 62
              ? "Preparation required"
              : "Evidence bank needs development",
        strength:
          interviewReadiness >= 80
            ? "strong"
            : interviewReadiness >= 62
              ? "moderate"
              : "weak",
      },
    ],
    finalRecommendation:
      decision === "strongly-recommend"
        ? "Advance to interview. Focus the discussion on verified achievements, role-specific decisions and leadership evidence."
        : decision === "recommend"
          ? "Recommend interview after minor application refinement. Strengthen the weakest KPI or keyword gaps before submission."
          : decision === "review"
            ? "Do not reject automatically. Conduct a focused review after improving evidence, role alignment and ownership language."
            : "The application is not yet shortlist-ready. Strengthen verified outcomes, vacancy alignment and professional evidence first.",
    nextBestActions: [
      ...(missingKeywords.length
        ? [`Address genuine experience related to: ${missingKeywords.slice(0, 5).join(", ")}.`]
        : []),
      ...(quantified.length < 3
        ? ["Add at least three truthful, measurable achievement statements."]
        : []),
      ...(leadershipCount < 3
        ? ["Clarify ownership, decisions, influence and stakeholder outcomes."]
        : []),
      "Prepare one defensible STAR example for each priority requirement.",
      "Review all claims for consistency, accuracy and supporting evidence.",
    ],
    methodology: [
      "Vacancy-keyword coverage",
      "Action and achievement language",
      "Verified KPI evidence signals",
      "Leadership and ownership language",
      "Business-impact language",
      "Technical and project evidence",
      "Document completeness and ATS readiness",
      "No sensitive personal traits are used in scoring",
    ],
  };
}
