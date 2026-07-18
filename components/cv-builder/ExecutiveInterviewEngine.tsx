"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildExecutiveInterview,
  buildExecutiveReadinessReport,
  scoreExecutiveAnswer,
  type ExecutiveInterviewAnswer,
  type ExecutiveInterviewInput,
  type ExecutiveLevel,
} from "@/lib/executive-interview";

import styles from "./ExecutiveInterviewEngine.module.css";

interface ExecutiveInterviewEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-executive-interview-v1";

const LEVELS: ExecutiveLevel[] = [
  "Senior Manager",
  "Director",
  "Executive",
  "C-Suite",
];

export function ExecutiveInterviewEngine({
  targetRole,
  jobDescription,
}: ExecutiveInterviewEngineProps) {
  const [input, setInput] = useState<ExecutiveInterviewInput>({
    targetRole,
    jobDescription,
    companyName: "",
    executiveLevel: "Executive",
    questionCount: 16,
    includeBoardQuestions: true,
    includeFinancialQuestions: true,
    includeTransformationQuestions: true,
    includeCrisisQuestions: true,
    includeGovernanceQuestions: true,
    includePeopleQuestions: true,
  });
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<ExecutiveInterviewAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<ExecutiveInterviewInput>;
          answers?: ExecutiveInterviewAnswer[];
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

  const interview = useMemo(() => buildExecutiveInterview(input), [input]);

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
    () => buildExecutiveReadinessReport(answers),
    [answers],
  );

  function updateInput<K extends keyof ExecutiveInterviewInput>(
    field: K,
    value: ExecutiveInterviewInput[K],
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

    const feedback = scoreExecutiveAnswer(activeQuestion, answerText);
    const result: ExecutiveInterviewAnswer = {
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
            Phase 12.8 · Executive interview engine
          </span>
          <h1>Prepare candidates for board-level and executive interviews</h1>
          <p>
            Simulate strategic, commercial, financial, governance, crisis and
            transformation questions while evaluating executive judgement,
            leadership credibility and board readiness.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Executive baseline</span>
          <strong>{interview.executiveReadinessBaseline}%</strong>
          <small>{input.executiveLevel}</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Executive configuration</span>
            <h2>Set level, role and interview coverage</h2>
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
            <span>Executive level</span>
            <select
              value={input.executiveLevel}
              onChange={(event) =>
                updateInput(
                  "executiveLevel",
                  event.target.value as ExecutiveLevel,
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
              min={8}
              max={36}
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
            ["includeBoardQuestions", "Board questions"],
            ["includeFinancialQuestions", "Financial leadership"],
            ["includeTransformationQuestions", "Transformation"],
            ["includeCrisisQuestions", "Crisis leadership"],
            ["includeGovernanceQuestions", "Governance and ethics"],
            ["includePeopleQuestions", "Culture and people"],
          ].map(([field, label]) => (
            <label className={styles.toggle} key={field}>
              <input
                type="checkbox"
                checked={
                  input[
                    field as
                      | "includeBoardQuestions"
                      | "includeFinancialQuestions"
                      | "includeTransformationQuestions"
                      | "includeCrisisQuestions"
                      | "includeGovernanceQuestions"
                      | "includePeopleQuestions"
                  ]
                }
                onChange={(event) =>
                  updateInput(
                    field as
                      | "includeBoardQuestions"
                      | "includeFinancialQuestions"
                      | "includeTransformationQuestions"
                      | "includeCrisisQuestions"
                      | "includeGovernanceQuestions"
                      | "includePeopleQuestions",
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
        {interview.interviewProfile.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <aside className={styles.questionPanel}>
          <span className={styles.eyebrow}>Executive question bank</span>
          <h2>Board-level interview</h2>

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
                    <strong>{question.category}</strong>
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
                    {activeQuestion.category}
                  </span>
                  <h2>{activeQuestion.question}</h2>
                </div>
                <span>{activeQuestion.scoringWeight}% weight</span>
              </div>

              <div className={styles.intentBox}>
                <strong>What the board is testing</strong>
                <p>{activeQuestion.boardIntent}</p>
              </div>

              <label className={styles.answerField}>
                <span>Your executive answer</span>
                <textarea
                  rows={12}
                  value={answerText}
                  onChange={(event) => {
                    setAnswerText(event.target.value);
                    setShowFeedback(false);
                  }}
                  placeholder="Lead with the enterprise issue, state the recommendation, explain commercial and financial impact, identify risks and stakeholders, then close with execution and measurable outcomes."
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
                  Evaluate executive answer
                </button>
              </div>

              {showFeedback && activeAnswer ? (
                <section className={styles.feedback}>
                  <div className={styles.feedbackHeader}>
                    <div>
                      <span className={styles.eyebrow}>
                        Executive answer analysis
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
                      <h4>Executive strengths</h4>
                      {activeAnswer.feedback.strengths.length ? (
                        activeAnswer.feedback.strengths.map((item) => (
                          <p key={item}>✓ {item}</p>
                        ))
                      ) : (
                        <p>No strong executive signal detected yet.</p>
                      )}
                    </section>

                    <section>
                      <h4>Improve</h4>
                      {activeAnswer.feedback.improvements.map((item) => (
                        <p key={item}>→ {item}</p>
                      ))}
                    </section>

                    <section>
                      <h4>Board-level red flags</h4>
                      {activeAnswer.feedback.redFlags.length ? (
                        activeAnswer.feedback.redFlags.map((item) => (
                          <p key={item}>⚠ {item}</p>
                        ))
                      ) : (
                        <p>✓ No major board-level red flag detected.</p>
                      )}
                    </section>
                  </div>

                  {activeAnswer.feedback.boardFollowUp ? (
                    <div className={styles.followUp}>
                      <strong>Board follow-up</strong>
                      <p>{activeAnswer.feedback.boardFollowUp}</p>
                    </div>
                  ) : null}

                  <div className={styles.coachingNote}>
                    <strong>Executive coaching</strong>
                    <p>{activeAnswer.feedback.coachingNote}</p>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <p>Select an executive interview question.</p>
          )}
        </article>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.reportHeader}>
          <div>
            <span className={styles.eyebrow}>Executive readiness report</span>
            <h2>Leadership credibility and board readiness</h2>
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
              <p>Complete answers to generate priorities.</p>
            )}
          </article>

          <article>
            <h3>Leadership risks</h3>
            {report.leadershipRisks.length ? (
              report.leadershipRisks.slice(0, 8).map((item) => (
                <p key={item}>⚠ {item}</p>
              ))
            ) : (
              <p>No major leadership risk has been detected.</p>
            )}
          </article>

          <article>
            <h3>Strongest signals</h3>
            {report.strongestSignals.length ? (
              report.strongestSignals.map((item) => (
                <p key={item}>✓ {item}</p>
              ))
            ) : (
              <p>Complete answers to identify executive strengths.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
