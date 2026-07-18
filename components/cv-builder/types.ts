import type {
  ATSResult,
  GeneratedCV,
  ProfileBundle,
} from "@/lib/types";
import type {
  CVSectionKey,
  CVSettings,
  CVTemplateKey,
} from "@/lib/cv-builder";

export type BuilderTab = "build" | "design" | "ats";
export type BusyState = "" | "generate" | "ats" | "pdf" | "docx";

export type BuilderState = {
  bundle: ProfileBundle;
  generated: GeneratedCV | null;
  targetRole: string;
  title: string;
  jobDescription: string;
  template: CVTemplateKey;
  settings: CVSettings;
  sectionOrder: CVSectionKey[];
  ats: ATSResult | null;
};

export type BuilderActions = {
  setTargetRole: (value: string) => void;
  setTitle: (value: string) => void;
  setJobDescription: (value: string) => void;
  setTemplate: (value: CVTemplateKey) => void;
  setSettings: (value: CVSettings) => void;
  setSectionOrder: (value: CVSectionKey[]) => void;
};
