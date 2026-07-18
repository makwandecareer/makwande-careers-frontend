"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildTechnicalDeepDive,
  buildTechnicalDeepDiveReport,
  scoreTechnicalAnswer,
  type TechnicalDeepDiveInput,
  type TechnicalDifficulty,
  type TechnicalInterviewAnswer,
} from "@/lib/technical-deep-dive";

import styles from "./TechnicalDeepDiveEngine.module.css";

interface TechnicalDeepDiveEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-technical-deep-dive-v1";

const DIFFICULTIES: TechnicalDifficulty[] = [
  "Foundation",
  "Intermediate",
  "Advanced",
  "Expert",
];

export function TechnicalDeepDiveEngine({
  cvContent,
  targetRole,
  jobDescription,
}: TechnicalDeepDiveEngineProps) {
  const [input, setInput] = useState<TechnicalDeepDiveInput>({
    targetRole,
    jobDescription,
    companyName: "",
    difficulty: "Advanced",
    questionCount: 20,
    includeScenarios: true,
    includeTroubleshooting: true,
    includeArchitecture: true,
    includeSecurityRisk: true,
    includeLeadership: true,
    includeEvidenceVerification: true,
  });
  const [selectedSkill, setSelectedSkill] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<TechnicalInterviewAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<TechnicalDeepDiveInput>;
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

  const deepDive = useMemo(
    () => buildTechnicalDeepDive(cvContent, input),
    [cvContent, input],
  );

  useEffect(() => {
    if (!selectedSkill && deepDive.skills[0]) {
      setSelectedSkill(deepDive.skills[0].name);
    }
  }, [deepDive.skills, selectedSkill]);

  const visibleQuestions = useMemo(
    () =>
      selectedSkill === "all"
        ? deepDive.questions
        : deepDive.questions.filter(
            (question) => question.skill === selectedSkill,
          ),
    [deepDive.questions, selectedSkill],
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

  const activeQuestion = deepDive.questions.find(
    (question) => question.id === activeQuestionId,
  );

  const activeAnswer = answers.find(
    (answer) => answer.questionId === activeQuestionId,
  );

  const report = useMemo(
    () =>
      buildTechnicalDeepDiveReport(
        deepDive.skills,
        deepDive.questions,
        answers,
      ),
    [answers, deepDive.questions, deepDive.skills],
  );

  function updateInput<K extends keyof TechnicalDeepDiveInput>(
    field: K,
    value: TechnicalDeepDiveInput[K],
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

    const feedback = scoreTechnicalAnswer(activeQuestion, answerText);

    const answer: TechnicalInterviewAnswer = {
      questionId: activeQuestion.id,
      answer: answerText.trim(),
      feedback,
    };

    setAnswers((current) => [
      ...current.filter((item) => item.questionId !== activeQuestion.id),
      answer,
    ]);
    setShowFeedback(true);
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.6 · Technical deep dive engine
          </span>
          <h1>Test technical competence beyond keywords and CV claims</h1>
          <p>
            Build role-specific technical interviews, examine practical depth,
            test troubleshooting and architecture judgement, and identify
            skill claims that may fail under expert follow-up.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Technical readiness</span>
          <strong>{deepDive.readinessScore}%</strong>
          <small>{deepDive.skills.length} skills analysed</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Technical configuration</span>
            <h2>Role, difficulty and question coverage</h2>
          </div>
          <span>{deepDive.questions.length} questions generated</span>
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
            <span>Difficulty</span>
            <select
              value={input.difficulty}
              onChange={(event) =>
                updateInput(
                  "difficulty",
                  event.target.value as TechnicalDifficulty,
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
            <span>Question count</span>
            <input
              type="number"
              min={6}
              max={60}
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
              placeholder="Paste the technical requirements and responsibilities."
            />
          </label>
        </div>

        <div className={styles.toggleGrid}>
          {[
            ["includeScenarios", "Scenario questions"],
            ["includeTroubleshooting", "Troubleshooting questions"],
            ["includeArchitecture", "Architecture questions"],
            ["includeSecurityRisk", "Security and risk questions"],
            ["includeLeadership", "Technical leadership questions"],
            ["includeEvidenceVerification", "Evidence verification questions"],
          ].map(([field, label]) => (
            <label className={styles.toggle} key={field}>
              <input
                type="checkbox"
                checked={
                  input[
                    field as
                      | "includeScenarios"
                      | "includeTroubleshooting"
                      | "includeArchitecture"
                      | "includeSecurityRisk"
                      | "includeLeadership"
                      | "includeEvidenceVerification"
                  ]
                }
                onChange={(event) =>
                  updateInput(
                    field as
                      | "includeScenarios"
                      | "includeTroubleshooting"
                      | "includeArchitecture"
                      | "includeSecurityRisk"
                      | "includeLeadership"
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

      {!deepDive.skills.length ? (
        <section className={styles.emptyState}>
          <h2>No technical skills were detected</h2>
          <p>
            Add skills, project evidence or a detailed job specification to
            generate a technical deep-dive interview.
          </p>
        </section>
      ) : (
        <>
          <section className={styles.skillGrid}>
            {deepDive.skills.slice(0, 12).map((skill) => (
              <button
                type="button"
                key={skill.name}
                className={
                  selectedSkill === skill.name ? styles.activeSkill : ""
                }
                onClick={() => {
                  setSelectedSkill(skill.name);
                  setShowFeedback(false);
                }}
              >
                <div>
                  <span>{skill.name}</span>
                  <small>{skill.source}</small>
                </div>
                <div className={styles.skillMetrics}>
                  <strong>{skill.relevance}% relevant</strong>
                  <strong>{skill.depthSignal}% depth</strong>
                </div>
                {skill.riskFlags[0] ? <p>{skill.riskFlags[0]}</p> : null}
              </button>
            ))}

            <button
              type="button"
              className={selectedSkill === "all" ? styles.activeSkill : ""}
              onClick={() => {
                setSelectedSkill("all");
                setShowFeedback(false);
              }}
            >
              <div>
                <span>All technical areas</span>
                <small>Complete generated interview</small>
              </div>
              <div className={styles.skillMetrics}>
                <strong>{deepDive.skills.length} skills</strong>
                <strong>{deepDive.questions.length} questions</strong>
              </div>
            </button>
          </section>

          <section className={styles.mainGrid}>
            <aside className={styles.questionPanel}>
              <span className={styles.eyebrow}>Technical question bank</span>
              <h2>{selectedSkill === "all" ? "All skills" : selectedSkill}</h2>

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
                        <strong>{question.category}</strong>
                        <small>
                          {completed
                            ? "Answered"
                            : `${question.difficulty} · ${question.skill}`}
                        </small>
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
                        {activeQuestion.category} · {activeQuestion.skill}
                      </span>
                      <h2>{activeQuestion.question}</h2>
                    </div>
                    <span>{activeQuestion.scoringWeight}% weight</span>
                  </div>

                  <div className={styles.intentBox}>
                    <strong>What the interviewer is testing</strong>
                    <p>{activeQuestion.interviewerIntent}</p>
                  </div>

                  <div className={styles.insightGrid}>
                    <details>
                      <summary>Expected concepts</summary>
                      {activeQuestion.expectedConcepts.map((concept) => (
                        <p key={concept}>✓ {concept}</p>
                      ))}
                    </details>

                    <details>
                      <summary>CV evidence</summary>
                      {activeQuestion.practicalEvidence.length ? (
                        activeQuestion.practicalEvidence.map((item) => (
                          <p key={item}>✓ {item}</p>
                        ))
                      ) : (
                        <p>No direct CV evidence was detected.</p>
                      )}
                    </details>
                  </div>

                  <label className={styles.answerField}>
                    <span>Your technical answer</span>
                    <textarea
                      rows={12}
                      value={answerText}
                      onChange={(event) => {
                        setAnswerText(event.target.value);
                        setShowFeedback(false);
                      }}
                      placeholder="Define the concept, explain your approach, provide a real example, discuss trade-offs and close with validation or measurable impact."
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
                      Evaluate technical answer
                    </button>
                  </div>

                  {showFeedback && activeAnswer ? (
                    <section className={styles.feedback}>
                      <div className={styles.feedbackHeader}>
                        <div>
                          <span className={styles.eyebrow}>
                            Technical answer analysis
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
                            <p>No strong technical signal detected yet.</p>
                          )}
                        </section>

                        <section>
                          <h4>Improve</h4>
                          {activeAnswer.feedback.improvements.map((item) => (
                            <p key={item}>⚠ {item}</p>
                          ))}
                        </section>

                        <section>
                          <h4>Missing concepts</h4>
                          {activeAnswer.feedback.missingConcepts.length ? (
                            activeAnswer.feedback.missingConcepts.map(
                              (item) => <p key={item}>→ {item}</p>,
                            )
                          ) : (
                            <p>✓ Core concepts are represented.</p>
                          )}
                        </section>
                      </div>

                      {activeAnswer.feedback.redFlags.length ? (
                        <div className={styles.redFlagBox}>
                          <strong>Technical red flags</strong>
                          {activeAnswer.feedback.redFlags.map((item) => (
                            <p key={item}>⚠ {item}</p>
                          ))}
                        </div>
                      ) : null}

                      {activeAnswer.feedback.adaptiveFollowUp ? (
                        <div className={styles.followUp}>
                          <strong>Adaptive technical follow-up</strong>
                          <p>{activeAnswer.feedback.adaptiveFollowUp}</p>
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
                <p>Select a technical question.</p>
              )}
            </article>
          </section>

          <section className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Technical readiness report
                </span>
                <h2>Interview performance and skill risks</h2>
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
                <h3>Technical risk areas</h3>
                {report.riskAreas.length ? (
                  report.riskAreas.slice(0, 8).map((item) => (
                    <p key={item}>⚠ {item}</p>
                  ))
                ) : (
                  <p>No major technical risk has been detected.</p>
                )}
              </article>

              <article>
                <h3>Strongest technical skills</h3>
                {report.strongestSkills.length ? (
                  report.strongestSkills.map((item) => (
                    <p key={item}>✓ {item}</p>
                  ))
                ) : (
                  <p>Add stronger technical evidence to the CV.</p>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
