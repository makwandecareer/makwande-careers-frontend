"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Copy, Plus, Search, Send, XCircle } from "lucide-react";
import { api } from "@/lib/client-api";
import styles from "./jobs.module.css";

type Job = {
  id: string;
  title: string;
  location?: string;
  employment_type: string;
  workplace_type: string;
  status: "draft" | "published" | "closed";
};

function friendly(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setJobs((await api<{ jobs: Job[] }>("/api/employer/jobs")).jobs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load jobs.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: "publish" | "close" | "duplicate") {
    setWorkingId(id);
    setError("");
    try {
      await api(`/api/employer/jobs/${id}/${action}`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to ${action} vacancy.`);
    } finally {
      setWorkingId("");
    }
  }

  const shown = useMemo(
    () => jobs.filter((job) => job.title.toLowerCase().includes(query.toLowerCase())),
    [jobs, query],
  );

  return (
    <main className={styles.page}>
      <header>
        <div><span>Vacancy management</span><h1>Jobs</h1><p>Create, publish and manage every vacancy.</p></div>
        <Link href="/dashboard/employer/jobs/new"><Plus size={18} />Post a job</Link>
      </header>

      <div className={styles.toolbar}>
        <Search size={17} />
        <input placeholder="Search jobs" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section>
        {shown.length === 0 ? (
          <article>
            <BriefcaseBusiness size={21} />
            <div><small>Ready to begin</small><h2>No vacancies found</h2><p>Create a vacancy or change your search.</p></div>
            <aside><Link href="/dashboard/employer/jobs/new"><Plus size={15} />Create vacancy</Link></aside>
          </article>
        ) : shown.map((job) => (
          <article key={job.id}>
            <BriefcaseBusiness size={21} />
            <div>
              <small>{friendly(job.status)}</small>
              <h2>{job.title}</h2>
              <p>{job.location || "Location not set"} • {friendly(job.employment_type)} • {friendly(job.workplace_type)}</p>
            </div>
            <aside>
              {job.status === "draft" ? <button disabled={workingId === job.id} onClick={() => void act(job.id, "publish")}><Send size={15} />Publish</button> : null}
              {job.status === "published" ? <button disabled={workingId === job.id} onClick={() => void act(job.id, "close")}><XCircle size={15} />Close</button> : null}
              <button disabled={workingId === job.id} onClick={() => void act(job.id, "duplicate")}><Copy size={15} />Duplicate</button>
              <Link href={`/dashboard/employer/jobs/${job.id}`}><ArrowRight size={17} /></Link>
            </aside>
          </article>
        ))}
      </section>
    </main>
  );
}
