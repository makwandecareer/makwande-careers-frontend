"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FilePenLine,
  FileSearch,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  Languages,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UserSearch,
  UsersRound,
  WandSparkles,
  Wrench,
} from "lucide-react";

import styles from "./sidebar.module.css";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

type SidebarItem = {
  label: string;
  href: string;
  icon: Icon;
  badge?: "AI" | "New";
};

type SidebarSection = {
  id: string;
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
};

const SECTIONS: SidebarSection[] = [
  {
    id: "overview",
    title: "Overview",
    defaultOpen: true,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Gauge },
      { label: "Profile", href: "/dashboard/profile", icon: UserRound },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    id: "career-profile",
    title: "Career Profile",
    defaultOpen: true,
    items: [
      { label: "Education", href: "/dashboard/education", icon: GraduationCap },
      { label: "Experience", href: "/dashboard/experience", icon: BriefcaseBusiness },
      { label: "Skills", href: "/dashboard/skills", icon: Wrench },
      { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
      { label: "Certifications", href: "/dashboard/certifications", icon: Award },
      { label: "Languages", href: "/dashboard/languages", icon: Languages },
      { label: "References", href: "/dashboard/references", icon: UsersRound },
    ],
  },
  {
    id: "cv-platform",
    title: "CV Platform",
    defaultOpen: true,
    items: [
      { label: "My CVs", href: "/dashboard/cvs", icon: BookOpen },
      { label: "Templates", href: "/dashboard/templates", icon: Palette },
      { label: "CV Studio", href: "/dashboard/cv-studio", icon: LayoutTemplate },
      { label: "AI CV Builder", href: "/dashboard/cv-builder", icon: FileText },
    ],
  },
  {
    id: "ai-suite",
    title: "AI Career Suite",
    defaultOpen: true,
    items: [
      {
        label: "ATS Intelligence",
        href: "/dashboard/cv-builder?workspace=ats",
        icon: BarChart3,
        badge: "AI",
      },
      {
        label: "Career Intelligence",
        href: "/dashboard/cv-builder?workspace=career",
        icon: BrainCircuit,
        badge: "AI",
      },
      {
        label: "Application Copilot",
        href: "/dashboard/cv-builder?workspace=copilot",
        icon: ClipboardCheck,
        badge: "AI",
      },
      {
        label: "Recruiter Simulation",
        href: "/dashboard/cv-builder?workspace=recruiter",
        icon: UserSearch,
        badge: "AI",
      },
      {
        label: "AI Resume Writer",
        href: "/dashboard/cv-builder?workspace=writer",
        icon: WandSparkles,
        badge: "AI",
      },
      {
        label: "Job Matching",
        href: "/dashboard/cv-builder?workspace=matching",
        icon: Target,
        badge: "AI",
      },
      {
        label: "Opportunity Dashboard",
        href: "/dashboard/cv-builder?workspace=opportunities",
        icon: LayoutDashboard,
        badge: "New",
      },
      { label: "Career Assistant", href: "/dashboard/career", icon: Sparkles },
      { label: "Interview Coach", href: "/dashboard/interview-ai", icon: BrainCircuit },
      { label: "Cover Letter AI", href: "/dashboard/cover-letter", icon: FilePenLine },
      { label: "AI Career Engine", href: "/dashboard/ai-engine", icon: Bot },
    ],
  },
  {
    id: "jobs",
    title: "Jobs",
    defaultOpen: false,
    items: [
      { label: "Browse Jobs", href: "/dashboard/jobs", icon: BriefcaseBusiness },
      { label: "Saved Jobs", href: "/dashboard/saved-jobs", icon: BookOpen },
      { label: "Applications", href: "/dashboard/applications", icon: ClipboardList },
      { label: "Interviews", href: "/dashboard/interviews", icon: CalendarDays },
      { label: "Job Search", href: "/dashboard/job-search", icon: Search },
    ],
  },
  {
    id: "employer",
    title: "Employer",
    defaultOpen: false,
    items: [
      { label: "Employer Portal", href: "/dashboard/employer", icon: Building2 },
      { label: "Candidate Search", href: "/dashboard/candidates", icon: FileSearch },
    ],
  },
  {
    id: "account",
    title: "Account",
    defaultOpen: false,
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Security", href: "/dashboard/security", icon: ShieldCheck },
    ],
  },
];

function parseHref(href: string) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  return {
    pathname,
    workspace: params.get("workspace"),
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeWorkspace = searchParams.get("workspace");

  const initialOpen = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [section.id, Boolean(section.defaultOpen)]),
      ),
    [],
  );

  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(initialOpen);

  useEffect(() => {
    const activeSection = SECTIONS.find((section) =>
      section.items.some((item) => isItemActive(item.href)),
    );

    if (activeSection) {
      setOpenSections((current) => ({
        ...current,
        [activeSection.id]: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, activeWorkspace]);

  function isItemActive(href: string) {
    const target = parseHref(href);

    if (target.workspace) {
      return pathname === target.pathname && activeWorkspace === target.workspace;
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === target.pathname || pathname.startsWith(`${target.pathname}/`);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <aside className={styles.sidebar} aria-label="Dashboard navigation">
      <Link href="/dashboard" className={styles.logo}>
        <Image
          src="/makwande-careers-logo.jpeg"
          alt="Makwande Careers"
          width={42}
          height={42}
          priority
        />
        <span>
          <strong>MAKWANDE</strong>
          <small>CAREERS</small>
        </span>
      </Link>

      <nav className={styles.navigation}>
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id];

          return (
            <section className={styles.section} key={section.id}>
              <button
                type="button"
                className={styles.sectionButton}
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenSections((current) => ({
                    ...current,
                    [section.id]: !current[section.id],
                  }))
                }
              >
                <span>{section.title}</span>
                <ChevronDown
                  size={15}
                  className={isOpen ? styles.chevronOpen : styles.chevron}
                />
              </button>

              {isOpen ? (
                <div className={styles.sectionItems}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.href);

                    return (
                      <Link
                        key={`${section.id}-${item.label}`}
                        href={item.href}
                        className={`${styles.link} ${active ? styles.active : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon size={18} strokeWidth={1.9} />
                        <span className={styles.label}>{item.label}</span>
                        {item.badge ? (
                          <span
                            className={
                              item.badge === "New"
                                ? styles.newBadge
                                : styles.aiBadge
                            }
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button type="button" className={styles.logout} onClick={logout}>
          <LogOut size={18} strokeWidth={1.9} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

