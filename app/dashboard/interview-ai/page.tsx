"use client";

import "./interview-studio.css";

import { useMemo, useState } from "react";

type Level = "Graduate" | "Junior" | "Mid-Level" | "Senior" | "Executive";
type InterviewType =
  | "HR"
  | "Behavioural"
  | "Technical"
  | "Leadership"
  | "Situational";

type Question = {
  id: string;
  category: InterviewType;
  prompt: string;
  followUp: string;
  guidance: string;
};

type ScoreCard = {
  relevance: number;
  structure: number;
  evidence: number;
  confidence: number;
  clarity: number;
  overall: number;
};

type SessionRecord = {
  id: string;
  role: string;
  industry: string;
  score: number;
  date: string;
};

const INDUSTRIES = [
  "General",
  "Information Technology",
  "Finance",
  "Engineering",
  "Human Resources",
  "Logistics & Supply Chain",
  "Government",
  "Mining",
  "Healthcare",
  "Retail",
];

const LEVELS: Level[] = [
  "Graduate",
  "Junior",
  "Mid-Level",
  "Senior",
  "Executive",
];

const TYPES: InterviewType[] = [
  "HR",
  "Behavioural",
  "Technical",
  "Leadership",
  "Situational",
];

const QUESTION_BANK: Record<InterviewType, Question[]> = {
  HR: [
    {
      id: "hr-1",
      category: "HR",
      prompt: "Tell me about yourself and why you are interested in this role.",
      followUp: "Which part of your experience is most relevant to this position?",
      guidance:
        "Connect your background, strongest evidence and career direction to the vacancy.",
    },
    {
      id: "hr-2",
      category: "HR",
      prompt: "Why should we appoint you?",
      followUp: "What evidence can you provide to support that claim?",
      guidance:
        "Use two or three job-relevant strengths supported by examples rather than general qualities.",
    },
    {
      id: "hr-3",
      category: "HR",
      prompt: "What is one professional weakness you are actively improving?",
      followUp: "What measurable progress have you made?",
      guidance:
        "Choose a genuine but manageable weakness and explain the action you are taking.",
    },
  ],
  Behavioural: [
    {
      id: "beh-1",
      category: "Behavioural",
      prompt: "Describe a time you solved a difficult problem at work or during your studies.",
      followUp: "What alternatives did you consider before choosing your solution?",
      guidance:
        "Use the STAR method and make your personal contribution clear.",
    },
    {
      id: "beh-2",
      category: "Behavioural",
      prompt: "Tell me about a time you had to work under pressure.",
      followUp: "How did you protect quality while meeting the deadline?",
      guidance:
        "Explain priorities, actions, communication and the final outcome.",
    },
    {
      id: "beh-3",
      category: "Behavioural",
      prompt: "Describe a disagreement with a colleague or team member.",
      followUp: "What did you learn about your communication style?",
      guidance:
        "Show emotional maturity, listening, respectful action and a constructive result.",
    },
  ],
  Technical: [
    {
      id: "tech-1",
      category: "Technical",
      prompt: "Which tools, systems or methods are most important in your target role?",
      followUp: "How have you used one of them to improve an outcome?",
      guidance:
        "Name relevant tools and explain your actual level of practical experience.",
    },
    {
      id: "tech-2",
      category: "Technical",
      prompt: "Walk me through how you would approach a common challenge in this role.",
      followUp: "How would you measure whether your approach worked?",
      guidance:
        "Use a logical process: understand, assess, act, verify and improve.",
    },
    {
      id: "tech-3",
      category: "Technical",
      prompt: "How do you maintain accuracy, compliance or quality in your work?",
      followUp: "What controls or checks do you use?",
      guidance:
        "Discuss real procedures, standards, reviews, documentation or quality checks.",
    },
  ],
  Leadership: [
    {
      id: "lead-1",
      category: "Leadership",
      prompt: "Describe a time you influenced others without formal authority.",
      followUp: "How did you gain support from people with different priorities?",
      guidance:
        "Show communication, credibility, stakeholder awareness and measurable impact.",
    },
    {
      id: "lead-2",
      category: "Leadership",
      prompt: "How do you support an underperforming team member?",
      followUp: "When would you escalate the matter?",
      guidance:
        "Balance coaching, clarity, accountability, evidence and fairness.",
    },
    {
      id: "lead-3",
      category: "Leadership",
      prompt: "Tell me about a decision you made with incomplete information.",
      followUp: "How did you manage the risk?",
      guidance:
        "Show judgement, consultation, risk awareness and ownership of the outcome.",
    },
  ],
  Situational: [
    {
      id: "sit-1",
      category: "Situational",
      prompt: "What would you do if two urgent priorities had the same deadline?",
      followUp: "How would you communicate your decision to stakeholders?",
      guidance:
        "Explain how you assess impact, urgency, dependencies and available resources.",
    },
    {
      id: "sit-2",
      category: "Situational",
      prompt: "How would you respond if you discovered an important error shortly before submission?",
      followUp: "What would you do to prevent the same error in future?",
      guidance:
        "Prioritise transparency, correction, escalation where needed and prevention.",
    },
    {
      id: "sit-3",
      category: "Situational",
      prompt: "What would you do if a customer or stakeholder rejected your recommendation?",
      followUp: "How would you determine whether to revise or defend it?",
      guidance:
        "Show listening, evidence-based discussion, flexibility and professional judgement.",
    },
  ],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreAnswer(answer: string): ScoreCard {
  const text = answer.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();

  const starSignals = [
    "situation",
    "task",
    "action",
    "result",
    "challenge",
    "responsible",
    "implemented",
    "achieved",
  ].filter((signal) => lower.includes(signal)).length;

  const evidenceSignals =
    (text.match(/\d+/g)?.length ?? 0) +
    [
      "%",
      "increased",
      "reduced",
      "improved",
      "saved",
      "delivered",
      "completed",
      "managed",
    ].filter((signal) => lower.includes(signal)).length;

  const weakSignals = [
    "maybe",
    "i think",
    "sort of",
    "kind of",
    "not sure",
    "probably",
  ].filter((signal) => lower.includes(signal)).length;

  const relevance = clamp(35 + Math.min(words.length, 90) * 0.45 + starSignals * 4);
  const structure = clamp(30 + starSignals * 10 + (words.length >= 70 ? 15 : 0));
  const evidence = clamp(25 + evidenceSignals * 9);
  const confidence = clamp(68 - weakSignals * 12 + Math.min(evidenceSignals, 4) * 5);
  const clarity = clamp(
    82 -
      Math.max(0, words.length - 180) * 0.15 -
      (text.match(/[,;:]/g)?.length ?? 0) * 0.25,
  );
  const overall = clamp(
    relevance * 0.24 +
      structure * 0.22 +
      evidence * 0.22 +
      confidence * 0.16 +
      clarity * 0.16,
  );

  return { relevance, structure, evidence, confidence, clarity, overall };
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Interview ready";
  if (score >= 70) return "Strong foundation";
  if (score >= 55) return "Developing";
  return "More practice needed";
}

function improvementAdvice(score: ScoreCard): string[] {
  const advice: string[] = [];

  if (score.structure < 70) {
    advice.push("Use a clearer Situation, Task, Action and Result structure.");
  }
  if (score.evidence < 70) {
    advice.push("Add verified numbers, volumes, timeframes or measurable outcomes.");
  }
  if (score.relevance < 70) {
    advice.push("Connect the answer more directly to the role and vacancy requirements.");
  }
  if (score.confidence < 70) {
    advice.push("Remove uncertain phrases and use direct, evidence-based language.");
  }
  if (score.clarity < 70) {
    advice.push("Shorten the answer and keep one clear message in each sentence.");
  }

  return advice.length
    ? advice
    : ["Keep practising delivery, eye contact and a natural conversational pace."];
}

function weakPhraseSuggestions(answer: string): Array<{
  weak: string;
  stronger: string;
}> {
  const options = [
    { weak: "I think", stronger: "Based on my experience" },
    { weak: "Maybe", stronger: "My recommended approach is" },
    { weak: "I was responsible for", stronger: "I managed" },
    { weak: "I helped with", stronger: "I contributed to" },
    { weak: "We did", stronger: "My specific contribution was" },
  ];

  const lower = answer.toLowerCase();
  return options.filter((item) => lower.includes(item.weak.toLowerCase()));
}

export default function InterviewAIPage() {
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("General");
  const [level, setLevel] = useState<Level>("Graduate");
  const [interviewType, setInterviewType] =
    useState<InterviewType>("Behavioural");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const questions = QUESTION_BANK[interviewType];
  const question = questions[questionIndex % questions.length];

  const scores = useMemo(() => scoreAnswer(answer), [answer]);
  const advice = useMemo(() => improvementAdvice(scores), [scores]);
  const weakPhrases = useMemo(() => weakPhraseSuggestions(answer), [answer]);

  function evaluate(): void {
    if (!answer.trim()) return;
    setEvaluated(true);
  }

  function nextQuestion(): void {
    if (evaluated && answer.trim()) {
      const record: SessionRecord = {
        id: `${Date.now()}-${question.id}`,
        role: role.trim() || "Target role",
        industry,
        score: scores.overall,
        date: new Date().toLocaleDateString(),
      };
      setHistory((current) => [record, ...current].slice(0, 6));
    }

    setQuestionIndex((current) => (current + 1) % questions.length);
    setAnswer("");
    setEvaluated(false);
    setShowFollowUp(false);
  }

  function changeType(type: InterviewType): void {
    setInterviewType(type);
    setQuestionIndex(0);
    setAnswer("");
    setEvaluated(false);
    setShowFollowUp(false);
  }

  return (
    <main className="interview-studio">
      <header className="interview-hero">
        <div>
          <span className="interview-eyebrow">Makwande AI Interview Studio</span>
          <h1>Practise realistic interviews and strengthen every answer</h1>
          <p>
            Prepare for HR, behavioural, technical, situational and leadership
            interviews with structured guidance, live scoring and an evidence-led
            improvement plan.
          </p>
        </div>
        <div className="interview-hero-card">
          <span>Readiness status</span>
          <strong>{evaluated ? `${scores.overall}%` : "Not scored"}</strong>
          <small>{evaluated ? scoreLabel(scores.overall) : "Complete an answer"}</small>
        </div>
      </header>

      <section className="interview-setup">
        <label>
          <span>Target role</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Example: Supply Chain Coordinator"
          />
        </label>
        <label>
          <span>Industry</span>
          <select
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
          >
            {INDUSTRIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Experience level</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as Level)}
          >
            {LEVELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <nav className="interview-types" aria-label="Interview categories">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={interviewType === type ? "active" : ""}
            onClick={() => changeType(type)}
          >
            {type}
          </button>
        ))}
      </nav>

      <div className="interview-workspace">
        <section className="interview-practice-card">
          <div className="interview-question-meta">
            <div>
              <span>
                Question {questionIndex + 1} of {questions.length}
              </span>
              <strong>
                {level} · {interviewType}
              </strong>
            </div>
            <span>{industry}</span>
          </div>

          <h2>{question.prompt}</h2>
          <p className="interview-guidance">{question.guidance}</p>

          <div className="star-builder">
            <article>
              <strong>S</strong>
              <span>Situation</span>
              <small>Set the context briefly.</small>
            </article>
            <article>
              <strong>T</strong>
              <span>Task</span>
              <small>Explain your responsibility.</small>
            </article>
            <article>
              <strong>A</strong>
              <span>Action</span>
              <small>Describe what you personally did.</small>
            </article>
            <article>
              <strong>R</strong>
              <span>Result</span>
              <small>Show the outcome and evidence.</small>
            </article>
          </div>

          <label className="interview-answer-field">
            <span>Your answer</span>
            <textarea
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setEvaluated(false);
              }}
              placeholder="Write your interview answer here. Aim for a clear STAR response supported by real evidence."
            />
          </label>

          <div className="interview-answer-footer">
            <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            <div>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowFollowUp((current) => !current)}
              >
                {showFollowUp ? "Hide follow-up" : "Show follow-up"}
              </button>
              <button
                type="button"
                className="primary"
                disabled={!answer.trim()}
                onClick={evaluate}
              >
                Score my answer
              </button>
            </div>
          </div>

          {showFollowUp ? (
            <div className="follow-up-card">
              <span>Interviewer follow-up</span>
              <strong>{question.followUp}</strong>
            </div>
          ) : null}
        </section>

        <aside className="interview-feedback-card">
          {evaluated ? (
            <>
              <div className="interview-score-summary">
                <div>
                  <strong>{scores.overall}%</strong>
                  <span>{scoreLabel(scores.overall)}</span>
                </div>
                <p>
                  This score is a writing-based practice indicator. Real interview
                  delivery also depends on voice, pace, confidence and interaction.
                </p>
              </div>

              <div className="interview-score-list">
                {[
                  ["Relevance", scores.relevance],
                  ["STAR structure", scores.structure],
                  ["Evidence", scores.evidence],
                  ["Confidence", scores.confidence],
                  ["Clarity", scores.clarity],
                ].map(([label, score]) => (
                  <article key={String(label)}>
                    <div>
                      <span>{label}</span>
                      <strong>{score}</strong>
                    </div>
                    <div className="interview-score-track">
                      <i style={{ width: `${score}%` }} />
                    </div>
                  </article>
                ))}
              </div>

              <div className="interview-feedback-section">
                <h3>Priority improvement plan</h3>
                <ol>
                  {advice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>

              <div className="interview-feedback-section">
                <h3>Weak phrase check</h3>
                {weakPhrases.length ? (
                  <div className="weak-phrases">
                    {weakPhrases.map((item) => (
                      <article key={item.weak}>
                        <span>{item.weak}</span>
                        <strong>{item.stronger}</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No major weak phrases were detected.</p>
                )}
              </div>

              <button type="button" className="next-question" onClick={nextQuestion}>
                Save result and continue
              </button>
            </>
          ) : (
            <div className="interview-empty-feedback">
              <div>AI</div>
              <span>Interview coach</span>
              <h2>Your feedback will appear here</h2>
              <p>
                Complete your response and run the score to review relevance,
                structure, evidence, confidence and clarity.
              </p>
            </div>
          )}
        </aside>
      </div>

      <section className="interview-lower-grid">
        <article className="interview-readiness">
          <div>
            <span className="interview-eyebrow">Interview readiness dashboard</span>
            <h2>Build evidence, structure and confidence together</h2>
          </div>
          <div className="readiness-grid">
            {[
              ["Communication", evaluated ? scores.clarity : 0],
              ["Problem solving", evaluated ? scores.relevance : 0],
              ["STAR structure", evaluated ? scores.structure : 0],
              ["Evidence strength", evaluated ? scores.evidence : 0],
              ["Confidence", evaluated ? scores.confidence : 0],
              ["Recruiter readiness", evaluated ? scores.overall : 0],
            ].map(([label, score]) => (
              <article key={String(label)}>
                <strong>{score}%</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="interview-history">
          <div className="history-heading">
            <div>
              <span className="interview-eyebrow">Practice history</span>
              <h2>Recent scored answers</h2>
            </div>
            <strong>{history.length}/6</strong>
          </div>

          {history.length ? (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id}>
                  <div>
                    <strong>{item.role}</strong>
                    <span>
                      {item.industry} · {item.date}
                    </span>
                  </div>
                  <strong>{item.score}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>
              Completed answers will be saved here during this practice session.
            </p>
          )}
        </article>
      </section>

      <section className="interview-responsible-ai">
        <div>
          <span className="interview-eyebrow">Responsible preparation</span>
          <h2>Prepare honestly. Never memorise invented achievements.</h2>
        </div>
        <p>
          Use only examples you can explain and defend. Replace placeholder
          figures with verified facts before using an answer in a real interview.
        </p>
      </section>
    </main>
  );
}
