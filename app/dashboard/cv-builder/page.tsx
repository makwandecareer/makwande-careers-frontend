"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { BuilderControls } from "@/components/cv-builder/BuilderControls";
import { BuilderPreview } from "@/components/cv-builder/BuilderPreview";
import { CareerIntelligencePanel } from "@/components/cv-builder/CareerIntelligencePanel";
import { api } from "@/lib/client-api";
import {
  defaultCVSettings,
  defaultSectionOrder,
  type CVSectionKey,
  type CVSettings,
  type CVTemplateKey,
} from "@/lib/cv-builder";
import type {
  ATSResult,
  GeneratedCV,
  ProfileBundle,
} from "@/lib/types";

type BuilderTab = "build" | "design" | "ats";
type BusyState = "" | "generate" | "ats" | "pdf" | "docx";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CVBuilderPage() {
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [template, setTemplate] =
    useState<CVTemplateKey>("ats-standard");
  const [settings, setSettings] =
    useState<CVSettings>(defaultCVSettings);
  const [sectionOrder, setSectionOrder] =
    useState<CVSectionKey[]>(defaultSectionOrder);
  const [generated, setGenerated] =
    useState<GeneratedCV | null>(null);
  const [ats, setAts] = useState<ATSResult | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyState>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<BuilderTab>("build");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      try {
        const profile = await api<ProfileBundle>(
          "/api/profile/source-of-truth",
        );

        if (cancelled) return;

        setBundle(profile);
        setTargetRole(profile.profile?.professional_title ?? "");
        setTitle(`${profile.user.full_name} CV`);
      } catch (reason) {
        if (cancelled) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load profile",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const missingSections = useMemo(() => {
    if (!bundle) return [];

    const sections: Array<[string, unknown[]]> = [
      ["education", bundle.education],
      ["experience", bundle.experience],
      ["skills", bundle.skills],
      ["projects", bundle.projects],
      ["certifications", bundle.certifications],
      ["languages", bundle.languages],
    ];

    return sections
      .filter(([, entries]) => !entries.length)
      .map(([name]) => name);
  }, [bundle]);

  const currentCVContent = generated?.content ?? (
    bundle
      ? {
          user: bundle.user,
          profile: bundle.profile,
          education: bundle.education,
          experience: bundle.experience,
          skills: bundle.skills,
          projects: bundle.projects,
          certifications: bundle.certifications,
          languages: bundle.languages,
          references: bundle.references,
          target_role: targetRole,
        }
      : {}
  );

  async function generate(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!bundle) return;

    setBusy("generate");
    setError("");
    setMessage("");

    try {
      const result = await api<GeneratedCV>("/api/ai-cv/generate", {
        method: "POST",
        body: JSON.stringify({
          title,
          target_role: targetRole,
          template_key: template,
          save_snapshot: true,
          job_description: jobDescription || null,
          settings,
          section_order: sectionOrder,
        }),
      });

      setGenerated(result);
      setMessage("Professional CV generated and saved successfully.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "CV generation failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function analyse(): Promise<void> {
    if (!bundle || !jobDescription.trim()) {
      setError("Paste a job description before running ATS analysis.");
      return;
    }

    setBusy("ats");
    setError("");

    try {
      const result = await api<ATSResult>("/api/ai-cv/ats-score", {
        method: "POST",
        body: JSON.stringify({
          job_description: jobDescription,
          cv_content: currentCVContent,
        }),
      });

      setAts(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ATS analysis failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function download(format: "pdf" | "docx"): Promise<void> {
    if (!bundle) return;

    setBusy(format);
    setError("");

    try {
      const blob = await api<Blob>(`/api/ai-cv/export/${format}`, {
        method: "POST",
        body: JSON.stringify({
          filename: title,
          template_key: template,
          settings,
          section_order: sectionOrder,
          cv_content: currentCVContent,
        }),
      });

      const safeTitle = title
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      downloadBlob(blob, `${safeTitle || "cv"}.${format}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Export failed",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" />
        Loading your career profile...
      </div>
    );
  }

  if (!bundle) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-header builder-header">
      <div>
        <span className="eyebrow">
          Phase 6 · AI Career Intelligence
        </span>
        <h1>Create, optimise and validate your professional CV</h1>
        <p className="muted">
          World-class CV creation with ATS matching, KPI evidence,
          measurable results and deep recruiter analysis.
        </p>
      </div>

      <div className="builder-status">
        <span>Profile readiness</span>
        <strong>{Math.max(0, 100 - missingSections.length * 8)}%</strong>
      </div>

      <div className="builder-tabs" role="tablist">
        <button
          type="button"
          className={tab === "build" ? "active" : ""}
          onClick={() => setTab("build")}
        >
          Build
        </button>
        <button
          type="button"
          className={tab === "design" ? "active" : ""}
          onClick={() => setTab("design")}
        >
          Design
        </button>
        <button
          type="button"
          className={tab === "ats" ? "active" : ""}
          onClick={() => setTab("ats")}
        >
          Career Intelligence
        </button>
      </div>

      <div className="builder-layout">
        {tab === "ats" ? (
          <CareerIntelligencePanel
            jobDescription={jobDescription}
            targetRole={targetRole}
            cvContent={currentCVContent}
            ats={ats}
            busy={busy}
            onJobDescriptionChange={setJobDescription}
            onAnalyse={() => void analyse()}
          />
        ) : (
          <BuilderControls
            bundle={bundle}
            title={title}
            targetRole={targetRole}
            template={template}
            settings={settings}
            sectionOrder={sectionOrder}
            busy={busy}
            error={error}
            message={message}
            onTitleChange={setTitle}
            onTargetRoleChange={setTargetRole}
            onTemplateChange={setTemplate}
            onSettingsChange={setSettings}
            onSectionOrderChange={setSectionOrder}
            onGenerate={generate}
            onDownloadPDF={() => void download("pdf")}
            onDownloadDOCX={() => void download("docx")}
          />
        )}

        <BuilderPreview
          bundle={bundle}
          generated={generated}
          targetRole={targetRole}
          template={template}
          settings={settings}
          sectionOrder={sectionOrder}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  );
}
