"use client";

import "./job-matcher-studio.css";

import { useMemo, useState } from "react";

type MatchHistoryItem = {
  id: string;
  role: string;
  company: string;
  score: number;
  date: string;
};

type MatchResult = {
  overall: number;
  keywordScore: number;
  skillsScore: number;
  experienceScore: number;
  qualificationScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  risks: string[];
  recommendations: string[];
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "our",
  "are", "will", "have", "has", "job", "role", "work", "working", "into",
  "but", "not", "all", "any", "can", "who", "what", "when", "where", "how",
  "within", "such", "other", "about", "their", "they", "them", "using", "use",
  "must", "should", "required", "requirements", "responsibilities", "position",
  "candidate", "company", "team", "years", "year", "experience", "skills",
]);

const IMPORTANT_TERMS = [
  "project management",
  "stakeholder management",
  "customer service",
  "data analysis",
  "microsoft excel",
  "power bi",
  "sql",
  "python",
  "sap",
  "erp",
  "inventory management",
  "supply chain",
  "procurement",
  "logistics",
  "warehouse",
  "operations",
  "leadership",
  "communication",
  "reporting",
  "budgeting",
  "compliance",
  "quality assurance",
  "risk management",
  "administration",
  "sales",
  "marketing",
  "human resources",
  "recruitment",
  "financial analysis",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.%-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text: string): string[] {
  const normalized = normalize(text);
  const phrases = IMPORTANT_TERMS.filter((term) => normalized.includes(term));
  const words = normalized
    .split(" ")
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));

  const frequency = new Map<string, number>();
  for (const item of [...phrases, ...words]) {
    frequency.set(item, (frequency.get(item) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 30);
}

function percentage(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function analyseMatch(cvText: string, jobText: string): MatchResult {
  const cv = normalize(cvText);
  const job = normalize(jobText);
  const jobKeywords = extractKeywords(jobText);
  const cvKeywords = extractKeywords(cvText);

  const matchedKeywords = jobKeywords.filter(
    (keyword) => cv.includes(keyword) || cvKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !matchedKeywords.includes(keyword),
  );

  const keywordScore = percentage(matchedKeywords.length, jobKeywords.length);

  const technicalTerms = IMPORTANT_TERMS.filter((term) => job.includes(term));
  const matchedTechnical = technicalTerms.filter((term) => cv.includes(term));
  const skillsScore = technicalTerms.length
    ? percentage(matchedTechnical.length, technicalTerms.length)
    : keywordScore;

  const yearsRequiredMatches = [...job.matchAll(/(\d+)\+?\s+years?/g)].map(
    (match) => Number(match[1]),
  );
  const yearsCandidateMatches = [...cv.matchAll(/(\d+)\+?\s+years?/g)].map(
    (match) => Number(match[1]),
  );
  const yearsRequired = yearsRequiredMatches.length
    ? Math.max(...yearsRequiredMatches)
    : 0;
  const yearsCandidate = yearsCandidateMatches.length
    ? Math.max(...yearsCandidateMatches)
    : 0;

  const experienceScore = yearsRequired
    ? clamp((yearsCandidate / yearsRequired) * 100)
    : clamp(65 + keywordScore * 0.25);

  const qualifications = [
    "degree",
    "diploma",
    "bachelor",
    "honours",
    "master",
    "matric",
    "certificate",
    "certification",
    "ndip",
    "btech",
  ];
  const requiredQualifications = qualifications.filter((item) =>
    job.includes(item),
  );
  const matchedQualifications = requiredQualifications.filter((item) =>
    cv.includes(item),
  );
  const qualificationScore = requiredQualifications.length
    ? percentage(matchedQualifications.length, requiredQualifications.length)
    : 75;

  const overall = clamp(
    keywordScore * 0.36 +
      skillsScore * 0.29 +
      experienceScore * 0.2 +
      qualificationScore * 0.15,
  );

  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (matchedKeywords.length >= 8) {
    strengths.push("The CV already contains a strong group of vacancy-related keywords.");
  } else if (matchedKeywords.length) {
    strengths.push("The CV contains some relevant terminology that supports the application.");
  }

  if (skillsScore >= 70) {
    strengths.push("Technical and functional skill alignment is strong.");
  }

  if (experienceScore >= 80) {
    strengths.push("The available experience evidence appears aligned with the requirement.");
  }

  if (qualificationScore >= 80) {
    strengths.push("Qualification terminology appears aligned with the vacancy.");
  }

  if (missingKeywords.length >= 6) {
    risks.push("Several important vacancy terms are not visible in the CV.");
  }

  if (experienceScore < 60) {
    risks.push("The CV may not demonstrate the requested level of experience clearly enough.");
  }

  if (qualificationScore < 60) {
    risks.push("Qualification alignment may require careful verification before applying.");
  }

  if (!/\d/.test(cvText)) {
    risks.push("The CV contains limited measurable evidence such as volumes, percentages or targets.");
  }

  if (missingKeywords.length) {
    recommendations.push(
      `Review these genuine skills or experiences before adding them: ${missingKeywords
        .slice(0, 5)
        .join(", ")}.`,
    );
  }

  recommendations.push(
    "Rewrite the professional summary so it names the target role and the strongest matching capabilities.",
  );
  recommendations.push(
    "Move the most relevant achievements and responsibilities into the first half of the CV.",
  );

  if (!/\d/.test(cvText)) {
    recommendations.push(
      "Add verified KPIs, turnaround times, portfolio sizes, savings, targets or quality results.",
    );
  }

  return {
    overall,
    keywordScore,
    skillsScore,
    experienceScore,
    qualificationScore,
    matchedKeywords,
    missingKeywords,
    strengths:
      strengths.length > 0
        ? strengths
        : ["The profile may still be suitable, but stronger evidence is required."],
    risks:
      risks.length > 0
        ? risks
        : ["No major immediate risk was detected from the supplied text."],
    recommendations,
  };
}

function decision(score: number): {
  label: string;
  message: string;
} {
  if (score >= 85) {
    return {
      label: "Strong match",
      message: "The candidate appears well aligned and can proceed after a final accuracy review.",
    };
  }
  if (score >= 70) {
    return {
      label: "Good match",
      message: "The application is promising, but targeted CV improvements should be completed first.",
    };
  }
  if (score >= 55) {
    return {
      label: "Possible match",
      message: "There is some alignment, although important gaps should be addressed before applying.",
    };
  }
  return {
    label: "Low match",
    message: "The vacancy currently appears weakly aligned with the supplied CV evidence.",
  };
}

export default function JobMatcherPage() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [cvText, setCvText] = useState("");
  const [jobText, setJobText] = useState("");
  const [analysed, setAnalysed] = useState(false);
  const [copied, setCopied] = useState("");
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);

  const result = useMemo(
    () => analyseMatch(cvText, jobText),
    [cvText, jobText],
  );

  const readiness = decision(result.overall);

  function runAnalysis(): void {
    if (!cvText.trim() || !jobText.trim()) return;
    setAnalysed(true);
  }

  function saveMatch(): void {
    if (!analysed) return;

    const item: MatchHistoryItem = {
      id: String(Date.now()),
      role: role.trim() || "Target vacancy",
      company: company.trim() || "Company not specified",
      score: result.overall,
      date: new Date().toLocaleDateString(),
    };

    setHistory((current) => [item, ...current].slice(0, 6));
  }

  async function copyKeywords(type: "matched" | "missing"): Promise<void> {
    const values =
      type === "matched" ? result.matchedKeywords : result.missingKeywords;
    await navigator.clipboard.writeText(values.join(", "));
    setCopied(type);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <main className="job-match-studio">
      <header className="job-match-hero">
        <div>
          <span className="job-match-eyebrow">Makwande AI Job Match Engine</span>
          <h1>See how strongly a CV matches a vacancy before applying</h1>
          <p>
            Compare the candidate profile with the job advertisement, identify
            keyword and evidence gaps, and receive an application-readiness
            decision based on the information supplied.
          </p>
        </div>

        <div className="job-match-hero-score">
          <span>Overall match</span>
          <strong>{analysed ? `${result.overall}%` : "Not analysed"}</strong>
          <small>{analysed ? readiness.label : "Add both documents"}</small>
        </div>
      </header>

      <section className="job-match-details">
        <label>
          <span>Target role</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Example: Procurement Officer"
          />
        </label>
        <label>
          <span>Company</span>
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Optional company name"
          />
        </label>
      </section>

      <section className="job-match-input-grid">
        <article>
          <div className="job-match-input-heading">
            <div>
              <span className="job-match-eyebrow">Candidate evidence</span>
              <h2>CV or saved profile content</h2>
            </div>
            <strong>{cvText.trim().split(/\s+/).filter(Boolean).length} words</strong>
          </div>
          <textarea
            value={cvText}
            onChange={(event) => {
              setCvText(event.target.value);
              setAnalysed(false);
            }}
            placeholder="Paste the candidate's CV content here."
          />
        </article>

        <article>
          <div className="job-match-input-heading">
            <div>
              <span className="job-match-eyebrow">Vacancy evidence</span>
              <h2>Job advertisement</h2>
            </div>
            <strong>{jobText.trim().split(/\s+/).filter(Boolean).length} words</strong>
          </div>
          <textarea
            value={jobText}
            onChange={(event) => {
              setJobText(event.target.value);
              setAnalysed(false);
            }}
            placeholder="Paste the complete vacancy here, including requirements and duties."
          />
        </article>
      </section>

      <section className="job-match-action-bar">
        <div>
          <strong>Evidence-led analysis</strong>
          <span>
            Results depend on the completeness and accuracy of the supplied CV
            and vacancy.
          </span>
        </div>
        <button
          type="button"
          disabled={!cvText.trim() || !jobText.trim()}
          onClick={runAnalysis}
        >
          Analyse job match
        </button>
      </section>

      {analysed ? (
        <>
          <section className="job-match-overview">
            <article className="job-match-decision">
              <div
                className="job-match-ring"
                style={{
                  background: `conic-gradient(#08744d ${result.overall * 3.6}deg, #e3ece7 0deg)`,
                }}
              >
                <div>
                  <strong>{result.overall}%</strong>
                  <span>Match</span>
                </div>
              </div>
              <div>
                <span className="job-match-eyebrow">Application decision</span>
                <h2>{readiness.label}</h2>
                <p>{readiness.message}</p>
              </div>
            </article>

            <div className="job-match-metrics">
              {[
                ["Keyword coverage", result.keywordScore],
                ["Skills alignment", result.skillsScore],
                ["Experience evidence", result.experienceScore],
                ["Qualification match", result.qualificationScore],
              ].map(([label, score]) => (
                <article key={String(label)}>
                  <div>
                    <span>{label}</span>
                    <strong>{score}%</strong>
                  </div>
                  <div className="job-match-track">
                    <i style={{ width: `${score}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="job-match-keyword-grid">
            <article>
              <div className="job-match-section-heading">
                <div>
                  <span className="job-match-eyebrow">Present in the CV</span>
                  <h2>Matched keywords</h2>
                </div>
                <button type="button" onClick={() => void copyKeywords("matched")}>
                  {copied === "matched" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="job-match-tags matched">
                {result.matchedKeywords.length ? (
                  result.matchedKeywords.map((item) => (
                    <span key={item}>{item}</span>
                  ))
                ) : (
                  <p>No strong keyword matches were detected.</p>
                )}
              </div>
            </article>

            <article>
              <div className="job-match-section-heading">
                <div>
                  <span className="job-match-eyebrow">Not visible in the CV</span>
                  <h2>Missing keywords</h2>
                </div>
                <button type="button" onClick={() => void copyKeywords("missing")}>
                  {copied === "missing" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="job-match-tags missing">
                {result.missingKeywords.length ? (
                  result.missingKeywords.map((item) => (
                    <span key={item}>{item}</span>
                  ))
                ) : (
                  <p>No major vacancy keywords appear to be missing.</p>
                )}
              </div>
            </article>
          </section>

          <section className="job-match-insight-grid">
            <article>
              <span className="job-match-eyebrow">Candidate advantages</span>
              <h2>Strengths supporting the application</h2>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <span className="job-match-eyebrow">Recruiter concerns</span>
              <h2>Possible application risks</h2>
              <ul>
                {result.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="job-match-recommendations">
            <div className="job-match-section-heading">
              <div>
                <span className="job-match-eyebrow">Tailoring plan</span>
                <h2>Recommended CV improvements</h2>
              </div>
              <button type="button" onClick={saveMatch}>
                Save match
              </button>
            </div>

            <div className="job-match-recommendation-list">
              {result.recommendations.map((item, index) => (
                <article key={item}>
                  <strong>{index + 1}</strong>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="job-match-checklist">
            <div>
              <span className="job-match-eyebrow">Application checklist</span>
              <h2>Complete these steps before submitting</h2>
            </div>
            <div>
              {[
                "Confirm every added keyword reflects genuine knowledge or experience.",
                "Tailor the professional summary to the advertised role.",
                "Move the strongest matching achievements near the top of the CV.",
                "Check qualification, location and experience eligibility.",
                "Proofread the CV and application documents before submission.",
              ].map((item) => (
                <label key={item}>
                  <input type="checkbox" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="job-match-empty-state">
          <div>AI</div>
          <span className="job-match-eyebrow">Job match analysis</span>
          <h2>Your match dashboard will appear here</h2>
          <p>
            Add the candidate CV and complete vacancy, then run the analysis to
            review alignment, gaps and application readiness.
          </p>
        </section>
      )}

      <section className="job-match-history">
        <div className="job-match-section-heading">
          <div>
            <span className="job-match-eyebrow">Session history</span>
            <h2>Recently saved job matches</h2>
          </div>
          <strong>{history.length}/6</strong>
        </div>

        {history.length ? (
          <div className="job-match-history-list">
            {history.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.role}</strong>
                  <span>
                    {item.company} · {item.date}
                  </span>
                </div>
                <strong>{item.score}%</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="job-match-history-empty">
            Saved match results will remain available during this browser session.
          </p>
        )}
      </section>

      <section className="job-match-disclaimer">
        <div>
          <span className="job-match-eyebrow">Responsible matching</span>
          <h2>A match score supports judgement. It does not guarantee employment.</h2>
        </div>
        <p>
          Hiring decisions depend on employer requirements, competition,
          verification, interviews and other selection processes. Never add
          unsupported experience or qualifications to improve a score.
        </p>
      </section>
    </main>
  );
}
