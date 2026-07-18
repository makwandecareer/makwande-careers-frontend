export type HiringStage =
  | "New"
  | "Reviewed"
  | "Shortlisted"
  | "Screening"
  | "Interview"
  | "Assessment"
  | "Reference"
  | "Offer"
  | "Hired"
  | "Rejected";

export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
export type JobPriority = "Standard" | "High" | "Urgent";
export type EmploymentModel = "On-site" | "Hybrid" | "Remote" | "Flexible";
export type TeamRole = "Owner" | "Admin" | "Recruiter" | "Hiring Manager" | "Interviewer";
export type InterviewType = "Screening" | "Technical" | "Behavioural" | "Panel" | "Executive";
export type CandidateFlag = "Top Talent" | "Referral" | "Internal" | "Diversity" | "Risk";

export interface EmployerProfile {
  companyName: string;
  industry: string;
  website: string;
  location: string;
  companySize: string;
  hiringBrand: string;
  values: string[];
}

export interface HiringTeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  active: boolean;
}

export interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentModel: EmploymentModel;
  status: JobStatus;
  priority: JobPriority;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  description: string;
  requirements: string;
  scorecard: string[];
  ownerId: string;
  openingDate: string;
  closingDate: string;
  vacancies: number;
  createdAt: string;
}

export interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  yearsExperience: number;
  qualification: string;
  skills: string[];
  cvText: string;
  source: string;
  expectedSalary: number;
  noticePeriod: string;
  stage: HiringStage;
  jobId: string;
  recruiterRating: number;
  aiScore: number;
  atsScore: number;
  cultureScore: number;
  leadershipScore: number;
  riskScore: number;
  flags: CandidateFlag[];
  notes: RecruiterNote[];
  interviews: InterviewRecord[];
  createdAt: string;
  lastActivityAt: string;
}

export interface RecruiterNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface InterviewRecord {
  id: string;
  type: InterviewType;
  scheduledAt: string;
  interviewer: string;
  status: "Planned" | "Completed" | "Cancelled";
  score: number;
  feedback: string;
}

export interface CandidateMatchDimension {
  label: string;
  score: number;
  weight: number;
  evidence: string[];
  concerns: string[];
}

export interface CandidateMatchReport {
  candidateId: string;
  jobId: string;
  overallScore: number;
  confidence: number;
  recommendation: "Priority shortlist" | "Shortlist" | "Review" | "Low priority";
  dimensions: CandidateMatchDimension[];
  strengths: string[];
  risks: string[];
  interviewQuestions: string[];
  generatedAt: string;
}

export interface HiringMetrics {
  openJobs: number;
  activeCandidates: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hired: number;
  averageTimeToHire: number;
  qualityOfPipeline: number;
  diversityCoverage: number;
  overdueReviews: number;
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
  "project management": ["project management", "project delivery", "programme management"],
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
  "human resources": ["human resources", "talent acquisition", "recruitment"],
  "microsoft office": ["microsoft office", "excel", "word", "powerpoint"],
  "sql": ["sql", "structured query language"],
  "python": ["python"],
  "javascript": ["javascript", "typescript", "react", "next.js", "node.js"],
  "cloud": ["cloud", "azure", "aws", "google cloud"],
  "cybersecurity": ["cybersecurity", "information security", "security operations"],
  "operations": ["operations", "operational management", "process improvement"],
  "administration": ["administration", "office administration", "administrative"],
};

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

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(normalize(needle)));
}

function extractSkills(value: string): string[] {
  const normalized = normalize(value);
  const aliasSkills = Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) => includesAny(normalized, aliases))
    .map(([skill]) => skill);
  const tokenSkills = tokenize(value).filter((token) => token.length >= 4).slice(0, 60);
  return unique([...aliasSkills, ...tokenSkills]);
}

function similarity(left: string, right: string): number {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

export function createJob(partial?: Partial<RecruiterJob>): RecruiterJob {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? `job-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: partial?.title ?? "",
    department: partial?.department ?? "",
    location: partial?.location ?? "",
    employmentModel: partial?.employmentModel ?? "Hybrid",
    status: partial?.status ?? "Draft",
    priority: partial?.priority ?? "Standard",
    salaryMin: partial?.salaryMin ?? 0,
    salaryMax: partial?.salaryMax ?? 0,
    currency: partial?.currency ?? "ZAR",
    description: partial?.description ?? "",
    requirements: partial?.requirements ?? "",
    scorecard: partial?.scorecard ?? [],
    ownerId: partial?.ownerId ?? "",
    openingDate: partial?.openingDate ?? now.slice(0, 10),
    closingDate: partial?.closingDate ?? "",
    vacancies: partial?.vacancies ?? 1,
    createdAt: partial?.createdAt ?? now,
  };
}

export function createCandidate(partial?: Partial<CandidateRecord>): CandidateRecord {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fullName: partial?.fullName ?? "",
    email: partial?.email ?? "",
    phone: partial?.phone ?? "",
    location: partial?.location ?? "",
    currentTitle: partial?.currentTitle ?? "",
    yearsExperience: partial?.yearsExperience ?? 0,
    qualification: partial?.qualification ?? "",
    skills: partial?.skills ?? [],
    cvText: partial?.cvText ?? "",
    source: partial?.source ?? "",
    expectedSalary: partial?.expectedSalary ?? 0,
    noticePeriod: partial?.noticePeriod ?? "",
    stage: partial?.stage ?? "New",
    jobId: partial?.jobId ?? "",
    recruiterRating: partial?.recruiterRating ?? 0,
    aiScore: partial?.aiScore ?? 0,
    atsScore: partial?.atsScore ?? 0,
    cultureScore: partial?.cultureScore ?? 0,
    leadershipScore: partial?.leadershipScore ?? 0,
    riskScore: partial?.riskScore ?? 0,
    flags: partial?.flags ?? [],
    notes: partial?.notes ?? [],
    interviews: partial?.interviews ?? [],
    createdAt: partial?.createdAt ?? now,
    lastActivityAt: partial?.lastActivityAt ?? now,
  };
}

export function createTeamMember(partial?: Partial<HiringTeamMember>): HiringTeamMember {
  return {
    id: partial?.id ?? `member-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: partial?.name ?? "",
    email: partial?.email ?? "",
    role: partial?.role ?? "Recruiter",
    active: partial?.active ?? true,
  };
}

export function createNote(partial?: Partial<RecruiterNote>): RecruiterNote {
  return {
    id: partial?.id ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    author: partial?.author ?? "Recruiter",
    text: partial?.text ?? "",
    createdAt: partial?.createdAt ?? new Date().toISOString(),
  };
}

export function createInterview(partial?: Partial<InterviewRecord>): InterviewRecord {
  return {
    id: partial?.id ?? `interview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: partial?.type ?? "Screening",
    scheduledAt: partial?.scheduledAt ?? "",
    interviewer: partial?.interviewer ?? "",
    status: partial?.status ?? "Planned",
    score: partial?.score ?? 0,
    feedback: partial?.feedback ?? "",
  };
}

export function scoreCandidateForJob(
  candidate: CandidateRecord,
  job: RecruiterJob,
): CandidateMatchReport {
  const candidateText = [
    candidate.fullName,
    candidate.currentTitle,
    candidate.qualification,
    candidate.skills.join(" "),
    candidate.cvText,
  ].join(" ");
  const jobText = [
    job.title,
    job.department,
    job.description,
    job.requirements,
    job.scorecard.join(" "),
  ].join(" ");

  const candidateSkills = extractSkills(candidateText);
  const jobSkills = extractSkills(jobText);
  const matchedSkills = jobSkills.filter((skill) => includesAny(normalize(candidateText), [skill]));
  const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 10);

  const skillScore = jobSkills.length ? (matchedSkills.length / jobSkills.length) * 100 : 55;
  const roleScore = similarity(candidateText, `${job.title} ${job.description}`) * 100;
  const experienceExpected = Math.max(1, Math.min(12, tokenize(job.requirements).filter((t) => /^\d+$/.test(t)).map(Number)[0] || 3));
  const experienceScore = clamp((candidate.yearsExperience / experienceExpected) * 100);
  const qualificationScore = candidate.qualification
    ? similarity(candidate.qualification, job.requirements) * 100 + 35
    : 25;
  const compensationScore =
    !candidate.expectedSalary || !job.salaryMax
      ? 75
      : candidate.expectedSalary <= job.salaryMax
        ? 100
        : candidate.expectedSalary <= job.salaryMax * 1.15
          ? 70
          : 35;
  const locationScore =
    job.employmentModel === "Remote" ||
    job.employmentModel === "Flexible" ||
    !candidate.location ||
    !job.location ||
    normalize(candidate.location).includes(normalize(job.location)) ||
    normalize(job.location).includes(normalize(candidate.location))
      ? 100
      : 55;
  const cultureScore = candidate.cultureScore || 65;
  const leadershipScore = candidate.leadershipScore || 50;
  const atsScore = candidate.atsScore || 55;

  const dimensions: CandidateMatchDimension[] = [
    {
      label: "Skills alignment",
      score: clamp(skillScore),
      weight: 0.24,
      evidence: matchedSkills.slice(0, 5).map((skill) => `Evidence detected for ${skill}.`),
      concerns: missingSkills.slice(0, 5).map((skill) => `Limited evidence for ${skill}.`),
    },
    {
      label: "Role relevance",
      score: clamp(roleScore),
      weight: 0.18,
      evidence: roleScore >= 65 ? ["Career history and role language are aligned."] : [],
      concerns: roleScore < 65 ? ["The profile may require stronger role-specific positioning."] : [],
    },
    {
      label: "Experience level",
      score: experienceScore,
      weight: 0.14,
      evidence: experienceScore >= 75 ? ["Experience level meets the inferred requirement."] : [],
      concerns: experienceScore < 75 ? ["Experience may be below the expected level."] : [],
    },
    {
      label: "Qualification fit",
      score: clamp(qualificationScore),
      weight: 0.09,
      evidence: qualificationScore >= 70 ? ["Qualification appears relevant."] : [],
      concerns: qualificationScore < 55 ? ["Qualification alignment is not strongly evidenced."] : [],
    },
    {
      label: "ATS quality",
      score: atsScore,
      weight: 0.12,
      evidence: atsScore >= 75 ? ["CV structure is ATS competitive."] : [],
      concerns: atsScore < 65 ? ["CV quality may obscure otherwise relevant experience."] : [],
    },
    {
      label: "Culture contribution",
      score: cultureScore,
      weight: 0.08,
      evidence: cultureScore >= 75 ? ["Positive culture contribution signal."] : [],
      concerns: cultureScore < 55 ? ["Culture contribution requires validation."] : [],
    },
    {
      label: "Leadership potential",
      score: leadershipScore,
      weight: 0.07,
      evidence: leadershipScore >= 70 ? ["Leadership evidence is visible."] : [],
      concerns: leadershipScore < 45 ? ["Leadership evidence is limited."] : [],
    },
    {
      label: "Location and compensation",
      score: clamp((locationScore + compensationScore) / 2),
      weight: 0.08,
      evidence: locationScore >= 90 ? ["Location model is compatible."] : [],
      concerns: compensationScore < 60 ? ["Compensation expectations may be misaligned."] : [],
    },
  ];

  const weighted = dimensions.reduce((sum, item) => sum + item.score * item.weight, 0);
  const riskPenalty = Math.min(18, candidate.riskScore * 0.18);
  const overallScore = clamp(weighted - riskPenalty);
  const confidence = clamp(55 + matchedSkills.length * 3 + (candidate.cvText.length > 600 ? 12 : 0));

  const strengths = unique([
    ...matchedSkills.slice(0, 5).map((skill) => `Strong evidence for ${skill}.`),
    ...(experienceScore >= 80 ? ["Experience level is aligned with the vacancy."] : []),
    ...(atsScore >= 75 ? ["CV is easy to screen and parse."] : []),
    ...(cultureScore >= 75 ? ["Positive culture contribution signal."] : []),
  ]).slice(0, 8);

  const risks = unique([
    ...missingSkills.slice(0, 5).map((skill) => `Validate practical exposure to ${skill}.`),
    ...(candidate.riskScore >= 60 ? ["Candidate risk indicators require recruiter review."] : []),
    ...(compensationScore < 60 ? ["Expected salary may exceed the role range."] : []),
    ...(experienceScore < 55 ? ["Experience depth may be below the requirement."] : []),
  ]).slice(0, 8);

  const interviewQuestions = unique([
    ...matchedSkills.slice(0, 3).map((skill) => `Describe a recent outcome that demonstrates ${skill}.`),
    ...missingSkills.slice(0, 2).map((skill) => `How would you approach a requirement involving ${skill}?`),
    `Why is ${job.title} the right next step in your career?`,
    `What measurable impact would you aim to deliver in your first 90 days?`,
    `Describe a situation where you influenced stakeholders without formal authority.`,
  ]).slice(0, 8);

  const recommendation =
    overallScore >= 85
      ? "Priority shortlist"
      : overallScore >= 72
        ? "Shortlist"
        : overallScore >= 55
          ? "Review"
          : "Low priority";

  return {
    candidateId: candidate.id,
    jobId: job.id,
    overallScore,
    confidence,
    recommendation,
    dimensions,
    strengths,
    risks,
    interviewQuestions,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateHiringMetrics(
  jobs: RecruiterJob[],
  candidates: CandidateRecord[],
): HiringMetrics {
  const openJobs = jobs.filter((job) => job.status === "Open").length;
  const activeCandidates = candidates.filter((candidate) =>
    !["Hired", "Rejected"].includes(candidate.stage),
  ).length;
  const shortlisted = candidates.filter((candidate) =>
    ["Shortlisted", "Screening", "Interview", "Assessment", "Reference", "Offer", "Hired"].includes(candidate.stage),
  ).length;
  const interviews = candidates.filter((candidate) =>
    ["Interview", "Assessment", "Reference", "Offer", "Hired"].includes(candidate.stage),
  ).length;
  const offers = candidates.filter((candidate) =>
    ["Offer", "Hired"].includes(candidate.stage),
  ).length;
  const hired = candidates.filter((candidate) => candidate.stage === "Hired").length;
  const averageAiScore = candidates.length
    ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.aiScore, 0) / candidates.length)
    : 0;
  const diversityCoverage = candidates.length
    ? Math.round(
        (candidates.filter((candidate) => candidate.flags.includes("Diversity")).length /
          candidates.length) *
          100,
      )
    : 0;
  const now = Date.now();
  const overdueReviews = candidates.filter((candidate) => {
    if (candidate.stage !== "New" && candidate.stage !== "Reviewed") return false;
    const ageHours = (now - new Date(candidate.lastActivityAt).getTime()) / 36e5;
    return ageHours > 72;
  }).length;

  const hiredCandidates = candidates.filter((candidate) => candidate.stage === "Hired");
  const averageTimeToHire = hiredCandidates.length
    ? Math.round(
        hiredCandidates.reduce((sum, candidate) => {
          const days = (new Date(candidate.lastActivityAt).getTime() - new Date(candidate.createdAt).getTime()) / 86400000;
          return sum + Math.max(0, days);
        }, 0) / hiredCandidates.length,
      )
    : 0;

  return {
    openJobs,
    activeCandidates,
    shortlisted,
    interviews,
    offers,
    hired,
    averageTimeToHire,
    qualityOfPipeline: averageAiScore,
    diversityCoverage,
    overdueReviews,
  };
}
