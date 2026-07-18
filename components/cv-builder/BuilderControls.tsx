"use client";

import type { FormEvent } from "react";

import { CVBuilderSettings } from "@/components/cv-builder-settings";
import type {
  CVSectionKey,
  CVSettings,
  CVTemplateKey,
} from "@/lib/cv-builder";
import type { ProfileBundle } from "@/lib/types";

type BuilderControlsProps = {
  bundle: ProfileBundle;
  title: string;
  targetRole: string;
  template: CVTemplateKey;
  settings: CVSettings;
  sectionOrder: CVSectionKey[];
  busy: string;
  error: string;
  message: string;
  onTitleChange: (value: string) => void;
  onTargetRoleChange: (value: string) => void;
  onTemplateChange: (value: CVTemplateKey) => void;
  onSettingsChange: (value: CVSettings) => void;
  onSectionOrderChange: (value: CVSectionKey[]) => void;
  onGenerate: (event: FormEvent) => void;
  onDownloadPDF: () => void;
  onDownloadDOCX: () => void;
};

export function BuilderControls({
  bundle,
  title,
  targetRole,
  template,
  settings,
  sectionOrder,
  busy,
  error,
  message,
  onTitleChange,
  onTargetRoleChange,
  onTemplateChange,
  onSettingsChange,
  onSectionOrderChange,
  onGenerate,
  onDownloadPDF,
  onDownloadDOCX,
}: BuilderControlsProps) {
  return (
    <aside className="builder-panel">
      <form className="card form" onSubmit={onGenerate}>
        <label className="field">
          <span>CV title</span>
          <input
            className="input"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Target role</span>
          <input
            className="input"
            value={targetRole}
            onChange={(event) => onTargetRoleChange(event.target.value)}
            required
          />
        </label>

        <div className="source-summary-grid" aria-label="Profile source summary">
          <span>
            Education <strong>{bundle.education.length}</strong>
          </span>
          <span>
            Experience <strong>{bundle.experience.length}</strong>
          </span>
          <span>
            Skills <strong>{bundle.skills.length}</strong>
          </span>
          <span>
            Projects <strong>{bundle.projects.length}</strong>
          </span>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <button
          className="button button-primary button-wide"
          disabled={busy === "generate"}
        >
          {busy === "generate" ? "Generating..." : "Generate and save CV"}
        </button>

        <div className="export-grid">
          <button
            type="button"
            className="button button-secondary"
            onClick={onDownloadPDF}
            disabled={busy === "pdf"}
          >
            {busy === "pdf" ? "Preparing PDF..." : "Download PDF"}
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={onDownloadDOCX}
            disabled={busy === "docx"}
          >
            {busy === "docx" ? "Preparing DOCX..." : "Download DOCX"}
          </button>
        </div>
      </form>

      <CVBuilderSettings
        template={template}
        setTemplate={onTemplateChange}
        settings={settings}
        setSettings={onSettingsChange}
        sectionOrder={sectionOrder}
        setSectionOrder={onSectionOrderChange}
      />
    </aside>
  );
}
