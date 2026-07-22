"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileCheck2,
  FilePenLine,
  FilePlus2,
  Gauge,
  Pencil,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/client-api";
import type { GeneratedCV, ProfileBundle } from "@/lib/types";
import styles from "./dashboard-home.module.css";

type ChecklistItem = {
  title: string;
  description: string;
  action: string;
  href: string;
  complete: boolean;
  icon: typeof Gauge;
};

export default function DashboardPage() {
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [cvs, setCvs] = useState<GeneratedCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<ProfileBundle>("/api/profile/source-of-truth"),
      api<GeneratedCV[]>("/api/cvs"),
    ])
      .then(([profile, documents]) => {
        setBundle(profile);
        setCvs(documents);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load your career dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const primaryCV = cvs[0];
  const strength = Math.max(0, Math.min(100, bundle?.completion.percentage ?? 0));
  const checklist = useMemo<ChecklistItem[]>(() => [
    {
      title: primaryCV ? "Your CV is ready to improve" : "Create your first professional CV",
      description: primaryCV ? "Open your latest CV, refine the content and keep every version together." : "Build from your career profile or upload an existing CV.",
      action: primaryCV ? "Edit CV" : "Create CV",
      href: primaryCV ? "/dashboard/cv-studio" : "/dashboard/cv-builder?workspace=cv-intake-revamp",
      complete: Boolean(primaryCV),
      icon: FilePenLine,
    },
    {
      title: "Check ATS strength",
      description: "Identify formatting, keyword and evidence gaps before applying.",
      action: "Run CV check",
      href: "/dashboard/cv-builder?workspace=ats",
      complete: Boolean(bundle?.ats_history.length),
      icon: ScanSearch,
    },
    {
      title: "Complete your career profile",
      description: `${strength}% complete - add verified achievements for stronger AI recommendations.`,
      action: "Improve profile",
      href: "/dashboard/profile",
      complete: strength >= 80,
      icon: Gauge,
    },
    {
      title: "Create a tailored cover letter",
      description: "Generate a matching letter from your CV and the target job description.",
      action: "Build cover letter",
      href: "/dashboard/cover-letter",
      complete: false,
      icon: FileCheck2,
    },
  ], [bundle?.ats_history.length, primaryCV, strength]);
  const completeCount = checklist.filter((item) => item.complete).length;

  if (loading) return <div className={styles.loading}><span className="spinner" /> Preparing your career command centre.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div><span>Career command centre</span><h1>Get ready to apply</h1><p>Build, improve and manage every career document from one focused workspace.</p></div>
        <Link href="/dashboard/cv-builder?workspace=cv-intake-revamp" className={styles.primary}><FilePlus2 size={18} /> Create new CV</Link>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className={styles.layout}>
        <aside className={styles.resumeCard}>
          <div className={styles.cardLabel}>Primary CV</div>
          <div className={styles.select}>{primaryCV?.title || "No saved CV yet"}<span>?</span></div>
          <div className={styles.paper}>
            <div className={styles.paperName}>{bundle?.user.full_name || "Your name"}</div>
            <div className={styles.paperRole}>{primaryCV?.target_role || bundle?.profile?.professional_title || "Professional title"}</div>
            <div className={styles.paperRule} />
            <strong>Professional summary</strong><i /><i /><i className={styles.short} />
            <strong>Experience</strong><i /><i /><i /><i className={styles.short} />
            <strong>Skills</strong><div className={styles.skillLines}><i /><i /><i /><i /></div>
          </div>
          <div className={styles.documentActions}>
            <Link href="/dashboard/cv-studio"><Pencil size={16} /> Edit</Link>
            <Link href="/dashboard/cv-builder"><Download size={16} /> Download</Link>
          </div>
          <div className={styles.strength}><span>CV strength</span><strong>{strength}</strong><Link href="/dashboard/profile">Improve</Link></div>
          <Link className={styles.newDocument} href="/dashboard/cv-builder?workspace=cv-intake-revamp">+ Create another CV</Link>
        </aside>

        <section className={styles.checklist}>
          <header><div><span>Your checklist</span><h2>Build a complete application</h2></div><div className={styles.progressText}>Completed <strong>{completeCount} of {checklist.length}</strong></div></header>
          <div className={styles.progressBar}><span style={{ width: `${(completeCount / checklist.length) * 100}%` }} /></div>
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <div className={styles.taskIcon}><Icon size={24} /></div>
                <div className={styles.taskCopy}><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action} <ArrowRight size={16} /></Link></div>
                <div className={item.complete ? styles.complete : styles.incomplete}>{item.complete ? <Check size={14} /> : null}{item.complete ? "Complete" : "Next step"}</div>
              </article>
            );
          })}
        </section>
      </div>

      <section className={styles.quickTools}>
        <div><Sparkles size={22} /><span><strong>AI CV improvement</strong><small>Rewrite verified experience into stronger evidence.</small></span><Link href="/dashboard/cv-builder?workspace=writer">Open tool</Link></div>
        <div><ScanSearch size={22} /><span><strong>Job match analysis</strong><small>Compare your CV with a target vacancy.</small></span><Link href="/dashboard/cv-builder?workspace=matching">Match CV</Link></div>
        <div><FileCheck2 size={22} /><span><strong>Application documents</strong><small>Access CVs, templates and cover letters.</small></span><Link href="/dashboard/cvs">View all</Link></div>
      </section>
    </div>
  );
}
