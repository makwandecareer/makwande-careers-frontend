"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Plus,
  RefreshCw,
  Settings,
} from "lucide-react";

import { api } from "@/lib/client-api";
import styles from "./employer.module.css";

type Company = {
  name: string;
  industry?: string;
  location?: string;
  registration_number?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
};

type Job = {
  id: string;
  title: string;
  location?: string;
  employment_type: string;
  workplace_type: string;
  status: "draft" | "published" | "closed";
};

type Summary = {
  company: Company | null;
  metrics: {
    total_jobs: number;
    open_jobs: number;
    draft_jobs: number;
    closed_jobs: number;
  };
  recent_jobs: Job[];
};

const emptySummary: Summary = {
  company: null,
  metrics: { total_jobs: 0, open_jobs: 0, draft_jobs: 0, closed_jobs: 0 },
  recent_jobs: [],
};

function friendly(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EmployerPortalPage() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await api<Summary>("/api/employer/summary"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load employer portal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const completion = useMemo(() => {
    if (!summary.company) return 0;
    const fields = [
      summary.company.name,
      summary.company.industry,
      summary.company.location,
      summary.company.registration_number,
      summary.company.website,
      summary.company.email,
      summary.company.phone,
      summary.company.description,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [summary.company]);

  const metrics = [
    ["Published vacancies", summary.metrics.open_jobs, "Currently open"],
    ["Draft vacancies", summary.metrics.draft_jobs, "Waiting for publication"],
    ["Closed vacancies", summary.metrics.closed_jobs, "Recruitment completed"],
    ["Total vacancies", summary.metrics.total_jobs, "All company jobs"],
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <Building2 size={15} /> Employer command centre
          </span>
          <h1>{summary.company ? `Welcome, ${summary.company.name}` : "Build your employer workspace"}</h1>
          <p>Register your company, create vacancies and manage jobs from one connected workspace.</p>
          {error ? <p role="alert">{error}</p> : null}
        </div>

        <div className={styles.heroActions}>
          <button className={styles.secondaryButton} disabled={loading} onClick={() => void load()} type="button">
            <RefreshCw size={17} /> {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link className={styles.secondaryButton} href="/dashboard/employer/company">
            <Settings size={17} /> Company profile
          </Link>
          <Link className={styles.primaryButton} href="/dashboard/employer/jobs/new">
            <Plus size={18} /> Post a job
          </Link>
        </div>
      </section>

      <section className={styles.setupCard}>
        <div className={styles.setupIcon}><BadgeCheck size={26} /></div>
        <div className={styles.setupCopy}>
          <div className={styles.setupHeading}>
            <div>
              <span>Employer profile setup</span>
              <h2>{summary.company?.name ?? "Company profile not registered"}</h2>
            </div>
            <strong>{completion}% complete</strong>
          </div>
          <div className={styles.progress}><span style={{ width: `${completion}%` }} /></div>
          <p>{summary.company ? "Keep your organisation details accurate." : "Register your company before creating vacancies."}</p>
        </div>
        <Link href="/dashboard/employer/company">
          {summary.company ? "Update profile" : "Register company"} <ArrowRight size={16} />
        </Link>
      </section>

      <section className={styles.metrics}>
        {metrics.map(([label, value, helper]) => (
          <article className={styles.metricCard} key={String(label)}>
            <div className={styles.metricIcon}><BriefcaseBusiness size={21} /></div>
            <div>
              <span>{label}</span>
              <strong>{loading ? "—" : value}</strong>
              <small>{helper}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.jobsPanel}>
        <header className={styles.panelHeader}>
          <div><span>Vacancy management</span><h2>Recent jobs</h2></div>
          <Link href="/dashboard/employer/jobs">View all jobs <ArrowRight size={16} /></Link>
        </header>

        <div className={styles.jobsTable}>
          {summary.recent_jobs.length === 0 ? (
            <div>
              <h3>No vacancies yet</h3>
              <p>Create your first vacancy to begin.</p>
              <Link href="/dashboard/employer/jobs/new">Create vacancy</Link>
            </div>
          ) : summary.recent_jobs.map((job) => (
            <article key={job.id}>
              <div className={styles.jobIdentity}>
                <div><BriefcaseBusiness size={19} /></div>
                <span>
                  <strong>{job.title}</strong>
                  <small>{job.location || "Location not set"} • {friendly(job.employment_type)}</small>
                </span>
              </div>
              <strong>{friendly(job.workplace_type)}</strong>
              <strong>—</strong>
              <span className={job.status === "published" ? styles.activeStatus : styles.draftStatus}>
                {friendly(job.status)}
              </span>
              <Link aria-label={`Open ${job.title}`} href={`/dashboard/employer/jobs/${job.id}`}>
                <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
