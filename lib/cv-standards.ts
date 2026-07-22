export const CV_POPIA_DECLARATION =
  "References are available upon request. I consent to the processing of the personal information contained in this CV by prospective employers and their authorised recruitment partners for legitimate recruitment and employment-related purposes, in accordance with the Protection of Personal Information Act, 2013 (POPIA).";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatCVMonthYear(input: unknown): string {
  const raw = String(input ?? "").trim().replace(/^\(|\)$/g, "");
  if (!raw) return "";
  if (/^(present|current|now)$/i.test(raw)) return "Present";

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? `${MONTHS[month - 1]}.${iso[1]}` : raw;
  }

  const numeric = raw.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (numeric) {
    const month = Number(numeric[1]);
    return month >= 1 && month <= 12 ? `${MONTHS[month - 1]}.${numeric[2]}` : raw;
  }

  const named = raw.match(/^([A-Za-z]+)[\s./-]+(\d{4})$/);
  if (named) {
    const month = MONTHS.find((item) => named[1].toLowerCase().startsWith(item.toLowerCase()));
    return month ? `${month}.${named[2]}` : raw;
  }

  return raw;
}

export function formatEmploymentPeriod(record: Record<string, unknown>): string {
  const start = formatCVMonthYear(record.start_date);
  const end = Boolean(record.is_current)
    ? "Present"
    : formatCVMonthYear(record.end_date);
  return [start, end]
    .filter(Boolean)
    .map((item) => `(${item})`)
    .join("–");
}
