"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { api } from "@/lib/client-api";
import type { GeneratedCV } from "@/lib/types";
import "./cv-library-dashboard.css";

const CORE_SECTIONS = [
  "personal_details",
  "professional_summary",
  "experience",
  "education",
  "skills",
] as const;

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasValue);
  }
  return Boolean(value);
}

function completionFor(item: GeneratedCV): number {
  const content = safeObject(item.content);
  const completed = CORE_SECTIONS.filter((section) =>
    hasValue(content[section]),
  ).length;
  return Math.round((completed / CORE_SECTIONS.length) * 100);
}

function formatDate(value?: string): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function relativeDate(value?: string): string {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved yet";

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 30) return `Updated ${days} days ago`;
  return `Updated ${formatDate(value)}`;
}

export default function CVsPage() {
  const [items, setItems] = useState<GeneratedCV[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      setItems(await api<GeneratedCV[]>("/api/cvs"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load your CVs.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const dashboard = useMemo(() => {
    const completionValues = items.map(completionFor);
    const averageCompletion = completionValues.length
      ? Math.round(
          completionValues.reduce((total, value) => total + value, 0) /
            completionValues.length,
        )
      : 0;

    const readyCount = completionValues.filter((value) => value >= 80).length;
    const mostRecent = [...items].sort((a, b) => {
      const first = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const second = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      return second - first;
    })[0];

    return {
      averageCompletion,
      readyCount,
      mostRecent,
    };
  }, [items]);

  return (
    <div className="cv-dashboard">
      <header className="cv-dashboard-hero">
        <div>
          <span className="eyebrow">CV Builder workspace</span>
          <h1>Build a CV that is ready for opportunity</h1>
          <p>
            Create, improve and manage professional CVs from one focused
            workspace. Your documents remain available whenever you return.
          </p>
        </div>

        <div className="cv-dashboard-hero-actions">
          <Link className="button button-primary" href="/dashboard/cv-builder">
            <FilePlus2 size={18} />
            Create a new CV
          </Link>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "cv-spin" : ""} size={18} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error cv-dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="cv-metric-grid" aria-label="CV workspace overview">
        <article>
          <div className="cv-metric-icon">
            <FileText size={21} />
          </div>
          <span>Saved CVs</span>
          <strong>{items.length}</strong>
          <small>Your complete document library</small>
        </article>

        <article>
          <div className="cv-metric-icon">
            <BarChart3 size={21} />
          </div>
          <span>Average completion</span>
          <strong>{dashboard.averageCompletion}%</strong>
          <small>Based on essential CV sections</small>
        </article>

        <article>
          <div className="cv-metric-icon">
            <CheckCircle2 size={21} />
          </div>
          <span>Recruiter-ready CVs</span>
          <strong>{dashboard.readyCount}</strong>
          <small>CVs with at least 80% completion</small>
        </article>

        <article>
          <div className="cv-metric-icon">
            <Clock3 size={21} />
          </div>
          <span>Latest activity</span>
          <strong className="cv-metric-date">
            {dashboard.mostRecent
              ? formatDate(
                  dashboard.mostRecent.updated_at ??
                    dashboard.mostRecent.created_at,
                )
              : "No activity"}
          </strong>
          <small>Most recent saved update</small>
        </article>
      </section>

      <section className="cv-dashboard-layout">
        <div className="cv-dashboard-main">
          <div className="cv-section-heading">
            <div>
              <span className="eyebrow">Document library</span>
              <h2>My CVs</h2>
              <p>Continue editing an existing CV or create a tailored version.</p>
            </div>
            {items.length > 0 && (
              <span className="cv-document-count">
                {items.length} {items.length === 1 ? "document" : "documents"}
              </span>
            )}
          </div>

          {loading && (
            <div className="card cv-loading-state">
              <LoaderCircle className="cv-spin" size={25} />
              <div>
                <strong>Loading your CV workspace</strong>
                <p>Please wait while we retrieve your saved documents.</p>
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="card cv-empty-state">
              <div className="cv-empty-icon">
                <FileText size={32} />
              </div>
              <span className="eyebrow">Your first CV starts here</span>
              <h2>Create a professional, ATS-friendly CV</h2>
              <p>
                Add your career information, select a professional template and
                use Makwande Careers tools to strengthen your application.
              </p>
              <Link className="button button-primary" href="/dashboard/cv-builder">
                Build my first CV
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="cv-library-grid cv-library-grid-v2">
              {items.map((item, index) => {
                const completion = completionFor(item);
                const savedAt = item.updated_at ?? item.created_at;

                return (
                  <article
                    className="cv-library-card cv-library-card-v2"
                    key={String(item.id || index)}
                  >
                    <div className="cv-library-preview cv-library-preview-v2">
                      <div className="cv-paper-header">
                        <span />
                        <span />
                      </div>
                      <span className="cv-library-brand" />
                      <span />
                      <span />
                      <span className="short" />
                      <span />
                      <span className="short" />
                      <div className="cv-preview-footer">
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="cv-library-content">
                      <div className="cv-card-topline">
                        <span className="tag">
                          {item.template_key || "ATS Standard"}
                        </span>
                        <span className="cv-completion-label">
                          {completion}% complete
                        </span>
                      </div>

                      <div>
                        <h3>{item.title || "Untitled CV"}</h3>
                        <p className="cv-target-role">
                          <BriefcaseBusiness size={16} />
                          {item.target_role || "Target role not added"}
                        </p>
                      </div>

                      <div className="cv-progress" aria-label={`${completion}% complete`}>
                        <span style={{ width: `${completion}%` }} />
                      </div>

                      <div className="cv-card-footer">
                        <small>{relativeDate(savedAt)}</small>
                        <Link
                          className="button button-secondary"
                          href="/dashboard/cv-builder"
                        >
                          Open builder
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="cv-dashboard-sidebar">
          <section className="card cv-next-step-card">
            <div className="cv-side-icon">
              <Target size={22} />
            </div>
            <span className="eyebrow">Recommended next step</span>
            <h3>
              {items.length === 0
                ? "Create your first professional CV"
                : dashboard.averageCompletion < 80
                  ? "Complete your essential CV sections"
                  : "Run an ATS analysis before applying"}
            </h3>
            <p>
              {items.length === 0
                ? "Start with your career profile and build a tailored CV for the role you want."
                : dashboard.averageCompletion < 80
                  ? "Strengthen personal details, summary, experience, education and skills."
                  : "Check keywords, formatting and recruiter readiness against your target role."}
            </p>
            <Link className="cv-text-link" href="/dashboard/cv-builder">
              Continue in CV Builder
              <ArrowRight size={16} />
            </Link>
          </section>

          <section className="card cv-feature-card">
            <div className="cv-side-icon">
              <Sparkles size={22} />
            </div>
            <span className="eyebrow">Built for stronger applications</span>
            <ul>
              <li>
                <CheckCircle2 size={17} />
                Professional CV templates
              </li>
              <li>
                <CheckCircle2 size={17} />
                ATS analysis and recommendations
              </li>
              <li>
                <CheckCircle2 size={17} />
                AI-supported career writing
              </li>
              <li>
                <CheckCircle2 size={17} />
                PDF and DOCX export tools
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
