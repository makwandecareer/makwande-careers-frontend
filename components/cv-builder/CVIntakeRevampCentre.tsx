"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import {
  analyseCV,
  formatFileSize,
  revampDescription,
  type CVAnalysisReport,
  type IntakeStage,
  type RevampLevel,
  type UploadedCVRecord,
} from "@/lib/cv-intake-revamp";
import styles from "./CVIntakeRevampCentre.module.css";
import checkStyles from "./CVIntakeRevampChecks.module.css";

interface Props {
  targetRole: string;
  jobDescription: string;
  currentAtsScore: number | null;
  onStartFromScratch: () => void;
  onContinueToBuilder: () => void;
  onOpenAts: () => void;
  onOpenTemplates: () => void;
  onPreviewImportedDraft: (draft: ImportedCVDraft) => void;
  onUseImportedDraft: (draft: ImportedCVDraft) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const REVAMP_LEVELS: RevampLevel[] = [
  "Basic ATS Optimisation",
  "Professional Rewrite",
  "Executive Rewrite",
  "Recruiter Optimised",
];

function extension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

interface IntakeAnalysisResponse {
  filename: string;
  size: number;
  content_type: string;
  text: string;
  word_count: number;
  page_count: number | null;
  stored: false;
  draft: ImportedCVDraft;
  generation_mode: "openai-structured" | "safe-fallback";
}

export interface ImportedCVDraft {
  candidate_level: "graduate" | "early-career" | "mid-career" | "senior" | "executive";
  suggested_template: "ats-standard" | "graduate" | "professional" | "executive";
  personal_details: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url: string;
    portfolio_url: string;
  };
  professional_title: string;
  professional_summary: string;
  skills: string[];
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  certifications: Array<Record<string, unknown>>;
  languages: string[];
  missing_details: string[];
  follow_up_questions: string[];
  facts_to_verify: string[];
  additional_details?: string;
  intake_answers?: string[];
}

export function CVIntakeRevampCentre({
  targetRole,
  jobDescription,
  currentAtsScore,
  onStartFromScratch,
  onContinueToBuilder,
  onOpenAts,
  onOpenTemplates,
  onPreviewImportedDraft,
  onUseImportedDraft,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<IntakeStage>("choice");
  const [uploaded, setUploaded] = useState<UploadedCVRecord | null>(null);
  const [report, setReport] = useState<CVAnalysisReport | null>(null);
  const [revampLevel, setRevampLevel] = useState<RevampLevel>("Professional Rewrite");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importedDraft, setImportedDraft] = useState<ImportedCVDraft | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);

  const topIssues = useMemo(() => report?.issues.slice(0, 6) ?? [], [report]);

  useEffect(() => {
    if (!importedDraft) return;
    onPreviewImportedDraft({
      ...importedDraft,
      additional_details: additionalDetails.trim(),
      intake_answers: questionAnswers.filter((answer) => answer.trim()),
    });
  }, [
    additionalDetails,
    importedDraft,
    onPreviewImportedDraft,
    questionAnswers,
  ]);

  async function processFile(file: File): Promise<void> {
    setError("");
    const ext = extension(file.name);

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Upload a PDF, DOCX or TXT CV. Save legacy DOC files as DOCX first.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("The CV is larger than 10 MB. Upload a smaller file.");
      return;
    }

    setStage("analysing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_role", targetRole);
      formData.append("job_description", jobDescription);

      const intake = await api<IntakeAnalysisResponse>(
        "/api/ai-cv/intake-analysis",
        { method: "POST", body: formData },
      );

      const record: UploadedCVRecord = {
        id: `cv-${Date.now()}`,
        name: intake.filename,
        size: intake.size,
        type: intake.content_type || ext,
        uploadedAt: new Date().toISOString(),
        textPreview: intake.text.slice(0, 900),
      };

      setUploaded(record);
      setImportedDraft(intake.draft);
      setQuestionAnswers(intake.draft.follow_up_questions.map(() => ""));
      setReport(
        analyseCV(
          intake.text,
          targetRole,
          jobDescription,
          currentAtsScore ?? 0,
          {
            fileType: intake.content_type,
            wordCount: intake.word_count,
            pageCount: intake.page_count,
          },
        ),
      );
      setStage("report");
    } catch (uploadError) {
      setStage("choice");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The CV could not be analysed. Please try again.",
      );
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function resetUpload(): void {
    setUploaded(null);
    setReport(null);
    setError("");
    setImportedDraft(null);
    setAdditionalDetails("");
    setQuestionAnswers([]);
    setStage("choice");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={styles.centre}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Phase 21 · AI CV Intake & Revamp Centre</span>
          <h1>Start from scratch or improve an existing CV</h1>
          <p>
            Candidates can build a new professional CV or upload their original
            CV for ATS analysis, professional rewriting and structured improvement.
          </p>
        </div>
        <div className={styles.flow}>
          <span>Choose</span>
          <b>→</b>
          <span>Analyse</span>
          <b>→</b>
          <span>Improve</span>
          <b>→</b>
          <span>ATS Ready</span>
        </div>
      </header>

      {stage === "choice" ? (
        <section className={styles.choiceGrid}>
          <article>
            <div className={styles.icon}>＋</div>
            <span className={styles.eyebrow}>New CV</span>
            <h2>Start a CV from scratch</h2>
            <p>
              Best for graduates, first-time job seekers or candidates who want
              to rebuild their career profile using the structured CV Builder.
            </p>
            <ul>
              <li>Step-by-step professional CV creation</li>
              <li>ATS-safe sections and structure</li>
              <li>Career profile, skills and experience guidance</li>
              <li>Templates, ATS tools and CV Studio integration</li>
            </ul>
            <button type="button" onClick={onStartFromScratch}>
              Create a new CV
            </button>
          </article>

          <article className={styles.featuredChoice}>
            <div className={styles.icon}>⇧</div>
            <span className={styles.eyebrow}>Existing CV</span>
            <h2>Upload a CV for improvement</h2>
            <p>
              Best for candidates who already have a CV and want it reviewed,
              rewritten and optimised to meet ATS and recruiter standards.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void processFile(file);
              }}
            />

            <div
              className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <strong>Drag and drop the original CV here</strong>
              <span>or click to choose a file</span>
              <small>PDF, DOCX or TXT · Maximum 10 MB</small>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}
          </article>
        </section>
      ) : null}

      {stage === "analysing" ? (
        <section className={styles.analysisState}>
          <div className={styles.spinner} />
          <span className={styles.eyebrow}>AI analysis in progress</span>
          <h2>Reviewing {uploaded?.name}</h2>
          <p>Checking ATS compatibility, keywords, structure, readability and achievements.</p>
          <div>
            {[
              "ATS compatibility",
              "Formatting and sections",
              "Skills and keywords",
              "Grammar and readability",
              "Experience and achievements",
              "Contact details",
            ].map((item) => (
              <span key={item}>✓ {item}</span>
            ))}
          </div>
        </section>
      ) : null}

      {stage === "report" && uploaded && report ? (
        <>
          <section className={styles.fileBanner}>
            <div>
              <span className={styles.eyebrow}>Original CV uploaded</span>
              <h2>{uploaded.name}</h2>
              <p>
                {formatFileSize(uploaded.size)} · Uploaded{" "}
                {new Date(uploaded.uploadedAt).toLocaleString()}
              </p>
            </div>
            <button type="button" onClick={resetUpload}>
              Replace CV
            </button>
          </section>

          {importedDraft ? (
            <section className={checkStyles.reviewPanel}>
              <div className={checkStyles.reviewHeader}>
                <div>
                  <span className={styles.eyebrow}>10-minute guided CV build</span>
                  <h2>Review, enrich and create your new CV</h2>
                  <p>
                    We extracted the old CV. Confirm the information and add the
                    evidence recruiters need before generating the new version.
                  </p>
                </div>
                <span className={checkStyles.levelBadge}>
                  {importedDraft.candidate_level.replace("-", " ")}
                </span>
              </div>

              <div className={checkStyles.reviewGrid}>
                <label>
                  <span>Career level</span>
                  <select
                    value={importedDraft.candidate_level}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        candidate_level: event.target.value as ImportedCVDraft["candidate_level"],
                      })
                    }
                  >
                    <option value="graduate">Fresh graduate</option>
                    <option value="early-career">Early career</option>
                    <option value="mid-career">Mid-career professional</option>
                    <option value="senior">Senior professional</option>
                    <option value="executive">Executive</option>
                  </select>
                </label>
                <label>
                  <span>Professional title or target role</span>
                  <input
                    value={importedDraft.professional_title}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        professional_title: event.target.value,
                      })
                    }
                    placeholder="e.g. Chemical Engineer"
                  />
                </label>
                <label>
                  <span>Full name</span>
                  <input
                    value={importedDraft.personal_details.full_name}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        personal_details: {
                          ...importedDraft.personal_details,
                          full_name: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  <span>Telephone</span>
                  <input
                    value={importedDraft.personal_details.phone}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        personal_details: {
                          ...importedDraft.personal_details,
                          phone: event.target.value,
                        },
                      })
                    }
                    placeholder="+27..."
                  />
                </label>
                <label className={checkStyles.fullField}>
                  <span>Professional summary</span>
                  <textarea
                    value={importedDraft.professional_summary}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        professional_summary: event.target.value,
                      })
                    }
                    placeholder="Review the imported summary or write a concise verified career overview."
                  />
                </label>
                <label className={checkStyles.fullField}>
                  <span>Skills — separate with commas</span>
                  <textarea
                    value={importedDraft.skills.join(", ")}
                    onChange={(event) =>
                      setImportedDraft({
                        ...importedDraft,
                        skills: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Process optimisation, AutoCAD, project management..."
                  />
                </label>
              </div>

              <div className={checkStyles.importSummary}>
                <span><strong>{importedDraft.experience.length}</strong> experience entries</span>
                <span><strong>{importedDraft.education.length}</strong> education entries</span>
                <span><strong>{importedDraft.projects.length}</strong> projects</span>
                <span><strong>{importedDraft.certifications.length}</strong> certifications</span>
              </div>

              {importedDraft.missing_details.length ? (
                <div className={checkStyles.verifyBox}>
                  <strong>AI recommendations - information to add</strong>
                  <p>
                    These items were not found in the uploaded CV. Add only
                    accurate information; the AI will improve wording and
                    placement but will never invent client facts.
                  </p>
                  <ul>
                    {importedDraft.missing_details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={checkStyles.guidedQuestions}>
                <div>
                  <span className={styles.eyebrow}>Personalised evidence prompts</span>
                  <h3>Add the details that make this CV competitive</h3>
                </div>
                {importedDraft.follow_up_questions.map((question, index) => (
                  <label key={question}>
                    <span>{question}</span>
                    <textarea
                      value={questionAnswers[index] ?? ""}
                      onChange={(event) =>
                        setQuestionAnswers((current) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      placeholder="Add only accurate, verifiable information."
                    />
                  </label>
                ))}
                <label>
                  <span>Anything else the new CV should include?</span>
                  <textarea
                    value={additionalDetails}
                    onChange={(event) => setAdditionalDetails(event.target.value)}
                    placeholder="Projects, volunteer work, awards, leadership, systems, budgets, team size or measurable results..."
                  />
                </label>
              </div>

              {importedDraft.facts_to_verify.length ? (
                <div className={checkStyles.verifyBox}>
                  <strong>Confirm before generating:</strong>
                  <ul>
                    {importedDraft.facts_to_verify.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                className={checkStyles.buildButton}
                onClick={() =>
                  onUseImportedDraft({
                    ...importedDraft,
                    additional_details: additionalDetails.trim(),
                    intake_answers: questionAnswers.filter((answer) => answer.trim()),
                  })
                }
              >
                Create my new CV from this information
              </button>
            </section>
          ) : null}

          <section className={styles.scorePanel}>
            <article>
              <span>Current ATS score</span>
              <strong>{report.currentScore}%</strong>
              <div className={styles.track}>
                <span style={{ width: `${report.currentScore}%` }} />
              </div>
            </article>
            <article className={styles.potential}>
              <span>Potential ATS score</span>
              <strong>{report.potentialScore}%</strong>
              <div className={styles.track}>
                <span style={{ width: `${report.potentialScore}%` }} />
              </div>
            </article>
            <article>
              <span>Keyword strength</span>
              <strong>{report.keywordStrength}%</strong>
              <div className={styles.track}>
                <span style={{ width: `${report.keywordStrength}%` }} />
              </div>
            </article>
            <article>
              <span>Achievement strength</span>
              <strong>{report.achievementStrength}%</strong>
              <div className={styles.track}>
                <span style={{ width: `${report.achievementStrength}%` }} />
              </div>
            </article>
          </section>

          <section className={checkStyles.checkPanel}>
            <div className={checkStyles.checkHeading}>
              <div>
                <span className={styles.eyebrow}>Transparent ATS diagnostic</span>
                <h2>
                  {report.checksPassed} of {report.totalChecks} checks passed
                </h2>
                <p>
                  Every result is tied to a visible check—no unexplained AI score.
                </p>
              </div>
              <strong>
                {Math.round((report.checksPassed / report.totalChecks) * 100)}%
              </strong>
            </div>
            <div className={checkStyles.checkGrid}>
              {report.checks.map((check) => (
                <article
                  key={check.id}
                  className={
                    check.status === "pass"
                      ? checkStyles.checkPass
                      : checkStyles.checkImprove
                  }
                >
                  <span>{check.status === "pass" ? "✓" : "!"}</span>
                  <div>
                    <small>{check.category}</small>
                    <h3>{check.label}</h3>
                    <p>{check.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.reportGrid}>
            <section className={styles.panel}>
              <div className={styles.heading}>
                <div>
                  <span className={styles.eyebrow}>Improvement report</span>
                  <h2>What must be improved</h2>
                </div>
              </div>
              <div className={styles.issueList}>
                {topIssues.length ? (
                  topIssues.map((item) => (
                    <article key={item.id}>
                      <div>
                        <span className={styles[item.severity.toLowerCase()]}>
                          {item.severity}
                        </span>
                        <small>{item.category}</small>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <strong>{item.recommendation}</strong>
                    </article>
                  ))
                ) : (
                  <p>No major issues were detected.</p>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.heading}>
                <div>
                  <span className={styles.eyebrow}>ATS intelligence</span>
                  <h2>Missing keywords</h2>
                </div>
              </div>
              <div className={styles.keywordCloud}>
                {report.missingKeywords.length ? (
                  report.missingKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))
                ) : (
                  <p>Keyword alignment is already competitive.</p>
                )}
              </div>

              <div className={styles.strengths}>
                <span className={styles.eyebrow}>Existing strengths</span>
                {report.strengths.map((strength) => (
                  <p key={strength}>✓ {strength}</p>
                ))}
              </div>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.heading}>
              <div>
                <span className={styles.eyebrow}>Revamp service</span>
                <h2>Choose the level of improvement</h2>
              </div>
            </div>
            <div className={styles.revampGrid}>
              {REVAMP_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level}
                  className={revampLevel === level ? styles.selectedRevamp : ""}
                  onClick={() => setRevampLevel(level)}
                >
                  <strong>{level}</strong>
                  <span>{revampDescription(level)}</span>
                </button>
              ))}
            </div>

            <div className={styles.nextActions}>
              <div>
                <span className={styles.eyebrow}>Selected service</span>
                <h3>{revampLevel}</h3>
                <p>{revampDescription(revampLevel)}</p>
              </div>
              <div>
                <button type="button" onClick={onOpenAts}>
                  Open ATS Optimiser
                </button>
                <button type="button" onClick={onOpenTemplates}>
                  Choose A4 template
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={onContinueToBuilder}
                >
                  Continue to CV Builder
                </button>
              </div>
            </div>
          </section>

          <section className={styles.comparison}>
            <article>
              <span className={styles.eyebrow}>Before</span>
              <h3>Original CV</h3>
              <p>
                Candidate wording, current structure and original formatting are
                preserved as the source version.
              </p>
            </article>
            <div>→</div>
            <article>
              <span className={styles.eyebrow}>After</span>
              <h3>ATS-optimised CV</h3>
              <p>
                Professional structure, stronger achievements, targeted keywords
                and recruiter-friendly presentation.
              </p>
            </article>
          </section>
        </>
      ) : null}

      <footer className={styles.notice}>
        <strong>Privacy:</strong> uploaded CVs are processed securely in memory and are
        not stored during analysis. The client reviews imported facts before creating
        a new CV draft.
      </footer>
    </div>
  );
}
