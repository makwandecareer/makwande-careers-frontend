"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAssessmentCentre,
  buildAssessmentCentreReport,
  scoreAssessmentResponse,
  type AssessmentCentreInput,
  type AssessmentLevel,
  type AssessmentResponse,
} from "@/lib/assessment-centre";

import styles from "./AssessmentCentreEngine.module.css";

interface AssessmentCentreEngineProps {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-assessment-centre-v1";

const LEVELS: AssessmentLevel[] = [
  "Graduate",
  "Professional",
  "Management",
  "Executive",
];

export function AssessmentCentreEngine({
  targetRole,
  jobDescription,
}: AssessmentCentreEngineProps) {
  const [input, setInput] = useState<AssessmentCentreInput>({
    targetRole,
    jobDescription,
    companyName: "",
    assessmentLevel: "Professional",
    exerciseCount: 8,
    includeCaseStudy: true,
    includeInboxExercise: true,
    includePresentation: true,
    includeRolePlay: true,
    includeGroupExercise: true,
    includeLeadershipSimulation: true,
    includeCommercialExercise: true,
    includeEthicalScenario: true,
  });
  const [activeExerciseId, setActiveExerciseId] = useState("");
  const [responseText, setResponseText] = useState("");
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          input?: Partial<AssessmentCentreInput>;
          responses?: AssessmentResponse[];
        };
        setInput((current) => ({ ...current, ...parsed.input }));
        if (Array.isArray(parsed.responses)) setResponses(parsed.responses);
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
      JSON.stringify({ input, responses }),
    );
  }, [hydrated, input, responses]);

  const assessment = useMemo(() => buildAssessmentCentre(input), [input]);

  useEffect(() => {
    if (
      assessment.exercises.length &&
      !assessment.exercises.some(
        (exercise) => exercise.id === activeExerciseId,
      )
    ) {
      setActiveExerciseId(assessment.exercises[0].id);
      setResponseText("");
      setShowFeedback(false);
    }
  }, [activeExerciseId, assessment.exercises]);

  const activeExercise = assessment.exercises.find(
    (exercise) => exercise.id === activeExerciseId,
  );

  const activeResponse = responses.find(
    (response) => response.exerciseId === activeExerciseId,
  );

  const report = useMemo(
    () => buildAssessmentCentreReport(responses),
    [responses],
  );

  function updateInput<K extends keyof AssessmentCentreInput>(
    field: K,
    value: AssessmentCentreInput[K],
  ): void {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function selectExercise(exerciseId: string): void {
    setActiveExerciseId(exerciseId);
    const previous = responses.find(
      (response) => response.exerciseId === exerciseId,
    );
    setResponseText(previous?.response || "");
    setShowFeedback(Boolean(previous));
  }

  function evaluateResponse(): void {
    if (!activeExercise || !responseText.trim()) return;

    const feedback = scoreAssessmentResponse(activeExercise, responseText);
    const result: AssessmentResponse = {
      exerciseId: activeExercise.id,
      response: responseText.trim(),
      feedback,
    };

    setResponses((current) => [
      ...current.filter(
        (response) => response.exerciseId !== activeExercise.id,
      ),
      result,
    ]);
    setShowFeedback(true);
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Phase 12.9 · AI assessment centre
          </span>
          <h1>Prepare candidates for full assessment-centre performance</h1>
          <p>
            Practise case studies, inbox exercises, presentations, role plays,
            group scenarios, leadership simulations and commercial decisions
            with competency-based scoring and assessor feedback.
          </p>
        </div>

        <div className={styles.heroScore}>
          <span>Challenge level</span>
          <strong>{assessment.challengeScore}%</strong>
          <small>{input.assessmentLevel}</small>
        </div>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.eyebrow}>Assessment configuration</span>
            <h2>Choose level and exercise coverage</h2>
          </div>
          <span>{assessment.exercises.length} exercises generated</span>
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
            <span>Assessment level</span>
            <select
              value={input.assessmentLevel}
              onChange={(event) =>
                updateInput(
                  "assessmentLevel",
                  event.target.value as AssessmentLevel,
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
            <span>Exercise count</span>
            <input
              type="number"
              min={4}
              max={20}
              value={input.exerciseCount}
              onChange={(event) =>
                updateInput("exerciseCount", Number(event.target.value))
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
            ["includeCaseStudy", "Case study"],
            ["includeInboxExercise", "Inbox exercise"],
            ["includePresentation", "Presentation"],
            ["includeRolePlay", "Role play"],
            ["includeGroupExercise", "Group exercise"],
            ["includeLeadershipSimulation", "Leadership simulation"],
            ["includeCommercialExercise", "Commercial exercise"],
            ["includeEthicalScenario", "Ethical scenario"],
          ].map(([field, label]) => (
            <label className={styles.toggle} key={field}>
              <input
                type="checkbox"
                checked={
                  input[
                    field as
                      | "includeCaseStudy"
                      | "includeInboxExercise"
                      | "includePresentation"
                      | "includeRolePlay"
                      | "includeGroupExercise"
                      | "includeLeadershipSimulation"
                      | "includeCommercialExercise"
                      | "includeEthicalScenario"
                  ]
                }
                onChange={(event) =>
                  updateInput(
                    field as
                      | "includeCaseStudy"
                      | "includeInboxExercise"
                      | "includePresentation"
                      | "includeRolePlay"
                      | "includeGroupExercise"
                      | "includeLeadershipSimulation"
                      | "includeCommercialExercise"
                      | "includeEthicalScenario",
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
        {assessment.assessmentProfile.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <aside className={styles.exercisePanel}>
          <span className={styles.eyebrow}>Assessment exercise bank</span>
          <h2>Simulation sequence</h2>

          <div className={styles.exerciseList}>
            {assessment.exercises.map((exercise, index) => {
              const completed = responses.some(
                (response) => response.exerciseId === exercise.id,
              );

              return (
                <button
                  type="button"
                  key={exercise.id}
                  className={
                    activeExerciseId === exercise.id
                      ? styles.activeExercise
                      : ""
                  }
                  onClick={() => selectExercise(exercise.id)}
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{exercise.type}</strong>
                    <small>
                      {exercise.timeLimitMinutes} min ·{" "}
                      {completed ? "Completed" : "Not completed"}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className={styles.exerciseCard}>
          {activeExercise ? (
            <>
              <div className={styles.exerciseHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    {activeExercise.type}
                  </span>
                  <h2>{activeExercise.title}</h2>
                </div>
                <span>{activeExercise.scoringWeight}% weight</span>
              </div>

              <div className={styles.scenarioBox}>
                <strong>Scenario</strong>
                <p>{activeExercise.scenario}</p>
              </div>

              <div className={styles.instructionsBox}>
                <strong>Instructions</strong>
                {activeExercise.instructions.map((instruction) => (
                  <p key={instruction}>→ {instruction}</p>
                ))}
              </div>

              <div className={styles.intentBox}>
                <strong>What assessors are testing</strong>
                <p>{activeExercise.assessorIntent}</p>
              </div>

              <label className={styles.responseField}>
                <span>Your assessment response</span>
                <textarea
                  rows={14}
                  value={responseText}
                  onChange={(event) => {
                    setResponseText(event.target.value);
                    setShowFeedback(false);
                  }}
                  placeholder="Structure your response around the issue, evidence, priorities, decision, stakeholders, risks, execution and measurable outcomes."
                />
              </label>

              <div className={styles.responseActions}>
                <span>
                  {responseText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={evaluateResponse}
                  disabled={!responseText.trim()}
                >
                  Evaluate assessment response
                </button>
              </div>

              {showFeedback && activeResponse ? (
                <section className={styles.feedback}>
                  <div className={styles.feedbackHeader}>
                    <div>
                      <span className={styles.eyebrow}>
                        Assessor analysis
                      </span>
                      <h3>{activeResponse.feedback.score.overall}% overall</h3>
                    </div>
                  </div>

                  <div className={styles.scoreGrid}>
                    {Object.entries(activeResponse.feedback.score)
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
                      <h4>Strong competencies</h4>
                      {activeResponse.feedback.strengths.length ? (
                        activeResponse.feedback.strengths.map((item) => (
                          <p key={item}>✓ {item}</p>
                        ))
                      ) : (
                        <p>No strong competency signal detected yet.</p>
                      )}
                    </section>

                    <section>
                      <h4>Development areas</h4>
                      {activeResponse.feedback.developmentAreas.map((item) => (
                        <p key={item}>→ {item}</p>
                      ))}
                    </section>

                    <section>
                      <h4>Assessor red flags</h4>
                      {activeResponse.feedback.redFlags.length ? (
                        activeResponse.feedback.redFlags.map((item) => (
                          <p key={item}>⚠ {item}</p>
                        ))
                      ) : (
                        <p>✓ No major assessor red flag detected.</p>
                      )}
                    </section>
                  </div>

                  {activeResponse.feedback.assessorFollowUp ? (
                    <div className={styles.followUp}>
                      <strong>Assessor follow-up</strong>
                      <p>{activeResponse.feedback.assessorFollowUp}</p>
                    </div>
                  ) : null}

                  <div className={styles.coachingNote}>
                    <strong>Assessment coaching</strong>
                    <p>{activeResponse.feedback.coachingNote}</p>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <p>Select an assessment-centre exercise.</p>
          )}
        </article>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.reportHeader}>
          <div>
            <span className={styles.eyebrow}>Assessment-centre report</span>
            <h2>Competency readiness and assessor summary</h2>
          </div>
          <strong>{report.overallScore}%</strong>
        </div>

        <div className={styles.summaryBox}>
          <strong>Assessor summary</strong>
          <p>{report.assessorSummary}</p>
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
            <h3>Development priorities</h3>
            {report.developmentPriorities.length ? (
              report.developmentPriorities.map((item) => (
                <p key={item}>→ {item}</p>
              ))
            ) : (
              <p>Complete exercises to generate priorities.</p>
            )}
          </article>

          <article>
            <h3>Risk areas</h3>
            {report.riskAreas.length ? (
              report.riskAreas.slice(0, 8).map((item) => (
                <p key={item}>⚠ {item}</p>
              ))
            ) : (
              <p>No major assessment risk has been detected.</p>
            )}
          </article>

          <article>
            <h3>Strongest competencies</h3>
            {report.strongestCompetencies.length ? (
              report.strongestCompetencies.map((item) => (
                <p key={item}>✓ {item}</p>
              ))
            ) : (
              <p>Complete exercises to identify strengths.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
