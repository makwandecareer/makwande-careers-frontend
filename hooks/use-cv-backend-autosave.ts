"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudioDraft } from "@/lib/cv-studio";
import {
  createSavedCV,
  updateSavedCV,
  type SavedCV,
} from "@/lib/cv-backend";

const ACTIVE_CV_ID_KEY = "makwande_active_cv_id";
const ACTIVE_CV_VERSION_KEY = "makwande_active_cv_version";

export type BackendSaveState =
  | "idle"
  | "unsaved"
  | "saving"
  | "saved"
  | "offline"
  | "error";

type UseCVBackendAutosaveResult = {
  savedCV: SavedCV | null;
  backendSaveState: BackendSaveState;
  backendSaveError: string;
  lastSavedAt: Date | null;
  saveNow: () => Promise<SavedCV | null>;
};

function serializeDraft(draft: StudioDraft): string {
  return JSON.stringify(draft);
}

function getStoredVersion(): number {
  if (typeof window === "undefined") return 1;

  const value = Number(
    window.localStorage.getItem(ACTIVE_CV_VERSION_KEY),
  );

  return Number.isFinite(value) && value > 0 ? value : 1;
}

function isMissingCVError(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message.toLowerCase()
      : String(reason).toLowerCase();

  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error && reason.message.trim()) {
    return reason.message;
  }

  return "Unable to save your CV to the server.";
}

export function useCVBackendAutosave(
  draft: StudioDraft | null,
  delay = 2500,
): UseCVBackendAutosaveResult {
  const [savedCV, setSavedCV] = useState<SavedCV | null>(null);
  const [backendSaveState, setBackendSaveState] =
    useState<BackendSaveState>("idle");
  const [backendSaveError, setBackendSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef<StudioDraft | null>(draft);
  const lastSavedSnapshotRef = useRef("");
  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);
  const savedCVRef = useRef<SavedCV | null>(null);
  const scheduleSaveFeedback = useCallback(
    (state: BackendSaveState, error = "") => {
      queueMicrotask(() => {
        if (!mountedRef.current) return;
        setBackendSaveState(state);
        setBackendSaveError(error);
      });
    },
    [],
  );

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    savedCVRef.current = savedCV;
  }, [savedCV]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const persistSuccessfulSave = useCallback(
    (result: SavedCV, snapshot: string) => {
      window.localStorage.setItem(ACTIVE_CV_ID_KEY, result.id);
      window.localStorage.setItem(
        ACTIVE_CV_VERSION_KEY,
        String(result.version),
      );

      lastSavedSnapshotRef.current = snapshot;
      savedCVRef.current = result;

      if (!mountedRef.current) return;

      setSavedCV(result);
      setLastSavedAt(new Date());
      setBackendSaveState("saved");
      setBackendSaveError("");
    },
    [],
  );

  const createNewCV = useCallback(
    async (
      currentDraft: StudioDraft,
      snapshot: string,
    ): Promise<SavedCV> => {
      const result = await createSavedCV(currentDraft);

      persistSuccessfulSave(result, snapshot);

      return result;
    },
    [persistSuccessfulSave],
  );

  const saveDraft = useCallback(
    async (
      candidate?: StudioDraft | null,
    ): Promise<SavedCV | null> => {
      const currentDraft = candidate ?? latestDraftRef.current;

      if (!currentDraft) {
        return null;
      }

      const snapshot = serializeDraft(currentDraft);

      if (snapshot === lastSavedSnapshotRef.current) {
        if (mountedRef.current) {
          setBackendSaveState("saved");
          setBackendSaveError("");
        }

        return savedCVRef.current;
      }

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        if (mountedRef.current) {
          setBackendSaveState("offline");
          setBackendSaveError(
            "You are offline. Your CV is saved on this device and will sync when you reconnect.",
          );
        }

        return null;
      }

      const requestSequence = ++requestSequenceRef.current;

      if (mountedRef.current) {
        setBackendSaveState("saving");
        setBackendSaveError("");
      }

      try {
        const activeCVId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ACTIVE_CV_ID_KEY)
            : null;

        if (!activeCVId) {
          const created = await createNewCV(
            currentDraft,
            snapshot,
          );

          return requestSequence === requestSequenceRef.current
            ? created
            : null;
        }

        const currentVersion =
          savedCVRef.current?.version ?? getStoredVersion();

        try {
          const updated = await updateSavedCV(
            activeCVId,
            currentDraft,
            currentVersion,
          );

          if (requestSequence !== requestSequenceRef.current) {
            return updated;
          }

          persistSuccessfulSave(updated, snapshot);

          return updated;
        } catch (reason) {
          if (!isMissingCVError(reason)) {
            throw reason;
          }

          window.localStorage.removeItem(ACTIVE_CV_ID_KEY);
          window.localStorage.removeItem(ACTIVE_CV_VERSION_KEY);
          savedCVRef.current = null;

          if (mountedRef.current) {
            setSavedCV(null);
          }

          const recreated = await createNewCV(
            currentDraft,
            snapshot,
          );

          return requestSequence === requestSequenceRef.current
            ? recreated
            : null;
        }
      } catch (reason) {
        if (requestSequence !== requestSequenceRef.current) {
          return null;
        }

        if (mountedRef.current) {
          setBackendSaveState("error");
          setBackendSaveError(getErrorMessage(reason));
        }

        return null;
      }
    },
    [createNewCV, persistSuccessfulSave],
  );

  const saveNow = useCallback(async (): Promise<SavedCV | null> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    return saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    if (!draft) return;

    const snapshot = serializeDraft(draft);

    if (snapshot === lastSavedSnapshotRef.current) {
      scheduleSaveFeedback("saved");
      return;
    }

    const isOffline =
      typeof navigator !== "undefined" &&
      !navigator.onLine;

    if (isOffline) {
      scheduleSaveFeedback(
        "offline",
        "You are offline. Your CV is saved on this device and will sync when you reconnect.",
      );
      return;
    }

    scheduleSaveFeedback("unsaved");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void saveDraft(draft);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [draft, delay, saveDraft, scheduleSaveFeedback]);

  useEffect(() => {
    function handleOnline(): void {
      setBackendSaveError("");

      if (latestDraftRef.current) {
        void saveNow();
      }
    }

    function handleOffline(): void {
      setBackendSaveState("offline");
      setBackendSaveError(
        "You are offline. Your CV is saved on this device and will sync when you reconnect.",
      );
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveNow]);

  return {
    savedCV,
    backendSaveState,
    backendSaveError,
    lastSavedAt,
    saveNow,
  };
}