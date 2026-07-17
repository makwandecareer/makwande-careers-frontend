"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudioDraft } from "@/lib/cv-studio";
import { createSavedCV, updateSavedCV, type SavedCV } from "@/lib/cv-backend";

const ACTIVE_CV_KEY = "makwande_active_cv_id";

export type BackendSaveState = "idle" | "unsaved" | "saving" | "saved" | "error" | "offline";

function serializeDraft(draft: StudioDraft): string {
  return JSON.stringify(draft);
}

function isMissingCVError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message.toLowerCase() : String(reason).toLowerCase();
  return message.includes("404") || message.includes("not found") || message.includes("does not exist");
}

export function useCVBackendAutosave(draft: StudioDraft | null, delay = 2500) {
  const [savedCV, setSavedCV] = useState<SavedCV | null>(null);
  const [state, setState] = useState<BackendSaveState>("idle");
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef<StudioDraft | null>(draft);
  const lastSavedSnapshotRef = useRef("");
  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => { latestDraftRef.current = draft; }, [draft]);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const saveDraft = useCallback(async (candidate?: StudioDraft | null) => {
    const currentDraft = candidate ?? latestDraftRef.current;
    if (!currentDraft) return null;

    const snapshot = serializeDraft(currentDraft);
    if (snapshot === lastSavedSnapshotRef.current) {
      if (mountedRef.current) { setState("saved"); setError(""); }
      return savedCV;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (mountedRef.current) {
        setState("offline");
        setError("You are offline. Your CV is saved on this device and will sync when you reconnect.");
      }
      return null;
    }

    const requestSequence = ++requestSequenceRef.current;
    if (mountedRef.current) { setState("saving"); setError(""); }

    try {
      const activeId = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_CV_KEY) : null;
      let result: SavedCV;

      if (activeId) {
        try {
          result = await updateSavedCV(activeId, currentDraft);
        } catch (reason) {
          if (!isMissingCVError(reason)) throw reason;
          window.localStorage.removeItem(ACTIVE_CV_KEY);
          result = await createSavedCV(currentDraft);
        }
      } else {
        result = await createSavedCV(currentDraft);
      }

      if (requestSequence !== requestSequenceRef.current) return result;

      window.localStorage.setItem(ACTIVE_CV_KEY, result.id);
      lastSavedSnapshotRef.current = snapshot;
      if (mountedRef.current) {
        setSavedCV(result);
        setLastSavedAt(new Date());
        setState("saved");
        setError("");
      }
      return result;
    } catch (reason) {
      if (requestSequence !== requestSequenceRef.current) return null;
      if (mountedRef.current) {
        setState("error");
        setError(reason instanceof Error ? reason.message : "Unable to save your CV to the server.");
      }
      return null;
    }
  }, [savedCV]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    return saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    if (!draft) return;
    const snapshot = serializeDraft(draft);
    if (snapshot === lastSavedSnapshotRef.current) { setState("saved"); return; }

    setState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void saveDraft(draft); }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [draft, delay, saveDraft]);

  useEffect(() => {
    function handleOnline() { if (latestDraftRef.current) void saveNow(); }
    function handleOffline() {
      setState("offline");
      setError("You are offline. Your CV is saved on this device and will sync when you reconnect.");
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveNow]);

  return { savedCV, backendSaveState: state, backendSaveError: error, lastSavedAt, saveNow };
}
