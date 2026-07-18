export type CopilotTone =
  | "professional"
  | "confident"
  | "executive"
  | "warm";

export type CopilotInput = {
  cvContent: unknown;
  jobDescription: string;
  targetRole: string;
  companyName: string;
  hiringManager?: string;
  tone: CopilotTone;
};

export type InterviewQuestion = {
  id: string;
  category:
    | "role"
    | "behavioural"
    | "technical"
    | "leadership"
    | "commercial";
  question: string;
  answerFramework: string[];
  evidencePrompt: string;
};

export type RecruiterBrief = {
  headline: string;
  fitSummary: string;
  strengths: string[];
  risks: string[];
  interviewFocus: string[];
};

export type SuccessPlanItem = {
  period: "First 30 days" | "Days 31–60" | "Days 61–90";
  objective: string;
  actions: string[];
  indicators: string[];
};

export type ApplicationCopilotReport = {
  coverLetter: string;
  recruiterBrief: RecruiterBrief;
  interviewQuestions: InterviewQuestion[];
  successPlan: SuccessPlanItem[];
  negotiationPoints: string[];
  applicationChecklist: Array<{
    label: string;
    status: "ready" | "review" | "missing";
    explanation: string;
  }>;
};

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "your",
  "you", "are", "our", "their", "they", "has", "have", "had", "into",
  "using", "use", "job", "role", "work", "team", "years", "year",
  "experience", "required", "preferred", "candidate", "skills", "ability",
]);

const ACTION_VERBS = [
  "led", "managed", "delivered", "improved", "developed", "implemented",
  "reduced", "increased", "created", "coordinated", "designed", "built",
  "supported", "resolved", "streamlined", "optimised", "optimized",
];

function flattenText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
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

function topKeywords(text: string, limit = 12): string[] {
  const frequencies = new Map<string, number>();

  for (const word of words(text)) {
    if (STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function extractName(cvContent: unknown): string {
  if (!cvContent || typeof cvContent !== "object") return "Candidate";
  const record = cvContent as Record<string, unknown>;

  const direct = [
    record.fullName,
    record.full_name,
    record.name,
  ].find((value) => typeof value === "string" && value.trim());

  if (typeof direct === "string") return direct;

  const user = record.user;
  if (user && typeof user === "object") {
    const userRecord = user as Record<string, unknown>;
    const value = userRecord.full_name ?? userRecord.fullName ?? userRecord.name;
    if (typeof value === "string" && value.trim()) return value;
  }

  const profile = record.profile;
  if (profile && typeof profile === "object") {
    const profileRecord = profile as Record<string, unknown>;
    const value =
      profileRecord.full_name ??
      profileRecord.fullName ??
      profileRecord.name;
    if (typeof value === "string" && value.trim()) return value;
  }

  return "Candidate";
}

function extractEvidenceStatements(cvText: string): string[] {
  const statements = cvText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 30);

  const ranked = statements
    .map((statement) => {
      const lower = statement.toLowerCase();
      let score = 0;

      if (/\d|%|R\s?\d|[$€£]\s?\d/i.test(statement)) score += 5;
      if (ACTION_VERBS.some((verb) => lower.includes(verb))) score += 3;
      if (/revenue|cost|quality|delivery|customer|risk|safety|performance|efficiency/i.test(statement)) {
        score += 3;
      }

      return { statement, score };
    })
    .sort((left, right) => right.score - left.score);

  return ranked
    .filter((item) => item.score > 0)
    .slice(0, 5)
    .map((item) => item.statement);
}

function toneOpening(tone: CopilotTone): string {
  switch (tone) {
    case "executive":
      return "I am writing to express my interest";
    case "confident":
      return "I am excited to apply";
    case "warm":
      return "I was pleased to discover the opportunity";
    default:
      return "I am writing to apply";
  }
}

function buildCoverLetter(input: CopilotInput, cvText: string): string {
  const name = extractName(input.cvContent);
  const manager = input.hiringManager?.trim() || "Hiring Manager";
  const company = input.companyName.trim() || "your organisation";
  const role = input.targetRole.trim() || "the advertised role";
  const evidence = extractEvidenceStatements(cvText);
  const keywords = topKeywords(input.jobDescription, 8);

  const evidenceParagraph = evidence.length
    ? `My background includes ${evidence
        .slice(0, 2)
        .map((item) => item.replace(/[.]+$/, ""))
        .join("; and ")}.`
    : "My experience has developed strong capability in delivering reliable work, collaborating with stakeholders and improving outcomes. I would welcome the opportunity to discuss the verified results and scale behind my contributions.";

  const alignment = keywords.length
    ? `The vacancy's emphasis on ${keywords.slice(0, 5).join(", ")} aligns closely with the direction of my experience and professional development.`
    : "The responsibilities described in the vacancy align closely with my experience and professional goals.";

  return [
    `Dear ${manager},`,
    "",
    `${toneOpening(input.tone)} for the ${role} position at ${company}. ${alignment}`,
    "",
    evidenceParagraph,
    "",
    `I would bring a disciplined, results-focused approach to ${company}. I am particularly interested in contributing through strong ownership, clear communication and evidence-based improvement. I have intentionally avoided including unsupported figures in this letter; any performance claims can be discussed and substantiated during the selection process.`,
    "",
    `Thank you for considering my application. I would welcome the opportunity to discuss how my experience can support the priorities of the ${role} position.`,
    "",
    "Yours sincerely,",
    name,
  ].join("\n");
}

function buildRecruiterBrief(
  input: CopilotInput,
  cvText: string,
): RecruiterBrief {
  const keywords = topKeywords(input.jobDescription, 14);
  const cvLower = cvText.toLowerCase();
  const matched = keywords.filter((keyword) => cvLower.includes(keyword));
  const missing = keywords.filter((keyword) => !cvLower.includes(keyword));
  const evidence = extractEvidenceStatements(cvText);

  const strengths = [
    matched.length
      ? `Demonstrates alignment with ${matched.slice(0, 5).join(", ")}.`
      : "Shows transferable capability relevant to the target role.",
    evidence.length
      ? "Includes evidence-led statements that can support competency-based interviewing."
      : "Presents a clear base profile that can be strengthened with verified outcomes.",
    "Uses a structured CV and application workflow suitable for ATS and recruiter review.",
  ];

  const risks = [
    ...(missing.length
      ? [`Several vacancy terms are not yet evidenced: ${missing.slice(0, 6).join(", ")}.`]
      : []),
    ...(evidence.length < 2
      ? ["Limited quantified outcomes may weaken recruiter confidence."]
      : []),
    "Any numerical claims should be verified and defensible during interview.",
  ];

  return {
    headline: `${input.targetRole || "Candidate"} application briefing`,
    fitSummary:
      matched.length >= Math.max(4, Math.ceil(keywords.length * 0.45))
        ? "Strong initial alignment. The application should focus on verified business impact and role-specific examples."
        : "Moderate alignment. The application requires stronger evidence of the vacancy's priority capabilities.",
    strengths,
    risks,
    interviewFocus: [
      "Ask for one detailed example of measurable impact.",
      "Validate ownership versus team contribution.",
      "Test decision-making under pressure.",
      "Explore stakeholder management and communication.",
      "Confirm the candidate's understanding of the role's first-year priorities.",
    ],
  };
}

function buildInterviewQuestions(
  input: CopilotInput,
): InterviewQuestion[] {
  const keywords = topKeywords(input.jobDescription, 8);
  const role = input.targetRole || "this role";

  const keywordQuestions = keywords.slice(0, 3).map((keyword, index) => ({
    id: `keyword-${index}`,
    category: "technical" as const,
    question: `Tell us about your practical experience with ${keyword}.`,
    answerFramework: [
      "Define the context and business need.",
      "Explain your direct responsibility.",
      "Describe the method, tools or decision used.",
      "State the verified result and lesson learned.",
    ],
    evidencePrompt:
      "Prepare a truthful example with scale, timeframe and a measurable outcome.",
  }));

  return [
    {
      id: "motivation",
      category: "role",
      question: `Why are you interested in ${role}, and why now?`,
      answerFramework: [
        "Connect the role to your career direction.",
        "Reference two priorities from the vacancy.",
        "Explain the value you can contribute.",
        "Close with why the organisation is a strong match.",
      ],
      evidencePrompt:
        "Use specific vacancy language without repeating the job description.",
    },
    {
      id: "achievement",
      category: "behavioural",
      question: "Describe your most relevant professional achievement.",
      answerFramework: [
        "Situation: explain the problem.",
        "Task: clarify your personal accountability.",
        "Action: describe the decisions and work completed.",
        "Result: give a verified KPI, outcome or lesson.",
      ],
      evidencePrompt:
        "Prepare a result you can defend with records, references or a clear explanation.",
    },
    {
      id: "leadership",
      category: "leadership",
      question: "Tell us about a time you influenced people without relying on authority.",
      answerFramework: [
        "Identify the stakeholders and competing interests.",
        "Explain how you built trust.",
        "Describe the decision or change achieved.",
        "State the impact and what you learned.",
      ],
      evidencePrompt:
        "Choose an example that shows communication, judgement and ownership.",
    },
    {
      id: "commercial",
      category: "commercial",
      question: "How would you measure success in your first six months?",
      answerFramework: [
        "Identify three role-relevant KPIs.",
        "Explain how you would establish a baseline.",
        "Describe stakeholder reporting.",
        "Show how you would improve performance responsibly.",
      ],
      evidencePrompt:
        "Use KPIs such as quality, delivery, cost, risk, customer outcomes or productivity.",
    },
    ...keywordQuestions,
  ];
}

function buildSuccessPlan(input: CopilotInput): SuccessPlanItem[] {
  const keywords = topKeywords(input.jobDescription, 6);
  const focus = keywords.length ? keywords : ["stakeholders", "delivery", "quality"];

  return [
    {
      period: "First 30 days",
      objective: "Understand the business, expectations and performance baseline.",
      actions: [
        "Meet key stakeholders and clarify decision rights.",
        `Review current processes relating to ${focus.slice(0, 2).join(" and ")}.`,
        "Confirm role priorities, risks and reporting cadence.",
      ],
      indicators: [
        "Stakeholder map completed",
        "Baseline KPIs agreed",
        "Priority risks documented",
      ],
    },
    {
      period: "Days 31–60",
      objective: "Deliver early improvements and establish operating credibility.",
      actions: [
        "Prioritise one high-value, low-risk improvement.",
        "Create a transparent delivery plan with owners and deadlines.",
        `Strengthen performance visibility across ${focus.slice(2, 4).join(" and ") || "core responsibilities"}.`,
      ],
      indicators: [
        "First improvement delivered",
        "Clear action tracker established",
        "Regular performance reporting active",
      ],
    },
    {
      period: "Days 61–90",
      objective: "Scale what works and present a sustainable performance roadmap.",
      actions: [
        "Evaluate early results against the agreed baseline.",
        "Standardise successful processes.",
        "Present a six-to-twelve-month improvement roadmap.",
      ],
      indicators: [
        "Verified early results",
        "Repeatable process documented",
        "Longer-term roadmap approved",
      ],
    },
  ];
}

export function createApplicationCopilotReport(
  input: CopilotInput,
): ApplicationCopilotReport {
  const cvText = flattenText(input.cvContent).replace(/\s+/g, " ").trim();
  const jobReady = input.jobDescription.trim().length >= 120;
  const companyReady = input.companyName.trim().length >= 2;
  const roleReady = input.targetRole.trim().length >= 2;
  const evidence = extractEvidenceStatements(cvText);

  return {
    coverLetter: buildCoverLetter(input, cvText),
    recruiterBrief: buildRecruiterBrief(input, cvText),
    interviewQuestions: buildInterviewQuestions(input),
    successPlan: buildSuccessPlan(input),
    negotiationPoints: [
      "Research a market-aligned salary range before the interview.",
      "Discuss total reward: salary, benefits, flexibility, development and performance incentives.",
      "Anchor the conversation in role scope, verified experience and expected value.",
      "Do not disclose fabricated competing offers or unsupported current earnings.",
      "Ask when salary review and performance evaluation normally occur.",
    ],
    applicationChecklist: [
      {
        label: "Complete job description",
        status: jobReady ? "ready" : "missing",
        explanation: jobReady
          ? "Enough vacancy detail is available for tailored preparation."
          : "Paste the full vacancy to improve relevance.",
      },
      {
        label: "Target role defined",
        status: roleReady ? "ready" : "missing",
        explanation: roleReady
          ? "The application has a clear role target."
          : "Add the exact target role.",
      },
      {
        label: "Company context",
        status: companyReady ? "ready" : "review",
        explanation: companyReady
          ? "The company name is available for personalisation."
          : "Add the organisation name before sending documents.",
      },
      {
        label: "Verified achievement evidence",
        status: evidence.length >= 2 ? "ready" : "review",
        explanation:
          evidence.length >= 2
            ? "The CV contains evidence-led statements for interview preparation."
            : "Add truthful KPI outcomes before making strong performance claims.",
      },
      {
        label: "Cover letter review",
        status: "review",
        explanation:
          "Review the generated letter for accuracy, tone and organisation-specific detail.",
      },
    ],
  };
}
