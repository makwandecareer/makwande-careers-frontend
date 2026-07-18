"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  answerFeedback,
  createInterviewStudioPlan,
  scoreInterviewAnswer,
  type InterviewDifficulty,
  type InterviewMode,
  type InterviewSession,
} from "@/lib/interview-preparation";

import styles from "./InterviewPreparationStudio.module.css";

interface InterviewPreparationStudioProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-interview-studio-v1";

export function InterviewPreparationStudio({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: InterviewPreparationStudioProps) {
  const [mode, setMode] = useState<InterviewMode>("hr");
  const [difficulty, setDifficulty] =
    useState<InterviewDifficulty>("professional");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const plan = useMemo(
    () =>
      createInterviewStudioPlan(
        cvContent,
        targetRole,
        jobDescription,
        atsScore,
        mode,
        difficulty,
      ),
    [atsScore, cvContent, difficulty, jobDescription, mode, targetRole],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored) as InterviewSession[]);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    setActiveQuestion(0);
    setAnswers({});
  }, [difficulty, mode]);

  const question = plan.questions[activeQuestion];
  const answer = question ? answers[question.id] ?? "" : "";
  const currentScore = question
    ? scoreInterviewAnswer(answer, question)
    : 0;

  const answeredQuestions = plan.questions.filter(
    (item) => (answers[item.id] ?? "").trim().length > 0,
  );

  const averageScore =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce(
            (total, item) =>
              total + scoreInterviewAnswer(answers[item.id] ?? "", item),
            0,
          ) / answeredQuestions.length,
        )
      : 0;

  function updateAnswer(value: string): void {
    if (!question) return;

    setAnswers((current) => ({
      ...current,
      [question.id]: value,
    }));
  }

  function completeSession(): void {
    if (!answeredQuestions.length) return;

    const scores = Object.fromEntries(
      plan.questions.map((item) => [
        item.id,
        scoreInterviewAnswer(answers[item.id] ?? "", item),
      ]),
    );

    const session: InterviewSession = {
      id: `${Date.now()}`,
      role: plan.role,
      mode,
      difficulty,
      startedAt: plan.generatedAt,
      completedAt: new Date().toISOString(),
      answers,
      scores,
      averageScore,
    };

    setHistory((current) => [session, ...current].slice(0, 8));
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 11.4 · AI interview preparation
          </span>
          <h1>Practise stronger answers before the real interview</h1>
          <p>
            Generate role-specific questions, build STAR answers and receive
            immediate coaching based on relevance, structure and evidence.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Interview readiness</span>
          <strong>{plan.readinessScore}%</strong>
          <small>Estimated from your profile and ATS data</small>
        </div>
      </header>

      <section className={styles.controlCard}>
        <label>
          <span>Interview mode</span>
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as InterviewMode)
            }
          >
            <option value="hr">HR interview</option>
            <option value="behavioural">Behavioural interview</option>
            <option value="technical">Role and technical interview</option>
          </select>
        </label>

        <label>
          <span>Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as InterviewDifficulty)
            }
          >
            <option value="foundation">Foundation</option>
            <option value="professional">Professional</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <div className={styles.controlMetric}>
          <span>Confidence estimate</span>
          <strong>{plan.confidenceScore}%</strong>
        </div>

        <div className={styles.controlMetric}>
          <span>Session average</span>
          <strong>{averageScore}%</strong>
        </div>
      </section>

      <section className={styles.focusCard}>
        <div>
          <span className={styles.eyebrow}>Coaching focus</span>
          <h2>What strong answers should demonstrate</h2>
        </div>

        <div className={styles.focusGrid}>
          {plan.focusAreas.map((focus, index) => (
            <article key={focus}>
              <span>{index + 1}</span>
              <p>{focus}</p>
            </article>
          ))}
        </div>
      </section>

      {question ? (
        <section className={styles.practiceLayout}>
          <aside className={styles.questionList}>
            <div className={styles.questionHeader}>
              <span>Question bank</span>
              <strong>{plan.questions.length} questions</strong>
            </div>

            {plan.questions.map((item, index) => {
              const itemAnswer = answers[item.id] ?? "";
              const score = scoreInterviewAnswer(itemAnswer, item);

              return (
                <button
                  type="button"
                  className={
                    index === activeQuestion ? styles.activeQuestion : ""
                  }
                  onClick={() => setActiveQuestion(index)}
                  key={item.id}
                >
                  <span>{index + 1}</span>
                  <span>
                    <strong>{item.category}</strong>
                    <small>{item.question}</small>
                  </span>
                  {score > 0 ? <b>{score}%</b> : null}
                </button>
              );
            })}
          </aside>

          <article className={styles.practiceCard}>
            <div className={styles.questionMeta}>
              <span>{question.category}</span>
              <span>{question.suggestedSeconds} seconds</span>
            </div>

            <h2>{question.question}</h2>

            <div className={styles.guidance}>
              <strong>AI coaching guidance</strong>
              <p>{question.guidance}</p>
            </div>

            <label className={styles.answerField}>
              <span>Your practice answer</span>
              <textarea
                rows={11}
                value={answer}
                onChange={(event) => updateAnswer(event.target.value)}
                placeholder="Write your answer here. Use a real example and explain your actions and results."
              />
            </label>

            <div className={styles.feedbackCard}>
              <div>
                <span>Answer score</span>
                <strong>{currentScore}%</strong>
              </div>
              <p>{answerFeedback(currentScore)}</p>
            </div>

            <div className={styles.keywordRow}>
              <span>Recommended evidence:</span>
              {question.keywords.map((keyword) => (
                <b key={keyword}>{keyword}</b>
              ))}
            </div>

            <div className={styles.navigation}>
              <button
                type="button"
                onClick={() =>
                  setActiveQuestion((current) => Math.max(0, current - 1))
                }
                disabled={activeQuestion === 0}
              >
                Previous
              </button>

              <span>
                {activeQuestion + 1} of {plan.questions.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setActiveQuestion((current) =>
                    Math.min(plan.questions.length - 1, current + 1),
                  )
                }
                disabled={activeQuestion === plan.questions.length - 1}
              >
                Next question
              </button>
            </div>
          </article>
        </section>
      ) : null}

      <section className={styles.historyCard}>
        <div className={styles.historyHeading}>
          <div>
            <span className={styles.eyebrow}>Practice history</span>
            <h2>Track your interview improvement</h2>
          </div>

          <button
            type="button"
            onClick={completeSession}
            disabled={!answeredQuestions.length}
          >
            Complete this session
          </button>
        </div>

        {history.length ? (
          <div className={styles.historyList}>
            {history.map((session) => (
              <article key={session.id}>
                <div>
                  <strong>{session.role}</strong>
                  <span>
                    {session.mode} · {session.difficulty}
                  </span>
                </div>
                <div>
                  <span>Session score</span>
                  <strong>{session.averageScore}%</strong>
                </div>
                <small>
                  {session.completedAt
                    ? new Date(session.completedAt).toLocaleDateString()
                    : ""}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyHistory}>
            Complete your first practice session to begin tracking confidence
            and answer quality.
          </div>
        )}
      </section>
    </div>
  );
}
