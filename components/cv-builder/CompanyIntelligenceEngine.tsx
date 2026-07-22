"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createCompanyIntelligenceReport,
  type CompanyResearchInput,
} from "@/lib/company-intelligence";

import styles from "./CompanyIntelligenceEngine.module.css";

interface CompanyIntelligenceEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-company-intelligence-v1";

const INITIAL_INPUT: CompanyResearchInput = {
  companyName: "",
  website: "",
  industry: "",
  location: "",
  mission: "",
  values: "",
  productsServices: "",
  companyNotes: "",
  recentDevelopments: "",
};

export function CompanyIntelligenceEngine({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: CompanyIntelligenceEngineProps) {
  const [role, setRole] = useState(targetRole);
  const [specification, setSpecification] = useState(jobDescription);
  const [input, setInput] = useState<CompanyResearchInput>(INITIAL_INPUT);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: string;
          specification?: string;
          input?: Partial<CompanyResearchInput>;
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

  const report = useMemo(
    () =>
      createCompanyIntelligenceReport(
        input,
        role,
        specification,
        cvContent,
        atsScore,
      ),
    [atsScore, cvContent, input, role, specification],
  );

  const selectedQuestion =
    report.interviewQuestions[activeQuestion] ??
    report.interviewQuestions[0];

  function updateField(
    field: keyof CompanyResearchInput,
    value: string,
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.2 · Company intelligence & research
          </span>
          <h1>Prepare for the company, not only the interview questions</h1>
          <p>
            Build a company-specific recruitment brief using the vacancy,
            candidate evidence and verified research. The engine explains why
            the role exists, what success may look like and how to speak to the
            organisation&amp;apos;s priorities.
          </p>
        </div>

        <div className={styles.readinessRing}>
          <span>Company readiness</span>
          <strong>{report.readiness.overall}%</strong>
          <small>{report.companyName}</small>
        </div>
      </header>

      <section className={styles.researchGrid}>
        <article className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Research inputs</span>
              <h2>Company and vacancy information</h2>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Company name</span>
              <input
                value={input.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
                placeholder="e.g. Anglo American"
              />
            </label>

            <label>
              <span>Official website</span>
              <input
                value={input.website}
                onChange={(event) =>
                  updateField("website", event.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label>
              <span>Industry</span>
              <input
                value={input.industry}
                onChange={(event) =>
                  updateField("industry", event.target.value)
                }
                placeholder="Mining, banking, technology..."
              />
            </label>

            <label>
              <span>Location or region</span>
              <input
                value={input.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="South Africa, Gauteng..."
              />
            </label>

            <label>
              <span>Target job title</span>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Operations Manager"
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
                placeholder="Paste responsibilities, requirements and competencies."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Mission and strategic direction</span>
              <textarea
                value={input.mission}
                onChange={(event) =>
                  updateField("mission", event.target.value)
                }
                rows={3}
                placeholder="Add information from official company sources."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Values and culture</span>
              <textarea
                value={input.values}
                onChange={(event) =>
                  updateField("values", event.target.value)
                }
                rows={3}
                placeholder="Enter verified values, behaviours and cultural themes."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Products and services</span>
              <textarea
                value={input.productsServices}
                onChange={(event) =>
                  updateField("productsServices", event.target.value)
                }
                rows={3}
                placeholder="What does the organisation sell, deliver or operate?"
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Company notes and business model</span>
              <textarea
                value={input.companyNotes}
                onChange={(event) =>
                  updateField("companyNotes", event.target.value)
                }
                rows={4}
                placeholder="Customers, competitors, leadership, markets, business challenges..."
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Recent developments</span>
              <textarea
                value={input.recentDevelopments}
                onChange={(event) =>
                  updateField("recentDevelopments", event.target.value)
                }
                rows={4}
                placeholder="Add date-stamped news, projects, changes or strategic announcements."
              />
            </label>
          </div>
        </article>

        <aside className={styles.scorePanel}>
          <span className={styles.eyebrow}>Readiness profile</span>
          <h2>Candidate-to-company alignment</h2>

          {Object.entries(report.readiness)
            .filter(([key]) => key !== "overall")
            .map(([key, value]) => (
              <div className={styles.scoreItem} key={key}>
                <div>
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{value}%</strong>
                </div>
                <div className={styles.track}>
                  <span style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}

          <div className={styles.overallScore}>
            <span>Overall readiness</span>
            <strong>{report.readiness.overall}%</strong>
          </div>
        </aside>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Company profile</span>
            <h2>Research-backed interview signals</h2>
          </div>
          {input.website ? (
            <a href={input.website} target="_blank" rel="noreferrer">
              Open official website
            </a>
          ) : null}
        </div>

        <div className={styles.signalGrid}>
          {report.profileSignals.map((signal) => (
            <article key={signal.label}>
              <div>
                <strong>{signal.label}</strong>
                <span>{signal.confidence}</span>
              </div>
              <p>{signal.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.purposeLayout}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Why this role exists</span>
          <h2>{report.rolePurpose.headline}</h2>

          <div className={styles.purposeBlock}>
            <h3>Business problems to solve</h3>
            {report.rolePurpose.businessProblems.map((item) => (
              <p key={item}>→ {item}</p>
            ))}
          </div>

          <div className={styles.timelineGrid}>
            <div>
              <h3>First 90 days</h3>
              {report.rolePurpose.first90Days.map((item) => (
                <p key={item}>✓ {item}</p>
              ))}
            </div>
            <div>
              <h3>First 12 months</h3>
              {report.rolePurpose.first12Months.map((item) => (
                <p key={item}>✓ {item}</p>
              ))}
            </div>
          </div>
        </article>

        <aside className={styles.card}>
          <span className={styles.eyebrow}>Likely success measures</span>
          <h2>KPIs the hiring manager may care about</h2>
          <div className={styles.kpiGrid}>
            {report.rolePurpose.likelyKpis.map((kpi) => (
              <span key={kpi}>{kpi}</span>
            ))}
          </div>

          <span className={styles.eyebrow}>Likely process</span>
          <h2>Interview formats to prepare for</h2>
          <div className={styles.formatList}>
            {report.interviewFormats.map((format, index) => (
              <div key={format}>
                <span>{index + 1}</span>
                <strong>{format}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Company competency map</span>
            <h2>Behaviours the organisation may evaluate</h2>
          </div>
        </div>

        <div className={styles.competencyGrid}>
          {report.competencies.map((competency) => (
            <article key={competency.name}>
              <div className={styles.competencyHeader}>
                <strong>{competency.name}</strong>
                <span>{competency.score}%</span>
              </div>
              <div className={styles.track}>
                <span style={{ width: `${competency.score}%` }} />
              </div>
              <p>{competency.rationale}</p>
              <small>
                {competency.candidateEvidence.length
                  ? `Candidate evidence: ${competency.candidateEvidence.join(" · ")}`
                  : "No strong candidate evidence detected yet."}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.questionLayout}>
        <aside className={styles.questionTabs}>
          <span className={styles.eyebrow}>Company-specific interview</span>
          <h2>Choose a question</h2>

          {report.interviewQuestions.map((question, index) => (
            <button
              type="button"
              className={
                activeQuestion === index ? styles.questionActive : ""
              }
              onClick={() => setActiveQuestion(index)}
              key={`${question.category}-${question.question}`}
            >
              <strong>{question.category}</strong>
              <small>{question.question}</small>
            </button>
          ))}
        </aside>

        {selectedQuestion ? (
          <article className={styles.questionCoach}>
            <span className={styles.eyebrow}>
              {selectedQuestion.category}
            </span>
            <h2>{selectedQuestion.question}</h2>

            <div className={styles.intentBox}>
              <strong>Why the interviewer asks this</strong>
              <p>{selectedQuestion.intent}</p>
            </div>

            <h3>Advanced answer structure</h3>
            <div className={styles.framework}>
              {selectedQuestion.answerFramework.map((item, index) => (
                <article key={`${item}-${index}`}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className={styles.threeColumns}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Research assistant</span>
          <h2>Questions to investigate</h2>
          {report.researchQuestions.map((item) => (
            <p key={item}>⌕ {item}</p>
          ))}
        </article>

        <article className={styles.card}>
          <span className={styles.eyebrow}>Candidate advantage</span>
          <h2>Evidence to connect to the company</h2>
          {report.candidateAdvantages.length ? (
            report.candidateAdvantages.map((item) => (
              <p key={item}>✓ {item}</p>
            ))
          ) : (
            <p>Add measurable candidate achievements and skills.</p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.eyebrow}>Preparation risks</span>
          <h2>Research gaps to close</h2>
          {report.preparationRisks.length ? (
            report.preparationRisks.map((item) => (
              <p key={item}>⚠ {item}</p>
            ))
          ) : (
            <p>✓ No major company-research gaps detected.</p>
          )}
        </article>
      </section>

      <section className={styles.card}>
        <span className={styles.eyebrow}>Questions for the employer</span>
        <h2>Strategic questions that demonstrate serious preparation</h2>
        <div className={styles.employerQuestions}>
          {report.strategicQuestionsToAsk.map((item, index) => (
            <article key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
