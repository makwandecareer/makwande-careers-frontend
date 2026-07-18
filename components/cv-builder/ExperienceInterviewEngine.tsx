"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildExperienceInterview,
  buildExperienceInterviewReport,
  scoreExperienceAnswer,
  type ExperienceDepth,
  type ExperienceInterviewAnswer,
  type ExperienceInterviewInput,
} from "@/lib/experience-interview";

import styles from "./ExperienceInterviewEngine.module.css";

interface ExperienceInterviewEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-experience-interview-v1";

const DEPTHS: ExperienceDepth[] = [
  "Foundation",
  "Professional",
  "Advanced",
  "Executive",
];

export function ExperienceInterviewEngine({
  cvContent,
  targetRole,
  jobDescription,
}: ExperienceInterviewEngineProps) {
  const [input, setInput] = useState<ExperienceInterviewInput>({
    targetRole,
    jobDescription,
    companyName: "",
    depth: "Professional",
    questionsPerRole: 5,
    includeCareerTransitions: true,
    includeFailureQuestions: true,
    includeLeadershipQuestions: true,
    includeTechnicalQuestions: true,
    includeEvidenceVerification: true,
  });
  const [selectedExperienceId, setSelectedExperienceId] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<ExperienceInterviewAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<ExperienceInterviewInput>;
        };
        setInput((current) => ({ ...current, ...parsed.input }));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ input }));
  }, [hydrated, input]);

  const interview = useMemo(
    () => buildExperienceInterview(cvContent, input),
    [cvContent, input],
  );

  useEffect(() => {
    if (!selectedExperienceId && interview.experiences[0]) {
      setSelectedExperienceId(interview.experiences[0].id);
    }
  }, [interview.experiences, selectedExperienceId]);

  const visibleQuestions = useMemo(
    () =>
      interview.questions.filter(
        (question) =>
          question.experienceId === selectedExperienceId ||
          (selectedExperienceId === "career" && question.experienceId === null),
      ),
    [interview.questions, selectedExperienceId],
  );

  useEffect(() => {
    if (
      visibleQuestions.length &&
      !visibleQuestions.some((question) => question.id === activeQuestionId)
    ) {
      setActiveQuestionId(visibleQuestions[0].id);
      setAnswerText("");
      setShowFeedback(false);
    }
  }, [activeQuestionId, visibleQuestions]);

  const activeQuestion = interview.questions.find(
    (question) => question.id === activeQuestionId,
  );

  const activeAnswer = answers.find(
    (answer) => answer.questionId === activeQuestionId,
  );

  const report = useMemo(
    () =>
      buildExperienceInterviewReport(
        interview.experiences,
        interview.questions,
        answers,
      ),
    [answers, interview.experiences, interview.questions],
  );

  function updateInput<K extends keyof ExperienceInterviewInput>(
    field: K,
    value: ExperienceInterviewInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function selectQuestion(questionId: string): void {
    setActiveQuestionId(questionId);
    const previous = answers.find((answer) => answer.questionId === questionId);
    setAnswerText(previous?.answer || "");
    setShowFeedback(Boolean(previous));
  }

  function submitAnswer(): void {
    if (!activeQuestion || !answerText.trim()) return;

    const feedback = scoreExperienceAnswer(
      activeQuestion,
      answerText,
      input.targetRole,
      input.jobDescription,
    );

    const result: ExperienceInterviewAnswer = {
      questionId: activeQuestion.id,
      answer: answerText.trim(),
      feedback,
    };

    setAnswers((current) => [
      ...current.filter((answer) => answer.questionId !== activeQuestion.id),
      result,
    ]);
    setShowFeedback(true);
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.5 · Experience-based interview engine
          </span>
          <h1>Turn every CV role into defensible interview evidence</h1>
          <p>
            Analyse career history, generate role-specific questions, test
            achievement ownership, examine career transitions and identify
            evidence that may fail under recruiter follow-up.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Experience readiness</span>
          <strong>{interview.readinessScore}%</strong>
          <small>{interview.experiences.length} roles analysed</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Interview configuration</span>
            <h2>Target-role and evidence settings</h2>
          </div>
          <span>{interview.questions.length} generated questions</span>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Target role</span>
            <input
              value={input.targetRole}
              onChange={(event) =>
                updateInput("targetRole", event.target.value)
              }
            />
          </label>

          <label>
            <span>Company name</span>
            <input
              value={input.companyName}
              onChange={(event) =>
                updateInput("companyName", event.target.value)
              }
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Interview depth</span>
            <select
              value={input.depth}
              onChange={(event) =>
                updateInput("depth", event.target.value as ExperienceDepth)
              }
            >
              {DEPTHS.map((depth) => (
                <option key={depth} value={depth}>
                  {depth}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Questions per role</span>
            <input
              type="number"
              min={2}
              max={8}
              value={input.questionsPerRole}
              onChange={(event) =>
                updateInput("questionsPerRole", Number(event.target.value))
              }
            />
          </label>

          <label className={styles.fullWidth}>
            <span>Job specification</span>
            <textarea
              rows={5}
              value={input.jobDescription}
              onChange={(event) =>
                updateInput("jobDescription", event.target.value)
              }
              placeholder="Paste the job requirements to prioritise relevant experience."
            />
          </label>
        </div>

        <div className={styles.toggleGrid}>
          {[
            ["includeCareerTransitions", "Career transition questions"],
            ["includeFailureQuestions", "Failure and learning questions"],
            ["includeLeadershipQuestions", "Leadership questions"],
            ["includeTechnicalQuestions", "Technical depth questions"],
            ["includeEvidenceVerification", "Evidence verification questions"],
          ].map(([field, label]) => (
            <label className={styles.toggle} key={field}>
              <input
                type="checkbox"
                checked={
                  input[
                    field as
                      | "includeCareerTransitions"
                      | "includeFailureQuestions"
                      | "includeLeadershipQuestions"
                      | "includeTechnicalQuestions"
                      | "includeEvidenceVerification"
                  ]
                }
                onChange={(event) =>
                  updateInput(
                    field as
                      | "includeCareerTransitions"
                      | "includeFailureQuestions"
                      | "includeLeadershipQuestions"
                      | "includeTechnicalQuestions"
                      | "includeEvidenceVerification",
                    event.target.checked,
                  )
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      {!interview.experiences.length ? (
        <section className={styles.emptyState}>
          <h2>No career experience was found</h2>
          <p>
            Add employment history to the candidate profile before using the
            experience-based interview engine.
          </p>
        </section>
      ) : (
        <>
          <section className={styles.roleOverview}>
            {interview.experiences.map((experience) => (
              <button
                type="button"
                key={experience.id}
                className={
                  selectedExperienceId === experience.id
                    ? styles.activeRole
                    : ""
                }
                onClick={() => {
                  setSelectedExperienceId(experience.id);
                  setShowFeedback(false);
                }}
              >
                <span>{experience.role}</span>
                <small>{experience.employer}</small>
                <div>
                  <strong>{experience.relevanceScore}% relevant</strong>
                  <strong>{experience.evidenceStrength}% evidence</strong>
                </div>
              </button>
            ))}

            <button
              type="button"
              className={
                selectedExperienceId === "career" ? styles.activeRole : ""
              }
              onClick={() => {
                setSelectedExperienceId("career");
                setShowFeedback(false);
              }}
            >
              <span>Career progression</span>
              <small>Transitions and overall narrative</small>
              <div>
                <strong>{interview.experiences.length} roles</strong>
                <strong>Full history</strong>
              </div>
            </button>
          </section>

          <section className={styles.mainGrid}>
            <aside className={styles.questionPanel}>
              <span className={styles.eyebrow}>Question bank</span>
              <h2>
                {selectedExperienceId === "career"
                  ? "Career narrative"
                  : interview.experiences.find(
                      (experience) =>
                        experience.id === selectedExperienceId,
                    )?.role}
              </h2>

              <div className={styles.questionList}>
                {visibleQuestions.map((question, index) => {
                  const completed = answers.some(
                    (answer) => answer.questionId === question.id,
                  );

                  return (
                    <button
                      type="button"
                      key={question.id}
                      className={
                        activeQuestionId === question.id
                          ? styles.activeQuestion
                          : ""
                      }
                      onClick={() => selectQuestion(question.id)}
                    >
                      <span>{index + 1}</span>
                      <div>
                        <strong>{question.type}</strong>
                        <small>{completed ? "Answered" : "Not answered"}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <article className={styles.interviewCard}>
              {activeQuestion ? (
                <>
                  <div className={styles.questionHeader}>
                    <div>
                      <span className={styles.eyebrow}>
                        {activeQuestion.type}
                      </span>
                      <h2>{activeQuestion.question}</h2>
                    </div>
                    <span>{activeQuestion.scoringWeight}% weight</span>
                  </div>

                  <div className={styles.intentBox}>
                    <strong>What the interviewer is testing</strong>
                    <p>{activeQuestion.interviewerIntent}</p>
                  </div>

                  {activeQuestion.evidencePrompts.length ? (
                    <details>
                      <summary>View available CV evidence</summary>
                      {activeQuestion.evidencePrompts.map((prompt) => (
                        <p key={prompt}>✓ {prompt}</p>
                      ))}
                    </details>
                  ) : null}

                  <label className={styles.answerField}>
                    <span>Your interview answer</span>
                    <textarea
                      rows={11}
                      value={answerText}
                      onChange={(event) => {
                        setAnswerText(event.target.value);
                        setShowFeedback(false);
                      }}
                      placeholder="Explain the context, your personal responsibility, the actions you took, the measurable result and what you learned."
                    />
                  </label>

                  <div className={styles.answerActions}>
                    <span>
                      {answerText.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={!answerText.trim()}
                    >
                      Evaluate answer
                    </button>
                  </div>

                  {showFeedback && activeAnswer ? (
                    <section className={styles.feedback}>
                      <div className={styles.feedbackHeader}>
                        <div>
                          <span className={styles.eyebrow}>
                            Experience answer analysis
                          </span>
                          <h3>{activeAnswer.feedback.score.overall}% overall</h3>
                        </div>
                      </div>

                      <div className={styles.scoreGrid}>
                        {Object.entries(activeAnswer.feedback.score)
                          .filter(([name]) => name !== "overall")
                          .map(([name, score]) => (
                            <article key={name}>
                              <span>
                                {name.replace(/([A-Z])/g, " $1")}
                              </span>
                              <strong>{score}%</strong>
                            </article>
                          ))}
                      </div>

                      <div className={styles.feedbackColumns}>
                        <section>
                          <h4>Strengths</h4>
                          {activeAnswer.feedback.strengths.length ? (
                            activeAnswer.feedback.strengths.map((item) => (
                              <p key={item}>✓ {item}</p>
                            ))
                          ) : (
                            <p>No strong signal detected yet.</p>
                          )}
                        </section>

                        <section>
                          <h4>Improve</h4>
                          {activeAnswer.feedback.improvements.map((item) => (
                            <p key={item}>⚠ {item}</p>
                          ))}
                        </section>

                        <section>
                          <h4>Missing evidence</h4>
                          {activeAnswer.feedback.missingEvidence.length ? (
                            activeAnswer.feedback.missingEvidence.map(
                              (item) => <p key={item}>→ {item}</p>,
                            )
                          ) : (
                            <p>✓ Core evidence is present.</p>
                          )}
                        </section>
                      </div>

                      {activeAnswer.feedback.adaptiveFollowUp ? (
                        <div className={styles.followUp}>
                          <strong>Adaptive recruiter follow-up</strong>
                          <p>
                            {activeAnswer.feedback.adaptiveFollowUp}
                          </p>
                        </div>
                      ) : null}

                      <div className={styles.structureBox}>
                        <strong>Recommended answer structure</strong>
                        <p>{activeAnswer.feedback.suggestedStructure}</p>
                      </div>
                    </section>
                  ) : null}
                </>
              ) : (
                <p>Select an interview question.</p>
              )}
            </article>
          </section>

          <section className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Experience readiness report
                </span>
                <h2>Career evidence performance</h2>
              </div>
              <strong>{report.overallScore}%</strong>
            </div>

            <div className={styles.dimensionGrid}>
              {Object.entries(report.dimensions).map(([name, score]) => (
                <article key={name}>
                  <div>
                    <span>{name.replace(/([A-Z])/g, " $1")}</span>
                    <strong>{score}%</strong>
                  </div>
                  <div className={styles.track}>
                    <span style={{ width: `${score}%` }} />
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.reportColumns}>
              <article>
                <h3>Preparation priorities</h3>
                {report.preparationPriorities.length ? (
                  report.preparationPriorities.map((item) => (
                    <p key={item}>→ {item}</p>
                  ))
                ) : (
                  <p>Complete answers to generate preparation priorities.</p>
                )}
              </article>

              <article>
                <h3>Career risks</h3>
                {report.careerRisks.length ? (
                  report.careerRisks.slice(0, 6).map((item) => (
                    <p key={item}>⚠ {item}</p>
                  ))
                ) : (
                  <p>No major career-history risk was detected.</p>
                )}
              </article>

              <article>
                <h3>Strongest CV evidence</h3>
                {report.strongestEvidence.length ? (
                  report.strongestEvidence.slice(0, 6).map((item) => (
                    <p key={item}>✓ {item}</p>
                  ))
                ) : (
                  <p>Add achievements to strengthen the interview evidence.</p>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
