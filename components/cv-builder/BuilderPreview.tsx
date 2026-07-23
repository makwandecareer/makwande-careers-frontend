"use client";

import { useEffect, useState } from "react";

import { CVPreview } from "@/components/cv-preview";
import type {
  CVSectionKey,
  CVSettings,
  CVTemplateKey,
} from "@/lib/cv-builder";
import type { GeneratedCV, ProfileBundle } from "@/lib/types";

type BuilderPreviewProps = {
  bundle: ProfileBundle;
  generated: GeneratedCV | null;
  targetRole: string;
  template: CVTemplateKey;
  settings: CVSettings;
  sectionOrder: CVSectionKey[];
  zoom: number;
  onZoomChange: (value: number) => void;
};

const ZOOM_PRESETS = [0.5, 0.75, 0.85, 1, 1.2] as const;

export function BuilderPreview({
  bundle,
  generated,
  targetRole,
  template,
  settings,
  sectionOrder,
  zoom,
  onZoomChange,
}: BuilderPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setIsFullscreen(false);

      if ((event.ctrlKey || event.metaKey) && event.key === "0") {
        event.preventDefault();
        onZoomChange(0.85);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onZoomChange]);

  function changeZoom(value: number): void {
    onZoomChange(Math.min(1.2, Math.max(0.5, Number(value.toFixed(2)))));
  }

  return (
    <section
      className={`builder-preview-shell${isFullscreen ? " preview-fullscreen" : ""}`}
      aria-label="Live CV preview studio"
    >
      <div className="preview-toolbar">
        <div className="preview-toolbar-title">
          <span className="preview-live-indicator" aria-hidden="true" />
          <div>
            <strong>Live CV Preview Studio</strong>
            <span>{template.replaceAll("-", " ")} · A4 recruiter view</span>
          </div>
        </div>

        <div className="preview-toolbar-actions">
          <label className="preview-zoom-select">
            <span className="sr-only">Preview zoom</span>
            <select
              value={zoom}
              onChange={(event) => changeZoom(Number(event.target.value))}
              aria-label="Preview zoom"
            >
              {ZOOM_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {Math.round(preset * 100)}%
                </option>
              ))}
            </select>
          </label>

          <div className="zoom-controls" aria-label="Zoom controls">
            <button
              type="button"
              onClick={() => changeZoom(zoom - 0.1)}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => changeZoom(zoom + 0.1)}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => changeZoom(0.85)}
              title="Fit to screen"
            >
              Fit
            </button>
          </div>

          <button
            type="button"
            className="preview-action-button"
            onClick={() => window.print()}
            title="Print CV"
          >
            Print
          </button>

          <button
            type="button"
            className="preview-action-button preview-primary-action"
            onClick={() => setIsFullscreen((current) => !current)}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </div>

      <div className="preview-statusbar">
        <span>Changes appear instantly</span>
        <span>A4 layout</span>
        <span>ATS-friendly preview</span>
        <span>{generated ? "Generated CV" : "Profile draft"}</span>
      </div>

      <div className="preview-canvas">
        <CVPreview
          bundle={bundle}
          generated={generated}
          targetRole={targetRole}
          template={template}
          settings={settings}
          sectionOrder={sectionOrder}
          zoom={zoom}
        />
      </div>
    </section>
  );
}
