"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createDynamicInterviewBlueprint,
  type DynamicInterviewInput,
  type InterviewDifficulty,
  type RecruiterPersona,
} from "@/lib/dynamic-interview";

import styles from "./DynamicInterviewBuilder.module.css";

interface DynamicInterviewBuilderProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-dynamic-interview-builder-v1";

const INITIAL_INPUT: DynamicInterviewInput = {
  companyName: "",
  industry: "",
  companyValues: "",
  companyPriorities: "",
  recruiterPersona: "Hiring Manager",
  difficulty: "Professional",
  questionCount: 12,
  interviewLength: 45,
  includeTechnical: true,
  includePressure: true,
  includeFollowUps: true,
  includeCompanyQuestions: true,
};

const PERSONAS: RecruiterPersona[] = [
  "HR Recruiter",
  "Hiring Manager",
  "Technical Interviewer",
  "Executive",
  "Panel",
];

const DIFFICULTIES: InterviewDifficulty[] = [
  "Foundation",
  "Professional",
  "Advanced",
  "Executive",
];

export function DynamicInterviewBuilder({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: DynamicInterviewBuilderProps) {
  const [role, setRole] = useState(targetRole);
  const [specification, setSpecification] = useState(jobDescription);
  const [input, setInput] = useState<DynamicInterviewInput>(INITIAL_INPUT);
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: string;
          specification?: string;
          input?: Partial<DynamicInterviewInput>;
        };

        setRole(parsed.role || targetRole);
        setSpecification(parsed.specification || jobDescription);
        setInput({ ...INITIAL_INPUT, ...parsed.input });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, [jobDescription, targetRole]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role, specification, input }),
    );
  }, [hydrated, input, role, specification]);

  const blueprint = useMemo(
    () =>
      createDynamicInterviewBlueprint(
        input,
        role,
        specification,
        cvContent,
        atsScore,
      ),
    [atsScore, cvContent, input, role, specification],
  );

  const allQuestions = useMemo(
    () => blueprint.sections.flatMap((section) => section.questions),
    [blueprint.sections],
  );

  useEffect(() => {
    if (
      !activeQuestionId ||
      !allQuestions.some((question) => question.id === activeQuestionId)
    ) {
      setActiveQuestionId(allQuestions[0]?.id || "");
    }
  }, [activeQuestionId, allQuestions]);

  const activeQuestion =
    allQuestions.find((question) => question.id === activeQuestionId) ??
    allQuestions[0];

  function updateInput<K extends keyof DynamicInterviewInput>(
    field: K,
    value: DynamicInterviewInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.3 · AI Dynamic Interview Builder
          </span>
          <h1>Generate a unique interview from the candidate, role and company</h1>
          <p>
            Build a structured interview that adapts to the candidate&amp;apos;s CV,
            vacancy requirements, seniority, company priorities and recruiter
            persona. Every question includes interviewer intent, evidence cues,
            answer signals, red flags and adaptive follow-up questions.
          </p>
        </div>

        <div className={styles.summaryBadge}>
          <span>{blueprint.persona}</span>
          <strong>{blueprint.estimatedQuestions}</strong>
          <small>questions · {blueprint.totalMinutes} minutes</small>
        </div>
      </header>

      <section className={styles.builderGrid}>
        <article className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Interview configuration</span>
              <h2>Build the interview blueprint</h2>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Target role</span>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Operations Manager"
              />
            </label>

            <label>
              <span>Company name</span>
              <input
                value={input.companyName}
                onChange={(event) =>
                  updateInput("companyName", event.target.value)
                }
                placeholder="e.g. Anglo American"
              />
            </label>

            <label>
              <span>Industry</span>
              <input
                value={input.industry}
                onChange={(event) =>
                  updateInput("industry", event.target.value)
                }
                placeholder="Mining, banking, technology..."
              />
            </label>

            <label>
              <span>Recruiter persona</span>
              <select
                value={input.recruiterPersona}
                onChange={(event) =>
                  updateInput(
                    "recruiterPersona",
                    event.target.value as RecruiterPersona,
                  )
                }
              >
                {PERSONAS.map((persona) => (
                  <option key={persona} value={persona}>
                    {persona}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Difficulty</span>
              <select
                value={input.difficulty}
                onChange={(event) =>
                  updateInput(
                    "difficulty",
                    event.target.value as InterviewDifficulty,
                  )
                }
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Interview duration</span>
              <select
                value={input.interviewLength}
                onChange={(event) =>
                  updateInput(
                    "interviewLength",
                    Number(event.target.value),
                  )
                }
              >
                {[30, 45, 60, 75, 90].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Number of questions</span>
              <input
                type="number"
                min={6}
                max={20}
                value={input.questionCount}
                onChange={(event) =>
                  updateInput(
                    "questionCount",
                    Number(event.target.value),
                  )
                }
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Job specification</span>
              <textarea
                value={specification}
                onChange={(event) =>
                  setSpecification(event.target.value)
                }
                rows={7}
                placeholder="Paste responsibilities, requirements, systems, competencies and success measures."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Company values</span>
              <textarea
                value={input.companyValues}
                onChange={(event) =>
                  updateInput("companyValues", event.target.value)
                }
                rows={3}
                placeholder="Safety, customer focus, innovation, integrity..."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Company priorities and current challenges</span>
              <textarea
                value={input.companyPriorities}
                onChange={(event) =>
                  updateInput("companyPriorities", event.target.value)
                }
                rows={4}
                placeholder="Growth, transformation, service improvement, cost control, compliance..."
              />
            </label>
          </div>

          <div className={styles.toggleGrid}>
            {[
              ["includeTechnical", "Technical questions"],
              ["includePressure", "Pressure questions"],
              ["includeFollowUps", "Adaptive follow-ups"],
              ["includeCompanyQuestions", "Company-specific questions"],
            ].map(([field, label]) => (
              <label className={styles.toggle} key={field}>
                <input
                  type="checkbox"
                  checked={
                    input[
                      field as keyof Pick<
                        DynamicInterviewInput,
                        | "includeTechnical"
                        | "includePressure"
                        | "includeFollowUps"
                        | "includeCompanyQuestions"
                      >
                    ] as boolean
                  }
                  onChange={(event) =>
                    updateInput(
                      field as
                        | "includeTechnical"
                        | "includePressure"
                        | "includeFollowUps"
                        | "includeCompanyQuestions",
                      event.target.checked,
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </article>

        <aside className={styles.intelligencePanel}>
          <span className={styles.eyebrow}>Interviewer intelligence</span>
          <h2>{blueprint.title}</h2>

          <div className={styles.metaGrid}>
            <div>
              <span>Persona</span>
              <strong>{blueprint.persona}</strong>
            </div>
            <div>
              <span>Difficulty</span>
              <strong>{blueprint.difficulty}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{blueprint.totalMinutes} min</strong>
            </div>
            <div>
              <span>Questions</span>
              <strong>{blueprint.estimatedQuestions}</strong>
            </div>
          </div>

          <h3>Interviewer objectives</h3>
          {blueprint.interviewerObjectives.map((objective) => (
            <p key={objective}>→ {objective}</p>
          ))}

          <h3>Scoring dimensions</h3>
          <div className={styles.chipList}>
            {blueprint.scoringDimensions.map((dimension) => (
              <span key={dimension}>{dimension}</span>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.sectionOverview}>
        {blueprint.sections.map((section, index) => (
          <article key={section.title}>
            <span>{index + 1}</span>
            <div>
              <strong>{section.title}</strong>
              <p>{section.purpose}</p>
              <small>{section.questions.length} questions</small>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.interviewWorkspace}>
        <aside className={styles.questionNavigator}>
          <span className={styles.eyebrow}>Interview sequence</span>
          <h2>Questions</h2>

          {blueprint.sections.map((section) => (
            <div className={styles.navigatorSection} key={section.title}>
              <strong>{section.title}</strong>
              {section.questions.map((question, index) => (
                <button
                  type="button"
                  className={
                    activeQuestion?.id === question.id
                      ? styles.activeQuestion
                      : ""
                  }
                  onClick={() => setActiveQuestionId(question.id)}
                  key={question.id}
                >
                  <span>{index + 1}</span>
                  <div>
                    <small>{question.category}</small>
                    <p>{question.question}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {activeQuestion ? (
          <article className={styles.questionDetail}>
            <div className={styles.questionTop}>
              <div>
                <span className={styles.eyebrow}>
                  {activeQuestion.category}
                </span>
                <h2>{activeQuestion.question}</h2>
              </div>
              <div className={styles.questionMeta}>
                <span>{activeQuestion.suggestedTime} min</span>
                <strong>{activeQuestion.scoreWeight}% weight</strong>
              </div>
            </div>

            <div className={styles.intentBox}>
              <strong>Why the interviewer asks this</strong>
              <p>{activeQuestion.whyAsked}</p>
            </div>

            <div className={styles.detailGrid}>
              <section>
                <h3>Candidate evidence to consider</h3>
                {activeQuestion.candidateEvidence.length ? (
                  activeQuestion.candidateEvidence.map((evidence) => (
                    <p key={evidence}>✓ {evidence}</p>
                  ))
                ) : (
                  <p>No direct CV evidence detected. Prepare a relevant example.</p>
                )}
              </section>

              <section>
                <h3>Strong answer signals</h3>
                {activeQuestion.strongAnswerSignals.map((signal) => (
                  <p key={signal}>✓ {signal}</p>
                ))}
              </section>

              <section>
                <h3>Red flags</h3>
                {activeQuestion.redFlags.map((redFlag) => (
                  <p key={redFlag}>⚠ {redFlag}</p>
                ))}
              </section>

              <section>
                <h3>Adaptive follow-up questions</h3>
                {activeQuestion.followUps.length ? (
                  activeQuestion.followUps.map((followUp) => (
                    <p key={followUp}>→ {followUp}</p>
                  ))
                ) : (
                  <p>Follow-up questions are disabled.</p>
                )}
              </section>
            </div>
          </article>
        ) : null}
      </section>

      <section className={styles.twoColumns}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Candidate strengths</span>
          <h2>Evidence the interview should draw out</h2>
          {blueprint.candidateStrengths.length ? (
            blueprint.candidateStrengths.map((strength) => (
              <p key={strength}>✓ {strength}</p>
            ))
          ) : (
            <p>Add more candidate evidence to the CV profile.</p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.eyebrow}>Evidence gaps</span>
          <h2>Requirements needing stronger preparation</h2>
          {blueprint.evidenceGaps.length ? (
            blueprint.evidenceGaps.map((gap) => (
              <p key={gap}>⚠ {gap}</p>
            ))
          ) : (
            <p>✓ No major evidence gaps were detected from the available information.</p>
          )}
        </article>
      </section>
    </div>
  );
}
