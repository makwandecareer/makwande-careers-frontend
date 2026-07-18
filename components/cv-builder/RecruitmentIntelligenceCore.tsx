"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createRecruitmentIntelligenceReport,
  personaLabel,
  type RecruiterPersona,
} from "@/lib/recruitment-intelligence";

import styles from "./RecruitmentIntelligenceCore.module.css";

interface RecruitmentIntelligenceCoreProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-recruitment-intelligence-v1";

export function RecruitmentIntelligenceCore({
  cvContent,
  targetRole,
  jobDescription,
  atsScore,
}: RecruitmentIntelligenceCoreProps) {
  const [role, setRole] = useState(targetRole);
  const [specification, setSpecification] = useState(jobDescription);
  const [activePersona, setActivePersona] =
    useState<RecruiterPersona>("hiring-manager");
  const [activeScenario, setActiveScenario] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: string;
          specification?: string;
          persona?: RecruiterPersona;
        };

        setRole(parsed.role || targetRole);
        setSpecification(parsed.specification || jobDescription);
        setActivePersona(parsed.persona || "hiring-manager");
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
      JSON.stringify({
        role,
        specification,
        persona: activePersona,
      }),
    );
  }, [activePersona, hydrated, role, specification]);

  const report = useMemo(
    () =>
      createRecruitmentIntelligenceReport(
        cvContent,
        role,
        specification,
        atsScore,
      ),
    [atsScore, cvContent, role, specification],
  );

  const recruiter =
    report.recruiterBriefs.find(
      (brief) => brief.persona === activePersona,
    ) ?? report.recruiterBriefs[0];

  const scenario =
    report.scenarios[activeScenario] ?? report.scenarios[0];

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.1 · Recruitment intelligence core
          </span>
          <h1>Understand the vacancy, recruiter and interview before you enter the room</h1>
          <p>
            This engine converts the candidate CV, job title, job
            specification, experience and skills into an advanced recruitment
            brief, competency map and scenario-based interview plan.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          <article>
            <span>Candidate match</span>
            <strong>{report.matchScore}%</strong>
          </article>
          <article>
            <span>Evidence strength</span>
            <strong>{report.evidenceStrength}%</strong>
          </article>
          <article>
            <span>Interview complexity</span>
            <strong>{report.interviewComplexity}%</strong>
          </article>
        </div>
      </header>

      <section className={styles.inputCard}>
        <label>
          <span>Target job title</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g. Senior Project Manager"
          />
        </label>

        <label className={styles.specificationField}>
          <span>Job specification</span>
          <textarea
            value={specification}
            onChange={(event) => setSpecification(event.target.value)}
            rows={8}
            placeholder="Paste the complete job specification, responsibilities, requirements and preferred competencies."
          />
        </label>

        <div className={styles.roleSummary}>
          <span>Detected seniority</span>
          <strong>{report.seniority}</strong>
          <small>
            {report.candidate.experienceYears} estimated years ·{" "}
            {report.candidate.skills.length} skills detected
          </small>
        </div>
      </section>

      <section className={styles.scoreGrid}>
        <article>
          <span>Requirements analysed</span>
          <strong>{report.requirements.length}</strong>
          <small>Vacancy signals extracted</small>
        </article>
        <article>
          <span>Critical matches</span>
          <strong>
            {
              report.requirements.filter(
                (item) => item.priority === "critical" && item.matched,
              ).length
            }
          </strong>
          <small>Critical requirements with evidence</small>
        </article>
        <article>
          <span>Competencies mapped</span>
          <strong>{report.competencies.length}</strong>
          <small>Behavioural and technical themes</small>
        </article>
        <article>
          <span>Advanced scenarios</span>
          <strong>{report.scenarios.length}</strong>
          <small>Role-specific pressure simulations</small>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Job specification intelligence</span>
            <h2>What the employer is likely to evaluate</h2>
          </div>
        </div>

        {report.requirements.length ? (
          <div className={styles.requirementList}>
            {report.requirements.map((requirement) => (
              <article
                className={
                  requirement.matched
                    ? styles.requirementMatched
                    : styles.requirementGap
                }
                key={requirement.id}
              >
                <div>
                  <span>{requirement.type}</span>
                  <b>{requirement.priority}</b>
                </div>
                <strong>{requirement.label}</strong>
                <small>
                  {requirement.matched
                    ? `Evidence: ${requirement.evidence.join(" · ")}`
                    : "No clear evidence detected. Prepare a credible example before the interview."}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            Paste a job specification to generate vacancy-specific requirements
            and evidence matching.
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Competency intelligence</span>
            <h2>Competencies that will shape the interview</h2>
          </div>
        </div>

        <div className={styles.competencyGrid}>
          {report.competencies.map((competency) => (
            <article key={competency.name}>
              <div>
                <strong>{competency.name}</strong>
                <span>{competency.score}%</span>
              </div>
              <div className={styles.progressTrack}>
                <span style={{ width: `${competency.score}%` }} />
              </div>
              <p>{competency.interviewFocus}</p>
              <small>
                {competency.evidence.length
                  ? `${competency.evidence.length} evidence signal(s) detected`
                  : "Prepare evidence for this competency"}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.recruiterLayout}>
        <aside className={styles.personaPanel}>
          <span className={styles.eyebrow}>Recruiter mind</span>
          <h2>Select the interviewer</h2>

          {report.recruiterBriefs.map((brief) => (
            <button
              type="button"
              className={
                activePersona === brief.persona ? styles.personaActive : ""
              }
              onClick={() => setActivePersona(brief.persona)}
              key={brief.persona}
            >
              <strong>{personaLabel(brief.persona)}</strong>
              <small>{brief.objective}</small>
            </button>
          ))}
        </aside>

        <article className={styles.recruiterBrief}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>
                {personaLabel(recruiter.persona)}
              </span>
              <h2>What this interviewer is trying to decide</h2>
            </div>
          </div>

          <p className={styles.objective}>{recruiter.objective}</p>

          <div className={styles.briefColumns}>
            <div>
              <h3>Likely concerns</h3>
              {recruiter.concerns.map((concern) => (
                <p key={concern}>⚠ {concern}</p>
              ))}
            </div>

            <div>
              <h3>Decision signals</h3>
              {recruiter.decisionSignals.map((signal) => (
                <p key={signal}>✓ {signal}</p>
              ))}
            </div>
          </div>

          <div className={styles.questionBank}>
            <h3>Likely questions</h3>
            {recruiter.likelyQuestions.map((question, index) => (
              <article key={question}>
                <span>{index + 1}</span>
                <p>{question}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Advanced scenario engine</span>
            <h2>Realistic situations based on the role</h2>
          </div>

          <div className={styles.scenarioTabs}>
            {report.scenarios.map((item, index) => (
              <button
                type="button"
                className={index === activeScenario ? styles.scenarioActive : ""}
                onClick={() => setActiveScenario(index)}
                key={item.id}
              >
                Scenario {index + 1}
              </button>
            ))}
          </div>
        </div>

        {scenario ? (
          <article className={styles.scenarioCard}>
            <div className={styles.scenarioHeader}>
              <div>
                <span>{scenario.difficulty}</span>
                <h3>{scenario.title}</h3>
              </div>
              <b>{report.role}</b>
            </div>

            <div className={styles.scenarioBody}>
              <div>
                <h4>Context</h4>
                <p>{scenario.context}</p>
              </div>
              <div>
                <h4>Your challenge</h4>
                <p>{scenario.challenge}</p>
              </div>
            </div>

            <div className={styles.signalGrid}>
              {scenario.expectedSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>

            <div className={styles.followUpList}>
              <h4>Pressure follow-up questions</h4>
              {scenario.followUps.map((question) => (
                <p key={question}>→ {question}</p>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className={styles.insightGrid}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Strongest selling points</span>
          <h2>Evidence to lead with</h2>
          {report.strongestSellingPoints.length ? (
            report.strongestSellingPoints.map((point) => (
              <p key={point}>✓ {point}</p>
            ))
          ) : (
            <p>No strong evidence has been detected yet.</p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.eyebrow}>Hiring risks</span>
          <h2>Concerns to neutralise</h2>
          {report.hiringRisks.length ? (
            report.hiringRisks.map((risk) => <p key={risk}>⚠ {risk}</p>)
          ) : (
            <p>✓ No major recruitment risks detected from the available data.</p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.eyebrow}>Preparation priorities</span>
          <h2>What to practise next</h2>
          {report.preparationPriorities.map((priority) => (
            <p key={priority}>→ {priority}</p>
          ))}
        </article>
      </section>
    </div>
  );
}
