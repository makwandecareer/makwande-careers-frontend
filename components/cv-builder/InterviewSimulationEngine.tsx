"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSimulationQuestions,
  createSimulationReport,
  evaluateSimulationAnswer,
  type SimulationAnswer,
  type SimulationDifficulty,
  type SimulationInput,
  type SimulationPersona,
} from "@/lib/interview-simulation";

import styles from "./InterviewSimulationEngine.module.css";

interface InterviewSimulationEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-interview-simulation-v1";

const INITIAL_INPUT: SimulationInput = {
  companyName: "",
  industry: "",
  companyValues: "",
  companyPriorities: "",
  recruiterPersona: "Hiring Manager",
  difficulty: "Professional",
  totalQuestions: 10,
  answerTimeLimit: 5,
  includeTechnical: true,
  includePressure: true,
  includeCompanyQuestions: true,
  includeAdaptiveFollowUps: true,
};

const PERSONAS: SimulationPersona[] = [
  "HR Recruiter",
  "Hiring Manager",
  "Technical Interviewer",
  "Executive",
  "Panel",
];

const DIFFICULTIES: SimulationDifficulty[] = [
  "Foundation",
  "Professional",
  "Advanced",
  "Executive",
];

type SessionState = "setup" | "active" | "complete";

export function InterviewSimulationEngine({
  cvContent,
  targetRole,
  jobDescription,
}: InterviewSimulationEngineProps) {
  const [role, setRole] = useState(targetRole);
  const [specification, setSpecification] = useState(jobDescription);
  const [input, setInput] = useState<SimulationInput>(INITIAL_INPUT);
  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<SimulationAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: string;
          specification?: string;
          input?: Partial<SimulationInput>;
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

  const questions = useMemo(
    () =>
      createSimulationQuestions(
        input,
        role,
        specification,
        cvContent,
      ),
    [cvContent, input, role, specification],
  );

  const currentQuestion = questions[questionIndex];
  const currentStoredAnswer = answers.find(
    (item) => item.questionId === currentQuestion?.id,
  );

  const report = useMemo(
    () => createSimulationReport(input, role, answers),
    [answers, input, role],
  );

  function updateInput<K extends keyof SimulationInput>(
    field: K,
    value: SimulationInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function startSimulation(): void {
    setAnswers([]);
    setQuestionIndex(0);
    setAnswer("");
    setShowFeedback(false);
    setSessionState("active");
  }

  function submitAnswer(): void {
    if (!currentQuestion || !answer.trim()) return;

    const feedback = evaluateSimulationAnswer(
      currentQuestion,
      answer,
      role,
      specification,
      input.companyValues,
    );

    const response: SimulationAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: answer.trim(),
      feedback,
      answeredAt: new Date().toISOString(),
    };

    setAnswers((current) => [
      ...current.filter((item) => item.questionId !== currentQuestion.id),
      response,
    ]);
    setShowFeedback(true);
  }

  function nextQuestion(): void {
    if (questionIndex >= questions.length - 1) {
      setSessionState("complete");
      return;
    }

    setQuestionIndex((current) => current + 1);
    setAnswer("");
    setShowFeedback(false);
  }

  function restartSimulation(): void {
    setSessionState("setup");
    setAnswers([]);
    setQuestionIndex(0);
    setAnswer("");
    setShowFeedback(false);
  }

  if (sessionState === "setup") {
    return (
      <div className={styles.dashboard}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              Phase 12.4 · Interview simulation & scenario engine
            </span>
            <h1>Practise the interview one question at a time</h1>
            <p>
              Run a structured mock interview using candidate evidence, role
              requirements, company context and recruiter persona. Each answer
              is evaluated for communication, STAR structure, evidence,
              relevance, confidence, technical depth, business understanding,
              leadership and culture fit.
            </p>
          </div>

          <div className={styles.heroMetric}>
            <span>Simulation plan</span>
            <strong>{questions.length}</strong>
            <small>questions · {input.answerTimeLimit} min each</small>
          </div>
        </header>

        <section className={styles.setupGrid}>
          <article className={styles.card}>
            <span className={styles.eyebrow}>Simulation setup</span>
            <h2>Configure the mock interview</h2>

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
                      event.target.value as SimulationPersona,
                    )
                  }
                >
                  {PERSONAS.map((persona) => (
                    <option value={persona} key={persona}>
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
                      event.target.value as SimulationDifficulty,
                    )
                  }
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option value={difficulty} key={difficulty}>
                      {difficulty}
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
                  value={input.totalQuestions}
                  onChange={(event) =>
                    updateInput(
                      "totalQuestions",
                      Number(event.target.value),
                    )
                  }
                />
              </label>

              <label>
                <span>Answer time guideline</span>
                <select
                  value={input.answerTimeLimit}
                  onChange={(event) =>
                    updateInput(
                      "answerTimeLimit",
                      Number(event.target.value),
                    )
                  }
                >
                  {[2, 3, 4, 5, 6, 8].map((minutes) => (
                    <option value={minutes} key={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.fullWidth}>
                <span>Job specification</span>
                <textarea
                  value={specification}
                  onChange={(event) =>
                    setSpecification(event.target.value)
                  }
                  rows={7}
                  placeholder="Paste responsibilities, requirements, competencies and technical expectations."
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
                  placeholder="Safety, integrity, collaboration, innovation..."
                />
              </label>

              <label className={styles.fullWidth}>
                <span>Company priorities and challenges</span>
                <textarea
                  value={input.companyPriorities}
                  onChange={(event) =>
                    updateInput("companyPriorities", event.target.value)
                  }
                  rows={4}
                  placeholder="Transformation, growth, service, compliance, cost control..."
                />
              </label>
            </div>

            <div className={styles.toggleGrid}>
              {[
                ["includeTechnical", "Technical questions"],
                ["includePressure", "Pressure questions"],
                ["includeCompanyQuestions", "Company questions"],
                ["includeAdaptiveFollowUps", "Adaptive follow-ups"],
              ].map(([field, label]) => (
                <label className={styles.toggle} key={field}>
                  <input
                    type="checkbox"
                    checked={
                      input[
                        field as
                          | "includeTechnical"
                          | "includePressure"
                          | "includeCompanyQuestions"
                          | "includeAdaptiveFollowUps"
                      ]
                    }
                    onChange={(event) =>
                      updateInput(
                        field as
                          | "includeTechnical"
                          | "includePressure"
                          | "includeCompanyQuestions"
                          | "includeAdaptiveFollowUps",
                        event.target.checked,
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={startSimulation}
            >
              Start interview simulation
            </button>
          </article>

          <aside className={styles.previewPanel}>
            <span className={styles.eyebrow}>Interview preview</span>
            <h2>{input.recruiterPersona}</h2>

            <div className={styles.previewMetrics}>
              <div>
                <span>Questions</span>
                <strong>{questions.length}</strong>
              </div>
              <div>
                <span>Difficulty</span>
                <strong>{input.difficulty}</strong>
              </div>
              <div>
                <span>Target role</span>
                <strong>{role || "Not entered"}</strong>
              </div>
              <div>
                <span>Company</span>
                <strong>{input.companyName || "Target company"}</strong>
              </div>
            </div>

            <h3>Question categories</h3>
            <div className={styles.categoryList}>
              {Array.from(new Set(questions.map((item) => item.category))).map(
                (category) => (
                  <span key={category}>{category}</span>
                ),
              )}
            </div>

            <div className={styles.notice}>
              <strong>Current scoring approach</strong>
              <p>
                Answers are evaluated using deterministic language and evidence
                signals. A later backend phase can replace this evaluator with
                a generative AI service while preserving the same interface.
              </p>
            </div>
          </aside>
        </section>
      </div>
    );
  }

  if (sessionState === "complete") {
    return (
      <div className={styles.dashboard}>
        <header className={styles.reportHero}>
          <div>
            <span className={styles.eyebrow}>Interview complete</span>
            <h1>{report.role} simulation report</h1>
            <p>
              {report.completedQuestions} questions completed with the{" "}
              {report.persona} persona.
            </p>
          </div>

          <div className={styles.overallScore}>
            <span>Overall score</span>
            <strong>{report.overallScore}%</strong>
            <small>{report.companyName}</small>
          </div>
        </header>

        <section className={styles.dimensionGrid}>
          {Object.entries(report.dimensionScores).map(([dimension, score]) => (
            <article key={dimension}>
              <div>
                <span>{dimension.replace(/([A-Z])/g, " $1")}</span>
                <strong>{score}%</strong>
              </div>
              <div className={styles.track}>
                <span style={{ width: `${score}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section className={styles.reportColumns}>
          <article className={styles.card}>
            <span className={styles.eyebrow}>Strengths</span>
            <h2>What worked well</h2>
            {report.strengths.length ? (
              report.strengths.map((item) => <p key={item}>✓ {item}</p>)
            ) : (
              <p>Complete more answers to identify recurring strengths.</p>
            )}
          </article>

          <article className={styles.card}>
            <span className={styles.eyebrow}>Weaknesses</span>
            <h2>What needs improvement</h2>
            {report.weaknesses.length ? (
              report.weaknesses.map((item) => <p key={item}>⚠ {item}</p>)
            ) : (
              <p>No major recurring weakness was detected.</p>
            )}
          </article>

          <article className={styles.card}>
            <span className={styles.eyebrow}>Action plan</span>
            <h2>Recommended next steps</h2>
            {report.recommendedActions.length ? (
              report.recommendedActions.map((item) => (
                <p key={item}>→ {item}</p>
              ))
            ) : (
              <p>Continue practising with more difficult scenarios.</p>
            )}
          </article>
        </section>

        <section className={styles.card}>
          <span className={styles.eyebrow}>Answer review</span>
          <h2>Question-by-question performance</h2>

          <div className={styles.answerReview}>
            {report.answers.map((item, index) => (
              <article key={item.questionId}>
                <div className={styles.reviewHeader}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.question}</strong>
                    <small>{item.feedback.score.overall}%</small>
                  </div>
                </div>
                <p>{item.answer}</p>
                <div className={styles.reviewTags}>
                  {item.feedback.strengths.map((strength) => (
                    <span key={strength}>✓ {strength}</span>
                  ))}
                  {item.feedback.improvements.map((improvement) => (
                    <span key={improvement}>⚠ {improvement}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={restartSimulation}
        >
          Start another simulation
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.sessionHeader}>
        <div>
          <span className={styles.eyebrow}>Live simulation</span>
          <h1>{role || "Target Role"}</h1>
          <p>
            {input.recruiterPersona} · Question {questionIndex + 1} of{" "}
            {questions.length}
          </p>
        </div>

        <div className={styles.progressBlock}>
          <span>{Math.round(((questionIndex + 1) / questions.length) * 100)}%</span>
          <div className={styles.track}>
            <span
              style={{
                width: `${((questionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      <section className={styles.sessionGrid}>
        <article className={styles.interviewerCard}>
          <div className={styles.interviewerIdentity}>
            <span>{input.recruiterPersona.charAt(0)}</span>
            <div>
              <strong>{input.recruiterPersona}</strong>
              <small>{input.difficulty} interview</small>
            </div>
          </div>

          <span className={styles.questionCategory}>
            {currentQuestion?.category}
          </span>
          <h2>{currentQuestion?.question}</h2>

          <div className={styles.intentBox}>
            <strong>Interviewer intent</strong>
            <p>{currentQuestion?.interviewerIntent}</p>
          </div>

          {currentQuestion?.candidateEvidence.length ? (
            <details>
              <summary>View CV evidence prompts</summary>
              {currentQuestion.candidateEvidence.map((item) => (
                <p key={item}>✓ {item}</p>
              ))}
            </details>
          ) : null}
        </article>

        <article className={styles.answerCard}>
          <div className={styles.answerHeader}>
            <div>
              <span className={styles.eyebrow}>Your answer</span>
              <h2>Respond as you would in the real interview</h2>
            </div>
            <span>{input.answerTimeLimit} min guideline</span>
          </div>

          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={12}
            disabled={showFeedback}
            placeholder="Use a clear structure. Explain the situation, your responsibility, actions, result and what you learned."
          />

          <div className={styles.answerFooter}>
            <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            {!showFeedback ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={submitAnswer}
                disabled={!answer.trim()}
              >
                Submit answer
              </button>
            ) : null}
          </div>
        </article>
      </section>

      {showFeedback && currentStoredAnswer ? (
        <section className={styles.feedbackPanel}>
          <div className={styles.feedbackTop}>
            <div>
              <span className={styles.eyebrow}>Instant feedback</span>
              <h2>Answer score: {currentStoredAnswer.feedback.score.overall}%</h2>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={nextQuestion}
            >
              {questionIndex >= questions.length - 1
                ? "View final report"
                : "Next question"}
            </button>
          </div>

          <div className={styles.feedbackScores}>
            {Object.entries(currentStoredAnswer.feedback.score)
              .filter(([dimension]) => dimension !== "overall")
              .map(([dimension, score]) => (
                <article key={dimension}>
                  <span>{dimension.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{score}%</strong>
                </article>
              ))}
          </div>

          <div className={styles.feedbackColumns}>
            <section>
              <h3>Strengths</h3>
              {currentStoredAnswer.feedback.strengths.map((item) => (
                <p key={item}>✓ {item}</p>
              ))}
            </section>

            <section>
              <h3>Improvements</h3>
              {currentStoredAnswer.feedback.improvements.map((item) => (
                <p key={item}>⚠ {item}</p>
              ))}
            </section>

            <section>
              <h3>Missed opportunities</h3>
              {currentStoredAnswer.feedback.missedOpportunities.length ? (
                currentStoredAnswer.feedback.missedOpportunities.map((item) => (
                  <p key={item}>→ {item}</p>
                ))
              ) : (
                <p>✓ No major missed opportunity detected.</p>
              )}
            </section>
          </div>

          {currentStoredAnswer.feedback.nextFollowUp ? (
            <div className={styles.followUpBox}>
              <strong>Adaptive follow-up</strong>
              <p>{currentStoredAnswer.feedback.nextFollowUp}</p>
            </div>
          ) : null}

          <div className={styles.rewriteBox}>
            <strong>How to strengthen this answer</strong>
            <p>{currentStoredAnswer.feedback.suggestedRewrite}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
