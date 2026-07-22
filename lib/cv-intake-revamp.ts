export type RevampLevel =
  | "Basic ATS Optimisation"
  | "Professional Rewrite"
  | "Executive Rewrite"
  | "Recruiter Optimised";

export type IntakeStage =
  | "choice"
  | "uploaded"
  | "analysing"
  | "report"
  | "ready";

export interface UploadedCVRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  textPreview: string;
}

export interface CVIssue {
  id: string;
  category: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  description: string;
  recommendation: string;
}

export interface CVCheck {
  id: string;
  category: string;
  label: string;
  status: "pass" | "improve";
  detail: string;
}

export interface CVDocumentMeta {
  fileType?: string;
  wordCount?: number;
  pageCount?: number | null;
}

export interface CVAnalysisReport {
  currentScore: number;
  potentialScore: number;
  completeness: number;
  readability: number;
  keywordStrength: number;
  achievementStrength: number;
  formattingScore: number;
  checks: CVCheck[];
  checksPassed: number;
  totalChecks: number;
  issues: CVIssue[];
  strengths: string[];
  missingKeywords: string[];
  generatedAt: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "our",
  "are", "was", "were", "have", "has", "had", "will", "can", "job", "role",
  "work", "working", "responsible", "responsibilities", "required", "skills",
  "experience", "years", "strong", "excellent", "including", "within", "their",
  "they", "who", "into", "about", "using", "such", "other", "professional",
]);

const ACTION_VERBS = [
  "achieved", "administered", "analysed", "built", "coordinated", "created",
  "delivered", "developed", "directed", "drove", "executed", "generated",
  "implemented", "improved", "increased", "led", "managed", "negotiated",
  "optimised", "reduced", "resolved", "streamlined", "supervised", "trained",
];

const STANDARD_SECTIONS = [
  "summary", "profile", "experience", "employment", "education", "skills",
  "certifications", "projects", "achievements", "contact",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function words(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function issue(
  category: string,
  severity: CVIssue["severity"],
  title: string,
  description: string,
  recommendation: string,
): CVIssue {
  return {
    id: `${category}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category,
    severity,
    title,
    description,
    recommendation,
  };
}

export function analyseCV(
  cvText: string,
  targetRole: string,
  jobDescription: string,
  fallbackScore = 0,
  documentMeta: CVDocumentMeta = {},
): CVAnalysisReport {
  const text = normalize(cvText);
  const sourceWords = words(cvText);
  const jobWords = Array.from(new Set(words(`${targetRole} ${jobDescription}`))).slice(0, 60);
  const matchedKeywords = jobWords.filter((word) => text.includes(word));
  const missingKeywords = jobWords.filter((word) => !text.includes(word)).slice(0, 12);
  const detectedSections = STANDARD_SECTIONS.filter((section) => text.includes(section));
  const actionVerbCount = ACTION_VERBS.filter((verb) => text.includes(verb)).length;
  const numberCount = (cvText.match(/\b\d+(?:\.\d+)?%?\b/g) || []).length;
  const bulletCount = (cvText.match(/[•●▪◦\-]\s/g) || []).length;
  const dateCount = (cvText.match(/\b(?:19|20)\d{2}\b/g) || []).length;
  const firstPersonCount = (cvText.match(/\b(?:I|me|my|mine)\b/gi) || []).length;
  const urlPresent = /(?:linkedin\.com\/in\/|https?:\/\/|www\.)/i.test(cvText);
  const lineCount = cvText.split("\n").filter((line) => line.trim()).length;
  const longLineCount = cvText
    .split("\n")
    .filter((line) => line.trim().length > 220).length;
  const summaryMatch = cvText.match(
    /(?:professional\s+summary|career\s+profile|professional\s+profile)([\s\S]{0,900})/i,
  );
  const summaryWordCount = summaryMatch ? words(summaryMatch[1]).slice(0, 120).length : 0;
  const emailPresent = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(cvText);
  const phonePresent = /(?:\+?\d[\d\s()-]{7,}\d)/.test(cvText);
  const lengthScore =
    sourceWords.length >= 300 && sourceWords.length <= 1100
      ? 90
      : sourceWords.length >= 180
        ? 70
        : 42;
  const completeness = clamp(
    detectedSections.length * 9 +
      (emailPresent ? 10 : 0) +
      (phonePresent ? 10 : 0) +
      Math.min(18, numberCount * 2),
  );
  const keywordStrength = jobWords.length
    ? clamp((matchedKeywords.length / jobWords.length) * 100)
    : 58;
  const achievementStrength = clamp(25 + actionVerbCount * 5 + Math.min(30, numberCount * 3));
  const readability = clamp(
    lengthScore * 0.55 +
      Math.min(25, bulletCount * 2) +
      (cvText.split("\n").filter(Boolean).length > 8 ? 20 : 8),
  );
  const formattingScore = clamp(
    40 +
      Math.min(25, detectedSections.length * 4) +
      Math.min(20, bulletCount * 2) +
      (emailPresent && phonePresent ? 15 : 5),
  );

  const calculated = clamp(
    completeness * 0.25 +
      keywordStrength * 0.27 +
      achievementStrength * 0.2 +
      readability * 0.14 +
      formattingScore * 0.14,
  );
  const currentScore = fallbackScore > 0 ? clamp((calculated + fallbackScore) / 2) : calculated;
  const potentialScore = clamp(Math.max(currentScore + 18, 88));

  const checks: CVCheck[] = [];
  const addCheck = (
    category: string,
    label: string,
    passed: boolean,
    passDetail: string,
    improveDetail: string,
  ) => {
    checks.push({
      id: `${category}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      label,
      status: passed ? "pass" : "improve",
      detail: passed ? passDetail : improveDetail,
    });
  };

  addCheck("Contact", "Email address", emailPresent, "Professional email detected.", "Add a professional email address.");
  addCheck("Contact", "Telephone number", phonePresent, "Telephone number detected.", "Add a reachable telephone number.");
  addCheck("Contact", "Professional web presence", urlPresent, "LinkedIn or portfolio link detected.", "Add a LinkedIn or portfolio URL.");
  addCheck("Structure", "Professional summary", text.includes("summary") || text.includes("profile"), "Summary section detected.", "Add a targeted professional summary.");
  addCheck("Structure", "Experience section", text.includes("experience") || text.includes("employment"), "Experience section detected.", "Use a standard Experience heading.");
  addCheck("Structure", "Education section", text.includes("education") || text.includes("qualification"), "Education section detected.", "Add an Education section.");
  addCheck("Structure", "Skills section", text.includes("skills") || text.includes("competencies"), "Skills section detected.", "Add a clearly labelled Skills section.");
  addCheck("Structure", "Supporting sections", detectedSections.length >= 5, "Strong section coverage detected.", "Add relevant projects, certifications or achievements.");
  addCheck("Structure", "Recognised headings", detectedSections.length >= 4, "ATS-recognised headings detected.", "Use standard ATS section headings.");
  addCheck("Structure", "Reverse chronology evidence", dateCount >= 2, "Multiple career dates detected.", "Include dates for education and employment entries.");
  addCheck("Job alignment", "Target-role language", keywordStrength >= 55, "Role language is represented.", "Add more language from the target role.");
  addCheck("Job alignment", "Competitive keyword match", keywordStrength >= 70, "Competitive keyword match achieved.", "Aim for at least 70% natural keyword alignment.");
  addCheck("Job alignment", "Technical terminology", matchedKeywords.length >= 4, "Relevant role terms detected.", "Add role-specific tools, methods and technical skills.");
  addCheck("Job alignment", "Missing-keyword control", missingKeywords.length <= 6, "Few priority terms are missing.", "Address the priority missing keywords.");
  addCheck("Job alignment", "Target title", !targetRole || text.includes(normalize(targetRole)), "Target title is reflected.", "Include the target title where truthful.");
  addCheck("Impact", "Action verbs", actionVerbCount >= 4, "Strong action language detected.", "Start more bullets with strong action verbs.");
  addCheck("Impact", "Measurable results", numberCount >= 4, "Multiple measurable results detected.", "Add quantities, percentages, time or financial impact.");
  addCheck("Impact", "Achievement density", achievementStrength >= 65, "Evidence-led experience is strong.", "Rewrite responsibilities as measurable achievements.");
  addCheck("Impact", "Scannable bullets", bulletCount >= 4, "Bullet structure detected.", "Use concise achievement-focused bullet points.");
  addCheck("Impact", "Outcome-oriented writing", actionVerbCount >= 3 && numberCount >= 2, "Actions are supported by outcomes.", "Connect actions to outcomes and business impact.");
  addCheck("Readability", "Recommended length", sourceWords.length >= 300 && sourceWords.length <= 1100, "Word count is within a practical range.", "Keep the CV focused at roughly 300–1,100 words.");
  addCheck("Readability", "Useful content volume", sourceWords.length >= 180, "Enough content is available for assessment.", "Add more evidence about skills and experience.");
  addCheck("Readability", "Line structure", lineCount >= 8, "Content is separated into readable lines.", "Break dense content into sections and bullets.");
  addCheck("Readability", "Dense paragraph control", longLineCount <= 2, "No excessive dense blocks detected.", "Shorten long paragraphs for recruiter scanning.");
  addCheck("Readability", "First-person control", firstPersonCount <= 2, "Professional CV voice detected.", "Remove unnecessary first-person pronouns.");
  addCheck("Readability", "Summary length", summaryWordCount === 0 || (summaryWordCount >= 25 && summaryWordCount <= 120), "Summary length is concise.", "Keep the summary between roughly 25 and 120 words.");
  addCheck("Quality", "Readable extraction", sourceWords.length >= 30, "Document text was extracted successfully.", "Upload a text-based PDF, DOCX or TXT file.");
  addCheck("Quality", "Supported file format", !documentMeta.fileType || /pdf|docx|text|plain/i.test(documentMeta.fileType), "ATS-compatible source format detected.", "Use PDF, DOCX or TXT.");
  addCheck("Quality", "Practical page count", !documentMeta.pageCount || documentMeta.pageCount <= 3, "Page count is recruiter-friendly.", "Reduce the CV to three pages or fewer where possible.");
  addCheck("Quality", "Overall ATS foundation", formattingScore >= 70, "The CV has a solid ATS foundation.", "Strengthen headings, contact details and bullet structure.");

  const checksPassed = checks.filter((check) => check.status === "pass").length;

  const issues: CVIssue[] = [];

  if (!emailPresent || !phonePresent) {
    issues.push(
      issue(
        "Contact details",
        "High",
        "Incomplete contact information",
        "The CV may be missing an email address or telephone number.",
        "Add professional, clearly labelled contact details at the top of the CV.",
      ),
    );
  }
  if (!text.includes("summary") && !text.includes("profile")) {
    issues.push(
      issue(
        "Professional summary",
        "High",
        "Professional summary not detected",
        "Recruiters may not immediately understand the candidate's value proposition.",
        "Add a concise role-targeted summary containing experience, strengths and career direction.",
      ),
    );
  }
  if (keywordStrength < 65) {
    issues.push(
      issue(
        "ATS keywords",
        "High",
        "Weak keyword alignment",
        "The CV does not contain enough language from the target role or job description.",
        "Add relevant role, technical and industry keywords naturally throughout the CV.",
      ),
    );
  }
  if (achievementStrength < 60) {
    issues.push(
      issue(
        "Achievements",
        "High",
        "Limited measurable achievements",
        "Responsibilities may be listed without evidence of results or impact.",
        "Rewrite experience using action verbs, outcomes, quantities, percentages and business impact.",
      ),
    );
  }
  if (detectedSections.length < 4) {
    issues.push(
      issue(
        "Structure",
        "Medium",
        "Essential CV sections may be missing",
        "The CV does not clearly show enough standard ATS-recognised section headings.",
        "Use clear headings such as Professional Summary, Skills, Experience and Education.",
      ),
    );
  }
  if (readability < 65) {
    issues.push(
      issue(
        "Readability",
        "Medium",
        "CV may be difficult to scan",
        "Long paragraphs or limited bullet structure may reduce recruiter readability.",
        "Use concise bullets, consistent spacing and shorter achievement-focused statements.",
      ),
    );
  }
  if (formattingScore < 70) {
    issues.push(
      issue(
        "Formatting",
        "Medium",
        "ATS formatting needs improvement",
        "The document may contain inconsistent structure or insufficiently clear information hierarchy.",
        "Use a single-column ATS-safe layout with standard headings and consistent typography.",
      ),
    );
  }

  const strengths = [
    ...(emailPresent && phonePresent ? ["Contact details appear to be present."] : []),
    ...(detectedSections.length >= 5 ? ["Several standard ATS sections were detected."] : []),
    ...(actionVerbCount >= 4 ? ["The CV already uses multiple action-oriented verbs."] : []),
    ...(numberCount >= 4 ? ["Some measurable evidence and numerical impact are present."] : []),
    ...(keywordStrength >= 70 ? ["Keyword alignment with the target opportunity is competitive."] : []),
  ];

  return {
    currentScore,
    potentialScore,
    completeness,
    readability,
    keywordStrength,
    achievementStrength,
    formattingScore,
    checks,
    checksPassed,
    totalChecks: checks.length,
    issues,
    strengths: strengths.length ? strengths : ["The original CV provides a foundation that can be professionally improved."],
    missingKeywords,
    generatedAt: new Date().toISOString(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function revampDescription(level: RevampLevel): string {
  const descriptions: Record<RevampLevel, string> = {
    "Basic ATS Optimisation":
      "Preserves the candidate's wording while correcting ATS structure, headings, keywords and formatting.",
    "Professional Rewrite":
      "Professionally rewrites the summary, skills and work experience with stronger achievements and language.",
    "Executive Rewrite":
      "Elevates the CV for senior, management and executive opportunities with leadership and strategic impact.",
    "Recruiter Optimised":
      "Improves scanability, relevance, evidence and recruiter decision-making while remaining ATS compliant.",
  };
  return descriptions[level];
}
