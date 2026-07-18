export type ResearchConfidence = "verified" | "inferred" | "candidate-input";
export type InterviewFormat =
  | "HR screening"
  | "Hiring manager"
  | "Technical"
  | "Panel"
  | "Case study"
  | "Assessment centre"
  | "Executive";

export interface CompanyResearchInput {
  companyName: string;
  website: string;
  industry: string;
  location: string;
  mission: string;
  values: string;
  productsServices: string;
  companyNotes: string;
  recentDevelopments: string;
}

export interface CompanySignal {
  label: string;
  explanation: string;
  confidence: ResearchConfidence;
}

export interface RolePurpose {
  headline: string;
  businessProblems: string[];
  first90Days: string[];
  first12Months: string[];
  likelyKpis: string[];
}

export interface CompanyCompetency {
  name: string;
  score: number;
  rationale: string;
  candidateEvidence: string[];
  interviewQuestion: string;
}

export interface CompanyInterviewQuestion {
  category: string;
  question: string;
  intent: string;
  answerFramework: string[];
}

export interface CompanyReadiness {
  skillsFit: number;
  experienceFit: number;
  cultureFit: number;
  technicalFit: number;
  industryKnowledge: number;
  leadershipFit: number;
  overall: number;
}

export interface CompanyIntelligenceReport {
  companyName: string;
  role: string;
  profileSignals: CompanySignal[];
  rolePurpose: RolePurpose;
  competencies: CompanyCompetency[];
  interviewFormats: InterviewFormat[];
  interviewQuestions: CompanyInterviewQuestion[];
  researchQuestions: string[];
  strategicQuestionsToAsk: string[];
  readiness: CompanyReadiness;
  candidateAdvantages: string[];
  preparationRisks: string[];
  generatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function lines(value: string): string[] {
  return unique(
    value
      .split(/\n|•|;|\r|\.(?=\s|$)/g)
      .map((item) => item.replace(/^[-–—\s]+/, "").trim())
      .filter((item) => item.length >= 3),
  );
}

function candidateText(cvContent: unknown): {
  skills: string[];
  achievements: string[];
  qualifications: string[];
  experienceCount: number;
} {
  const cv = record(cvContent);

  const skills = unique(
    array(cv.skills).flatMap((item) => {
      if (typeof item === "string") return [item];
      const entry = record(item);
      return [text(entry.name), text(entry.skill_name), text(entry.title)];
    }),
  );

  const achievements = unique(
    array(cv.experience).flatMap((item) => {
      const entry = record(item);
      return [
        text(entry.achievements),
        text(entry.description),
        text(entry.responsibilities),
        text(entry.summary),
      ];
    }),
  );

  const qualifications = unique(
    array(cv.education).flatMap((item) => {
      const entry = record(item);
      return [
        text(entry.qualification),
        text(entry.degree),
        text(entry.programme),
        text(entry.field_of_study),
        text(entry.institution),
      ];
    }),
  );

  return {
    skills,
    achievements,
    qualifications,
    experienceCount: array(cv.experience).length,
  };
}

function containsAny(source: string, terms: string[]): boolean {
  const lower = source.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function profileSignals(
  input: CompanyResearchInput,
  jobDescription: string,
): CompanySignal[] {
  const company = input.companyName || "Target company";
  const industry = input.industry || "the organisation's sector";

  const signals: CompanySignal[] = [
    {
      label: "Company context",
      explanation: input.companyNotes
        ? input.companyNotes
        : `${company} operates within ${industry}. Add verified company notes to strengthen this profile.`,
      confidence: input.companyNotes ? "candidate-input" : "inferred",
    },
    {
      label: "Mission and strategic direction",
      explanation: input.mission
        ? input.mission
        : "Mission information has not yet been entered. Research the official company website, annual report and careers pages.",
      confidence: input.mission ? "candidate-input" : "inferred",
    },
    {
      label: "Products and services",
      explanation: input.productsServices
        ? input.productsServices
        : `The job specification suggests the role contributes to ${inferBusinessArea(jobDescription)}.`,
      confidence: input.productsServices ? "candidate-input" : "inferred",
    },
    {
      label: "Values and culture",
      explanation: input.values
        ? input.values
        : "Values are not yet verified. Review the company's careers, sustainability and leadership pages.",
      confidence: input.values ? "candidate-input" : "inferred",
    },
    {
      label: "Recent developments",
      explanation: input.recentDevelopments
        ? input.recentDevelopments
        : "No recent developments were entered. Add current, date-stamped research before the interview.",
      confidence: input.recentDevelopments ? "candidate-input" : "inferred",
    },
  ];

  return signals;
}

function inferBusinessArea(jobDescription: string): string {
  const lower = jobDescription.toLowerCase();

  if (containsAny(lower, ["customer", "client", "service"])) return "customer and service outcomes";
  if (containsAny(lower, ["finance", "budget", "audit", "cost"])) return "financial control and commercial performance";
  if (containsAny(lower, ["operation", "production", "warehouse", "supply"])) return "operational delivery and efficiency";
  if (containsAny(lower, ["software", "system", "data", "technology"])) return "technology, systems and digital performance";
  if (containsAny(lower, ["people", "employee", "human resources", "talent"])) return "people, culture and organisational capability";
  if (containsAny(lower, ["safety", "quality", "compliance", "risk"])) return "risk, quality and compliance";
  return "the organisation's strategic and operational priorities";
}

function rolePurpose(role: string, jobDescription: string): RolePurpose {
  const lower = `${role} ${jobDescription}`.toLowerCase();
  const businessProblems: string[] = [];
  const kpis: string[] = [];

  if (containsAny(lower, ["customer", "client", "service"])) {
    businessProblems.push("Improve customer experience, responsiveness and service consistency.");
    kpis.push("Customer satisfaction", "Resolution time", "Service-level performance");
  }
  if (containsAny(lower, ["cost", "budget", "finance", "profit"])) {
    businessProblems.push("Control costs, improve financial visibility and protect commercial performance.");
    kpis.push("Budget variance", "Cost savings", "Forecast accuracy");
  }
  if (containsAny(lower, ["project", "deadline", "delivery", "programme"])) {
    businessProblems.push("Deliver priorities on time while controlling scope, dependencies and stakeholder expectations.");
    kpis.push("On-time delivery", "Milestone completion", "Schedule variance");
  }
  if (containsAny(lower, ["team", "lead", "manage", "people"])) {
    businessProblems.push("Strengthen team performance, accountability, engagement and capability.");
    kpis.push("Team productivity", "Retention", "Performance goals achieved");
  }
  if (containsAny(lower, ["quality", "risk", "safety", "compliance"])) {
    businessProblems.push("Reduce operational risk and ensure work meets required standards.");
    kpis.push("Audit findings", "Incident rate", "Quality compliance");
  }
  if (containsAny(lower, ["system", "technology", "software", "data"])) {
    businessProblems.push("Improve system reliability, data quality or digital efficiency.");
    kpis.push("System availability", "Defect rate", "Process automation");
  }

  if (!businessProblems.length) {
    businessProblems.push(
      `Enable the organisation to achieve stronger results through effective performance in the ${role} position.`,
      "Provide reliable execution, sound judgement and measurable value.",
    );
  }

  const first90Days = [
    "Understand the company strategy, team structure, customers and success measures.",
    "Build relationships with the manager, team and critical stakeholders.",
    "Assess current processes, risks, performance gaps and immediate priorities.",
    `Deliver one credible early improvement relevant to the ${role} role.`,
  ];

  const first12Months = [
    "Demonstrate consistent delivery against agreed performance indicators.",
    "Resolve or materially improve the business problems attached to the role.",
    "Build trusted cross-functional relationships and contribute beyond assigned tasks.",
    "Introduce sustainable improvements supported by evidence and measurable outcomes.",
  ];

  return {
    headline: `The ${role} role likely exists to strengthen ${inferBusinessArea(jobDescription)}.`,
    businessProblems: unique(businessProblems).slice(0, 6),
    first90Days,
    first12Months,
    likelyKpis: unique(kpis.length ? kpis : [
      "Quality of delivery",
      "Stakeholder satisfaction",
      "Productivity",
      "Achievement of role-specific targets",
    ]).slice(0, 8),
  };
}

const COMPETENCIES = [
  {
    name: "Customer Focus",
    terms: ["customer", "client", "service", "stakeholder"],
    rationale: "The company is likely to value decisions that improve customer and stakeholder outcomes.",
  },
  {
    name: "Operational Excellence",
    terms: ["operation", "process", "quality", "efficiency", "production", "delivery"],
    rationale: "The role appears connected to dependable execution, process control and continuous improvement.",
  },
  {
    name: "Innovation & Learning",
    terms: ["innovation", "digital", "technology", "improve", "change", "learn"],
    rationale: "The organisation may expect adaptability, learning speed and practical improvement.",
  },
  {
    name: "Leadership & Ownership",
    terms: ["lead", "manage", "supervise", "own", "accountable", "team"],
    rationale: "The role contains signals of accountability, influence and responsibility for outcomes.",
  },
  {
    name: "Collaboration",
    terms: ["team", "collaborate", "stakeholder", "cross-functional", "liaise"],
    rationale: "Success will likely depend on relationships, communication and cross-functional cooperation.",
  },
  {
    name: "Risk, Safety & Integrity",
    terms: ["risk", "safety", "compliance", "policy", "ethical", "integrity", "audit"],
    rationale: "The company is likely to test professional judgement, controls and responsible conduct.",
  },
  {
    name: "Commercial Awareness",
    terms: ["budget", "cost", "revenue", "profit", "commercial", "market"],
    rationale: "The vacancy contains signals that business impact and commercial trade-offs matter.",
  },
  {
    name: "Analytical Problem Solving",
    terms: ["analyse", "analyze", "data", "problem", "root cause", "decision"],
    rationale: "The interviewer may test how the candidate gathers evidence and reaches defensible decisions.",
  },
];

function competencyMap(
  input: CompanyResearchInput,
  jobDescription: string,
  cvContent: unknown,
): CompanyCompetency[] {
  const candidate = candidateText(cvContent);
  const source = [
    input.values,
    input.mission,
    input.companyNotes,
    input.recentDevelopments,
    jobDescription,
  ].join(" ");

  return COMPETENCIES.map((competency) => {
    const companyHits = competency.terms.filter((term) =>
      source.toLowerCase().includes(term),
    ).length;

    const evidence = [...candidate.skills, ...candidate.achievements]
      .filter((item) =>
        competency.terms.some((term) => item.toLowerCase().includes(term)),
      )
      .slice(0, 3);

    return {
      name: competency.name,
      score: clamp(42 + companyHits * 10 + evidence.length * 7),
      rationale: competency.rationale,
      candidateEvidence: evidence,
      interviewQuestion: `Tell us about a time you demonstrated ${competency.name.toLowerCase()} in a way that produced a measurable result.`,
    };
  })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function interviewFormats(role: string, jobDescription: string): InterviewFormat[] {
  const lower = `${role} ${jobDescription}`.toLowerCase();
  const formats: InterviewFormat[] = ["HR screening", "Hiring manager"];

  if (containsAny(lower, ["technical", "engineering", "software", "finance", "clinical", "audit"])) {
    formats.push("Technical");
  }
  if (containsAny(lower, ["manager", "lead", "director", "senior", "stakeholder"])) {
    formats.push("Panel");
  }
  if (containsAny(lower, ["case", "analyse", "strategy", "consult", "problem solving"])) {
    formats.push("Case study");
  }
  if (containsAny(lower, ["graduate", "trainee", "assessment", "group exercise"])) {
    formats.push("Assessment centre");
  }
  if (containsAny(lower, ["executive", "director", "head", "chief"])) {
    formats.push("Executive");
  }

  return unique(formats) as InterviewFormat[];
}

function questions(
  companyName: string,
  role: string,
  purpose: RolePurpose,
  competencies: CompanyCompetency[],
): CompanyInterviewQuestion[] {
  const company = companyName || "our organisation";

  return [
    {
      category: "Company motivation",
      question: `Why do you want to work for ${company}?`,
      intent: "Test whether the candidate has researched the organisation and can connect genuine motivation to the role.",
      answerFramework: [
        "One specific company fact or strategic priority",
        "Why it matters to you professionally",
        "How your experience enables contribution",
        "Why this role is the logical next step",
      ],
    },
    {
      category: "Role understanding",
      question: `What do you believe success as a ${role} would look like in the first year?`,
      intent: "Assess understanding of the vacancy, priorities and expected business outcomes.",
      answerFramework: [
        ...purpose.first90Days.slice(0, 2),
        ...purpose.first12Months.slice(0, 2),
      ],
    },
    {
      category: "Business impact",
      question: `Which business problem should the ${role} solve first?`,
      intent: "Test prioritisation, commercial judgement and awareness of the company context.",
      answerFramework: [
        purpose.businessProblems[0] || "Identify the most important business challenge",
        "Explain evidence and assumptions",
        "Propose first actions",
        "Define how success will be measured",
      ],
    },
    ...competencies.slice(0, 3).map((competency) => ({
      category: competency.name,
      question: competency.interviewQuestion,
      intent: `Evaluate ${competency.name.toLowerCase()} using real behavioural evidence.`,
      answerFramework: [
        "Situation and business context",
        "Your individual responsibility",
        "Actions and judgement",
        "Measured result",
        `How the lesson applies to ${company}`,
      ],
    })),
  ];
}

function readiness(
  cvContent: unknown,
  jobDescription: string,
  input: CompanyResearchInput,
  atsScore: number | null,
  competencies: CompanyCompetency[],
): CompanyReadiness {
  const candidate = candidateText(cvContent);
  const source = jobDescription.toLowerCase();
  const skillMatches = candidate.skills.filter((skill) =>
    source.includes(skill.toLowerCase()),
  ).length;

  const skillsFit = clamp(35 + skillMatches * 10 + (atsScore ?? 50) * 0.25);
  const experienceFit = clamp(35 + candidate.experienceCount * 10 + candidate.achievements.length * 3);
  const cultureFit = clamp(
    35 +
      lines(input.values).length * 8 +
      competencies.filter((item) => item.candidateEvidence.length).length * 5,
  );
  const technicalFit = clamp(
    35 +
      candidate.skills.length * 3 +
      candidate.qualifications.length * 4,
  );
  const industryKnowledge = clamp(
    25 +
      (input.industry ? 20 : 0) +
      (input.companyNotes ? 15 : 0) +
      (input.recentDevelopments ? 15 : 0) +
      (input.productsServices ? 10 : 0),
  );
  const leadershipFit = clamp(
    30 +
      candidate.achievements.filter((item) =>
        containsAny(item.toLowerCase(), ["lead", "manage", "supervise", "mentor", "team"]),
      ).length * 12,
  );

  const overall = clamp(
    skillsFit * 0.22 +
      experienceFit * 0.2 +
      cultureFit * 0.16 +
      technicalFit * 0.16 +
      industryKnowledge * 0.14 +
      leadershipFit * 0.12,
  );

  return {
    skillsFit,
    experienceFit,
    cultureFit,
    technicalFit,
    industryKnowledge,
    leadershipFit,
    overall,
  };
}

export function createCompanyIntelligenceReport(
  input: CompanyResearchInput,
  targetRole: string,
  jobDescription: string,
  cvContent: unknown,
  atsScore: number | null,
): CompanyIntelligenceReport {
  const companyName = input.companyName.trim() || "Target company";
  const role = targetRole.trim() || "Target Role";
  const purpose = rolePurpose(role, jobDescription);
  const competencies = competencyMap(input, jobDescription, cvContent);
  const candidate = candidateText(cvContent);
  const score = readiness(
    cvContent,
    jobDescription,
    input,
    atsScore,
    competencies,
  );

  const candidateAdvantages = unique([
    ...candidate.achievements.slice(0, 3),
    ...candidate.skills.slice(0, 3).map((skill) => `${skill} may support the company's role requirements.`),
    ...competencies
      .filter((item) => item.candidateEvidence.length)
      .slice(0, 2)
      .map((item) => `Evidence aligns with ${item.name}.`),
  ]).slice(0, 6);

  const preparationRisks = [
    !input.companyName ? "Company name has not been entered." : "",
    !input.mission ? "Mission and strategic direction are not yet verified." : "",
    !input.values ? "Company values and culture are not yet verified." : "",
    !input.recentDevelopments ? "No current, date-stamped company development has been added." : "",
    !jobDescription.trim() ? "No detailed job specification is available." : "",
    score.industryKnowledge < 60
      ? "Industry and company knowledge may not yet be strong enough for a company-specific interview."
      : "",
  ].filter(Boolean);

  return {
    companyName,
    role,
    profileSignals: profileSignals(input, jobDescription),
    rolePurpose: purpose,
    competencies,
    interviewFormats: interviewFormats(role, jobDescription),
    interviewQuestions: questions(companyName, role, purpose, competencies),
    researchQuestions: [
      `What are ${companyName}'s most important products, services and customer groups?`,
      `Which strategic priorities or challenges has ${companyName} publicly discussed recently?`,
      `How does ${companyName} describe its culture and values on its official careers pages?`,
      `Who are ${companyName}'s major competitors and what differentiates the organisation?`,
      `Which business outcomes would justify hiring a ${role}?`,
      `What recent company development can be used naturally in an interview answer or question?`,
    ],
    strategicQuestionsToAsk: [
      `What are the most important outcomes you expect from the ${role} during the first 90 days?`,
      "Which current business challenge will this role have the greatest responsibility for solving?",
      "How will performance be measured, and which indicators matter most to the hiring manager?",
      "How would you describe the team culture and the behaviours of people who succeed here?",
      "What major changes or strategic priorities will affect this role over the next 12 months?",
      "Is there any concern about my experience that I can address before we conclude?",
    ],
    readiness: score,
    candidateAdvantages,
    preparationRisks,
    generatedAt: new Date().toISOString(),
  };
}
