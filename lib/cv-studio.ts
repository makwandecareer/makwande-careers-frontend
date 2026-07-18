import type { ProfileBundle } from "@/lib/types";

export type StudioSection =
  | "profile"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "references";

export type StudioMargin = "narrow" | "standard" | "wide";

export type StudioLayout = "one-column" | "two-column";

export type StudioHeaderStyle =
  | "classic"
  | "centered"
  | "banded"
  | "minimal";

export type StudioPhotoShape =
  | "circle"
  | "square"
  | "rounded";

export type StudioDraft = {
  cvTitle: string;
  targetRole: string;
  templateKey: string;
  templateName?: string;
  templateLayout?: string;

  accent: string;
  secondaryAccent: string;
  fontFamily: string;
  headingFont: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  margin: StudioMargin;
  layout: StudioLayout;
  headerStyle: StudioHeaderStyle;

  showPhoto: boolean;
  photoUrl: string;
  photoShape: StudioPhotoShape;

  sectionOrder: StudioSection[];
  hiddenSections: StudioSection[];

  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    professionalTitle: string;
    summary: string;
  };

  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  languages: Record<string, unknown>[];
  references: Record<string, unknown>[];
};

export const defaultSectionOrder: StudioSection[] = [
  "profile",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "references",
];

export function createStudioDraft(
  bundle: ProfileBundle,
): StudioDraft {
  return {
    cvTitle: `${bundle.user.full_name} CV`,
    targetRole: bundle.profile?.professional_title || "",
    templateKey: "real-01",
    templateName: "Apex Professional",
    templateLayout: "sidebar-left",

    accent: "#006943",
    secondaryAccent: "#dcefe5",
    fontFamily: "Arial",
    headingFont: "Arial",
    fontSize: 12,
    lineHeight: 1.5,
    sectionSpacing: 20,
    margin: "standard",
    layout: "one-column",
    headerStyle: "classic",

    showPhoto: false,
    photoUrl: "",
    photoShape: "circle",

    sectionOrder: [...defaultSectionOrder],
    hiddenSections: [],

    profile: {
      fullName: bundle.user.full_name,
      email: bundle.user.email,
      phone: bundle.profile?.phone || "",
      location: bundle.profile?.location || "",
      linkedin: bundle.profile?.linkedin_url || "",
      website: bundle.profile?.website_url || "",
      professionalTitle:
        bundle.profile?.professional_title || "",
      summary:
        bundle.profile?.professional_summary || "",
    },

    experience: bundle.experience ?? [],
    education: bundle.education ?? [],
    skills: bundle.skills ?? [],
    projects: bundle.projects ?? [],
    certifications: bundle.certifications ?? [],
    languages: bundle.languages ?? [],
    references: bundle.references ?? [],
  };
}
