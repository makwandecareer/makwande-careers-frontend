export type InterviewDifficulty = "Foundation" | "Professional" | "Advanced" | "Executive";
export type RecruiterPersona =
  | "HR Recruiter"
  | "Hiring Manager"
  | "Technical Interviewer"
  | "Executive"
  | "Panel";
export type QuestionCategory =
  | "Opening"
  | "Motivation"
  | "Behavioural"
  | "Competency"
  | "Technical"
  | "Experience"
  | "Scenario"
  | "Company"
  | "Pressure"
  | "Closing";

export interface DynamicInterviewInput {
  companyName: string;
  industry: string;
  companyValues: string;
  companyPriorities: string;
  recruiterPersona: RecruiterPersona;
  difficulty: InterviewDifficulty;
  questionCount: number;
  interviewLength: number;
  includeTechnical: boolean;
  includePressure: boolean;
  includeFollowUps: boolean;
  includeCompanyQuestions: boolean;
}

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  whyAsked: string;
  candidateEvidence: string[];
  strongAnswerSignals: string[];
  redFlags: string[];
  followUps: string[];
  suggestedTime: number;
  scoreWeight: number;
}

export interface InterviewSection {
  title: string;
  purpose: string;
  questions: InterviewQuestion[];
}

export interface InterviewBlueprint {
  title: string;
  companyName: string;
  targetRole: string;
  persona: RecruiterPersona;
  difficulty: InterviewDifficulty;
  totalMinutes: number;
  estimatedQuestions: number;
  sections: InterviewSection[];
  candidateStrengths: string[];
  evidenceGaps: string[];
  interviewerObjectives: string[];
  scoringDimensions: string[];
  generatedAt: string;
}

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function splitSentences(value: string): string[] {
  return unique(
    value
      .split(/\n|•|;|\r|\.(?=\s|$)/g)
      .map((item) => item.replace(/^[-–—\s]+/, "").trim())
      .filter((item) => item.length >= 4),
  );
}

function containsAny(source: string, terms: string[]): boolean {
  const lower = source.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.max(6, Math.min(20, Math.round(value)));
}

function normalizeMinutes(value: number): number {
  if (!Number.isFinite(value)) return 45;
  return Math.max(20, Math.min(120, Math.round(value)));
}

function candidateProfile(cvContent: unknown) {
  const cv = asRecord(cvContent);

  const skills = unique(
    asArray(cv.skills).flatMap((item) => {
      if (typeof item === "string") return [item];
      const entry = asRecord(item);
      return [
        asText(entry.name),
        asText(entry.skill_name),
        asText(entry.title),
      ];
    }),
  );

  const experienceItems = asArray(cv.experience).map(asRecord);

  const achievements = unique(
    experienceItems.flatMap((entry) => [
      asText(entry.achievements),
      asText(entry.description),
      asText(entry.responsibilities),
      asText(entry.summary),
    ]),
  );

  const roles = unique(
    experienceItems.flatMap((entry) => [
      asText(entry.job_title),
      asText(entry.position),
      asText(entry.title),
      asText(entry.role),
    ]),
  );

  const qualifications = unique(
    asArray(cv.education).flatMap((item) => {
      const entry = asRecord(item);
      return [
        asText(entry.qualification),
        asText(entry.degree),
        asText(entry.programme),
        asText(entry.field_of_study),
      ];
    }),
  );

  const certifications = unique(
    asArray(cv.certifications).flatMap((item) => {
      if (typeof item === "string") return [item];
      const entry = asRecord(item);
      return [asText(entry.name), asText(entry.title)];
    }),
  );

  const projects = unique(
    asArray(cv.projects).flatMap((item) => {
      const entry = asRecord(item);
      return [
        asText(entry.name),
        asText(entry.title),
        asText(entry.description),
      ];
    }),
  );

  return {
    skills,
    achievements,
    roles,
    qualifications,
    certifications,
    projects,
    experienceCount: experienceItems.length,
  };
}

function inferSeniority(role: string, cvContent: unknown): InterviewDifficulty {
  const lower = role.toLowerCase();
  const profile = candidateProfile(cvContent);

  if (containsAny(lower, ["chief", "executive", "director", "head of", "vice president"])) {
    return "Executive";
  }
  if (
    containsAny(lower, ["senior", "lead", "manager", "principal", "specialist"]) ||
    profile.experienceCount >= 5
  ) {
    return "Advanced";
  }
  if (
    containsAny(lower, ["junior", "graduate", "intern", "trainee", "assistant"]) ||
    profile.experienceCount <= 1
  ) {
    return "Foundation";
  }
  return "Professional";
}

const COMPETENCY_PATTERNS = [
  {
    name: "Leadership",
    terms: ["lead", "manage", "supervise", "coach", "mentor", "team"],
    question: "Tell me about a time you had to lead people through a difficult objective or change.",
    whyAsked: "The interviewer wants proof of ownership, influence and accountability for team outcomes.",
  },
  {
    name: "Problem Solving",
    terms: ["problem", "analyse", "analyze", "root cause", "resolve", "decision"],
    question: "Describe a complex problem you solved when the correct answer was not immediately clear.",
    whyAsked: "The interviewer is testing structured thinking, judgement and evidence-based decision-making.",
  },
  {
    name: "Customer Focus",
    terms: ["customer", "client", "service", "stakeholder"],
    question: "Give an example of how you improved an outcome for a customer or important stakeholder.",
    whyAsked: "The interviewer wants to see whether you understand needs, manage expectations and create value.",
  },
  {
    name: "Collaboration",
    terms: ["collaborate", "cross-functional", "team", "liaise", "stakeholder"],
    question: "Tell me about a time you achieved a result through people who did not report to you.",
    whyAsked: "The interviewer is assessing influence, communication and cross-functional execution.",
  },
  {
    name: "Operational Excellence",
    terms: ["process", "quality", "efficiency", "operation", "continuous improvement", "delivery"],
    question: "Describe a process you improved and explain the measurable impact.",
    whyAsked: "The interviewer wants evidence that you can diagnose inefficiency and sustain better performance.",
  },
  {
    name: "Risk & Compliance",
    terms: ["risk", "compliance", "safety", "audit", "policy", "control"],
    question: "Tell me about a time you identified a serious risk before it became a larger problem.",
    whyAsked: "The interviewer is testing professional judgement, control awareness and responsible escalation.",
  },
  {
    name: "Commercial Awareness",
    terms: ["budget", "cost", "revenue", "profit", "commercial", "market"],
    question: "Describe a decision you made that improved cost, revenue or commercial performance.",
    whyAsked: "The interviewer wants to understand whether you connect daily work to business results.",
  },
  {
    name: "Adaptability",
    terms: ["change", "adapt", "learn", "new system", "transformation", "innovation"],
    question: "Tell me about a time you had to adapt quickly to a major change.",
    whyAsked: "The interviewer is assessing learning agility, resilience and effectiveness under uncertainty.",
  },
];

function detectedCompetencies(
  jobDescription: string,
  companyValues: string,
  companyPriorities: string,
) {
  const source = `${jobDescription} ${companyValues} ${companyPriorities}`.toLowerCase();

  const matched = COMPETENCY_PATTERNS.map((item) => ({
    ...item,
    hits: item.terms.filter((term) => source.includes(term)).length,
  }))
    .sort((left, right) => right.hits - left.hits)
    .filter((item) => item.hits > 0);

  return (matched.length ? matched : COMPETENCY_PATTERNS.slice(0, 5)).slice(0, 6);
}

function evidenceForTerms(cvContent: unknown, terms: string[]): string[] {
  const profile = candidateProfile(cvContent);
  return unique([
    ...profile.achievements,
    ...profile.skills,
    ...profile.projects,
  ])
    .filter((item) =>
      terms.some((term) => item.toLowerCase().includes(term)),
    )
    .slice(0, 3);
}

function jobRequirements(jobDescription: string): string[] {
  return splitSentences(jobDescription)
    .filter((item) =>
      containsAny(item, [
        "experience",
        "skill",
        "knowledge",
        "responsible",
        "manage",
        "develop",
        "deliver",
        "ensure",
        "required",
        "ability",
      ]),
    )
    .slice(0, 12);
}

function technicalTopics(jobDescription: string, cvContent: unknown): string[] {
  const profile = candidateProfile(cvContent);
  const source = jobDescription.toLowerCase();

  const matchedSkills = profile.skills.filter((skill) =>
    source.includes(skill.toLowerCase()),
  );

  const extracted = splitSentences(jobDescription)
    .filter((sentence) =>
      containsAny(sentence, [
        "system",
        "software",
        "tool",
        "method",
        "framework",
        "standard",
        "technical",
        "data",
        "process",
        "equipment",
      ]),
    )
    .map((item) => item.slice(0, 120));

  return unique([...matchedSkills, ...extracted]).slice(0, 8);
}

function question(
  id: string,
  category: QuestionCategory,
  prompt: string,
  whyAsked: string,
  candidateEvidence: string[],
  strongAnswerSignals: string[],
  redFlags: string[],
  followUps: string[],
  suggestedTime: number,
  scoreWeight: number,
): InterviewQuestion {
  return {
    id,
    category,
    question: prompt,
    whyAsked,
    candidateEvidence,
    strongAnswerSignals,
    redFlags,
    followUps,
    suggestedTime,
    scoreWeight,
  };
}

function openingQuestions(
  role: string,
  companyName: string,
  cvContent: unknown,
): InterviewQuestion[] {
  const profile = candidateProfile(cvContent);
  return [
    question(
      "opening-1",
      "Opening",
      `Please introduce yourself and explain why your background is relevant to the ${role} position.`,
      "This tests communication, relevance and whether the candidate can present a coherent professional narrative.",
      unique([...profile.roles, ...profile.qualifications]).slice(0, 4),
      [
        "Clear career narrative",
        "Direct connection to the target role",
        "Evidence of progression",
        "Concise and confident delivery",
      ],
      [
        "Chronological life story with no relevance",
        "Unclear value proposition",
        "Repeating the CV without interpretation",
      ],
      [
        "Which part of your experience is most relevant to this vacancy?",
        "What professional achievement best represents your capability?",
      ],
      3,
      8,
    ),
    question(
      "motivation-1",
      "Motivation",
      `Why are you interested in this ${role} opportunity${companyName ? ` at ${companyName}` : ""}?`,
      "The interviewer is evaluating genuine motivation, research quality and long-term alignment.",
      profile.achievements.slice(0, 2),
      [
        "Specific understanding of the company or role",
        "Connection to career direction",
        "Credible contribution the candidate can make",
      ],
      [
        "Generic praise",
        "Only discussing salary or convenience",
        "No evidence of company research",
      ],
      [
        "Why now?",
        "What would make you accept or reject an offer?",
      ],
      3,
      8,
    ),
  ];
}

function competencyQuestions(
  jobDescription: string,
  companyValues: string,
  companyPriorities: string,
  cvContent: unknown,
): InterviewQuestion[] {
  return detectedCompetencies(
    jobDescription,
    companyValues,
    companyPriorities,
  ).map((competency, index) =>
    question(
      `competency-${index + 1}`,
      index % 2 === 0 ? "Competency" : "Behavioural",
      competency.question,
      competency.whyAsked,
      evidenceForTerms(cvContent, competency.terms),
      [
        "Specific STAR or STARR example",
        "Clear individual responsibility",
        "Actions explained in logical sequence",
        "Measured result",
        "Relevant lesson or reflection",
      ],
      [
        "Hypothetical answer instead of real evidence",
        "Unclear personal contribution",
        "No measurable result",
        "Blaming colleagues or previous employers",
      ],
      [
        "What was the most difficult decision you made?",
        "What would you do differently now?",
        "How did you measure success?",
      ],
      5,
      12,
    ),
  );
}

function experienceQuestions(
  role: string,
  jobDescription: string,
  cvContent: unknown,
): InterviewQuestion[] {
  const profile = candidateProfile(cvContent);
  const requirements = jobRequirements(jobDescription).slice(0, 4);

  return requirements.map((requirement, index) =>
    question(
      `experience-${index + 1}`,
      "Experience",
      `The role requires: "${requirement}". Which experience from your background provides the strongest evidence that you can deliver this?`,
      "The interviewer is testing direct evidence against a stated vacancy requirement.",
      profile.achievements
        .filter((achievement) =>
          requirement
            .toLowerCase()
            .split(/\W+/)
            .some((word) => word.length > 4 && achievement.toLowerCase().includes(word)),
        )
        .slice(0, 3),
      [
        "Direct match to the requirement",
        "Scale and complexity are explained",
        "Candidate distinguishes team result from individual contribution",
        "Outcome is quantified where possible",
      ],
      [
        "Claiming experience without evidence",
        "Avoiding the exact requirement",
        "Overstating responsibility",
      ],
      [
        "How recent is that experience?",
        "What was the scale of the work?",
        `How would you apply that experience in this ${role} position?`,
      ],
      5,
      11,
    ),
  );
}

function technicalQuestions(
  role: string,
  jobDescription: string,
  cvContent: unknown,
): InterviewQuestion[] {
  const topics = technicalTopics(jobDescription, cvContent);

  return topics.slice(0, 5).map((topic, index) =>
    question(
      `technical-${index + 1}`,
      "Technical",
      `Explain your practical experience with ${topic}. How have you used it to achieve a business or operational result?`,
      "The interviewer is testing depth, hands-on credibility and the ability to connect technical knowledge to outcomes.",
      evidenceForTerms(cvContent, topic.toLowerCase().split(/\W+/).filter((word) => word.length > 3)),
      [
        "Accurate technical explanation",
        "Real example",
        "Trade-offs or limitations discussed",
        "Connection to business impact",
      ],
      [
        "Only textbook definitions",
        "Unsupported claim of expertise",
        "Inability to explain decisions or trade-offs",
      ],
      [
        "What alternatives did you consider?",
        "What went wrong and how did you correct it?",
        `How would you apply this at the level expected of a ${role}?`,
      ],
      6,
      13,
    ),
  );
}

function scenarioQuestions(
  role: string,
  jobDescription: string,
  companyPriorities: string,
): InterviewQuestion[] {
  const source = `${jobDescription} ${companyPriorities}`.toLowerCase();
  const scenarios: Array<{ prompt: string; why: string }> = [];

  if (containsAny(source, ["customer", "client", "service"])) {
    scenarios.push({
      prompt: `A major customer is dissatisfied, the team disputes responsibility and the issue is escalating. As the ${role}, how would you respond?`,
      why: "This tests customer judgement, escalation, accountability and cross-functional coordination.",
    });
  }
  if (containsAny(source, ["deadline", "project", "delivery", "programme"])) {
    scenarios.push({
      prompt: `A critical delivery is behind schedule, resources are limited and senior stakeholders want immediate recovery. What would you do?`,
      why: "This tests prioritisation, recovery planning, communication and decision-making under pressure.",
    });
  }
  if (containsAny(source, ["team", "people", "lead", "manage"])) {
    scenarios.push({
      prompt: `A high-performing employee is damaging team morale and ignoring agreed standards. How would you handle the situation?`,
      why: "This tests leadership courage, fairness, performance management and team protection.",
    });
  }
  if (containsAny(source, ["risk", "safety", "quality", "compliance"])) {
    scenarios.push({
      prompt: `You discover a serious control, safety or compliance weakness shortly before an important deadline. What do you do?`,
      why: "This tests integrity, risk judgement, escalation and the ability to balance delivery with controls.",
    });
  }
  if (containsAny(source, ["budget", "cost", "finance", "commercial"])) {
    scenarios.push({
      prompt: `Your budget is reduced, but the expected outcomes remain unchanged. How would you redesign the plan?`,
      why: "This tests commercial judgement, prioritisation and resource allocation.",
    });
  }

  if (!scenarios.length) {
    scenarios.push(
      {
        prompt: `You join as the ${role} and discover unclear priorities, inconsistent processes and conflicting stakeholder expectations. What would your first 30 days look like?`,
        why: "This tests diagnosis, stakeholder management, prioritisation and structured onboarding.",
      },
      {
        prompt: `A senior stakeholder rejects your recommendation despite strong evidence. How would you proceed?`,
        why: "This tests influence, judgement, resilience and constructive challenge.",
      },
    );
  }

  return scenarios.slice(0, 4).map((scenario, index) =>
    question(
      `scenario-${index + 1}`,
      "Scenario",
      scenario.prompt,
      scenario.why,
      [],
      [
        "Clarifies facts and assumptions",
        "Prioritises risks and stakeholders",
        "Explains decision criteria",
        "Defines actions, communication and measures",
      ],
      [
        "Rushes into action without diagnosis",
        "Avoids difficult stakeholders",
        "No measurement or follow-through",
      ],
      [
        "What would you do in the first hour?",
        "Who would you involve?",
        "Which risk would concern you most?",
      ],
      6,
      13,
    ),
  );
}

function companyQuestions(
  companyName: string,
  companyValues: string,
  companyPriorities: string,
  role: string,
): InterviewQuestion[] {
  if (!companyName && !companyValues && !companyPriorities) return [];

  return [
    question(
      "company-1",
      "Company",
      `What do you understand about ${companyName || "our organisation"}, and how would you contribute as a ${role}?`,
      "The interviewer wants to distinguish serious preparation from generic interest.",
      [],
      [
        "Uses verified company facts",
        "Connects company priorities to candidate evidence",
        "Explains a credible contribution",
      ],
      [
        "Recites website language without interpretation",
        "Uses outdated or unverified facts",
        "Cannot connect research to the role",
      ],
      [
        "Which company priority interests you most?",
        "Which challenge do you think the organisation must solve?",
      ],
      4,
      10,
    ),
    question(
      "company-2",
      "Company",
      companyValues
        ? `Our stated values include: ${companyValues}. Which value best reflects how you work, and what evidence supports that?`
        : `Which behaviours do you believe are essential for succeeding at ${companyName || "this organisation"}?`,
      "The interviewer is testing culture alignment using evidence rather than personal claims.",
      [],
      [
        "Selects a specific value or behaviour",
        "Provides a real example",
        "Acknowledges how the value influences decisions",
      ],
      [
        "Claims alignment without evidence",
        "Chooses every value",
        "Uses a rehearsed answer unrelated to the company",
      ],
      [
        "Which value would challenge you most?",
        "How have you handled a values conflict?",
      ],
      5,
      10,
    ),
  ];
}

function pressureQuestions(role: string): InterviewQuestion[] {
  return [
    question(
      "pressure-1",
      "Pressure",
      `Why should we choose you over another strong candidate for this ${role} role?`,
      "This tests confidence, differentiation and the ability to make a concise evidence-based case.",
      [],
      [
        "Clear differentiator",
        "Evidence rather than adjectives",
        "Relevance to employer priorities",
        "Confident but not arrogant",
      ],
      [
        "Criticising other candidates",
        "Generic strengths",
        "Overconfidence without evidence",
      ],
      [
        "What is the strongest evidence for that claim?",
        "What is the biggest risk in hiring you?",
      ],
      3,
      9,
    ),
    question(
      "pressure-2",
      "Pressure",
      `Which requirement for this ${role} position is your weakest, and why should that not prevent us from hiring you?`,
      "The interviewer is testing self-awareness, honesty and the quality of the candidate's development plan.",
      [],
      [
        "Genuine but manageable gap",
        "Evidence of learning ability",
        "Practical mitigation plan",
        "No attempt to disguise a strength as a weakness",
      ],
      [
        "Denies having any gap",
        "Selects a critical requirement with no mitigation",
        "Becomes defensive",
      ],
      [
        "What are you doing about it now?",
        "How quickly can you close the gap?",
      ],
      4,
      9,
    ),
  ];
}

function closingQuestion(role: string): InterviewQuestion {
  return question(
    "closing-1",
    "Closing",
    `What questions would you like to ask us about the ${role} opportunity?`,
    "The quality of the candidate's questions reveals preparation, judgement and seriousness.",
    [],
    [
      "Asks about outcomes, challenges, team and success measures",
      "Builds on information discussed during the interview",
      "Avoids questions easily answered by basic research",
    ],
    [
      "Has no questions",
      "Only asks about benefits before understanding the role",
      "Asks questions already answered",
    ],
    [
      "Is there anything else you would like us to know?",
    ],
    5,
    7,
  );
}

function personaObjectives(
  persona: RecruiterPersona,
  role: string,
): string[] {
  const map: Record<RecruiterPersona, string[]> = {
    "HR Recruiter": [
      "Confirm motivation, communication and basic eligibility",
      "Assess values and culture alignment",
      "Identify salary, availability or retention risks",
    ],
    "Hiring Manager": [
      `Assess whether the candidate can deliver the ${role} outcomes`,
      "Validate relevant experience and judgement",
      "Understand how quickly the candidate can become effective",
    ],
    "Technical Interviewer": [
      "Test technical depth and hands-on credibility",
      "Explore decision-making, trade-offs and problem diagnosis",
      "Separate real expertise from memorised terminology",
    ],
    Executive: [
      "Assess strategic judgement and enterprise impact",
      "Evaluate leadership maturity and commercial awareness",
      "Test the candidate's ability to communicate at executive level",
    ],
    Panel: [
      "Gather multiple perspectives on candidate fit",
      "Test consistency across competencies and stakeholders",
      "Observe communication under varied questioning styles",
    ],
  };

  return map[persona];
}

function scoringDimensions(persona: RecruiterPersona): string[] {
  const shared = [
    "Evidence quality",
    "Role relevance",
    "Communication",
    "Judgement",
    "Result orientation",
  ];

  if (persona === "Technical Interviewer") {
    return [...shared, "Technical depth", "Problem diagnosis"];
  }
  if (persona === "Executive") {
    return [...shared, "Strategic thinking", "Commercial impact", "Leadership maturity"];
  }
  if (persona === "HR Recruiter") {
    return [...shared, "Motivation", "Values alignment"];
  }
  return [...shared, "Stakeholder management", "Learning agility"];
}

function selectQuestions(
  allQuestions: InterviewQuestion[],
  count: number,
): InterviewQuestion[] {
  const target = normalizeCount(count);
  const essentials = allQuestions.filter((item) =>
    ["Opening", "Motivation", "Closing"].includes(item.category),
  );
  const remainder = allQuestions.filter(
    (item) => !essentials.some((essential) => essential.id === item.id),
  );

  const selected: InterviewQuestion[] = [];
  const categoryOrder: QuestionCategory[] = [
    "Competency",
    "Behavioural",
    "Experience",
    "Technical",
    "Scenario",
    "Company",
    "Pressure",
  ];

  selected.push(...essentials.filter((item) => item.category !== "Closing"));

  let round = 0;
  while (selected.length < target - 1 && remainder.length) {
    const category = categoryOrder[round % categoryOrder.length];
    const index = remainder.findIndex((item) => item.category === category);

    if (index >= 0) {
      selected.push(remainder.splice(index, 1)[0]);
    } else {
      selected.push(remainder.shift() as InterviewQuestion);
    }
    round += 1;
  }

  const closing = essentials.find((item) => item.category === "Closing");
  if (closing && selected.length < target) selected.push(closing);

  return selected.slice(0, target);
}

function distributeTime(
  questions: InterviewQuestion[],
  totalMinutes: number,
): InterviewQuestion[] {
  const minutes = normalizeMinutes(totalMinutes);
  const totalWeight = questions.reduce(
    (sum, item) => sum + Math.max(1, item.suggestedTime),
    0,
  );

  return questions.map((item) => ({
    ...item,
    suggestedTime: Math.max(
      2,
      Math.round((item.suggestedTime / totalWeight) * minutes),
    ),
  }));
}

function sectionsFromQuestions(
  questions: InterviewQuestion[],
): InterviewSection[] {
  const groups: Array<{
    title: string;
    purpose: string;
    categories: QuestionCategory[];
  }> = [
    {
      title: "Introduction & Motivation",
      purpose: "Establish the candidate narrative, motivation and relevance.",
      categories: ["Opening", "Motivation"],
    },
    {
      title: "Evidence & Competency",
      purpose: "Test real experience, behaviours and role-specific evidence.",
      categories: ["Behavioural", "Competency", "Experience"],
    },
    {
      title: "Technical & Situational Depth",
      purpose: "Assess practical knowledge, judgement and response to realistic challenges.",
      categories: ["Technical", "Scenario"],
    },
    {
      title: "Company, Pressure & Closing",
      purpose: "Test company preparation, differentiation and final candidate judgement.",
      categories: ["Company", "Pressure", "Closing"],
    },
  ];

  return groups
    .map((group) => ({
      title: group.title,
      purpose: group.purpose,
      questions: questions.filter((item) =>
        group.categories.includes(item.category),
      ),
    }))
    .filter((section) => section.questions.length > 0);
}

export function createDynamicInterviewBlueprint(
  input: DynamicInterviewInput,
  targetRole: string,
  jobDescription: string,
  cvContent: unknown,
  atsScore: number | null,
): InterviewBlueprint {
  const role = targetRole.trim() || "Target Role";
  const companyName = input.companyName.trim();
  const profile = candidateProfile(cvContent);
  const inferredDifficulty = inferSeniority(role, cvContent);
  const effectiveDifficulty =
    input.difficulty || inferredDifficulty;

  let allQuestions: InterviewQuestion[] = [
    ...openingQuestions(role, companyName, cvContent),
    ...competencyQuestions(
      jobDescription,
      input.companyValues,
      input.companyPriorities,
      cvContent,
    ),
    ...experienceQuestions(role, jobDescription, cvContent),
    ...scenarioQuestions(role, jobDescription, input.companyPriorities),
  ];

  if (input.includeTechnical) {
    allQuestions.push(
      ...technicalQuestions(role, jobDescription, cvContent),
    );
  }

  if (input.includeCompanyQuestions) {
    allQuestions.push(
      ...companyQuestions(
        companyName,
        input.companyValues,
        input.companyPriorities,
        role,
      ),
    );
  }

  if (input.includePressure) {
    allQuestions.push(...pressureQuestions(role));
  }

  allQuestions.push(closingQuestion(role));

  const selected = distributeTime(
    selectQuestions(allQuestions, input.questionCount),
    input.interviewLength,
  ).map((item) => ({
    ...item,
    followUps: input.includeFollowUps ? item.followUps : [],
  }));

  const candidateStrengths = unique([
    ...profile.achievements.slice(0, 4),
    ...profile.skills.slice(0, 4).map((skill) => `${skill} is available as candidate evidence.`),
    atsScore !== null && atsScore >= 70
      ? `The current ATS alignment score of ${atsScore}% indicates a relatively strong document-to-role match.`
      : "",
  ]).slice(0, 7);

  const requirements = jobRequirements(jobDescription);
  const evidenceCorpus = unique([
    ...profile.skills,
    ...profile.achievements,
    ...profile.qualifications,
    ...profile.certifications,
    ...profile.projects,
  ])
    .join(" ")
    .toLowerCase();

  const evidenceGaps = requirements
    .filter((requirement) => {
      const significantWords = requirement
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length >= 6);

      return !significantWords.some((word) => evidenceCorpus.includes(word));
    })
    .slice(0, 6);

  return {
    title: `${effectiveDifficulty} ${role} Interview`,
    companyName: companyName || "Target company",
    targetRole: role,
    persona: input.recruiterPersona,
    difficulty: effectiveDifficulty,
    totalMinutes: normalizeMinutes(input.interviewLength),
    estimatedQuestions: selected.length,
    sections: sectionsFromQuestions(selected),
    candidateStrengths,
    evidenceGaps,
    interviewerObjectives: personaObjectives(
      input.recruiterPersona,
      role,
    ),
    scoringDimensions: scoringDimensions(input.recruiterPersona),
    generatedAt: new Date().toISOString(),
  };
}
