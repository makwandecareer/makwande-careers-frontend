export type ApplicationStage =
  | "Researching"
  | "Preparing"
  | "Applied"
  | "Screening"
  | "Interview"
  | "Assessment"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type ApplicationPriority = "Low" | "Medium" | "High" | "Critical";
export type ContactType = "Recruiter" | "Hiring Manager" | "Employee" | "Referral";
export type TaskType =
  | "Research"
  | "Tailor CV"
  | "Write Cover Letter"
  | "Submit"
  | "Follow Up"
  | "Interview Prep"
  | "Assessment Prep"
  | "Negotiation";

export interface ApplicationContact {
  id: string;
  name: string;
  title: string;
  email: string;
  linkedin: string;
  type: ContactType;
  notes: string;
}

export interface ApplicationTask {
  id: string;
  title: string;
  type: TaskType;
  dueDate: string;
  completed: boolean;
}

export interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  salary: string;
  stage: ApplicationStage;
  priority: ApplicationPriority;
  matchScore: number;
  atsScore: number;
  deadline: string;
  appliedDate: string;
  lastActivityDate: string;
  nextFollowUpDate: string;
  jobDescription: string;
  notes: string;
  contacts: ApplicationContact[];
  tasks: ApplicationTask[];
  createdAt: string;
}

export interface ApplicationMetrics {
  total: number;
  active: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  averageMatch: number;
  overdueFollowUps: number;
}

export interface ApplicationInsight {
  type: "success" | "warning" | "action";
  title: string;
  detail: string;
}

export interface FunnelStage {
  label: string;
  count: number;
  conversion: number;
}

export const APPLICATION_STAGES: ApplicationStage[] = [
  "Researching",
  "Preparing",
  "Applied",
  "Screening",
  "Interview",
  "Assessment",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export const ACTIVE_STAGES: ApplicationStage[] = [
  "Researching",
  "Preparing",
  "Applied",
  "Screening",
  "Interview",
  "Assessment",
  "Offer",
];

export function createApplication(
  partial?: Partial<ApplicationRecord>,
): ApplicationRecord {
  const now = new Date().toISOString();

  return {
    id: partial?.id ?? `application-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    company: partial?.company ?? "",
    role: partial?.role ?? "",
    location: partial?.location ?? "",
    source: partial?.source ?? "",
    salary: partial?.salary ?? "",
    stage: partial?.stage ?? "Researching",
    priority: partial?.priority ?? "Medium",
    matchScore: partial?.matchScore ?? 0,
    atsScore: partial?.atsScore ?? 0,
    deadline: partial?.deadline ?? "",
    appliedDate: partial?.appliedDate ?? "",
    lastActivityDate: partial?.lastActivityDate ?? now.slice(0, 10),
    nextFollowUpDate: partial?.nextFollowUpDate ?? "",
    jobDescription: partial?.jobDescription ?? "",
    notes: partial?.notes ?? "",
    contacts: partial?.contacts ?? [],
    tasks: partial?.tasks ?? [],
    createdAt: partial?.createdAt ?? now,
  };
}

export function createTask(partial?: Partial<ApplicationTask>): ApplicationTask {
  return {
    id: partial?.id ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: partial?.title ?? "",
    type: partial?.type ?? "Research",
    dueDate: partial?.dueDate ?? "",
    completed: partial?.completed ?? false,
  };
}

export function createContact(
  partial?: Partial<ApplicationContact>,
): ApplicationContact {
  return {
    id: partial?.id ?? `contact-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: partial?.name ?? "",
    title: partial?.title ?? "",
    email: partial?.email ?? "",
    linkedin: partial?.linkedin ?? "",
    type: partial?.type ?? "Recruiter",
    notes: partial?.notes ?? "",
  };
}

function isPastDate(value: string): boolean {
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return date.getTime() < Date.now();
}

export function calculateApplicationMetrics(
  applications: ApplicationRecord[],
): ApplicationMetrics {
  const total = applications.length;
  const active = applications.filter((item) => ACTIVE_STAGES.includes(item.stage)).length;
  const applied = applications.filter((item) =>
    ["Applied", "Screening", "Interview", "Assessment", "Offer", "Rejected"].includes(item.stage),
  ).length;
  const interviews = applications.filter((item) =>
    ["Interview", "Assessment", "Offer"].includes(item.stage),
  ).length;
  const offers = applications.filter((item) => item.stage === "Offer").length;
  const rejected = applications.filter((item) => item.stage === "Rejected").length;
  const responses = applications.filter((item) =>
    ["Screening", "Interview", "Assessment", "Offer", "Rejected"].includes(item.stage),
  ).length;
  const averageMatch = total
    ? Math.round(applications.reduce((sum, item) => sum + item.matchScore, 0) / total)
    : 0;

  return {
    total,
    active,
    applied,
    interviews,
    offers,
    rejected,
    responseRate: applied ? Math.round((responses / applied) * 100) : 0,
    interviewRate: applied ? Math.round((interviews / applied) * 100) : 0,
    offerRate: interviews ? Math.round((offers / interviews) * 100) : 0,
    averageMatch,
    overdueFollowUps: applications.filter(
      (item) =>
        ACTIVE_STAGES.includes(item.stage) &&
        isPastDate(item.nextFollowUpDate),
    ).length,
  };
}

export function buildApplicationFunnel(
  applications: ApplicationRecord[],
): FunnelStage[] {
  const applied = applications.filter((item) =>
    ["Applied", "Screening", "Interview", "Assessment", "Offer", "Rejected"].includes(item.stage),
  ).length;
  const screening = applications.filter((item) =>
    ["Screening", "Interview", "Assessment", "Offer"].includes(item.stage),
  ).length;
  const interview = applications.filter((item) =>
    ["Interview", "Assessment", "Offer"].includes(item.stage),
  ).length;
  const offer = applications.filter((item) => item.stage === "Offer").length;

  const rate = (value: number, base: number): number =>
    base ? Math.round((value / base) * 100) : 0;

  return [
    { label: "Applications", count: applied, conversion: applied ? 100 : 0 },
    { label: "Screening", count: screening, conversion: rate(screening, applied) },
    { label: "Interviews", count: interview, conversion: rate(interview, screening) },
    { label: "Offers", count: offer, conversion: rate(offer, interview) },
  ];
}

export function generateApplicationInsights(
  applications: ApplicationRecord[],
): ApplicationInsight[] {
  const metrics = calculateApplicationMetrics(applications);
  const insights: ApplicationInsight[] = [];

  if (!applications.length) {
    return [
      {
        type: "action",
        title: "Build your first targeted application",
        detail: "Add an opportunity and move it through research, tailoring, submission and follow-up.",
      },
    ];
  }

  if (metrics.overdueFollowUps > 0) {
    insights.push({
      type: "warning",
      title: `${metrics.overdueFollowUps} follow-up${metrics.overdueFollowUps === 1 ? "" : "s"} overdue`,
      detail: "Prioritise polite, value-led follow-ups before adding more applications.",
    });
  }

  if (metrics.averageMatch < 60) {
    insights.push({
      type: "warning",
      title: "Application quality is too broad",
      detail: "The average opportunity match is below 60%. Focus on fewer, better-aligned roles.",
    });
  } else if (metrics.averageMatch >= 75) {
    insights.push({
      type: "success",
      title: "Strong targeting discipline",
      detail: `Your average opportunity match is ${metrics.averageMatch}%, which supports a quality-over-volume strategy.`,
    });
  }

  if (metrics.applied >= 5 && metrics.responseRate < 20) {
    insights.push({
      type: "action",
      title: "Low recruiter response rate",
      detail: "Review role fit, CV tailoring, application timing and networking activity.",
    });
  }

  if (metrics.interviews > 0 && metrics.offerRate < 25) {
    insights.push({
      type: "action",
      title: "Convert more interviews into offers",
      detail: "Strengthen role-specific stories, commercial evidence and closing questions.",
    });
  }

  const incompleteTasks = applications.flatMap((item) =>
    item.tasks.filter((task) => !task.completed),
  ).length;

  if (incompleteTasks > 0) {
    insights.push({
      type: "action",
      title: `${incompleteTasks} preparation task${incompleteTasks === 1 ? "" : "s"} outstanding`,
      detail: "Complete the highest-priority tasks before the next deadline or interview.",
    });
  }

  const strongApplications = applications.filter(
    (item) => item.matchScore >= 75 && ACTIVE_STAGES.includes(item.stage),
  ).length;

  if (strongApplications > 0) {
    insights.push({
      type: "success",
      title: `${strongApplications} high-potential application${strongApplications === 1 ? "" : "s"}`,
      detail: "Protect these opportunities with timely follow-up, tailored preparation and stakeholder research.",
    });
  }

  return insights.slice(0, 6);
}

export function recommendNextAction(
  application: ApplicationRecord,
): string {
  const openTasks = application.tasks
    .filter((task) => !task.completed)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  if (openTasks[0]) return openTasks[0].title;

  switch (application.stage) {
    case "Researching":
      return "Research the company, hiring team and role priorities.";
    case "Preparing":
      return "Tailor the CV and application message before submission.";
    case "Applied":
      return application.nextFollowUpDate
        ? `Follow up on ${application.nextFollowUpDate}.`
        : "Set a follow-up date for 5–7 business days after submission.";
    case "Screening":
      return "Prepare a concise career story and role-fit explanation.";
    case "Interview":
      return "Complete role-specific interview preparation and company research.";
    case "Assessment":
      return "Practise the expected case study, task or assessment format.";
    case "Offer":
      return "Review compensation, role scope, benefits and negotiation priorities.";
    case "Rejected":
      return "Capture lessons, request feedback where appropriate and close the record.";
    case "Withdrawn":
      return "Document the withdrawal reason for future decision quality.";
    default:
      return "Review the application and define the next concrete action.";
  }
}
