export type WorkMode = "Remote" | "Hybrid" | "On-site" | "Flexible";
export type EmploymentType =
  | "Permanent"
  | "Contract"
  | "Internship"
  | "Learnership"
  | "Graduate Programme";
export type Seniority =
  | "Entry"
  | "Junior"
  | "Mid"
  | "Senior"
  | "Lead"
  | "Manager"
  | "Executive";
export type MatchVerdict =
  | "Exceptional fit"
  | "Strong fit"
  | "Promising fit"
  | "Stretch opportunity"
  | "Low fit";

export interface OpportunityProfile {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  seniority: Seniority;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  description: string;
  requirements: string;
  preferredSkills: string;
  source: string;
  deadline: string;
  saved: boolean;
  applied: boolean;
  createdAt: string;
}

export interface CandidatePreferences {
  preferredLocations: string;
  preferredWorkModes: WorkMode[];
  preferredEmploymentTypes: EmploymentType[];
  targetSalary: number;
  yearsExperience: number;
  targetSeniority: Seniority;
  targetIndustries: string;
}

export interface MatchDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
  evidence: string[];
  gaps: string[];
}

export interface OpportunityMatch {
  opportunityId: string;
  overallScore: number;
  confidence: number;
  shortlistProbability: number;
  verdict: MatchVerdict;
  dimensions: MatchDimension[];
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills: string[];
  keywordGaps: string[];
  strengths: string[];
  risks: string[];
  cvActions: string[];
  interviewFocus: string[];
  applicationDecision: "Apply now" | "Improve first" | "Consider carefully";
  generatedAt: string;
}

const STOPWORDS = new Set([
  "and", "the", "with", "for", "that", "this", "from", "your", "you", "our",
  "are", "will", "have", "has", "into", "within", "their", "they", "who",
  "job", "role", "work", "working", "candidate", "experience", "required",
  "requirements", "skills", "ability", "responsible", "responsibilities",
  "including", "preferred", "minimum", "years", "strong", "excellent",
  "knowledge", "using", "across", "support", "team", "business", "company",
  "position", "successful", "must", "should", "can", "such", "other",
]);

const SKILL_ALIASES: Record<string, string[]> = {
  "project management": ["project management", "project manager", "project delivery"],
  "stakeholder management": ["stakeholder management", "stakeholder engagement"],
  "customer service": ["customer service", "customer support", "client service"],
  "data analysis": ["data analysis", "analytics", "data analytics"],
  "financial analysis": ["financial analysis", "financial modelling", "budgeting"],
  "supply chain": ["supply chain", "logistics", "procurement"],
  "software development": ["software development", "programming", "coding"],
  "leadership": ["leadership", "people management", "team management"],
  "communication": ["communication", "presentation", "written communication"],
  "sales": ["sales", "business development", "revenue generation"],
  "marketing": ["marketing", "digital marketing", "brand management"],
  "human resources": ["human resources", "hr", "talent acquisition"],
  "microsoft office": ["microsoft office", "excel", "word", "powerpoint"],
  "sql": ["sql", "structured query language"],
  "python": ["python"],
  "javascript": ["javascript", "typescript", "react", "next.js", "node.js"],
  "cloud": ["cloud", "azure", "aws", "google cloud"],
  "cybersecurity": ["cybersecurity", "information security", "security operations"],
  "operations": ["operations", "operational management", "process improvement"],
  "administration": ["administration", "office administration", "administrative"],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(normalize(needle)));
}

function extractSkills(value: string): string[] {
  const normalized = normalize(value);
  const skills = Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) => includesAny(normalized, aliases))
    .map(([skill]) => skill);

  const meaningfulTokens = tokenize(value)
    .filter((token) => token.length >= 4)
    .slice(0, 60);

  return unique([...skills, ...meaningfulTokens]);
}

function textSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (!leftTokens.size || !rightTokens.size) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return union ? intersection / union : 0;
}

function scoreLabel(score: number): MatchVerdict {
  if (score >= 88) return "Exceptional fit";
  if (score >= 76) return "Strong fit";
  if (score >= 63) return "Promising fit";
  if (score >= 48) return "Stretch opportunity";
  return "Low fit";
}

function seniorityRank(value: Seniority): number {
  const ranks: Record<Seniority, number> = {
    Entry: 1,
    Junior: 2,
    Mid: 3,
    Senior: 4,
    Lead: 5,
    Manager: 6,
    Executive: 7,
  };
  return ranks[value];
}

function dimension(
  key: string,
  label: string,
  score: number,
  weight: number,
  evidence: string[],
  gaps: string[],
): MatchDimension {
  return { key, label, score: clamp(score), weight, evidence, gaps };
}

export function createOpportunity(
  partial?: Partial<OpportunityProfile>,
): OpportunityProfile {
  const now = new Date().toISOString();

  return {
    id: partial?.id ?? `opportunity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    company: partial?.company ?? "",
    role: partial?.role ?? "",
    location: partial?.location ?? "",
    workMode: partial?.workMode ?? "Hybrid",
    employmentType: partial?.employmentType ?? "Permanent",
    seniority: partial?.seniority ?? "Mid",
    salaryMin: partial?.salaryMin ?? 0,
    salaryMax: partial?.salaryMax ?? 0,
    currency: partial?.currency ?? "ZAR",
    description: partial?.description ?? "",
    requirements: partial?.requirements ?? "",
    preferredSkills: partial?.preferredSkills ?? "",
    source: partial?.source ?? "",
    deadline: partial?.deadline ?? "",
    saved: partial?.saved ?? false,
    applied: partial?.applied ?? false,
    createdAt: partial?.createdAt ?? now,
  };
}

export function scoreOpportunityMatch(
  candidateText: string,
  targetRole: string,
  atsScore: number | null,
  preferences: CandidatePreferences,
  opportunity: OpportunityProfile,
): OpportunityMatch {
  const opportunityText = [
    opportunity.role,
    opportunity.description,
    opportunity.requirements,
    opportunity.preferredSkills,
  ].join(" ");

  const candidateSkills = extractSkills(candidateText);
  const opportunitySkills = extractSkills(opportunityText);

  const matchedSkills = opportunitySkills.filter((skill) =>
    includesAny(normalize(candidateText), [skill]),
  );
  const missingSkills = opportunitySkills
    .filter((skill) => !matchedSkills.includes(skill))
    .slice(0, 12);

  const transferableSkills = candidateSkills
    .filter((skill) => !opportunitySkills.includes(skill))
    .slice(0, 8);

  const skillScore = opportunitySkills.length
    ? (matchedSkills.length / opportunitySkills.length) * 100
    : 55;

  const roleSimilarity =
    textSimilarity(`${targetRole} ${candidateText}`, `${opportunity.role} ${opportunity.description}`) *
    100;

  const preferredLocations = normalize(preferences.preferredLocations)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const locationScore =
    opportunity.workMode === "Remote" ||
    opportunity.workMode === "Flexible" ||
    preferredLocations.length === 0 ||
    preferredLocations.some((location) => normalize(opportunity.location).includes(location))
      ? 100
      : 45;

  const modeScore =
    preferences.preferredWorkModes.length === 0 ||
    preferences.preferredWorkModes.includes(opportunity.workMode)
      ? 100
      : 50;

  const employmentScore =
    preferences.preferredEmploymentTypes.length === 0 ||
    preferences.preferredEmploymentTypes.includes(opportunity.employmentType)
      ? 100
      : 55;

  const salaryScore =
    preferences.targetSalary <= 0 ||
    opportunity.salaryMax <= 0 ||
    opportunity.salaryMax >= preferences.targetSalary
      ? 100
      : opportunity.salaryMax >= preferences.targetSalary * 0.8
        ? 70
        : 35;

  const candidateRank = seniorityRank(preferences.targetSeniority);
  const opportunityRank = seniorityRank(opportunity.seniority);
  const seniorityDelta = Math.abs(candidateRank - opportunityRank);
  const seniorityScore = seniorityDelta === 0 ? 100 : seniorityDelta === 1 ? 78 : seniorityDelta === 2 ? 48 : 25;

  const experienceExpected = Math.max(0, opportunityRank - 1) * 2;
  const experienceScore =
    preferences.yearsExperience >= experienceExpected
      ? 100
      : clamp((preferences.yearsExperience / Math.max(experienceExpected, 1)) * 100);

  const industryTokens = tokenize(preferences.targetIndustries);
  const industryScore =
    industryTokens.length === 0
      ? 70
      : industryTokens.some((token) => normalize(opportunityText).includes(token))
        ? 100
        : 50;

  const ats = atsScore ?? 55;

  const dimensions = [
    dimension(
      "skills",
      "Skills alignment",
      skillScore,
      0.25,
      matchedSkills.slice(0, 5).map((skill) => `Evidence found for ${skill}.`),
      missingSkills.slice(0, 5).map((skill) => `Missing or weak evidence for ${skill}.`),
    ),
    dimension(
      "role",
      "Role relevance",
      roleSimilarity,
      0.2,
      roleSimilarity >= 65 ? ["Candidate profile uses language relevant to the role."] : [],
      roleSimilarity < 65 ? ["Role-specific positioning requires improvement."] : [],
    ),
    dimension(
      "experience",
      "Experience level",
      (experienceScore + seniorityScore) / 2,
      0.15,
      experienceScore >= 75 ? ["Experience level is broadly aligned."] : [],
      experienceScore < 75 ? ["Experience evidence may not yet meet the expected level."] : [],
    ),
    dimension(
      "ats",
      "ATS readiness",
      ats,
      0.13,
      ats >= 75 ? ["CV is currently ATS competitive."] : [],
      ats < 75 ? ["CV should be tailored before applying."] : [],
    ),
    dimension(
      "work",
      "Work preferences",
      (locationScore + modeScore + employmentScore) / 3,
      0.12,
      locationScore >= 90 ? ["Location or remote preference aligns."] : [],
      locationScore < 90 ? ["Location preference may create friction."] : [],
    ),
    dimension(
      "compensation",
      "Compensation fit",
      salaryScore,
      0.08,
      salaryScore >= 90 ? ["Salary expectations appear compatible."] : [],
      salaryScore < 70 ? ["Advertised salary may be below target."] : [],
    ),
    dimension(
      "industry",
      "Industry alignment",
      industryScore,
      0.07,
      industryScore >= 90 ? ["Target industry alignment detected."] : [],
      industryScore < 70 ? ["Industry relevance is not strongly evidenced."] : [],
    ),
  ];

  const overallScore = clamp(
    dimensions.reduce((sum, item) => sum + item.score * item.weight, 0),
  );

  const evidenceCount = matchedSkills.length + dimensions.filter((item) => item.evidence.length > 0).length;
  const confidence = clamp(50 + Math.min(30, evidenceCount * 3) + (opportunityText.length > 350 ? 12 : 0));
  const shortlistProbability = clamp(overallScore * 0.78 + ats * 0.12 + confidence * 0.1 - 7);

  const keywordGaps = unique(
    tokenize(opportunity.requirements)
      .filter((token) => !normalize(candidateText).includes(token))
      .slice(0, 10),
  );

  const strengths = [
    ...matchedSkills.slice(0, 5).map((skill) => `Relevant ${skill} evidence is present.`),
    ...(roleSimilarity >= 70 ? ["Profile positioning is relevant to the vacancy."] : []),
    ...(ats >= 75 ? ["CV has a competitive ATS foundation."] : []),
    ...(experienceScore >= 80 ? ["Experience level is suitable for the role."] : []),
  ];

  const risks = [
    ...missingSkills.slice(0, 5).map((skill) => `Recruiters may question evidence for ${skill}.`),
    ...(ats < 65 ? ["Current ATS readiness may reduce screening success."] : []),
    ...(seniorityDelta >= 2 ? ["The seniority level differs materially from the candidate target."] : []),
    ...(salaryScore < 60 ? ["Compensation expectations may not align."] : []),
  ];

  const cvActions = [
    ...missingSkills.slice(0, 4).map(
      (skill) => `Add truthful, outcome-based evidence related to ${skill}.`,
    ),
    ...(roleSimilarity < 70
      ? [`Rewrite the professional summary specifically for ${opportunity.role}.`]
      : []),
    ...(ats < 75
      ? ["Mirror relevant vacancy terminology naturally across the CV."]
      : []),
    "Add measurable outcomes to the three most relevant achievements.",
  ];

  const interviewFocus = [
    ...matchedSkills.slice(0, 3).map(
      (skill) => `Prepare a STAR example demonstrating ${skill}.`,
    ),
    ...missingSkills.slice(0, 2).map(
      (skill) => `Prepare an honest bridge answer for limited ${skill} exposure.`,
    ),
    `Prepare a concise explanation of why ${opportunity.company || "this employer"} and this role are a strong fit.`,
  ];

  return {
    opportunityId: opportunity.id,
    overallScore,
    confidence,
    shortlistProbability,
    verdict: scoreLabel(overallScore),
    dimensions,
    matchedSkills,
    missingSkills,
    transferableSkills,
    keywordGaps,
    strengths: unique(strengths).slice(0, 8),
    risks: unique(risks).slice(0, 8),
    cvActions: unique(cvActions).slice(0, 8),
    interviewFocus: unique(interviewFocus).slice(0, 8),
    applicationDecision:
      overallScore >= 72
        ? "Apply now"
        : overallScore >= 52
          ? "Improve first"
          : "Consider carefully",
    generatedAt: new Date().toISOString(),
  };
}

export function rankOpportunities(
  candidateText: string,
  targetRole: string,
  atsScore: number | null,
  preferences: CandidatePreferences,
  opportunities: OpportunityProfile[],
): Array<{ opportunity: OpportunityProfile; match: OpportunityMatch }> {
  return opportunities
    .map((opportunity) => ({
      opportunity,
      match: scoreOpportunityMatch(
        candidateText,
        targetRole,
        atsScore,
        preferences,
        opportunity,
      ),
    }))
    .sort((left, right) => right.match.overallScore - left.match.overallScore);
}

export function opportunityFromJobDescription(
  targetRole: string,
  jobDescription: string,
): OpportunityProfile {
  return createOpportunity({
    company: "Target employer",
    role: targetRole || "Target opportunity",
    description: jobDescription,
    requirements: jobDescription,
    source: "Current CV Builder target",
  });
}
