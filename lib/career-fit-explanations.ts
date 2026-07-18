import { calculateJobMatch } from "@/lib/job-matching";
import type { OpportunityInput } from "@/lib/opportunity-dashboard";
import { analyzeSkillGaps } from "@/lib/skill-gap-analyzer";

export type CareerFitLevel =
  | "strong"
  | "promising"
  | "developing"
  | "stretch";

export type CareerFitEvidence = {
  label: string;
  explanation: string;
  score?: number;
};

export type CareerFitRisk = {
  label: string;
  explanation: string;
  action: string;
};

export type CareerFitExplanation = {
  opportunity: OpportunityInput;
  overallScore: number;
  fitLevel: CareerFitLevel;
  headline: string;
  executiveSummary: string;
  whyItFits: CareerFitEvidence[];
  mainRisks: CareerFitRisk[];
  transferableValue: string[];
  applicationStrategy: string[];
  interviewNarrative: string[];
  recruiterQuestions: string[];
  decisionGuidance: {
    recommendation: string;
    confidenceNote: string;
    nextBestAction: string;
  };
};

export type CareerFitPortfolio = {
  explanations: CareerFitExplanation[];
  strongestFit: CareerFitExplanation | null;
  portfolioSummary: string;
  recurringAdvantages: string[];
  recurringRisks: string[];
};

function fitLevelFor(score: number): CareerFitLevel {
  if (score >= 80) return "strong";
  if (score >= 65) return "promising";
  if (score >= 50) return "developing";
  return "stretch";
}

function headlineFor(
  level: CareerFitLevel,
  title: string,
): string {
  const headlines: Record<CareerFitLevel, string> = {
    strong: `Strong documented alignment for ${title}`,
    promising: `Promising fit with focused tailoring needed`,
    developing: `Partial fit that depends on stronger evidence`,
    stretch: `A stretch opportunity requiring careful positioning`,
  };

  return headlines[level];
}

function summaryFor(
  score: number,
  title: string,
  strengths: string[],
  gaps: string[],
): string {
  const strengthText =
    strengths.length > 0
      ? `The CV already shows useful evidence in ${strengths
          .slice(0, 3)
          .join(", ")}.`
      : "The CV contains some relevant foundations, but the strongest evidence is not yet clearly visible.";

  const gapText =
    gaps.length > 0
      ? `The main concern is under-evidenced alignment in ${gaps
          .slice(0, 3)
          .join(", ")}.`
      : "No major repeated gap was detected from the supplied information.";

  return `For the ${title} opportunity, the documented alignment score is ${score}%. ${strengthText} ${gapText}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function explainCareerFit(
  cvContent: unknown,
  targetRole: string,
  opportunities: OpportunityInput[],
): CareerFitPortfolio {
  const active = opportunities.filter(
    (item) => item.description.trim().length > 20,
  );

  const gapAnalysis = analyzeSkillGaps(
    cvContent,
    targetRole,
    active,
  );

  const recurringAdvantages = gapAnalysis.transferableStrengths
    .slice(0, 8)
    .map((item) => item.label);

  const recurringRisks = gapAnalysis.topPriorities
    .slice(0, 8)
    .map((item) => item.label);

  const explanations = active
    .map((opportunity): CareerFitExplanation => {
      const match = calculateJobMatch({
        cvContent,
        targetRole: opportunity.title || targetRole,
        jobDescription: opportunity.description,
      });

      const fitLevel = fitLevelFor(match.overallScore);
      const strongestDimensions = [...match.dimensions]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      const weakestDimensions = [...match.dimensions]
        .sort((a, b) => a.score - b.score)
        .slice(0, 4);

      const whyItFits: CareerFitEvidence[] = strongestDimensions.map(
        (dimension) => ({
          label: dimension.label,
          score: dimension.score,
          explanation:
            dimension.matched.length > 0
              ? `The CV contains relevant evidence for ${dimension.matched
                  .slice(0, 3)
                  .join(", ")}. ${dimension.explanation}`
              : dimension.explanation ||
                `The supplied CV shows comparatively stronger alignment in ${dimension.label.toLowerCase()}.`,
        }),
      );

      const mainRisks: CareerFitRisk[] = weakestDimensions.map(
        (dimension) => ({
          label: dimension.label,
          explanation:
            dimension.missing?.slice(0, 2).join(", ") ||
            `Evidence for ${dimension.label.toLowerCase()} is weaker than the strongest areas.`,
          action:
            dimension.missing?.length
              ? `Verify whether you have genuine evidence for ${dimension.missing
                  .slice(0, 2)
                  .join(" and ")} before tailoring the application.`
              : `Add a clearer verified example demonstrating ${dimension.label.toLowerCase()}.`,
        }),
      );

      const transferableValue = unique([
        ...recurringAdvantages.slice(0, 4),
        ...match.strengths.slice(0, 4),
      ]).slice(0, 6);

      const applicationStrategy = unique([
        `Lead the CV and cover message with the strongest evidence for ${strongestDimensions[0]?.label ?? "the role requirements"}.`,
        match.gaps.length
          ? `Address the highest-priority gap honestly: ${match.gaps[0]}.`
          : "Maintain the current evidence balance and tailor keywords to the vacancy wording.",
        "Use role-specific achievements rather than adding unsupported keywords.",
        "Keep the application focused on documented contribution, scope and measurable outcomes.",
      ]);

      const interviewNarrative = unique([
        `Why your current background is relevant to ${opportunity.title}.`,
        ...transferableValue
          .slice(0, 3)
          .map(
            (item) =>
              `A verified example showing how you applied ${item}.`,
          ),
        ...mainRisks
          .slice(0, 2)
          .map(
            (risk) =>
              `How you would close or manage the gap in ${risk.label.toLowerCase()}.`,
          ),
      ]);

      const recruiterQuestions = unique([
        `Which part of your experience best prepares you for ${opportunity.title}?`,
        `What measurable result best proves your readiness for this role?`,
        ...mainRisks.slice(0, 3).map(
          (risk) =>
            `What genuine evidence can you provide for ${risk.label.toLowerCase()}?`,
        ),
      ]);

      const recommendation =
        fitLevel === "strong"
          ? "Prioritise this opportunity and tailor the application carefully."
          : fitLevel === "promising"
            ? "Apply after strengthening the most visible evidence gaps."
            : fitLevel === "developing"
              ? "Apply selectively where transferable experience can be explained convincingly."
              : "Treat this as a stretch application and avoid overstating readiness.";

      const nextBestAction =
        match.gaps.length > 0
          ? `Strengthen or verify evidence for ${match.gaps[0]} before submitting.`
          : "Tailor the CV summary and achievements to the vacancy language.";

      return {
        opportunity,
        overallScore: match.overallScore,
        fitLevel,
        headline: headlineFor(fitLevel, opportunity.title),
        executiveSummary: summaryFor(
          match.overallScore,
          opportunity.title,
          match.strengths,
          match.gaps,
        ),
        whyItFits,
        mainRisks,
        transferableValue,
        applicationStrategy,
        interviewNarrative,
        recruiterQuestions,
        decisionGuidance: {
          recommendation,
          confidenceNote:
            "This explanation reflects documented CV-to-vacancy alignment only. It does not predict employer decisions, culture fit or hiring probability.",
          nextBestAction,
        },
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  const strongestFit = explanations[0] ?? null;

  const portfolioSummary =
    explanations.length === 0
      ? "Add opportunities to generate personalised career-fit explanations."
      : strongestFit
        ? `${strongestFit.opportunity.title} currently has the strongest documented alignment at ${strongestFit.overallScore}%. Use the explanations to understand why each role fits, where the risks are and how to position verified evidence.`
        : "No career-fit explanation is available.";

  return {
    explanations,
    strongestFit,
    portfolioSummary,
    recurringAdvantages,
    recurringRisks,
  };
}
