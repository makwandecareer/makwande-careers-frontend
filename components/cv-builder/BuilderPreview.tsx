"use client";

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
  return (
    <section className="builder-preview-shell">
      <div className="preview-toolbar">
        <div>
          <strong>Live CV preview</strong>
          <span>{template}</span>
        </div>

        <div className="zoom-controls">
          <button
            type="button"
            onClick={() =>
              onZoomChange(Math.max(0.5, Number((zoom - 0.1).toFixed(2))))
            }
            aria-label="Zoom out"
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() =>
              onZoomChange(Math.min(1.2, Number((zoom + 0.1).toFixed(2))))
            }
            aria-label="Zoom in"
          >
            +
          </button>
          <button type="button" onClick={() => onZoomChange(0.85)}>
            Fit
          </button>
        </div>
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
