export type RecruiterPersona =
  | "hr"
  | "hiring-manager"
  | "technical"
  | "executive"
  | "panel";

export type SeniorityLevel =
  | "graduate"
  | "junior"
  | "mid"
  | "senior"
  | "management"
  | "executive";

export interface CandidateEvidence {
  skills: string[];
  experienceYears: number;
  achievements: string[];
  qualifications: string[];
  projects: string[];
}

export interface JobRequirement {
  id: string;
  label: string;
  type:
    | "skill"
    | "experience"
    | "qualification"
    | "responsibility"
    | "competency";
  priority: "critical" | "important" | "supporting";
  matched: boolean;
  evidence: string[];
}

export interface CompetencySignal {
  name: string;
  score: number;
  evidence: string[];
  interviewFocus: string;
}

export interface RecruitmentScenario {
  id: string;
  title: string;
  context: string;
  challenge: string;
  expectedSignals: string[];
  followUps: string[];
  difficulty: "professional" | "advanced" | "executive";
}

export interface RecruiterBrief {
  persona: RecruiterPersona;
  objective: string;
  concerns: string[];
  likelyQuestions: string[];
  decisionSignals: string[];
}

export interface RecruitmentIntelligenceReport {
  role: string;
  seniority: SeniorityLevel;
  candidate: CandidateEvidence;
  requirements: JobRequirement[];
  competencies: CompetencySignal[];
  scenarios: RecruitmentScenario[];
  recruiterBriefs: RecruiterBrief[];
  matchScore: number;
  evidenceStrength: number;
  interviewComplexity: number;
  hiringRisks: string[];
  strongestSellingPoints: string[];
  preparationPriorities: string[];
  generatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function collectText(record: UnknownRecord, keys: string[]): string[] {
  return keys.map((key) => clean(record[key])).filter(Boolean);
}

function extractCandidateEvidence(cvContent: unknown): CandidateEvidence {
  const content = asRecord(cvContent);

  const skills = unique(
    asArray(content.skills).flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      return collectText(asRecord(entry), ["name", "skill_name", "title"]);
    }),
  );

  const experience = asArray(content.experience);
  const achievements = unique(
    experience.flatMap((entry) =>
      collectText(asRecord(entry), [
        "achievements",
        "description",
        "responsibilities",
        "summary",
      ]),
    ),
  );

  const qualifications = unique(
    asArray(content.education).flatMap((entry) =>
      collectText(asRecord(entry), [
        "qualification",
        "degree",
        "programme",
        "field_of_study",
        "institution",
      ]),
    ),
  );

  const projects = unique(
    asArray(content.projects).flatMap((entry) =>
      collectText(asRecord(entry), ["name", "title", "description"]),
    ),
  );

  const explicitYears = Number(content.total_experience_years ?? 0);
  const experienceYears = Number.isFinite(explicitYears) && explicitYears > 0
    ? Math.round(explicitYears)
    : Math.min(20, Math.max(0, experience.length * 2));

  return {
    skills,
    experienceYears,
    achievements,
    qualifications,
    projects,
  };
}

function inferSeniority(role: string, years: number): SeniorityLevel {
  const lower = role.toLowerCase();

  if (/(chief|ceo|cfo|coo|cto|executive|vice president|vp)/.test(lower)) {
    return "executive";
  }

  if (/(manager|head|director|lead|supervisor)/.test(lower)) {
    return "management";
  }

  if (/(senior|principal|specialist)/.test(lower) || years >= 8) {
    return "senior";
  }

  if (/(graduate|intern|trainee)/.test(lower) || years === 0) {
    return "graduate";
  }

  if (/(junior|assistant)/.test(lower) || years <= 2) {
    return "junior";
  }

  return "mid";
}

const COMPETENCY_LIBRARY: Array<{
  name: string;
  patterns: string[];
  interviewFocus: string;
}> = [
  {
    name: "Leadership",
    patterns: ["lead", "manage", "supervise", "mentor", "team", "strategy"],
    interviewFocus: "Ownership, influence, accountability and measurable team outcomes.",
  },
  {
    name: "Communication",
    patterns: ["communicat", "present", "report", "stakeholder", "client", "liaise"],
    interviewFocus: "Clarity, audience awareness, listening and professional judgement.",
  },
  {
    name: "Problem Solving",
    patterns: ["problem", "resolve", "analyse", "analyze", "root cause", "troubleshoot"],
    interviewFocus: "Structured thinking, evidence, options considered and final impact.",
  },
  {
    name: "Planning",
    patterns: ["plan", "schedule", "coordinate", "deadline", "organis", "priorit"],
    interviewFocus: "Prioritisation, dependencies, risk management and delivery control.",
  },
  {
    name: "Technical Expertise",
    patterns: ["technical", "system", "software", "engineering", "audit", "clinical", "design"],
    interviewFocus: "Depth of knowledge, standards, judgement and practical application.",
  },
  {
    name: "Risk & Compliance",
    patterns: ["risk", "compliance", "safety", "policy", "regulation", "quality"],
    interviewFocus: "Controls, escalation, documentation and responsible decision making.",
  },
  {
    name: "Commercial Awareness",
    patterns: ["budget", "cost", "revenue", "customer", "market", "profit", "business"],
    interviewFocus: "Business impact, trade-offs, value creation and customer outcomes.",
  },
  {
    name: "Adaptability",
    patterns: ["change", "adapt", "learn", "new", "pressure", "fast-paced"],
    interviewFocus: "Learning speed, resilience, reflection and behaviour under pressure.",
  },
];

function splitJobDescription(jobDescription: string): string[] {
  return unique(
    jobDescription
      .split(/\n|•|;|\.|\r/g)
      .map((line) => line.replace(/^[-–—\s]+/, "").trim())
      .filter((line) => line.length >= 12),
  ).slice(0, 30);
}

function requirementType(line: string): JobRequirement["type"] {
  const lower = line.toLowerCase();

  if (/(degree|diploma|certificate|qualification|bachelor|master)/.test(lower)) {
    return "qualification";
  }

  if (/(year|experience|proven track)/.test(lower)) {
    return "experience";
  }

  if (/(responsible|manage|deliver|coordinate|oversee|develop|maintain)/.test(lower)) {
    return "responsibility";
  }

  if (/(communication|leadership|teamwork|problem solving|attention to detail)/.test(lower)) {
    return "competency";
  }

  return "skill";
}

function priorityFor(line: string): JobRequirement["priority"] {
  const lower = line.toLowerCase();

  if (/(must|required|essential|minimum|mandatory)/.test(lower)) {
    return "critical";
  }

  if (/(preferred|advantage|desirable|beneficial)/.test(lower)) {
    return "supporting";
  }

  return "important";
}

function evidenceForRequirement(
  line: string,
  candidate: CandidateEvidence,
): string[] {
  const tokens = line
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  const corpus = [
    ...candidate.skills,
    ...candidate.achievements,
    ...candidate.qualifications,
    ...candidate.projects,
  ];

  return corpus
    .filter((item) => {
      const lower = item.toLowerCase();
      return tokens.some((token) => lower.includes(token));
    })
    .slice(0, 3);
}

function buildRequirements(
  jobDescription: string,
  candidate: CandidateEvidence,
): JobRequirement[] {
  const lines = splitJobDescription(jobDescription);

  return lines.map((line, index) => {
    const evidence = evidenceForRequirement(line, candidate);

    return {
      id: `requirement-${index + 1}`,
      label: line,
      type: requirementType(line),
      priority: priorityFor(line),
      matched: evidence.length > 0,
      evidence,
    };
  });
}

function competencyScore(
  text: string,
  candidate: CandidateEvidence,
  patterns: string[],
): { score: number; evidence: string[] } {
  const source = [
    text,
    ...candidate.skills,
    ...candidate.achievements,
    ...candidate.projects,
  ];

  const evidence = source
    .filter((item) => {
      const lower = item.toLowerCase();
      return patterns.some((pattern) => lower.includes(pattern));
    })
    .slice(0, 4);

  return {
    score: clamp(35 + evidence.length * 14, 25, 94),
    evidence,
  };
}

function buildCompetencies(
  jobDescription: string,
  candidate: CandidateEvidence,
): CompetencySignal[] {
  return COMPETENCY_LIBRARY.map((item) => {
    const result = competencyScore(
      jobDescription,
      candidate,
      item.patterns,
    );

    return {
      name: item.name,
      score: result.score,
      evidence: result.evidence,
      interviewFocus: item.interviewFocus,
    };
  })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function scenarioTemplates(role: string): Array<{
  title: string;
  context: string;
  challenge: string;
  signals: string[];
}> {
  const lower = role.toLowerCase();

  if (/(software|developer|engineer|it|data|cyber)/.test(lower)) {
    return [
      {
        title: "Critical production failure",
        context: "A core service fails during peak customer usage and senior management requests an immediate recovery plan.",
        challenge: "Explain your first 30 minutes, technical investigation, communication, risk control and permanent corrective action.",
        signals: ["triage", "root-cause analysis", "stakeholder communication", "service recovery", "post-incident learning"],
      },
      {
        title: "Security and delivery conflict",
        context: "A release is commercially urgent, but a security weakness is discovered shortly before deployment.",
        challenge: "Decide whether to proceed, delay or introduce controls, and defend your decision.",
        signals: ["risk judgement", "security awareness", "commercial awareness", "escalation", "accountability"],
      },
    ];
  }

  if (/(accountant|finance|audit|bookkeeper|financial)/.test(lower)) {
    return [
      {
        title: "Material financial discrepancy",
        context: "A month-end review reveals a material discrepancy shortly before executive reporting.",
        challenge: "Explain how you investigate, protect reporting integrity and communicate the issue.",
        signals: ["reconciliation", "controls", "professional ethics", "materiality", "executive communication"],
      },
      {
        title: "Audit finding under pressure",
        context: "An external auditor identifies a control weakness while leadership wants the matter resolved quietly.",
        challenge: "Describe your professional response and corrective action plan.",
        signals: ["independence", "governance", "documentation", "risk mitigation", "integrity"],
      },
    ];
  }

  if (/(nurse|clinical|medical|health|pharmac)/.test(lower)) {
    return [
      {
        title: "Rapid patient deterioration",
        context: "A patient’s condition deteriorates unexpectedly while the unit is under pressure.",
        challenge: "Walk through assessment, escalation, treatment support, documentation and family communication.",
        signals: ["patient safety", "clinical judgement", "escalation", "teamwork", "documentation"],
      },
      {
        title: "Medication safety concern",
        context: "You identify a potential medication error before administration.",
        challenge: "Explain the immediate response, reporting process and prevention steps.",
        signals: ["verification", "patient advocacy", "incident reporting", "professional accountability", "learning"],
      },
    ];
  }

  if (/(manager|director|head|executive|operations|project)/.test(lower)) {
    return [
      {
        title: "Delivery crisis and stakeholder conflict",
        context: "A strategic programme is behind schedule, over budget and facing strong client dissatisfaction.",
        challenge: "Present a recovery strategy covering people, scope, cost, governance and executive communication.",
        signals: ["strategic prioritisation", "commercial judgement", "leadership", "governance", "recovery planning"],
      },
      {
        title: "High performer creating team damage",
        context: "A high-performing employee delivers results but is damaging trust and team retention.",
        challenge: "Explain how you intervene while protecting performance and culture.",
        signals: ["courageous leadership", "performance management", "fairness", "culture", "coaching"],
      },
    ];
  }

  return [
    {
      title: "Competing priorities under pressure",
      context: `You are working as a ${role} when several urgent demands arrive at the same time.`,
      challenge: "Explain how you assess priorities, communicate trade-offs and maintain quality.",
      signals: ["prioritisation", "communication", "quality", "ownership", "time management"],
    },
    {
      title: "Unexpected service or process failure",
      context: "A process fails and affects customers, colleagues or operational delivery.",
      challenge: "Explain your immediate response, investigation and prevention plan.",
      signals: ["problem solving", "customer focus", "root-cause analysis", "teamwork", "continuous improvement"],
    },
  ];
}

function buildScenarios(
  role: string,
  seniority: SeniorityLevel,
  competencies: CompetencySignal[],
): RecruitmentScenario[] {
  const difficulty: RecruitmentScenario["difficulty"] =
    seniority === "executive"
      ? "executive"
      : seniority === "management" || seniority === "senior"
        ? "advanced"
        : "professional";

  return scenarioTemplates(role).map((template, index) => ({
    id: `scenario-${index + 1}`,
    title: template.title,
    context: template.context,
    challenge: template.challenge,
    expectedSignals: unique([
      ...template.signals,
      ...competencies.slice(0, 2).map((item) => item.name),
    ]),
    followUps: [
      "What information would you need before acting?",
      "What alternatives did you consider and reject?",
      "Which risks require escalation?",
      "How would you measure whether your response succeeded?",
      "What would you do differently if the problem happened again?",
    ],
    difficulty,
  }));
}

function recruiterBrief(
  persona: RecruiterPersona,
  role: string,
  seniority: SeniorityLevel,
  risks: string[],
): RecruiterBrief {
  const briefs: Record<RecruiterPersona, RecruiterBrief> = {
    hr: {
      persona,
      objective: "Assess motivation, communication, professionalism, values and career consistency.",
      concerns: ["Unclear motivation", "Weak cultural alignment", "Poor communication", ...risks.slice(0, 1)],
      likelyQuestions: [
        `Why are you interested in this ${role} position?`,
        "Tell me about yourself beyond the information already visible on your CV.",
        "Why are you considering a career move now?",
        "What type of working environment helps you perform at your best?",
      ],
      decisionSignals: ["Authenticity", "Professional maturity", "Clear motivation", "Cultural contribution"],
    },
    "hiring-manager": {
      persona,
      objective: "Determine whether the candidate can deliver the role, solve real problems and integrate with the team.",
      concerns: ["Evidence may be too general", "Insufficient ownership", "Limited role depth", ...risks.slice(0, 1)],
      likelyQuestions: [
        `What would your first 90 days as a ${role} look like?`,
        "Which achievement best proves you can perform this role?",
        "Describe a difficult decision you made with incomplete information.",
        "How do you balance speed, quality and stakeholder expectations?",
      ],
      decisionSignals: ["Relevant evidence", "Judgement", "Ownership", "Delivery discipline"],
    },
    technical: {
      persona,
      objective: "Test depth, practical judgement, standards, troubleshooting and ability to explain technical decisions.",
      concerns: ["Surface-level knowledge", "Weak practical examples", "Inability to defend decisions", ...risks.slice(0, 1)],
      likelyQuestions: [
        `Walk me through a technically complex ${role} assignment.`,
        "Which standards, controls or methods guide your work?",
        "Describe a technical failure and how you diagnosed it.",
        "How do you validate the quality and accuracy of your work?",
      ],
      decisionSignals: ["Technical depth", "Structured reasoning", "Quality awareness", "Learning agility"],
    },
    executive: {
      persona,
      objective: "Assess strategic judgement, business impact, leadership credibility and long-term value.",
      concerns: ["Too operational", "Limited commercial awareness", "Weak strategic narrative", ...risks.slice(0, 1)],
      likelyQuestions: [
        `What business problem should this ${role} solve?`,
        "Which strategic risk would you address first and why?",
        "How do you influence stakeholders who disagree with your recommendation?",
        "What measurable value would justify hiring you?",
      ],
      decisionSignals: ["Strategic thinking", "Commercial impact", "Executive communication", "Leadership confidence"],
    },
    panel: {
      persona,
      objective: "Evaluate consistency across HR, technical, operational and leadership perspectives.",
      concerns: ["Answers change between interviewers", "Poor audience awareness", "Unbalanced depth", ...risks.slice(0, 1)],
      likelyQuestions: [
        "Give us a concise overview of your suitability for this role.",
        "Describe a result that required collaboration across different functions.",
        "How would your previous manager describe your contribution?",
        "What concern might we reasonably have about appointing you?",
      ],
      decisionSignals: ["Consistency", "Composure", "Breadth", "Audience awareness"],
    },
  };

  const brief = briefs[persona];

  return {
    ...brief,
    objective:
      seniority === "executive"
        ? `${brief.objective} Executive-level evidence and board-ready communication are expected.`
        : brief.objective,
  };
}

export function createRecruitmentIntelligenceReport(
  cvContent: unknown,
  targetRole: string,
  jobDescription: string,
  atsScore: number | null,
): RecruitmentIntelligenceReport {
  const candidate = extractCandidateEvidence(cvContent);
  const role = targetRole.trim() || "Target Role";
  const seniority = inferSeniority(role, candidate.experienceYears);
  const requirements = buildRequirements(jobDescription, candidate);
  const competencies = buildCompetencies(jobDescription, candidate);

  const critical = requirements.filter(
    (item) => item.priority === "critical",
  );
  const matchedCritical = critical.filter((item) => item.matched).length;
  const matchedAll = requirements.filter((item) => item.matched).length;

  const requirementScore = requirements.length
    ? (matchedAll / requirements.length) * 100
    : 55;

  const criticalScore = critical.length
    ? (matchedCritical / critical.length) * 100
    : requirementScore;

  const safeAtsScore = atsScore === null ? 55 : clamp(atsScore);
  const evidenceStrength = clamp(
    candidate.achievements.length * 8 +
      candidate.projects.length * 5 +
      candidate.skills.length * 2 +
      candidate.qualifications.length * 3,
    20,
    95,
  );

  const matchScore = clamp(
    requirementScore * 0.38 +
      criticalScore * 0.27 +
      safeAtsScore * 0.2 +
      evidenceStrength * 0.15,
    15,
    97,
  );

  const hiringRisks = [
    critical.some((item) => !item.matched)
      ? "One or more critical job requirements lack visible evidence."
      : "",
    evidenceStrength < 60
      ? "Achievements may not contain enough measurable outcomes."
      : "",
    candidate.experienceYears < 2 && seniority !== "graduate"
      ? "Experience level may be challenged during the interview."
      : "",
    !jobDescription.trim()
      ? "No detailed job specification was supplied, limiting vacancy-specific intelligence."
      : "",
  ].filter(Boolean);

  const strongestSellingPoints = [
    ...candidate.achievements.slice(0, 2),
    ...candidate.projects.slice(0, 1),
    ...candidate.skills.slice(0, 3).map((skill) => `Demonstrated capability: ${skill}`),
  ].slice(0, 5);

  const preparationPriorities = [
    ...requirements
      .filter((item) => !item.matched && item.priority === "critical")
      .slice(0, 3)
      .map((item) => `Prepare credible evidence for: ${item.label}`),
    "Develop three to five adaptable STAR stories using real achievements.",
    `Prepare a 90-day value plan for the ${role} position.`,
    "Practise follow-up questions that test depth, metrics and personal contribution.",
    "Prepare thoughtful questions about role expectations, culture and success measures.",
  ].slice(0, 7);

  const scenarios = buildScenarios(role, seniority, competencies);
  const personas: RecruiterPersona[] = [
    "hr",
    "hiring-manager",
    "technical",
    "executive",
    "panel",
  ];

  return {
    role,
    seniority,
    candidate,
    requirements,
    competencies,
    scenarios,
    recruiterBriefs: personas.map((persona) =>
      recruiterBrief(persona, role, seniority, hiringRisks),
    ),
    matchScore,
    evidenceStrength,
    interviewComplexity: clamp(
      45 +
        (seniority === "executive"
          ? 35
          : seniority === "management"
            ? 25
            : seniority === "senior"
              ? 18
              : 8) +
        critical.length * 2,
      35,
      95,
    ),
    hiringRisks,
    strongestSellingPoints,
    preparationPriorities,
    generatedAt: new Date().toISOString(),
  };
}

export function personaLabel(persona: RecruiterPersona): string {
  const labels: Record<RecruiterPersona, string> = {
    hr: "HR Manager",
    "hiring-manager": "Hiring Manager",
    technical: "Technical Interviewer",
    executive: "Executive Interviewer",
    panel: "Panel Interview",
  };

  return labels[persona];
}
