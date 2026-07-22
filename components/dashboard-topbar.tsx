"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  FileCheck2,
  FileText,
  LayoutTemplate,
  Menu,
  ScanSearch,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import styles from "./dashboard-topbar.module.css";

const documentLinks = [
  { label: "My CVs", detail: "Create, edit and download your CVs", href: "/dashboard/cvs", icon: FileText },
  { label: "Upload & improve", detail: "Turn an existing CV into an ATS-ready draft", href: "/dashboard/cv-builder?workspace=cv-intake-revamp", icon: Sparkles },
  { label: "ATS CV check", detail: "Score structure, keywords and readability", href: "/dashboard/cv-builder?workspace=ats", icon: ScanSearch },
  { label: "Cover letters", detail: "Create job-specific application letters", href: "/dashboard/cover-letter", icon: FileCheck2 },
  { label: "Templates", detail: "Choose an A4 recruiter-ready design", href: "/dashboard/templates", icon: LayoutTemplate },
];

export function DashboardTopbar() {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <Link href="/dashboard" className={styles.brand} aria-label="Makwande Careers dashboard">
        <Image src="/makwande-careers-logo.jpeg" alt="" width={38} height={38} priority />
        <span><strong>Makwande</strong><small>Careers</small></span>
      </Link>

      <button className={styles.mobileToggle} type="button" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpen : ""}`} aria-label="Primary dashboard navigation">
        <Link href="/dashboard/cv-builder?workspace=matching">Jobs</Link>
        <div className={styles.dropdown}>
          <button type="button" onClick={() => setDocumentsOpen((value) => !value)} aria-expanded={documentsOpen}>
            Documents <ChevronDown size={15} />
          </button>
          {documentsOpen ? (
            <div className={styles.menu}>
              <div className={styles.menuIntro}>
                <span>Career documents</span>
                <strong>Everything required for a complete application</strong>
              </div>
              <div className={styles.menuGrid}>
                {documentLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href} onClick={() => setDocumentsOpen(false)}>
                      <Icon size={20} />
                      <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <Link href="/dashboard/cv-builder?workspace=career-operating-system">Career tools</Link>
        <Link href="/dashboard/billing">Pricing</Link>
      </nav>

      <div className={styles.account}>
        <Link href="/dashboard/notifications" aria-label="Notifications"><Bell size={19} /></Link>
        <Link href="/dashboard/profile"><UserRound size={19} /><span>My account</span></Link>
      </div>
    </header>
  );
}
