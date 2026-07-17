"use client";

import {
  Cloud,
  CloudOff,
  FileDown,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";

import type { BackendSaveState } from "@/hooks/use-cv-backend-autosave";

export type ToolbarProps = {
  saveState: BackendSaveState;
  backendSaveError?: string;
  lastSavedAt: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void | Promise<void>;
  onExportPDF: () => void | Promise<void>;
  onExportDOCX: () => void | Promise<void>;
  previewOnly: boolean;
  setPreviewOnly: (value: boolean) => void;
};

function getSaveLabel(
  saveState: BackendSaveState,
  lastSavedAt: Date | null,
): string {
  switch (saveState) {
    case "offline":
      return "Saved locally — offline";
    case "error":
      return "Local copy saved — sync failed";
    case "saving":
      return "Saving...";
    case "unsaved":
      return "Unsaved changes";
    case "saved":
      return lastSavedAt
        ? `Saved at ${lastSavedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "All changes saved";
    case "idle":
    default:
      return "All changes saved";
  }
}

function getStatusClass(saveState: BackendSaveState): string {
  switch (saveState) {
    case "error":
      return "error";
    case "offline":
      return "offline";
    case "saving":
      return "saving";
    case "unsaved":
      return "unsaved";
    case "saved":
    case "idle":
    default:
      return "saved";
  }
}

export function Toolbar({
  saveState,
  backendSaveError = "",
  lastSavedAt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExportPDF,
  onExportDOCX,
  previewOnly,
  setPreviewOnly,
}: ToolbarProps) {
  const saveLabel = getSaveLabel(saveState, lastSavedAt);
  const statusClass = getStatusClass(saveState);

  return (
    <header className="studio-toolbar">
      <div className="studio-toolbar-brand">
        <span className="studio-kicker">Makwande Careers</span>
        <strong>CV Studio</strong>
      </div>

      <div className="studio-history-controls">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
          Undo
        </button>

        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
          Redo
        </button>
      </div>

      <div
        className={`studio-save-state ${statusClass}`}
        title={backendSaveError || saveLabel}
        aria-live="polite"
      >
        {saveState === "offline" || saveState === "error" ? (
          <CloudOff size={15} />
        ) : (
          <Cloud size={15} />
        )}

        <span>{saveLabel}</span>
      </div>

      <div className="studio-toolbar-actions">
        <button
          type="button"
          onClick={() => setPreviewOnly(!previewOnly)}
        >
          {previewOnly ? "Edit CV" : "Preview"}
        </button>

        <button
          type="button"
          onClick={() => {
            void onSave();
          }}
          title="Save now (Ctrl+S)"
        >
          <Save size={16} />
          Save now
        </button>

        <button
          type="button"
          onClick={() => {
            void onExportPDF();
          }}
        >
          <FileDown size={16} />
          PDF
        </button>

        <button
          type="button"
          className="primary"
          onClick={() => {
            void onExportDOCX();
          }}
        >
          <FileDown size={16} />
          DOCX
        </button>
      </div>
    </header>
  );
}