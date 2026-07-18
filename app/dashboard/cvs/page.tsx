"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileClock,
  FilePlus2,
  FolderOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteSavedCV,
  duplicateSavedCV,
  listCVVersions,
  listSavedCVs,
  restoreCVVersion,
  type SavedCV,
  type SavedCVVersion,
} from "@/lib/cv-backend";

const ACTIVE_CV_ID_KEY = "makwande_active_cv_id";
const ACTIVE_CV_VERSION_KEY = "makwande_active_cv_version";
const STUDIO_DRAFT_KEY = "makwande_cv_studio_draft";

type SortOption = "updated-desc" | "updated-asc" | "title-asc";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTemplateLabel(templateKey: string): string {
  return templateKey
    .replace(/^real-/, "Template ")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CVsPage() {
  const router = useRouter();

  const [items, setItems] = useState<SavedCV[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("updated-desc");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [historyCV, setHistoryCV] = useState<SavedCV | null>(null);
  const [versions, setVersions] = useState<SavedCVVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const savedCVs = await listSavedCVs();
      setItems(savedCVs);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load your CVs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = normalizedQuery
      ? items.filter((item) => {
          const searchText = [
            item.title,
            item.target_role ?? "",
            item.template_key,
          ]
            .join(" ")
            .toLowerCase();

          return searchText.includes(normalizedQuery);
        })
      : [...items];

    result.sort((left, right) => {
      if (sort === "title-asc") {
        return left.title.localeCompare(right.title);
      }

      const leftTime = new Date(left.updated_at).getTime();
      const rightTime = new Date(right.updated_at).getTime();

      return sort === "updated-asc"
        ? leftTime - rightTime
        : rightTime - leftTime;
    });

    return result;
  }, [items, query, sort]);

  function openCV(item: SavedCV): void {
    window.localStorage.setItem(ACTIVE_CV_ID_KEY, item.id);
    window.localStorage.setItem(
      ACTIVE_CV_VERSION_KEY,
      String(item.version),
    );
    window.localStorage.setItem(
      STUDIO_DRAFT_KEY,
      JSON.stringify(item.content),
    );

    router.push("/dashboard/cv-builder");
  }

  async function handleDuplicate(item: SavedCV): Promise<void> {
    setWorkingId(item.id);
    setError("");
    setNotice("");

    try {
      const duplicate = await duplicateSavedCV(item.id);
      setItems((current) => [duplicate, ...current]);
      setNotice(`Created a copy of “${item.title}”.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to duplicate this CV.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(item: SavedCV): Promise<void> {
    const confirmed = window.confirm(
      `Delete “${item.title}”? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setWorkingId(item.id);
    setError("");
    setNotice("");

    try {
      await deleteSavedCV(item.id);
      setItems((current) =>
        current.filter((candidate) => candidate.id !== item.id),
      );

      if (
        window.localStorage.getItem(ACTIVE_CV_ID_KEY) === item.id
      ) {
        window.localStorage.removeItem(ACTIVE_CV_ID_KEY);
        window.localStorage.removeItem(ACTIVE_CV_VERSION_KEY);
      }

      setNotice(`Deleted “${item.title}”.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to delete this CV.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function openHistory(item: SavedCV): Promise<void> {
    setHistoryCV(item);
    setVersions([]);
    setHistoryLoading(true);
    setError("");

    try {
      const result = await listCVVersions(item.id);
      setVersions(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load version history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleRestore(
    version: SavedCVVersion,
  ): Promise<void> {
    if (!historyCV) return;

    const confirmed = window.confirm(
      `Restore version ${version.version_number} of “${historyCV.title}”?`,
    );

    if (!confirmed) return;

    setWorkingId(version.id);
    setError("");
    setNotice("");

    try {
      const restored = await restoreCVVersion(
        historyCV.id,
        version.id,
      );

      setItems((current) =>
        current.map((item) =>
          item.id === restored.id ? restored : item,
        ),
      );

      setHistoryCV(restored);
      setNotice(
        `Restored “${restored.title}” to version ${version.version_number}.`,
      );

      const refreshedVersions = await listCVVersions(restored.id);
      setVersions(refreshedVersions);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to restore this version.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Document library</span>
          <h1>My CVs</h1>
          <p className="muted">
            Open, duplicate, delete and restore your professional CVs.
          </p>
        </div>

        <Link
          className="button button-primary"
          href="/dashboard/cv-builder"
        >
          <FilePlus2 size={17} />
          Create a new CV
        </Link>
      </header>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div className="success" role="status">
          {notice}
        </div>
      )}

      <section className="card">
        <div className="cv-library-controls">
          <label className="cv-library-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by CV title, role or template"
              aria-label="Search CVs"
            />
          </label>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as SortOption)
            }
            aria-label="Sort CVs"
          >
            <option value="updated-desc">Recently updated</option>
            <option value="updated-asc">Oldest updated</option>
            <option value="title-asc">Title A–Z</option>
          </select>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="loading">
            <span className="spinner" />
            Loading CVs...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="empty-state">
            <FilePlus2 size={34} />
            <h3>No CVs saved yet</h3>
            <p className="muted">
              Build your first ATS-ready CV using your saved career
              profile.
            </p>
            <Link
              className="button button-primary"
              href="/dashboard/cv-builder"
            >
              Build my first CV
            </Link>
          </div>
        )}

        {!loading &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <div className="empty-state">
              <Search size={30} />
              <h3>No matching CVs</h3>
              <p className="muted">
                Try a different title, target role or template name.
              </p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            </div>
          )}

        {!loading && filteredItems.length > 0 && (
          <>
            <div className="cv-library-summary">
              <strong>
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "CV" : "CVs"}
              </strong>
              <span className="muted">
                {query ? `matching “${query}”` : "in your library"}
              </span>
            </div>

            <div className="cv-library-grid">
              {filteredItems.map((item) => {
                const isWorking = workingId === item.id;

                return (
                  <article
                    className="cv-library-card"
                    key={item.id}
                  >
                    <button
                      type="button"
                      className="cv-library-preview"
                      onClick={() => openCV(item)}
                      aria-label={`Open ${item.title}`}
                    >
                      <span className="cv-library-brand" />
                      <span />
                      <span />
                      <span className="short" />
                      <span />
                      <span className="short" />
                    </button>

                    <div className="cv-library-card-body">
                      <div className="cv-library-card-heading">
                        <div>
                          <h3>{item.title || "Untitled CV"}</h3>
                          <p className="muted">
                            {item.target_role || "No target role"}
                          </p>
                        </div>

                        <span className="tag">
                          v{item.version}
                        </span>
                      </div>

                      <div className="cv-library-meta">
                        <span>
                          {getTemplateLabel(item.template_key)}
                        </span>
                        <span>
                          Updated {formatDate(item.updated_at)}
                        </span>
                      </div>

                      <div className="cv-library-actions">
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => openCV(item)}
                        >
                          <FolderOpen size={16} />
                          Open
                        </button>

                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() =>
                            void handleDuplicate(item)
                          }
                          disabled={isWorking}
                          title="Duplicate CV"
                        >
                          <Copy size={16} />
                          Duplicate
                        </button>

                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => void openHistory(item)}
                          disabled={isWorking}
                          title="Version history"
                        >
                          <FileClock size={16} />
                          History
                        </button>

                        <button
                          type="button"
                          className="button button-danger"
                          onClick={() => void handleDelete(item)}
                          disabled={isWorking}
                          title="Delete CV"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {historyCV && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHistoryCV(null);
            }
          }}
        >
          <section
            className="modal-card cv-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-history-title"
          >
            <header className="modal-header">
              <div>
                <span className="eyebrow">Version history</span>
                <h2 id="cv-history-title">
                  {historyCV.title}
                </h2>
                <p className="muted">
                  Restore an earlier saved version of this CV.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setHistoryCV(null)}
                aria-label="Close version history"
              >
                <X size={19} />
              </button>
            </header>

            {historyLoading && (
              <div className="loading">
                <span className="spinner" />
                Loading version history...
              </div>
            )}

            {!historyLoading && versions.length === 0 && (
              <div className="empty-state">
                <FileClock size={30} />
                <h3>No earlier versions</h3>
                <p className="muted">
                  Versions will appear here after the CV is updated.
                </p>
              </div>
            )}

            {!historyLoading && versions.length > 0 && (
              <div className="cv-version-list">
                {versions.map((version) => (
                  <article
                    className="cv-version-item"
                    key={version.id}
                  >
                    <div>
                      <strong>
                        Version {version.version_number}
                      </strong>
                      <p className="muted">
                        {formatDate(version.created_at)}
                      </p>
                      <span className="tag">
                        {version.target_role ||
                          "No target role"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() =>
                        void handleRestore(version)
                      }
                      disabled={workingId === version.id}
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}