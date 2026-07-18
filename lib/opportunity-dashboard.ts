import {
  calculateJobMatch,
  type JobMatchDimension,
  type JobMatchResult,
} from "@/lib/job-matching";

export type OpportunityStatus =
  | "saved"
  | "reviewing"
  | "ready"
  | "applied"
  | "archived";

export type OpportunityInput = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  source?: string;
  closingDate?: string;
  salaryLabel?: string;
  status?: OpportunityStatus;
};

export type OpportunityScore = {
  opportunity: OpportunityInput;
  match: JobMatchResult;
  rank: number;
  readiness: number;
  strongestDimensions: Array<{
    key: JobMatchDimension;
    label: string;
    score: number;
  }>;
  weakestDimensions: Array<{
    key: JobMatchDimension;
    label: string;
    score: number;
  }>;
};

export type OpportunityDashboardResult = {
  ranked: OpportunityScore[];
  bestMatch: OpportunityScore | null;
  averageMatch: number;
  readyCount: number;
  priorityGaps: string[];
  commonStrengths: string[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function createOpportunityId(index: number): string {
  return `opportunity-${Date.now()}-${index}`;
}

export function rankOpportunities(
  cvContent: unknown,
  targetRole: string,
  opportunities: OpportunityInput[],
): OpportunityDashboardResult {
  const ranked = opportunities
    .filter((item) => item.description.trim().length > 20)
    .map((opportunity) => {
      const match = calculateJobMatch({
        cvContent,
        targetRole: opportunity.title || targetRole,
        jobDescription: opportunity.description,
      });

      const readiness = clamp(
        match.overallScore * 0.76 +
          (match.gaps.length <= 3 ? 12 : match.gaps.length <= 6 ? 7 : 2) +
          (match.strengths.length >= 5 ? 12 : match.strengths.length * 2),
      );

      const sortedDimensions = [...match.dimensions].sort(
        (a, b) => b.score - a.score,
      );

      return {
        opportunity,
        match,
        readiness,
        rank: 0,
        strongestDimensions: sortedDimensions.slice(0, 3).map((item) => ({
          key: item.key,
          label: item.label,
          score: item.score,
        })),
        weakestDimensions: sortedDimensions
          .slice()
          .reverse()
          .slice(0, 3)
          .map((item) => ({
            key: item.key,
            label: item.label,
            score: item.score,
          })),
      };
    })
    .sort((a, b) => {
      if (b.match.overallScore !== a.match.overallScore) {
        return b.match.overallScore - a.match.overallScore;
      }
      return b.readiness - a.readiness;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const allGaps = ranked.flatMap((item) => item.match.gaps);
  const allStrengths = ranked.flatMap((item) => item.match.strengths);

  const countTerms = (items: string[]) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = item.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([term]) => term);
  };

  return {
    ranked,
    bestMatch: ranked[0] ?? null,
    averageMatch: ranked.length
      ? clamp(
          ranked.reduce((sum, item) => sum + item.match.overallScore, 0) /
            ranked.length,
        )
      : 0,
    readyCount: ranked.filter((item) => item.readiness >= 72).length,
    priorityGaps: unique(countTerms(allGaps)).slice(0, 8),
    commonStrengths: unique(countTerms(allStrengths)).slice(0, 8),
  };
}

export function parseOpportunityBatch(raw: string): OpportunityInput[] {
  const blocks = raw
    .split(/\n-{3,}\n|\n={3,}\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = lines[0] || `Opportunity ${index + 1}`;
    const company = lines[1] || "Company not specified";
    const location = lines[2] || "Location not specified";
    const description = lines.slice(3).join("\n") || block;

    return {
      id: createOpportunityId(index),
      title,
      company,
      location,
      employmentType: "Not specified",
      description,
      status: "reviewing",
    };
  });
}
