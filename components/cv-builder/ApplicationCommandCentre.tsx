"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ACTIVE_STAGES,
  APPLICATION_STAGES,
  buildApplicationFunnel,
  calculateApplicationMetrics,
  createApplication,
  createContact,
  createTask,
  generateApplicationInsights,
  recommendNextAction,
  type ApplicationPriority,
  type ApplicationRecord,
  type ApplicationStage,
  type ContactType,
  type TaskType,
} from "@/lib/application-command-centre";

import styles from "./ApplicationCommandCentre.module.css";

interface ApplicationCommandCentreProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

interface StoredState {
  applications: ApplicationRecord[];
  selectedId: string;
}

const STORAGE_KEY = "makwande-application-command-centre-v1";
const PRIORITIES: ApplicationPriority[] = ["Low", "Medium", "High", "Critical"];
const TASK_TYPES: TaskType[] = [
  "Research",
  "Tailor CV",
  "Write Cover Letter",
  "Submit",
  "Follow Up",
  "Interview Prep",
  "Assessment Prep",
  "Negotiation",
];
const CONTACT_TYPES: ContactType[] = [
  "Recruiter",
  "Hiring Manager",
  "Employee",
  "Referral",
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ApplicationCommandCentre({
  targetRole,
  jobDescription,
  atsScore,
}: ApplicationCommandCentreProps) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [stageFilter, setStageFilter] = useState<"All" | ApplicationStage>("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ApplicationRecord>(() =>
    createApplication({
      role: targetRole,
      jobDescription,
      atsScore: atsScore ?? 0,
      matchScore: 0,
      nextFollowUpDate: plusDays(7),
    }),
  );

  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("Research");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactType, setContactType] = useState<ContactType>("Recruiter");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedIn, setContactLinkedIn] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredState;
        if (Array.isArray(parsed.applications)) {
          setApplications(parsed.applications);
        }
        if (parsed.selectedId) setSelectedId(parsed.selectedId);
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
      JSON.stringify({ applications, selectedId }),
    );
  }, [applications, hydrated, selectedId]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      role: current.role || targetRole,
      jobDescription: current.jobDescription || jobDescription,
      atsScore: current.atsScore || atsScore || 0,
    }));
  }, [atsScore, jobDescription, targetRole]);

  const metrics = useMemo(
    () => calculateApplicationMetrics(applications),
    [applications],
  );
  const funnel = useMemo(
    () => buildApplicationFunnel(applications),
    [applications],
  );
  const insights = useMemo(
    () => generateApplicationInsights(applications),
    [applications],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications
      .filter((application) =>
        stageFilter === "All" ? true : application.stage === stageFilter,
      )
      .filter((application) =>
        normalizedQuery
          ? `${application.company} ${application.role} ${application.location}`
              .toLowerCase()
              .includes(normalizedQuery)
          : true,
      )
      .sort((a, b) => {
        const priorityRank: Record<ApplicationPriority, number> = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        return priorityRank[b.priority] - priorityRank[a.priority];
      });
  }, [applications, query, stageFilter]);

  const selected =
    applications.find((application) => application.id === selectedId) ??
    filtered[0] ??
    null;

  function addApplication(): void {
    if (!draft.company.trim() || !draft.role.trim()) return;

    const application = createApplication({
      ...draft,
      company: draft.company.trim(),
      role: draft.role.trim(),
      lastActivityDate: today(),
      tasks:
        draft.tasks.length > 0
          ? draft.tasks
          : [
              createTask({
                title: "Research company priorities and hiring stakeholders",
                type: "Research",
                dueDate: today(),
              }),
              createTask({
                title: "Tailor CV to the job description",
                type: "Tailor CV",
                dueDate: plusDays(1),
              }),
            ],
    });

    setApplications((current) => [application, ...current]);
    setSelectedId(application.id);
    setDraft(
      createApplication({
        role: targetRole,
        jobDescription: "",
        atsScore: atsScore ?? 0,
        nextFollowUpDate: plusDays(7),
      }),
    );
  }

  function updateSelected(
    patch: Partial<ApplicationRecord>,
  ): void {
    if (!selected) return;
    setApplications((current) =>
      current.map((application) =>
        application.id === selected.id
          ? {
              ...application,
              ...patch,
              lastActivityDate: today(),
            }
          : application,
      ),
    );
  }

  function moveStage(stage: ApplicationStage): void {
    if (!selected) return;
    updateSelected({
      stage,
      appliedDate:
        stage === "Applied" && !selected.appliedDate
          ? today()
          : selected.appliedDate,
    });
  }

  function removeSelected(): void {
    if (!selected) return;
    setApplications((current) =>
      current.filter((application) => application.id !== selected.id),
    );
    setSelectedId("");
  }

  function addTask(): void {
    if (!selected || !taskTitle.trim()) return;
    updateSelected({
      tasks: [
        ...selected.tasks,
        createTask({
          title: taskTitle.trim(),
          type: taskType,
          dueDate: taskDueDate,
        }),
      ],
    });
    setTaskTitle("");
    setTaskDueDate("");
  }

  function toggleTask(taskId: string): void {
    if (!selected) return;
    updateSelected({
      tasks: selected.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    });
  }

  function removeTask(taskId: string): void {
    if (!selected) return;
    updateSelected({
      tasks: selected.tasks.filter((task) => task.id !== taskId),
    });
  }

  function addContact(): void {
    if (!selected || !contactName.trim()) return;
    updateSelected({
      contacts: [
        ...selected.contacts,
        createContact({
          name: contactName.trim(),
          title: contactTitle.trim(),
          type: contactType,
          email: contactEmail.trim(),
          linkedin: contactLinkedIn.trim(),
        }),
      ],
    });
    setContactName("");
    setContactTitle("");
    setContactEmail("");
    setContactLinkedIn("");
  }

  function removeContact(contactId: string): void {
    if (!selected) return;
    updateSelected({
      contacts: selected.contacts.filter((contact) => contact.id !== contactId),
    });
  }

  return (
    <div className={styles.commandCentre}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 15 · AI application command centre
          </span>
          <h1>Turn job opportunities into a disciplined hiring pipeline</h1>
          <p>
            Control every application from research and CV tailoring to
            follow-up, interview, assessment and offer. The command centre
            measures conversion, surfaces risks and tells the candidate what
            to do next.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          <article>
            <span>Active</span>
            <strong>{metrics.active}</strong>
          </article>
          <article>
            <span>Response rate</span>
            <strong>{metrics.responseRate}%</strong>
          </article>
          <article>
            <span>Interview rate</span>
            <strong>{metrics.interviewRate}%</strong>
          </article>
          <article>
            <span>Offers</span>
            <strong>{metrics.offers}</strong>
          </article>
        </div>
      </header>

      <section className={styles.analytics}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Pipeline intelligence</span>
            <h2>Application performance</h2>
          </div>
          <span>{metrics.overdueFollowUps} overdue follow-ups</span>
        </div>

        <div className={styles.metricGrid}>
          <article>
            <span>Total tracked</span>
            <strong>{metrics.total}</strong>
          </article>
          <article>
            <span>Average match</span>
            <strong>{metrics.averageMatch}%</strong>
          </article>
          <article>
            <span>Applications sent</span>
            <strong>{metrics.applied}</strong>
          </article>
          <article>
            <span>Interview-stage</span>
            <strong>{metrics.interviews}</strong>
          </article>
          <article>
            <span>Offer conversion</span>
            <strong>{metrics.offerRate}%</strong>
          </article>
          <article>
            <span>Rejected</span>
            <strong>{metrics.rejected}</strong>
          </article>
        </div>

        <div className={styles.funnel}>
          {funnel.map((stage) => (
            <article key={stage.label}>
              <div>
                <strong>{stage.label}</strong>
                <span>{stage.count}</span>
              </div>
              <div className={styles.track}>
                <span style={{ width: `${stage.conversion}%` }} />
              </div>
              <small>{stage.conversion}% conversion</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.insights}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>AI portfolio guidance</span>
            <h2>What needs attention now</h2>
          </div>
        </div>

        <div className={styles.insightGrid}>
          {insights.map((insight) => (
            <article
              key={`${insight.title}-${insight.detail}`}
              data-type={insight.type}
            >
              <strong>{insight.title}</strong>
              <p>{insight.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.addPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>New application</span>
            <h2>Add an opportunity to the pipeline</h2>
          </div>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Company</span>
            <input
              value={draft.company}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Role</span>
            <input
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({ ...current, role: event.target.value }))
              }
            />
          </label>

          <label>
            <span>Location</span>
            <input
              value={draft.location}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Source</span>
            <input
              value={draft.source}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  source: event.target.value,
                }))
              }
              placeholder="LinkedIn, company careers page..."
            />
          </label>

          <label>
            <span>Priority</span>
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priority: event.target.value as ApplicationPriority,
                }))
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Stage</span>
            <select
              value={draft.stage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  stage: event.target.value as ApplicationStage,
                }))
              }
            >
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Match score</span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.matchScore}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  matchScore: Number(event.target.value),
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
              value={draft.atsScore}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  atsScore: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            <span>Application deadline</span>
            <input
              type="date"
              value={draft.deadline}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  deadline: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Next follow-up</span>
            <input
              type="date"
              value={draft.nextFollowUpDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nextFollowUpDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Salary</span>
            <input
              value={draft.salary}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  salary: event.target.value,
                }))
              }
              placeholder="R600,000 per year"
            />
          </label>

          <label className={styles.fullWidth}>
            <span>Job description</span>
            <textarea
              rows={5}
              value={draft.jobDescription}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  jobDescription: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={!draft.company.trim() || !draft.role.trim()}
          onClick={addApplication}
        >
          Add to command centre
        </button>
      </section>

      <div className={styles.workspace}>
        <section className={styles.pipeline}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Application portfolio</span>
              <h2>Pipeline</h2>
            </div>
          </div>

          <div className={styles.filters}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company or role..."
            />
            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value as "All" | ApplicationStage)
              }
            >
              <option>All</option>
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>

          {filtered.length ? (
            <div className={styles.applicationList}>
              {filtered.map((application) => (
                <article
                  key={application.id}
                  className={
                    selected?.id === application.id ? styles.selected : ""
                  }
                  onClick={() => setSelectedId(application.id)}
                >
                  <div>
                    <span>{application.company}</span>
                    <h3>{application.role}</h3>
                    <p>
                      {application.location || "Location not specified"} ·{" "}
                      {application.stage}
                    </p>
                  </div>
                  <div className={styles.applicationScores}>
                    <strong>{application.matchScore}%</strong>
                    <span>{application.priority}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>No matching applications</strong>
              <p>Add or adjust the filter to view your application pipeline.</p>
            </div>
          )}
        </section>

        <section className={styles.detail}>
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <span className={styles.eyebrow}>Application control</span>
                  <h2>{selected.role}</h2>
                  <p>
                    {selected.company} · {selected.location || "Location pending"}
                  </p>
                </div>
                <div className={styles.nextAction}>
                  <span>Next best action</span>
                  <strong>{recommendNextAction(selected)}</strong>
                </div>
              </div>

              <div className={styles.stageBar}>
                {APPLICATION_STAGES.map((stage) => (
                  <button
                    type="button"
                    key={stage}
                    className={selected.stage === stage ? styles.activeStage : ""}
                    onClick={() => moveStage(stage)}
                  >
                    {stage}
                  </button>
                ))}
              </div>

              <div className={styles.detailGrid}>
                <label>
                  <span>Priority</span>
                  <select
                    value={selected.priority}
                    onChange={(event) =>
                      updateSelected({
                        priority: event.target.value as ApplicationPriority,
                      })
                    }
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Match score</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selected.matchScore}
                    onChange={(event) =>
                      updateSelected({ matchScore: Number(event.target.value) })
                    }
                  />
                </label>

                <label>
                  <span>ATS score</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selected.atsScore}
                    onChange={(event) =>
                      updateSelected({ atsScore: Number(event.target.value) })
                    }
                  />
                </label>

                <label>
                  <span>Applied date</span>
                  <input
                    type="date"
                    value={selected.appliedDate}
                    onChange={(event) =>
                      updateSelected({ appliedDate: event.target.value })
                    }
                  />
                </label>

                <label>
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={selected.nextFollowUpDate}
                    onChange={(event) =>
                      updateSelected({ nextFollowUpDate: event.target.value })
                    }
                  />
                </label>

                <label>
                  <span>Deadline</span>
                  <input
                    type="date"
                    value={selected.deadline}
                    onChange={(event) =>
                      updateSelected({ deadline: event.target.value })
                    }
                  />
                </label>

                <label className={styles.fullWidth}>
                  <span>Notes</span>
                  <textarea
                    rows={4}
                    value={selected.notes}
                    onChange={(event) =>
                      updateSelected({ notes: event.target.value })
                    }
                    placeholder="Recruiter feedback, interview notes, follow-up history..."
                  />
                </label>
              </div>

              <div className={styles.subsection}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Execution plan</span>
                    <h3>Tasks and deadlines</h3>
                  </div>
                </div>

                <div className={styles.inlineForm}>
                  <input
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Task title..."
                  />
                  <select
                    value={taskType}
                    onChange={(event) =>
                      setTaskType(event.target.value as TaskType)
                    }
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                  />
                  <button type="button" onClick={addTask}>
                    Add task
                  </button>
                </div>

                <div className={styles.taskList}>
                  {selected.tasks.map((task) => (
                    <article key={task.id}>
                      <button
                        type="button"
                        className={task.completed ? styles.completedTask : ""}
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed ? "✓" : "○"}
                      </button>
                      <div>
                        <strong>{task.title}</strong>
                        <span>
                          {task.type}
                          {task.dueDate ? ` · ${task.dueDate}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              <div className={styles.subsection}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Relationship intelligence</span>
                    <h3>Recruiters and hiring stakeholders</h3>
                  </div>
                </div>

                <div className={styles.contactForm}>
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Name"
                  />
                  <input
                    value={contactTitle}
                    onChange={(event) => setContactTitle(event.target.value)}
                    placeholder="Title"
                  />
                  <select
                    value={contactType}
                    onChange={(event) =>
                      setContactType(event.target.value as ContactType)
                    }
                  >
                    {CONTACT_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="Email"
                  />
                  <input
                    value={contactLinkedIn}
                    onChange={(event) => setContactLinkedIn(event.target.value)}
                    placeholder="LinkedIn URL"
                  />
                  <button type="button" onClick={addContact}>
                    Add contact
                  </button>
                </div>

                <div className={styles.contactList}>
                  {selected.contacts.map((contact) => (
                    <article key={contact.id}>
                      <div>
                        <strong>{contact.name}</strong>
                        <span>
                          {contact.title || contact.type} · {contact.type}
                        </span>
                        <small>{contact.email || contact.linkedin}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              <footer className={styles.detailFooter}>
                <span>
                  Last activity: {selected.lastActivityDate || "Not recorded"}
                </span>
                <button type="button" onClick={removeSelected}>
                  Remove application
                </button>
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>Select an application</strong>
              <p>
                Manage stage, follow-ups, tasks, contacts and conversion
                intelligence from one place.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
