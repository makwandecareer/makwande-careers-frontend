"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileSearch,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";

import styles from "./employer.module.css";

type Metric = {
  label: string;
  value: string;
  helper: string;
  icon: typeof Building2;
  tone: "blue" | "green" | "amber" | "violet";
};

type Job = {
  title: string;
  location: string;
  type: string;
  applicants: number;
  shortlisted: number;
  status: "Active" | "Draft";
};

const jobs: Job[] = [
  {
    title: "Graduate Supply Chain Coordinator",
    location: "Johannesburg, Gauteng",
    type: "Full-time",
    applicants: 48,
    shortlisted: 9,
    status: "Active",
  },
  {
    title: "Customer Service Team Leader",
    location: "Cape Town, Western Cape",
    type: "Full-time",
    applicants: 31,
    shortlisted: 6,
    status: "Active",
  },
  {
    title: "Junior Financial Administrator",
    location: "Pretoria, Gauteng",
    type: "Hybrid",
    applicants: 0,
    shortlisted: 0,
    status: "Draft",
  },
];

const pipeline = [
  { label: "New applicants", value: 79 },
  { label: "AI screened", value: 54 },
  { label: "Shortlisted", value: 15 },
  { label: "Interview", value: 7 },
  { label: "Offer", value: 2 },
];

export default function EmployerPortalPage() {
  const [period, setPeriod] = useState("30 days");

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: "Open vacancies",
        value: "2",
        helper: "+1 this month",
        icon: BriefcaseBusiness,
        tone: "blue",
      },
      {
        label: "Active candidates",
        value: "79",
        helper: "Across all vacancies",
        icon: UsersRound,
        tone: "green",
      },
      {
        label: "Interviews",
        value: "7",
        helper: "3 scheduled this week",
        icon: CalendarDays,
        tone: "amber",
      },
      {
        label: "Average match score",
        value: "82%",
        helper: "AI-ranked candidates",
        icon: Sparkles,
        tone: "violet",
      },
    ],
    [],
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <Building2 size={15} />
            Employer command centre
          </span>
          <h1>Find, evaluate and hire the right people.</h1>
          <p>
            Manage vacancies, discover qualified candidates and move every
            applicant through one intelligent recruitment workspace.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button className={styles.secondaryButton} type="button">
            <Settings size={17} />
            Company profile
          </button>
          <button className={styles.primaryButton} type="button">
            <Plus size={18} />
            Post a job
          </button>
        </div>
      </section>

      <section className={styles.setupCard}>
        <div className={styles.setupIcon}>
          <BadgeCheck size={26} />
        </div>
        <div className={styles.setupCopy}>
          <div className={styles.setupHeading}>
            <div>
              <span>Employer profile setup</span>
              <h2>Makwande Careers Recruitment</h2>
            </div>
            <strong>75% complete</strong>
          </div>
          <div className={styles.progress}>
            <span style={{ width: "75%" }} />
          </div>
          <p>
            Add your company logo, verified registration details and hiring
            preferences to build candidate trust.
          </p>
        </div>
        <button type="button">Complete profile <ArrowRight size={16} /></button>
      </section>

      <section className={styles.metrics}>
        {metrics.map(({ label, value, helper, icon: Icon, tone }) => (
          <article className={styles.metricCard} key={label}>
            <div className={`${styles.metricIcon} ${styles[tone]}`}>
              <Icon size={21} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{helper}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span>Recruitment pipeline</span>
              <h2>Candidate progress</h2>
            </div>
            <select
              aria-label="Select reporting period"
              onChange={(event) => setPeriod(event.target.value)}
              value={period}
            >
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
            </select>
          </header>

          <div className={styles.pipeline}>
            {pipeline.map((stage, index) => (
              <div className={styles.pipelineItem} key={stage.label}>
                <div>
                  <span>{stage.label}</span>
                  <strong>{stage.value}</strong>
                </div>
                <div className={styles.pipelineTrack}>
                  <span
                    style={{
                      width: `${Math.max(12, (stage.value / pipeline[0].value) * 100)}%`,
                    }}
                  />
                </div>
                {index < pipeline.length - 1 ? (
                  <small>
                    {Math.round((pipeline[index + 1].value / stage.value) * 100)}%
                    conversion
                  </small>
                ) : (
                  <small>Final-stage candidates</small>
                )}
              </div>
            ))}
          </div>

          <div className={styles.insight}>
            <Sparkles size={19} />
            <div>
              <strong>AI recruitment insight</strong>
              <p>
                Candidates with verified achievements are moving to shortlist
                2.4 times faster than candidates with task-only CVs.
              </p>
            </div>
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <header>
            <span>Subscription</span>
            <h2>Professional Employer</h2>
          </header>
          <div className={styles.planPrice}>
            <CircleDollarSign size={22} />
            <div><strong>Active plan</strong><small>Renews monthly</small></div>
            <BadgeCheck size={20} />
          </div>
          <ul>
            <li><CheckCircle2 size={16} /> Up to 10 active jobs</li>
            <li><CheckCircle2 size={16} /> AI candidate ranking</li>
            <li><CheckCircle2 size={16} /> 5 recruiter seats</li>
            <li><CheckCircle2 size={16} /> Recruitment analytics</li>
          </ul>
          <button type="button">Manage employer plan</button>

          <div className={styles.security}>
            <ShieldCheck size={21} />
            <div>
              <strong>Candidate data protected</strong>
              <p>Access is controlled and activity is securely recorded.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.jobsPanel}>
        <header className={styles.panelHeader}>
          <div>
            <span>Vacancy management</span>
            <h2>Current job openings</h2>
          </div>
          <Link href="/dashboard/employer/jobs">
            View all jobs <ArrowRight size={16} />
          </Link>
        </header>

        <div className={styles.jobsTable}>
          <div className={styles.tableHeader}>
            <span>Vacancy</span>
            <span>Applicants</span>
            <span>Shortlisted</span>
            <span>Status</span>
            <span />
          </div>

          {jobs.map((job) => (
            <article key={job.title}>
              <div className={styles.jobIdentity}>
                <div><BriefcaseBusiness size={19} /></div>
                <span>
                  <strong>{job.title}</strong>
                  <small>
                    <MapPin size={13} /> {job.location}
                    <Clock3 size={13} /> {job.type}
                  </small>
                </span>
              </div>
              <strong>{job.applicants}</strong>
              <strong>{job.shortlisted}</strong>
              <span
                className={
                  job.status === "Active" ? styles.activeStatus : styles.draftStatus
                }
              >
                {job.status}
              </span>
              <button aria-label={`Open ${job.title}`} type="button">
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.quickActions}>
        <Link href="/dashboard/employer/jobs">
          <BriefcaseBusiness size={22} />
          <span><strong>Manage jobs</strong><small>Create, edit and close vacancies.</small></span>
          <ArrowRight size={18} />
        </Link>
        <Link href="/dashboard/employer/candidates">
          <FileSearch size={22} />
          <span><strong>Search candidates</strong><small>Discover profiles ranked by job fit.</small></span>
          <ArrowRight size={18} />
        </Link>
        <Link href="/dashboard/employer/team">
          <UserPlus size={22} />
          <span><strong>Invite your team</strong><small>Add recruiters and hiring managers.</small></span>
          <ArrowRight size={18} />
        </Link>
        <Link href="/dashboard/employer/reports">
          <BarChart3 size={22} />
          <span><strong>Recruitment reports</strong><small>Track hiring speed and conversion.</small></span>
          <TrendingUp size={18} />
        </Link>
      </section>
    </main>
  );
}
