"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateHiringMetrics,
  createCandidate,
  createInterview,
  createJob,
  createNote,
  createTeamMember,
  scoreCandidateForJob,
  type CandidateFlag,
  type CandidateRecord,
  type EmployerProfile,
  type EmploymentModel,
  type HiringStage,
  type HiringTeamMember,
  type InterviewType,
  type JobPriority,
  type JobStatus,
  type RecruiterJob,
  type TeamRole,
} from "@/lib/recruiter-employer-portal";

import styles from "./RecruiterEmployerPortal.module.css";

interface RecruiterEmployerPortalProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

interface StoredState {
  employer: EmployerProfile;
  jobs: RecruiterJob[];
  candidates: CandidateRecord[];
  team: HiringTeamMember[];
  selectedJobId: string;
  selectedCandidateId: string;
}

const STORAGE_KEY = "makwande-recruiter-employer-portal-v1";
const HIRING_STAGES: HiringStage[] = [
  "New",
  "Reviewed",
  "Shortlisted",
  "Screening",
  "Interview",
  "Assessment",
  "Reference",
  "Offer",
  "Hired",
  "Rejected",
];
const JOB_STATUSES: JobStatus[] = ["Draft", "Open", "Paused", "Closed"];
const JOB_PRIORITIES: JobPriority[] = ["Standard", "High", "Urgent"];
const EMPLOYMENT_MODELS: EmploymentModel[] = ["On-site", "Hybrid", "Remote", "Flexible"];
const TEAM_ROLES: TeamRole[] = ["Owner", "Admin", "Recruiter", "Hiring Manager", "Interviewer"];
const INTERVIEW_TYPES: InterviewType[] = ["Screening", "Technical", "Behavioural", "Panel", "Executive"];
const CANDIDATE_FLAGS: CandidateFlag[] = ["Top Talent", "Referral", "Internal", "Diversity", "Risk"];

function cvToText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "";
  }
}

function nowDateTimeLocal(): string {
  const date = new Date(Date.now() + 86400000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function RecruiterEmployerPortal({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: RecruiterEmployerPortalProps) {
  const [employer, setEmployer] = useState<EmployerProfile>({
    companyName: "Makwande Careers",
    industry: "Career Technology",
    website: "",
    location: "South Africa",
    companySize: "1–50",
    hiringBrand: "Opportunity, fairness and measurable potential",
    values: ["Integrity", "Excellence", "Growth"],
  });
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [team, setTeam] = useState<HiringTeamMember[]>([
    createTeamMember({
      name: "Recruitment Lead",
      email: "",
      role: "Owner",
    }),
  ]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<"overview" | "jobs" | "pipeline" | "talent" | "team">("overview");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateStageFilter, setCandidateStageFilter] = useState<"All" | HiringStage>("All");

  const [jobDraft, setJobDraft] = useState<RecruiterJob>(() =>
    createJob({
      title: targetRole,
      description: jobDescription,
      requirements: jobDescription,
      status: "Open",
    }),
  );

  const [candidateDraft, setCandidateDraft] = useState<CandidateRecord>(() =>
    createCandidate({
      currentTitle: targetRole,
      cvText: cvToText(cvContent),
      atsScore: atsScore ?? 0,
      skills: [],
    }),
  );

  const [noteText, setNoteText] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("Screening");
  const [interviewDate, setInterviewDate] = useState(nowDateTimeLocal());
  const [interviewer, setInterviewer] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamRole, setTeamRole] = useState<TeamRole>("Recruiter");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredState;
        if (parsed.employer) setEmployer(parsed.employer);
        if (Array.isArray(parsed.jobs)) setJobs(parsed.jobs);
        if (Array.isArray(parsed.candidates)) setCandidates(parsed.candidates);
        if (Array.isArray(parsed.team)) setTeam(parsed.team);
        if (parsed.selectedJobId) setSelectedJobId(parsed.selectedJobId);
        if (parsed.selectedCandidateId) setSelectedCandidateId(parsed.selectedCandidateId);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        employer,
        jobs,
        candidates,
        team,
        selectedJobId,
        selectedCandidateId,
      }),
    );
  }, [candidates, employer, hydrated, jobs, selectedCandidateId, selectedJobId, team]);

  useEffect(() => {
    setJobDraft((current) => ({
      ...current,
      title: current.title || targetRole,
      description: current.description || jobDescription,
      requirements: current.requirements || jobDescription,
    }));
    setCandidateDraft((current) => ({
      ...current,
      currentTitle: current.currentTitle || targetRole,
      cvText: current.cvText || cvToText(cvContent),
      atsScore: current.atsScore || atsScore || 0,
    }));
  }, [atsScore, cvContent, jobDescription, targetRole]);

  const metrics = useMemo(
    () => calculateHiringMetrics(jobs, candidates),
    [candidates, jobs],
  );

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;

  const rankedCandidates = useMemo(() => {
    if (!selectedJob) return [];
    return candidates
      .filter((candidate) => candidate.jobId === selectedJob.id)
      .map((candidate) => ({
        candidate,
        report: scoreCandidateForJob(candidate, selectedJob),
      }))
      .sort((left, right) => right.report.overallScore - left.report.overallScore);
  }, [candidates, selectedJob]);

  useEffect(() => {
    if (!selectedJob) return;
    const scores = new Map(
      rankedCandidates.map(({ candidate, report }) => [candidate.id, report.overallScore]),
    );
    setCandidates((current) => {
      let changed = false;
      const next = current.map((candidate) => {
        const score = scores.get(candidate.id);
        if (score === undefined || candidate.aiScore === score) return candidate;
        changed = true;
        return { ...candidate, aiScore: score };
      });
      return changed ? next : current;
    });
  }, [rankedCandidates, selectedJob]);

  const filteredCandidates = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase();
    return candidates
      .filter((candidate) => (selectedJob ? candidate.jobId === selectedJob.id : true))
      .filter((candidate) =>
        candidateStageFilter === "All" ? true : candidate.stage === candidateStageFilter,
      )
      .filter((candidate) =>
        query
          ? `${candidate.fullName} ${candidate.currentTitle} ${candidate.skills.join(" ")}`
              .toLowerCase()
              .includes(query)
          : true,
      )
      .sort((a, b) => b.aiScore - a.aiScore);
  }, [candidateQuery, candidateStageFilter, candidates, selectedJob]);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    filteredCandidates[0] ??
    null;

  const selectedReport =
    selectedCandidate && selectedJob
      ? scoreCandidateForJob(selectedCandidate, selectedJob)
      : null;

  function addJob(): void {
    if (!jobDraft.title.trim()) return;
    const job = createJob({
      ...jobDraft,
      title: jobDraft.title.trim(),
      department: jobDraft.department.trim(),
      scorecard: jobDraft.scorecard.filter(Boolean),
    });
    setJobs((current) => [job, ...current]);
    setSelectedJobId(job.id);
    setView("jobs");
    setJobDraft(
      createJob({
        title: "",
        status: "Open",
        employmentModel: "Hybrid",
      }),
    );
  }

  function updateJob(id: string, patch: Partial<RecruiterJob>): void {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    );
  }

  function removeJob(id: string): void {
    setJobs((current) => current.filter((job) => job.id !== id));
    setCandidates((current) => current.filter((candidate) => candidate.jobId !== id));
    if (selectedJobId === id) setSelectedJobId("");
  }

  function addCandidate(): void {
    if (!candidateDraft.fullName.trim() || !selectedJob) return;
    const candidate = createCandidate({
      ...candidateDraft,
      fullName: candidateDraft.fullName.trim(),
      jobId: selectedJob.id,
      skills: candidateDraft.skills.filter(Boolean),
    });
    const report = scoreCandidateForJob(candidate, selectedJob);
    candidate.aiScore = report.overallScore;
    setCandidates((current) => [candidate, ...current]);
    setSelectedCandidateId(candidate.id);
    setView("pipeline");
    setCandidateDraft(
      createCandidate({
        jobId: selectedJob.id,
        atsScore: atsScore ?? 0,
      }),
    );
  }

  function updateCandidate(id: string, patch: Partial<CandidateRecord>): void {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              ...patch,
              lastActivityAt: new Date().toISOString(),
            }
          : candidate,
      ),
    );
  }

  function moveCandidate(stage: HiringStage): void {
    if (!selectedCandidate) return;
    updateCandidate(selectedCandidate.id, { stage });
  }

  function toggleFlag(flag: CandidateFlag): void {
    if (!selectedCandidate) return;
    const flags = selectedCandidate.flags.includes(flag)
      ? selectedCandidate.flags.filter((item) => item !== flag)
      : [...selectedCandidate.flags, flag];
    updateCandidate(selectedCandidate.id, { flags });
  }

  function addNote(): void {
    if (!selectedCandidate || !noteText.trim()) return;
    updateCandidate(selectedCandidate.id, {
      notes: [
        createNote({
          author: team[0]?.name || "Recruiter",
          text: noteText.trim(),
        }),
        ...selectedCandidate.notes,
      ],
    });
    setNoteText("");
  }

  function scheduleInterview(): void {
    if (!selectedCandidate || !interviewDate) return;
    updateCandidate(selectedCandidate.id, {
      stage: "Interview",
      interviews: [
        ...selectedCandidate.interviews,
        createInterview({
          type: interviewType,
          scheduledAt: interviewDate,
          interviewer: interviewer || team[0]?.name || "Hiring team",
        }),
      ],
    });
  }

  function updateInterview(
    interviewId: string,
    patch: Partial<CandidateRecord["interviews"][number]>,
  ): void {
    if (!selectedCandidate) return;
    updateCandidate(selectedCandidate.id, {
      interviews: selectedCandidate.interviews.map((interview) =>
        interview.id === interviewId ? { ...interview, ...patch } : interview,
      ),
    });
  }

  function addTeamMember(): void {
    if (!teamName.trim()) return;
    setTeam((current) => [
      ...current,
      createTeamMember({
        name: teamName.trim(),
        email: teamEmail.trim(),
        role: teamRole,
      }),
    ]);
    setTeamName("");
    setTeamEmail("");
  }

  function removeCandidate(id: string): void {
    setCandidates((current) => current.filter((candidate) => candidate.id !== id));
    if (selectedCandidateId === id) setSelectedCandidateId("");
  }

  return (
    <div className={styles.portal}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 16 · World-class AI recruiter and employer portal
          </span>
          <h1>Run a modern hiring operation from one intelligent workspace</h1>
          <p>
            Create jobs, rank talent, manage pipelines, schedule interviews,
            collaborate with hiring teams and make evidence-led hiring
            decisions with transparent candidate intelligence.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          <article>
            <span>Open jobs</span>
            <strong>{metrics.openJobs}</strong>
          </article>
          <article>
            <span>Active candidates</span>
            <strong>{metrics.activeCandidates}</strong>
          </article>
          <article>
            <span>Pipeline quality</span>
            <strong>{metrics.qualityOfPipeline}%</strong>
          </article>
          <article>
            <span>Hires</span>
            <strong>{metrics.hired}</strong>
          </article>
        </div>
      </header>

      <nav className={styles.portalNav}>
        {[
          ["overview", "Executive Overview"],
          ["jobs", "Jobs"],
          ["pipeline", "Hiring Pipeline"],
          ["talent", "Talent Intelligence"],
          ["team", "Team & Governance"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={view === key ? styles.activeNav : ""}
            onClick={() =>
              setView(key as "overview" | "jobs" | "pipeline" | "talent" | "team")
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {view === "overview" ? (
        <>
          <section className={styles.analytics}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Hiring intelligence</span>
                <h2>Executive talent dashboard</h2>
              </div>
              <span>{metrics.overdueReviews} candidate reviews overdue</span>
            </div>

            <div className={styles.metricGrid}>
              <article>
                <span>Shortlisted</span>
                <strong>{metrics.shortlisted}</strong>
              </article>
              <article>
                <span>Interview stage</span>
                <strong>{metrics.interviews}</strong>
              </article>
              <article>
                <span>Offers</span>
                <strong>{metrics.offers}</strong>
              </article>
              <article>
                <span>Average time-to-hire</span>
                <strong>{metrics.averageTimeToHire}d</strong>
              </article>
              <article>
                <span>Diversity coverage</span>
                <strong>{metrics.diversityCoverage}%</strong>
              </article>
              <article>
                <span>Pipeline quality</span>
                <strong>{metrics.qualityOfPipeline}%</strong>
              </article>
            </div>

            <div className={styles.overviewGrid}>
              <article>
                <span className={styles.eyebrow}>Active requisitions</span>
                <h3>Hiring priorities</h3>
                {jobs.filter((job) => job.status === "Open").length ? (
                  jobs
                    .filter((job) => job.status === "Open")
                    .slice(0, 5)
                    .map((job) => {
                      const count = candidates.filter((candidate) => candidate.jobId === job.id).length;
                      return (
                        <button
                          type="button"
                          key={job.id}
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setView("jobs");
                          }}
                        >
                          <div>
                            <strong>{job.title}</strong>
                            <span>{job.department || "Department pending"}</span>
                          </div>
                          <small>{count} candidates</small>
                        </button>
                      );
                    })
                ) : (
                  <p>No open jobs yet.</p>
                )}
              </article>

              <article>
                <span className={styles.eyebrow}>Priority talent</span>
                <h3>Highest-ranked candidates</h3>
                {candidates.length ? (
                  [...candidates]
                    .sort((a, b) => b.aiScore - a.aiScore)
                    .slice(0, 5)
                    .map((candidate) => (
                      <button
                        type="button"
                        key={candidate.id}
                        onClick={() => {
                          setSelectedCandidateId(candidate.id);
                          setSelectedJobId(candidate.jobId);
                          setView("talent");
                        }}
                      >
                        <div>
                          <strong>{candidate.fullName}</strong>
                          <span>{candidate.currentTitle}</span>
                        </div>
                        <small>{candidate.aiScore}% fit</small>
                      </button>
                    ))
                ) : (
                  <p>No candidates added yet.</p>
                )}
              </article>

              <article>
                <span className={styles.eyebrow}>Risk and governance</span>
                <h3>Immediate attention</h3>
                <p>
                  {metrics.overdueReviews
                    ? `${metrics.overdueReviews} candidate reviews are older than 72 hours.`
                    : "Candidate review service levels are currently healthy."}
                </p>
                <p>
                  {metrics.diversityCoverage < 30
                    ? "Diversity coverage is limited. Expand sourcing channels and review job language."
                    : "Diversity coverage is visible in the current pipeline."}
                </p>
                <p>
                  {metrics.qualityOfPipeline < 65
                    ? "Pipeline quality is below target. Improve sourcing precision and role calibration."
                    : "Pipeline quality supports focused recruiter attention."}
                </p>
              </article>
            </div>
          </section>

          <section className={styles.companyPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Employer brand</span>
                <h2>Company hiring profile</h2>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Company name</span>
                <input
                  value={employer.companyName}
                  onChange={(event) =>
                    setEmployer((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Industry</span>
                <input
                  value={employer.industry}
                  onChange={(event) =>
                    setEmployer((current) => ({
                      ...current,
                      industry: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={employer.location}
                  onChange={(event) =>
                    setEmployer((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Company size</span>
                <input
                  value={employer.companySize}
                  onChange={(event) =>
                    setEmployer((current) => ({
                      ...current,
                      companySize: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Employer value proposition</span>
                <textarea
                  rows={3}
                  value={employer.hiringBrand}
                  onChange={(event) =>
                    setEmployer((current) => ({
                      ...current,
                      hiringBrand: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </section>
        </>
      ) : null}

      {view === "jobs" ? (
        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Requisition management</span>
                <h2>Create a job</h2>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Job title</span>
                <input
                  value={jobDraft.title}
                  onChange={(event) =>
                    setJobDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Department</span>
                <input
                  value={jobDraft.department}
                  onChange={(event) =>
                    setJobDraft((current) => ({ ...current, department: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={jobDraft.location}
                  onChange={(event) =>
                    setJobDraft((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Work model</span>
                <select
                  value={jobDraft.employmentModel}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      employmentModel: event.target.value as EmploymentModel,
                    }))
                  }
                >
                  {EMPLOYMENT_MODELS.map((model) => (
                    <option key={model}>{model}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select
                  value={jobDraft.status}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      status: event.target.value as JobStatus,
                    }))
                  }
                >
                  {JOB_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select
                  value={jobDraft.priority}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      priority: event.target.value as JobPriority,
                    }))
                  }
                >
                  {JOB_PRIORITIES.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Minimum salary</span>
                <input
                  type="number"
                  min={0}
                  value={jobDraft.salaryMin}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      salaryMin: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Maximum salary</span>
                <input
                  type="number"
                  min={0}
                  value={jobDraft.salaryMax}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      salaryMax: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Job description</span>
                <textarea
                  rows={5}
                  value={jobDraft.description}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Requirements</span>
                <textarea
                  rows={4}
                  value={jobDraft.requirements}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      requirements: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Success scorecard — one item per line</span>
                <textarea
                  rows={4}
                  value={jobDraft.scorecard.join("\n")}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      scorecard: event.target.value
                        .split("\n")
                        .map((item) => item.trim()),
                    }))
                  }
                  placeholder="Deliver first 90-day priorities&#10;Build stakeholder trust&#10;Improve operational metrics"
                />
              </label>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={!jobDraft.title.trim()}
              onClick={addJob}
            >
              Create requisition
            </button>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Job portfolio</span>
                <h2>Requisitions</h2>
              </div>
            </div>

            <div className={styles.jobList}>
              {jobs.length ? (
                jobs.map((job) => {
                  const candidateCount = candidates.filter((candidate) => candidate.jobId === job.id).length;
                  return (
                    <article
                      key={job.id}
                      className={selectedJob?.id === job.id ? styles.selectedCard : ""}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div>
                        <span>{job.department || "Department pending"}</span>
                        <h3>{job.title}</h3>
                        <p>
                          {job.location || "Location pending"} · {job.employmentModel} · {job.status}
                        </p>
                      </div>
                      <div>
                        <strong>{candidateCount}</strong>
                        <small>candidates</small>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <strong>No jobs created</strong>
                  <p>Create the first requisition to begin building a hiring pipeline.</p>
                </div>
              )}
            </div>

            {selectedJob ? (
              <div className={styles.jobControls}>
                <label>
                  <span>Status</span>
                  <select
                    value={selectedJob.status}
                    onChange={(event) =>
                      updateJob(selectedJob.id, {
                        status: event.target.value as JobStatus,
                      })
                    }
                  >
                    {JOB_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select
                    value={selectedJob.priority}
                    onChange={(event) =>
                      updateJob(selectedJob.id, {
                        priority: event.target.value as JobPriority,
                      })
                    }
                  >
                    {JOB_PRIORITIES.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => removeJob(selectedJob.id)}>
                  Remove job
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {view === "pipeline" || view === "talent" ? (
        <>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Talent intake</span>
                <h2>Add candidate to {selectedJob?.title || "a selected job"}</h2>
              </div>
              <select
                value={selectedJob?.id || ""}
                onChange={(event) => setSelectedJobId(event.target.value)}
              >
                <option value="">Select job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Full name</span>
                <input
                  value={candidateDraft.fullName}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Current title</span>
                <input
                  value={candidateDraft.currentTitle}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      currentTitle: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  value={candidateDraft.email}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={candidateDraft.location}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Years experience</span>
                <input
                  type="number"
                  min={0}
                  value={candidateDraft.yearsExperience}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      yearsExperience: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Qualification</span>
                <input
                  value={candidateDraft.qualification}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      qualification: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Expected salary</span>
                <input
                  type="number"
                  min={0}
                  value={candidateDraft.expectedSalary}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      expectedSalary: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>ATS score</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={candidateDraft.atsScore}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      atsScore: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Skills — comma separated</span>
                <input
                  value={candidateDraft.skills.join(", ")}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      skills: event.target.value
                        .split(",")
                        .map((item) => item.trim()),
                    }))
                  }
                />
              </label>
              <label className={styles.fullWidth}>
                <span>CV content</span>
                <textarea
                  rows={6}
                  value={candidateDraft.cvText}
                  onChange={(event) =>
                    setCandidateDraft((current) => ({
                      ...current,
                      cvText: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={!selectedJob || !candidateDraft.fullName.trim()}
              onClick={addCandidate}
            >
              Add and rank candidate
            </button>
          </section>

          <div className={styles.workspace}>
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Hiring pipeline</span>
                  <h2>{selectedJob?.title || "Candidates"}</h2>
                </div>
              </div>

              <div className={styles.filters}>
                <input
                  value={candidateQuery}
                  onChange={(event) => setCandidateQuery(event.target.value)}
                  placeholder="Search talent..."
                />
                <select
                  value={candidateStageFilter}
                  onChange={(event) =>
                    setCandidateStageFilter(event.target.value as "All" | HiringStage)
                  }
                >
                  <option>All</option>
                  {HIRING_STAGES.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <div className={styles.candidateList}>
                {filteredCandidates.length ? (
                  filteredCandidates.map((candidate, index) => (
                    <article
                      key={candidate.id}
                      className={selectedCandidate?.id === candidate.id ? styles.selectedCard : ""}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                    >
                      <div className={styles.rank}>{index + 1}</div>
                      <div>
                        <span>{candidate.currentTitle || "Title pending"}</span>
                        <h3>{candidate.fullName}</h3>
                        <p>
                          {candidate.stage} · {candidate.yearsExperience} years · {candidate.location || "Location pending"}
                        </p>
                      </div>
                      <div className={styles.score}>
                        <strong>{candidate.aiScore}%</strong>
                        <small>AI fit</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <strong>No candidates found</strong>
                    <p>Add candidates or change the current filters.</p>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              {selectedCandidate && selectedReport ? (
                <>
                  <div className={styles.candidateHeader}>
                    <div>
                      <span className={styles.eyebrow}>Candidate intelligence</span>
                      <h2>{selectedCandidate.fullName}</h2>
                      <p>
                        {selectedCandidate.currentTitle} · {selectedCandidate.email || "Email pending"}
                      </p>
                    </div>
                    <div className={styles.recommendationCard}>
                      <strong>{selectedReport.overallScore}%</strong>
                      <span>{selectedReport.recommendation}</span>
                      <small>{selectedReport.confidence}% confidence</small>
                    </div>
                  </div>

                  <div className={styles.stageBar}>
                    {HIRING_STAGES.map((stage) => (
                      <button
                        type="button"
                        key={stage}
                        className={selectedCandidate.stage === stage ? styles.activeStage : ""}
                        onClick={() => moveCandidate(stage)}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>

                  <div className={styles.flagBar}>
                    {CANDIDATE_FLAGS.map((flag) => (
                      <button
                        type="button"
                        key={flag}
                        className={selectedCandidate.flags.includes(flag) ? styles.activeFlag : ""}
                        onClick={() => toggleFlag(flag)}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>

                  <div className={styles.dimensionGrid}>
                    {selectedReport.dimensions.map((dimension) => (
                      <article key={dimension.label}>
                        <div>
                          <strong>{dimension.label}</strong>
                          <span>{dimension.score}%</span>
                        </div>
                        <div className={styles.track}>
                          <span style={{ width: `${dimension.score}%` }} />
                        </div>
                        <p>
                          {dimension.evidence[0] || dimension.concerns[0] || "Evidence review required."}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className={styles.insightGrid}>
                    <article>
                      <span className={styles.eyebrow}>Strengths</span>
                      <h3>Why this candidate stands out</h3>
                      {selectedReport.strengths.length ? (
                        selectedReport.strengths.map((item) => <p key={item}>✓ {item}</p>)
                      ) : (
                        <p>No strong evidence detected yet.</p>
                      )}
                    </article>
                    <article>
                      <span className={styles.eyebrow}>Risks</span>
                      <h3>What recruiters must validate</h3>
                      {selectedReport.risks.length ? (
                        selectedReport.risks.map((item) => <p key={item}>⚠ {item}</p>)
                      ) : (
                        <p>✓ No major risk signals detected.</p>
                      )}
                    </article>
                    <article>
                      <span className={styles.eyebrow}>Interview plan</span>
                      <h3>Evidence-led questions</h3>
                      {selectedReport.interviewQuestions.map((item) => <p key={item}>→ {item}</p>)}
                    </article>
                  </div>

                  <div className={styles.subsection}>
                    <div className={styles.sectionHeading}>
                      <div>
                        <span className={styles.eyebrow}>Interview operations</span>
                        <h3>Schedule and score interviews</h3>
                      </div>
                    </div>

                    <div className={styles.inlineForm}>
                      <select
                        value={interviewType}
                        onChange={(event) => setInterviewType(event.target.value as InterviewType)}
                      >
                        {INTERVIEW_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(event) => setInterviewDate(event.target.value)}
                      />
                      <input
                        value={interviewer}
                        onChange={(event) => setInterviewer(event.target.value)}
                        placeholder="Interviewer"
                      />
                      <button type="button" onClick={scheduleInterview}>
                        Schedule
                      </button>
                    </div>

                    <div className={styles.interviewList}>
                      {selectedCandidate.interviews.map((interview) => (
                        <article key={interview.id}>
                          <div>
                            <strong>{interview.type}</strong>
                            <span>
                              {interview.scheduledAt || "Date pending"} · {interview.interviewer}
                            </span>
                          </div>
                          <select
                            value={interview.status}
                            onChange={(event) =>
                              updateInterview(interview.id, {
                                status: event.target.value as "Planned" | "Completed" | "Cancelled",
                              })
                            }
                          >
                            <option>Planned</option>
                            <option>Completed</option>
                            <option>Cancelled</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={interview.score}
                            onChange={(event) =>
                              updateInterview(interview.id, {
                                score: Number(event.target.value),
                              })
                            }
                          />
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className={styles.subsection}>
                    <div className={styles.sectionHeading}>
                      <div>
                        <span className={styles.eyebrow}>Collaboration</span>
                        <h3>Recruiter notes</h3>
                      </div>
                    </div>

                    <div className={styles.noteForm}>
                      <textarea
                        rows={3}
                        value={noteText}
                        onChange={(event) => setNoteText(event.target.value)}
                        placeholder="Record evidence, concerns, decisions or stakeholder feedback..."
                      />
                      <button type="button" onClick={addNote}>
                        Add note
                      </button>
                    </div>

                    <div className={styles.noteList}>
                      {selectedCandidate.notes.map((note) => (
                        <article key={note.id}>
                          <strong>{note.author}</strong>
                          <p>{note.text}</p>
                          <small>{new Date(note.createdAt).toLocaleString()}</small>
                        </article>
                      ))}
                    </div>
                  </div>

                  <footer className={styles.detailFooter}>
                    <span>
                      Last activity: {new Date(selectedCandidate.lastActivityAt).toLocaleString()}
                    </span>
                    <button type="button" onClick={() => removeCandidate(selectedCandidate.id)}>
                      Remove candidate
                    </button>
                  </footer>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <strong>Select a candidate</strong>
                  <p>Review transparent match intelligence, risks, interview plans and recruiter notes.</p>
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}

      {view === "team" ? (
        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Team and governance</span>
              <h2>Hiring team</h2>
            </div>
          </div>

          <div className={styles.inlineForm}>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Full name"
            />
            <input
              value={teamEmail}
              onChange={(event) => setTeamEmail(event.target.value)}
              placeholder="Email"
            />
            <select
              value={teamRole}
              onChange={(event) => setTeamRole(event.target.value as TeamRole)}
            >
              {TEAM_ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <button type="button" onClick={addTeamMember}>
              Add team member
            </button>
          </div>

          <div className={styles.teamGrid}>
            {team.map((member) => (
              <article key={member.id}>
                <div>
                  <span>{member.role}</span>
                  <h3>{member.name}</h3>
                  <p>{member.email || "Email pending"}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTeam((current) =>
                      current.map((item) =>
                        item.id === member.id ? { ...item, active: !item.active } : item,
                      ),
                    )
                  }
                >
                  {member.active ? "Active" : "Inactive"}
                </button>
              </article>
            ))}
          </div>

          <div className={styles.governanceGrid}>
            <article>
              <span className={styles.eyebrow}>Decision quality</span>
              <h3>Structured hiring</h3>
              <p>
                Use role scorecards, transparent dimensions and evidence-led
                interview questions to reduce unstructured decision-making.
              </p>
            </article>
            <article>
              <span className={styles.eyebrow}>Fairness</span>
              <h3>Human oversight</h3>
              <p>
                AI scores are decision-support signals only. Recruiters remain
                responsible for validation, fairness and lawful employment decisions.
              </p>
            </article>
            <article>
              <span className={styles.eyebrow}>Auditability</span>
              <h3>Recorded reasoning</h3>
              <p>
                Candidate stages, notes, interviews and score evidence create a
                clear internal hiring record.
              </p>
            </article>
          </div>
        </section>
      ) : null}
    </div>
  );
}
