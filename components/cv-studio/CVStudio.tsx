"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useCVBackendAutosave } from "@/hooks/use-cv-backend-autosave";
import { api } from "@/lib/client-api";
import {
  createStudioDraft,
  type StudioDraft,
  type StudioSection,
} from "@/lib/cv-studio";
import {
  applyTemplateToDraft,
  buildExportPayload,
  readSelectedTemplate,
  STUDIO_DRAFT_KEY,
} from "@/lib/template-process";
import type { ProfileBundle } from "@/lib/types";

import "./cv-studio.css";
import { DesignPanel } from "./DesignPanel";
import { EditorPanel } from "./EditorPanel";
import { PreviewPanel } from "./PreviewPanel";
import { SectionSidebar } from "./SectionSidebar";
import { Toolbar } from "./Toolbar";

type LocalSaveState = "saved" | "saving" | "unsaved";

export function CVStudio() {
  const [draft, setDraft] = useState<StudioDraft | null>(null);
  const [active, setActive] = useState<StudioSection>("profile");
  const [mode, setMode] = useState<"content" | "design">("content");
  const [history, setHistory] = useState<StudioDraft[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [localSaveState, setLocalSaveState] =
    useState<LocalSaveState>("saved");
  const [zoom, setZoom] = useState(0.82);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [error, setError] = useState("");

  const localSaveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<StudioDraft | null>(null);

  const {
    backendSaveState,
    backendSaveError,
    lastSavedAt,
    saveNow: saveBackendNow,
  } = useCVBackendAutosave(draft, 2500);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudio(): Promise<void> {
      try {
        const bundle = await api<ProfileBundle>(
          "/api/profile/source-of-truth",
        );

        if (cancelled) return;

        let initial = createStudioDraft(bundle);
        const savedDraft = window.localStorage.getItem(
          STUDIO_DRAFT_KEY,
        );

        if (savedDraft) {
          try {
            initial = {
              ...initial,
              ...(JSON.parse(savedDraft) as Partial<StudioDraft>),
            };
          } catch {
            window.localStorage.removeItem(STUDIO_DRAFT_KEY);
          }
        }

        const selectedTemplate = readSelectedTemplate();

        if (
          selectedTemplate &&
          selectedTemplate.key !== initial.templateKey
        ) {
          initial = applyTemplateToDraft(
            initial,
            selectedTemplate,
          );

          window.localStorage.setItem(
            STUDIO_DRAFT_KEY,
            JSON.stringify(initial),
          );
        }

        setDraft(initial);
        setHistory([initial]);
        setHistoryIndex(0);
      } catch (reason) {
        if (cancelled) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to open CV Studio",
        );
      }
    }

    void loadStudio();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveLocalNow = useCallback(
    (candidate?: StudioDraft | null): void => {
      const currentDraft = candidate ?? draftRef.current;

      if (!currentDraft) return;

      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
        localSaveTimerRef.current = null;
      }

      window.localStorage.setItem(
        STUDIO_DRAFT_KEY,
        JSON.stringify(currentDraft),
      );

      setLocalSaveState("saved");
    },
    [],
  );

  const scheduleLocalSave = useCallback(
    (nextDraft: StudioDraft): void => {
      setLocalSaveState("saving");

      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }

      localSaveTimerRef.current = setTimeout(() => {
        saveLocalNow(nextDraft);
      }, 700);
    },
    [saveLocalNow],
  );

  const change = useCallback(
    (nextDraft: StudioDraft): void => {
      const nextHistory = [
        ...history.slice(0, historyIndex + 1),
        nextDraft,
      ].slice(-50);

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setDraft(nextDraft);
      setLocalSaveState("unsaved");
      scheduleLocalSave(nextDraft);
    },
    [history, historyIndex, scheduleLocalSave],
  );

  const undo = useCallback((): void => {
    if (historyIndex <= 0) return;

    const nextIndex = historyIndex - 1;
    const previousDraft = history[nextIndex];

    if (!previousDraft) return;

    setHistoryIndex(nextIndex);
    setDraft(previousDraft);
    setLocalSaveState("unsaved");
    scheduleLocalSave(previousDraft);
  }, [history, historyIndex, scheduleLocalSave]);

  const redo = useCallback((): void => {
    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextDraft = history[nextIndex];

    if (!nextDraft) return;

    setHistoryIndex(nextIndex);
    setDraft(nextDraft);
    setLocalSaveState("unsaved");
    scheduleLocalSave(nextDraft);
  }, [history, historyIndex, scheduleLocalSave]);

  const move = useCallback(
    (index: number, direction: -1 | 1): void => {
      if (!draft) return;

      const destination = index + direction;

      if (
        destination < 0 ||
        destination >= draft.sectionOrder.length
      ) {
        return;
      }

      const nextOrder = [...draft.sectionOrder];

      [nextOrder[index], nextOrder[destination]] = [
        nextOrder[destination],
        nextOrder[index],
      ];

      change({
        ...draft,
        sectionOrder: nextOrder,
      });
    },
    [change, draft],
  );

  const toggle = useCallback(
    (section: StudioSection): void => {
      if (!draft) return;

      const hiddenSections = draft.hiddenSections.includes(section)
        ? draft.hiddenSections.filter(
            (item) => item !== section,
          )
        : [...draft.hiddenSections, section];

      change({
        ...draft,
        hiddenSections,
      });
    },
    [change, draft],
  );

  const saveEverythingNow = useCallback(async (): Promise<void> => {
    saveLocalNow();
    await saveBackendNow();
  }, [saveBackendNow, saveLocalNow]);

  const exportDocument = useCallback(
    async (format: "pdf" | "docx"): Promise<void> => {
      const currentDraft = draftRef.current;

      if (!currentDraft) return;

      setError("");

      try {
        saveLocalNow(currentDraft);
        await saveBackendNow();

        const blob = await api<Blob>(
          `/api/ai-cv/export/${format}`,
          {
            method: "POST",
            body: JSON.stringify(
              buildExportPayload(currentDraft),
            ),
          },
        );

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const safeTitle = currentDraft.cvTitle
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();

        anchor.href = url;
        anchor.download = `${safeTitle || "cv"}.${format}`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Export failed",
        );
      }
    },
    [saveBackendNow, saveLocalNow],
  );

  const handleExportPDF = useCallback(async (): Promise<void> => {
    await exportDocument("pdf");
  }, [exportDocument]);

  const handleExportDOCX = useCallback(async (): Promise<void> => {
    await exportDocument("docx");
  }, [exportDocument]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent): void {
      const commandKey = event.ctrlKey || event.metaKey;

      if (!commandKey) return;

      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        void saveEverythingNow();
        return;
      }

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [redo, saveEverythingNow, undo]);

  useEffect(() => {
    function handleBeforeUnload(
      event: BeforeUnloadEvent,
    ): void {
      if (draftRef.current) {
        saveLocalNow(draftRef.current);
      }

      if (
        ["unsaved", "saving", "error", "offline"].includes(
          backendSaveState,
        )
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );

      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
    };
  }, [backendSaveState, saveLocalNow]);

  if (error) {
    return (
      <div className="error">
        <strong>CV Studio error</strong>
        <span>{error}</span>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="loading">
        <span className="spinner" />
        Opening CV Studio...
      </div>
    );
  }

  return (
    <div
      className={`cv-studio-shell ${
        previewOnly ? "preview-only" : ""
      }`}
    >
      <Toolbar
        saveState={backendSaveState}
        backendSaveError={backendSaveError}
        lastSavedAt={lastSavedAt}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        onSave={saveEverythingNow}
        onExportPDF={handleExportPDF}
        onExportDOCX={handleExportDOCX}
        previewOnly={previewOnly}
        setPreviewOnly={setPreviewOnly}
      />

      {!previewOnly && (
        <div className="studio-mode-tabs">
          <button
            type="button"
            className={mode === "content" ? "active" : ""}
            onClick={() => setMode("content")}
          >
            Content
          </button>

          <button
            type="button"
            className={mode === "design" ? "active" : ""}
            onClick={() => setMode("design")}
          >
            Design
          </button>
        </div>
      )}

      <div className="cv-studio-workspace">
        {!previewOnly && mode === "content" && (
          <SectionSidebar
            draft={draft}
            active={active}
            onSelect={setActive}
            onMove={move}
            onToggle={toggle}
          />
        )}

        {!previewOnly && mode === "content" && (
          <EditorPanel
            draft={draft}
            active={active}
            onChange={change}
          />
        )}

        {!previewOnly && mode === "design" && (
          <div className="studio-design-spacer" />
        )}

        {!previewOnly && mode === "design" && (
          <DesignPanel draft={draft} onChange={change} />
        )}

        <PreviewPanel
          draft={draft}
          zoom={zoom}
          setZoom={setZoom}
        />
      </div>

      <span className="sr-only">
        Local save status: {localSaveState}
      </span>
    </div>
  );
}
