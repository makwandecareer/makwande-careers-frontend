"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy, Send, Trash2, XCircle } from "lucide-react";
import { api } from "@/lib/client-api";
import styles from "../jobs.module.css";

type Job = {
  id: string;
  title: string;
  location?: string;
  workplace_type: string;
  employment_type: string;
  status: "draft" | "published" | "closed";
  summary?: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
};

function friendly(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      setJob((await api<{ job: Job }>(`/api/employer/jobs/${params.id}`)).job);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load vacancy.");
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function action(name: "publish" | "close" | "duplicate") {
    setWorking(true);
    setError("");
    try {
      const response = await api<{ job: Job }>(`/api/employer/jobs/${params.id}/${name}`, { method: "POST" });
      if (name === "duplicate") router.push(`/dashboard/employer/jobs/${response.job.id}`);
      else setJob(response.job);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to ${name} vacancy.`);
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this vacancy permanently?")) return;
    setWorking(true);
    try {
      await api(`/api/employer/jobs/${params.id}`, { method: "DELETE" });
      router.push("/dashboard/employer/jobs");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete vacancy.");
      setWorking(false);
    }
  }

  if (!job) {
    return <main className={styles.page}><Link href="/dashboard/employer/jobs"><ArrowLeft size={17} />Jobs</Link><p>{error || "Loading vacancy..."}</p></main>;
  }

  return (
    <main className={styles.page}>
      <header>
        <div>
          <Link href="/dashboard/employer/jobs"><ArrowLeft size={17} />Jobs</Link>
          <span>{friendly(job.status)}</span>
          <h1>{job.title}</h1>
          <p>{job.location || "Location not set"} • {friendly(job.employment_type)} • {friendly(job.workplace_type)}</p>
        </div>
        <aside>
          {job.status === "draft" ? <button disabled={working} onClick={() => void action("publish")}><Send size={15} />Publish</button> : null}
          {job.status === "published" ? <button disabled={working} onClick={() => void action("close")}><XCircle size={15} />Close</button> : null}
          <button disabled={working} onClick={() => void action("duplicate")}><Copy size={15} />Duplicate</button>
          <button disabled={working} onClick={() => void remove()}><Trash2 size={15} />Delete</button>
        </aside>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section>
        <article><div><small>Role summary</small><h2>About this vacancy</h2><p>{job.summary || "No summary provided."}</p></div></article>
        {[
          ["Responsibilities", job.responsibilities],
          ["Requirements", job.requirements],
          ["Skills", job.skills],
          ["Benefits", job.benefits],
        ].map(([title, values]) => (
          <article key={title as string}>
            <div>
              <h2>{title as string}</h2>
              {(values as string[]).length ? <ul>{(values as string[]).map((value) => <li key={value}>{value}</li>)}</ul> : <p>None provided.</p>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
