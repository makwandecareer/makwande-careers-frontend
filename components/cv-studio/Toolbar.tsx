"use client";

import { Cloud, CloudOff, FileDown, Redo2, Save, Undo2 } from "lucide-react";
import type { BackendSaveState } from "@/hooks/use-cv-backend-autosave";

type LocalSaveState = "saved" | "saving" | "unsaved";

type ToolbarProps = {
  localSaveState: LocalSaveState;
  backendSaveState: BackendSaveState;
  backendSaveError: string;
  lastSavedAt: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  previewOnly: boolean;
  setPreviewOnly: (value: boolean) => void;
};

function getSaveLabel(local: LocalSaveState, backend: BackendSaveState, lastSavedAt: Date | null): string {
  if (backend === "offline") return "Saved locally — offline";
  if (backend === "error") return "Local copy saved — sync failed";
  if (local === "saving" || backend === "saving") return "Saving...";
  if (local === "unsaved" || backend === "unsaved") return "Unsaved changes";
  if (lastSavedAt) return `Saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return "All changes saved";
}

export function Toolbar(props: ToolbarProps) {
  const { localSaveState, backendSaveState, backendSaveError, lastSavedAt, canUndo, canRedo, onUndo, onRedo, onSave, onExportPDF, onExportDOCX, previewOnly, setPreviewOnly } = props;
  const saveLabel = getSaveLabel(localSaveState, backendSaveState, lastSavedAt);
  const statusClass = backendSaveState === "error" ? "error" : backendSaveState === "offline" ? "offline" : backendSaveState === "saving" || localSaveState === "saving" ? "saving" : backendSaveState === "unsaved" || localSaveState === "unsaved" ? "unsaved" : "saved";

  return <header className="studio-toolbar">
    <div className="studio-toolbar-brand"><span className="studio-kicker">Makwande Careers</span><strong>CV Studio</strong></div>
    <div className="studio-history-controls">
      <button disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl+Z)"><Undo2 size={16}/>Undo</button>
      <button disabled={!canRedo} onClick={onRedo} title="Redo (Ctrl+Y)"><Redo2 size={16}/>Redo</button>
    </div>
    <div className={`studio-save-state ${statusClass}`} title={backendSaveError || saveLabel}>
      {backendSaveState === "offline" ? <CloudOff size={15}/> : <Cloud size={15}/>}<span>{saveLabel}</span>
    </div>
    <div className="studio-toolbar-actions">
      <button onClick={() => setPreviewOnly(!previewOnly)}>{previewOnly ? "Edit CV" : "Preview"}</button>
      <button onClick={onSave} title="Save now (Ctrl+S)"><Save size={16}/>Save now</button>
      <button onClick={onExportPDF}><FileDown size={16}/>PDF</button>
      <button className="primary" onClick={onExportDOCX}><FileDown size={16}/>DOCX</button>
    </div>
  </header>;
}
