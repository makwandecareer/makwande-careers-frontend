"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildPressureInterview,
  buildPressureInterviewReport,
  scorePressureAnswer,
  type PressureInterviewAnswer,
  type PressureInterviewInput,
  type PressureLevel,
} from "@/lib/pressure-interview";

import styles from "./PressureInterviewEngine.module.css";

interface PressureInterviewEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-pressure-interview-v1";
const LEVELS: PressureLevel[] = [
  "Controlled",
  "Challenging",
  "Intense",
  "Executive",
];

export function PressureInterviewEngine({
  targetRole,
  jobDescription,
}: PressureInterviewEngineProps) {
  const [input, setInput] = useState<PressureInterviewInput>({
    targetRole,
    jobDescription,
    companyName: "",
    pressureLevel: "Challenging",
    questionCount: 16,
    includeRapidFire: true,
    includeContradictions: true,
    includeEthics: true,
    includeFailure: true,
    includeConflict: true,
    includeConsistencyChecks: true,
  });
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<PressureInterviewAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<PressureInterviewInput>;
          answers?: PressureInterviewAnswer[];
        };
        setInput((current) => ({ ...current, ...parsed.input }));
        if (Array.isArray(parsed.answers)) setAnswers(parsed.answers);
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
      JSON.stringify({ input, answers }),
    );
  }, [answers, hydrated, input]);

  const interview = useMemo(() => buildPressureInterview(input), [input]);

  useEffect(() => {
    if (
      interview.questions.length &&
      !interview.questions.some(
        (question) => question.id === activeQuestionId,
      )
    ) {
      setActiveQuestionId(interview.questions[0].id);
      setAnswerText("");
      setShowFeedback(false);
    }
  }, [activeQuestionId, interview.questions]);

  const activeQuestion = interview.questions.find(
    (question) => question.id === activeQuestionId,
  );

  const activeAnswer = answers.find(
    (answer) => answer.questionId === activeQuestionId,
  );

  const report = useMemo(
    () => buildPressureInterviewReport(answers),
    [answers],
  );

  function updateInput<K extends keyof PressureInterviewInput>(
    field: K,
    value: PressureInterviewInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function selectQuestion(questionId: string): void {
    setActiveQuestionId(questionId);
    const previous = answers.find((answer) => answer.questionId === questionId);
    setAnswerText(previous?.answer || "");
    setShowFeedback(Boolean(previous));
  }

  function evaluateAnswer(): void {
    if (!activeQuestion || !answerText.trim()) return;

    const feedback = scorePressureAnswer(
      activeQuestion,
      answerText,
      answers.filter((answer) => answer.questionId !== activeQuestion.id),
    );

    const result: PressureInterviewAnswer = {
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
            Phase 12.7 · Pressure interview engine
          </span>
          <h1>Build composure before the interviewer applies pressure</h1>
          <p>
            Simulate direct challenges, rapid-fire questions, contradictions,
            failure probes, ethical dilemmas and high-stakes decisions while
            measuring composure, ownership, consistency and resilience.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Pressure intensity</span>
          <strong>{interview.intensityScore}%</strong>
          <small>{input.pressureLevel} mode</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Simulation settings</span>
            <h2>Configure pressure and question coverage</h2>
          </div>
          <span>{interview.questions.length} questions generated</span>
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
            <span>Pressure level</span>
            <select
              value={input.pressureLevel}
              onChange={(event) =>
                updateInput(
                  "pressureLevel",
                  event.target.value as PressureLevel,
                )
              }
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Question count</span>
            <input
              type="number"
              min={6}
              max={40}
              value={input.questionCount}
              onChange={(event) =>
                updateInput("questionCount", Number(event.target.value))
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
            />
          </label>
        </div>

        <div className={styles.toggleGrid}>
          {[
            ["includeRapidFire", "Rapid-fire questions"],
            ["includeContradictions", "Contradiction testing"],
            ["includeEthics", "Ethical dilemmas"],
            ["includeFailure", "Failure probes"],
            ["includeConflict", "Conflict pressure"],
            ["includeConsistencyChecks", "Consistency checks"],
          ].map(([field, label]) => (
            <label className={styles.toggle} key={field}>
              <input
                type="checkbox"
                checked={
                  input[
                    field as
                      | "includeRapidFire"
                      | "includeContradictions"
                      | "includeEthics"
                      | "includeFailure"
                      | "includeConflict"
                      | "includeConsistencyChecks"
                  ]
                }
                onChange={(event) =>
                  updateInput(
                    field as
                      | "includeRapidFire"
                      | "includeContradictions"
                      | "includeEthics"
                      | "includeFailure"
                      | "includeConflict"
                      | "includeConsistencyChecks",
                    event.target.checked,
                  )
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.profileStrip}>
        {interview.pressureProfile.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <aside className={styles.questionPanel}>
          <span className={styles.eyebrow}>Pressure question bank</span>
          <h2>Simulation sequence</h2>

          <div className={styles.questionList}>
            {interview.questions.map((question, index) => {
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
                <strong>Pressure tactic</strong>
                <p>{activeQuestion.pressureTactic}</p>
                <strong>What is being tested</strong>
                <p>{activeQuestion.interviewerIntent}</p>
              </div>

              <label className={styles.answerField}>
                <span>Your response</span>
                <textarea
                  rows={11}
                  value={answerText}
                  onChange={(event) => {
                    setAnswerText(event.target.value);
                    setShowFeedback(false);
                  }}
                  placeholder="Pause, acknowledge the challenge, answer directly, take ownership, provide evidence and explain what changed."
                />
              </label>

              <div className={styles.answerActions}>
                <span>
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={evaluateAnswer}
                  disabled={!answerText.trim()}
                >
                  Evaluate pressure response
                </button>
              </div>

              {showFeedback && activeAnswer ? (
                <section className={styles.feedback}>
                  <div className={styles.feedbackHeader}>
                    <div>
                      <span className={styles.eyebrow}>
                        Pressure response analysis
                      </span>
                      <h3>{activeAnswer.feedback.score.overall}% overall</h3>
                    </div>
                  </div>

                  <div className={styles.scoreGrid}>
                    {Object.entries(activeAnswer.feedback.score)
                      .filter(([name]) => name !== "overall")
                      .map(([name, score]) => (
                        <article key={name}>
                          <span>{name.replace(/([A-Z])/g, " $1")}</span>
                          <strong>{score}%</strong>
                        </article>
                      ))}
                  </div>

                  <div className={styles.feedbackColumns}>
                    <section>
                      <h4>Strong signals</h4>
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
                        <p key={item}>→ {item}</p>
                      ))}
                    </section>

                    <section>
                      <h4>Red flags</h4>
                      {activeAnswer.feedback.redFlags.length ? (
                        activeAnswer.feedback.redFlags.map((item) => (
                          <p key={item}>⚠ {item}</p>
                        ))
                      ) : (
                        <p>✓ No major red flag detected.</p>
                      )}
                    </section>
                  </div>

                  {activeAnswer.feedback.adaptiveFollowUp ? (
                    <div className={styles.followUp}>
                      <strong>Immediate interviewer follow-up</strong>
                      <p>{activeAnswer.feedback.adaptiveFollowUp}</p>
                    </div>
                  ) : null}

                  <div className={styles.coachingNote}>
                    <strong>Pressure coaching</strong>
                    <p>{activeAnswer.feedback.coachingNote}</p>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <p>Select a pressure interview question.</p>
          )}
        </article>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.reportHeader}>
          <div>
            <span className={styles.eyebrow}>Pressure readiness report</span>
            <h2>Composure, consistency and resilience</h2>
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
              <p>Complete responses to generate priorities.</p>
            )}
          </article>

          <article>
            <h3>Risk areas</h3>
            {report.riskAreas.length ? (
              report.riskAreas.slice(0, 8).map((item) => (
                <p key={item}>⚠ {item}</p>
              ))
            ) : (
              <p>No major pressure risk has been detected.</p>
            )}
          </article>

          <article>
            <h3>Strongest signals</h3>
            {report.strongestSignals.length ? (
              report.strongestSignals.map((item) => (
                <p key={item}>✓ {item}</p>
              ))
            ) : (
              <p>Complete responses to identify strong signals.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
