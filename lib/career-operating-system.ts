export type TaskFrequency = "Daily" | "Weekly" | "Monthly";
export type TaskStatus = "Not started" | "In progress" | "Completed";
export type ApplicationStage = "Targeted" | "Preparing" | "Applied" | "Screening" | "Interview" | "Assessment" | "Offer" | "Rejected" | "Withdrawn";
export type LearningStatus = "Planned" | "Active" | "Completed";
export type InteractionType = "LinkedIn" | "Email" | "Phone" | "Interview" | "Networking" | "Referral";

export interface CareerTask { id: string; title: string; category: string; frequency: TaskFrequency; status: TaskStatus; dueDate: string; impact: number; createdAt: string; }
export interface CareerGoal { id: string; title: string; period: TaskFrequency; target: number; current: number; unit: string; dueDate: string; }
export interface CareerApplication { id: string; company: string; role: string; stage: ApplicationStage; matchScore: number; appliedDate: string; nextAction: string; nextActionDate: string; salaryMax: number; }
export interface CareerInterview { id: string; company: string; role: string; date: string; type: string; readiness: number; outcome: string; }
export interface LearningItem { id: string; title: string; provider: string; skill: string; status: LearningStatus; progress: number; targetDate: string; }
export interface CVVersion { id: string; name: string; targetRole: string; atsScore: number; updatedAt: string; notes: string; }
export interface RecruiterInteraction { id: string; recruiter: string; company: string; type: InteractionType; date: string; summary: string; followUpDate: string; }
export interface SalaryRecord { id: string; role: string; employer: string; annualSalary: number; date: string; }
export interface PromotionReadiness { performance: number; skillDepth: number; leadership: number; visibility: number; impactEvidence: number; sponsorSupport: number; }
export interface CareerProfile { fullName: string; currentRole: string; targetRole: string; currentSalary: number; targetSalary: number; location: string; language: string; weeklyHours: number; lastUpdated: string; }
export interface CareerHealthReport { overall: number; readiness: number; execution: number; marketPositioning: number; learningVelocity: number; networkStrength: number; financialProgression: number; promotionReadiness: number; alerts: string[]; recommendations: string[]; }

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function createTask(partial: Partial<CareerTask> = {}): CareerTask {
  return { id: partial.id ?? makeId("task"), title: partial.title ?? "", category: partial.category ?? "Career", frequency: partial.frequency ?? "Daily", status: partial.status ?? "Not started", dueDate: partial.dueDate ?? new Date().toISOString().slice(0, 10), impact: partial.impact ?? 5, createdAt: partial.createdAt ?? new Date().toISOString() };
}
export function createGoal(partial: Partial<CareerGoal> = {}): CareerGoal {
  return { id: partial.id ?? makeId("goal"), title: partial.title ?? "", period: partial.period ?? "Weekly", target: partial.target ?? 1, current: partial.current ?? 0, unit: partial.unit ?? "actions", dueDate: partial.dueDate ?? "" };
}
export function createApplication(partial: Partial<CareerApplication> = {}): CareerApplication {
  return { id: partial.id ?? makeId("application"), company: partial.company ?? "", role: partial.role ?? "", stage: partial.stage ?? "Targeted", matchScore: partial.matchScore ?? 0, appliedDate: partial.appliedDate ?? "", nextAction: partial.nextAction ?? "", nextActionDate: partial.nextActionDate ?? "", salaryMax: partial.salaryMax ?? 0 };
}
export function createInterview(partial: Partial<CareerInterview> = {}): CareerInterview {
  return { id: partial.id ?? makeId("interview"), company: partial.company ?? "", role: partial.role ?? "", date: partial.date ?? "", type: partial.type ?? "Screening", readiness: partial.readiness ?? 0, outcome: partial.outcome ?? "Pending" };
}
export function createLearning(partial: Partial<LearningItem> = {}): LearningItem {
  return { id: partial.id ?? makeId("learning"), title: partial.title ?? "", provider: partial.provider ?? "", skill: partial.skill ?? "", status: partial.status ?? "Planned", progress: partial.progress ?? 0, targetDate: partial.targetDate ?? "" };
}
export function createCVVersion(partial: Partial<CVVersion> = {}): CVVersion {
  return { id: partial.id ?? makeId("cv"), name: partial.name ?? "Master CV", targetRole: partial.targetRole ?? "", atsScore: partial.atsScore ?? 0, updatedAt: partial.updatedAt ?? new Date().toISOString(), notes: partial.notes ?? "" };
}
export function createInteraction(partial: Partial<RecruiterInteraction> = {}): RecruiterInteraction {
  return { id: partial.id ?? makeId("interaction"), recruiter: partial.recruiter ?? "", company: partial.company ?? "", type: partial.type ?? "LinkedIn", date: partial.date ?? new Date().toISOString().slice(0, 10), summary: partial.summary ?? "", followUpDate: partial.followUpDate ?? "" };
}
export function createSalaryRecord(partial: Partial<SalaryRecord> = {}): SalaryRecord {
  return { id: partial.id ?? makeId("salary"), role: partial.role ?? "", employer: partial.employer ?? "", annualSalary: partial.annualSalary ?? 0, date: partial.date ?? new Date().toISOString().slice(0, 10) };
}
export function calculatePromotionReadiness(p: PromotionReadiness): number {
  return clamp(p.performance * .24 + p.skillDepth * .18 + p.leadership * .18 + p.visibility * .14 + p.impactEvidence * .16 + p.sponsorSupport * .10);
}
export function calculateCareerHealth(input: { profile: CareerProfile; tasks: CareerTask[]; goals: CareerGoal[]; applications: CareerApplication[]; interviews: CareerInterview[]; learning: LearningItem[]; cvs: CVVersion[]; interactions: RecruiterInteraction[]; salaryHistory: SalaryRecord[]; promotion: PromotionReadiness; }): CareerHealthReport {
  const taskTotal = input.tasks.reduce((s, t) => s + Math.max(1, t.impact), 0) || 1;
  const taskDone = input.tasks.reduce((s, t) => s + Math.max(1, t.impact) * (t.status === "Completed" ? 1 : t.status === "In progress" ? .5 : 0), 0);
  const taskScore = input.tasks.length ? clamp(taskDone / taskTotal * 100) : 45;
  const goalScore = input.goals.length ? clamp(input.goals.reduce((s, g) => s + Math.min(1, g.current / Math.max(1, g.target)) * 100, 0) / input.goals.length) : 45;
  const execution = clamp((taskScore + goalScore) / 2);
  const cvScore = [...input.cvs].sort((a,b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]?.atsScore ?? 45;
  const appFit = input.applications.length ? input.applications.reduce((s,a) => s + a.matchScore, 0) / input.applications.length : 45;
  const marketPositioning = clamp(cvScore * .55 + appFit * .45);
  const learningVelocity = input.learning.length ? clamp(input.learning.reduce((s,l) => s + l.progress, 0) / input.learning.length) : 40;
  const recentInteractions = input.interactions.filter(i => Date.now() - +new Date(i.date) < 2592000000).length;
  const networkStrength = clamp(35 + Math.min(50, recentInteractions * 8));
  const interviewReadiness = input.interviews.length ? clamp(input.interviews.reduce((s,i) => s + i.readiness, 0) / input.interviews.length) : 45;
  const readiness = clamp((marketPositioning + learningVelocity + interviewReadiness) / 3);
  const latestSalary = [...input.salaryHistory].sort((a,b) => b.date.localeCompare(a.date))[0]?.annualSalary ?? input.profile.currentSalary;
  const target = Math.max(1, input.profile.targetSalary || latestSalary || 1);
  const financialProgression = clamp(35 + latestSalary / target * 60);
  const promotionReadiness = calculatePromotionReadiness(input.promotion);
  const overall = clamp(readiness*.24 + execution*.22 + marketPositioning*.16 + learningVelocity*.12 + networkStrength*.10 + financialProgression*.06 + promotionReadiness*.10);
  const alerts: string[] = [];
  if (execution < 55) alerts.push("Career execution is below target.");
  if (marketPositioning < 60) alerts.push("Market positioning needs improvement.");
  if (learningVelocity < 50) alerts.push("Learning momentum is low.");
  if (networkStrength < 55) alerts.push("Recruiter and network activity is limited.");
  if (promotionReadiness < 65) alerts.push("Promotion readiness requires stronger evidence.");
  if (!input.applications.length) alerts.push("No active job pipeline is being tracked.");
  const recommendations = [
    execution < 70 ? "Complete one high-impact career task today." : "Maintain your current execution rhythm.",
    marketPositioning < 75 ? "Create a role-specific CV for your highest-priority opportunity." : "Continue targeting high-fit opportunities.",
    learningVelocity < 70 ? "Schedule focused learning for your largest skill gap." : "Convert learning into portfolio evidence.",
    networkStrength < 70 ? "Record two meaningful recruiter interactions this week." : "Follow up with warm professional relationships.",
    promotionReadiness < 75 ? "Build measurable impact evidence and leadership visibility." : "Prepare a formal promotion or compensation case.",
  ];
  return { overall, readiness, execution, marketPositioning, learningVelocity, networkStrength, financialProgression, promotionReadiness, alerts, recommendations };
}

export const enterpriseCapabilities = [
  ["Multi-language CV generation","AI Content","Available"],
  ["AI translation","AI Content","Planned"],
  ["100+ ATS templates","Documents","Planned"],
  ["Recruiter CRM","Recruitment","Available"],
  ["Employer portal","Recruitment","Available"],
  ["Candidate portal","Career","Available"],
  ["Team collaboration","Enterprise","Available"],
  ["Notes and audit logs","Governance","Enterprise"],
  ["Role-based permissions","Governance","Enterprise"],
  ["AI analytics","Analytics","Available"],
  ["Executive dashboards","Analytics","Available"],
  ["HR reporting","Analytics","Planned"],
  ["API integrations","Integrations","Enterprise"],
  ["Outlook integration","Integrations","Planned"],
  ["Google Calendar integration","Integrations","Planned"],
  ["LinkedIn integration","Integrations","Planned"],
  ["Microsoft 365 integration","Integrations","Planned"],
  ["Bulk candidate processing","Enterprise","Enterprise"],
  ["AI reporting","Analytics","Available"],
  ["White-label support","Enterprise","Enterprise"],
] as const;
