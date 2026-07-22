"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  ClipboardList,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  Languages,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserSearch,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
      { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Career Profile",
    items: [
      { href: "/dashboard/education", label: "Education", icon: GraduationCap },
      { href: "/dashboard/experience", label: "Experience", icon: BriefcaseBusiness },
      { href: "/dashboard/skills", label: "Skills", icon: Wrench },
      { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
      { href: "/dashboard/certifications", label: "Certifications", icon: Award },
      { href: "/dashboard/languages", label: "Languages", icon: Languages },
      { href: "/dashboard/references", label: "References", icon: UsersRound },
    ],
  },
  {
    title: "CV Platform",
    items: [
      { href: "/dashboard/cvs", label: "My CVs", icon: BookOpen },
      { href: "/dashboard/templates", label: "Templates", icon: Palette },
      { href: "/dashboard/cv-studio", label: "CV Studio", icon: LayoutTemplate },
      { href: "/dashboard/cv-builder", label: "AI CV Builder", icon: FileText },
      { href: "/dashboard/ats", label: "ATS Analysis", icon: BarChart3 },
    ],
  },
  {
    title: "AI",
    items: [
      { href: "/dashboard/career", label: "Career Assistant", icon: Sparkles },
      { href: "/dashboard/interview-ai", label: "Interview Coach", icon: BrainCircuit },
      { href: "/dashboard/job-matcher", label: "Job Matcher", icon: Search },
      { href: "/dashboard/cover-letter", label: "Cover Letter AI", icon: MessageSquare },
      { href: "/dashboard/ai-engine", label: "AI Career Engine", icon: Bot },
    ],
  },
  {
    title: "Jobs",
    items: [
      { href: "/dashboard/jobs", label: "Browse Jobs", icon: BriefcaseBusiness },
      { href: "/dashboard/saved-jobs", label: "Saved Jobs", icon: BookOpen },
      { href: "/dashboard/applications", label: "Applications", icon: ClipboardList },
      { href: "/dashboard/interviews", label: "Interviews", icon: CalendarDays },
    ],
  },
  {
    title: "Employer",
    items: [
      { href: "/dashboard/employer", label: "Employer Portal", icon: Building2 },
      { href: "/dashboard/candidates", label: "Candidate Search", icon: UserSearch },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing & Plans", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
    ],
  },
];

const mobileTabs: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Gauge },
  { href: "/dashboard/cvs", label: "CVs", icon: BookOpen },
  { href: "/dashboard/ats", label: "ATS", icon: BarChart3 },
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navigationContent = (
    <>
      <div className="sidebar-logo">
        <Image
          src="/makwande-careers-logo.jpeg"
          alt="Makwande Careers"
          width={44}
          height={44}
          priority
        />
        <strong>MAKWANDE CAREERS</strong>
      </div>

      <nav aria-label="Dashboard navigation">
        {navigation.map((section) => (
          <div className="sidebar-section-group" key={section.title}>
            <div className="side-section">{section.title}</div>
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`side-link${active ? " side-link-active" : ""}`}
                  href={href}
                  key={href}
                >
                  <Icon aria-hidden size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button className="side-link sidebar-logout" onClick={logout} type="button">
        <LogOut aria-hidden size={18} />
        <span>Sign out</span>
      </button>
    </>
  );

  return (
    <>
      <aside className="sidebar desktop-sidebar">{navigationContent}</aside>

      <header className="mobile-dashboard-header">
        <Link className="mobile-brand" href="/dashboard">
          <Image
            src="/makwande-careers-logo.jpeg"
            alt=""
            width={38}
            height={38}
            priority
          />
          <span>
            <strong>Makwande Careers</strong>
            <small>Career Command Centre</small>
          </span>
        </Link>

        <button
          aria-controls="mobile-dashboard-menu"
          aria-expanded={mobileOpen}
          aria-label="Open dashboard menu"
          className="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <Menu aria-hidden size={24} />
        </button>
      </header>

      <div
        aria-hidden={!mobileOpen}
        className={`mobile-sidebar-backdrop${mobileOpen ? " is-open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        aria-label="Mobile dashboard menu"
        className={`mobile-sidebar-drawer${mobileOpen ? " is-open" : ""}`}
        id="mobile-dashboard-menu"
      >
        <div className="mobile-drawer-close-row">
          <span>Menu</span>
          <button
            aria-label="Close dashboard menu"
            className="mobile-menu-button"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X aria-hidden size={24} />
          </button>
        </div>
        {navigationContent}
      </aside>

      <nav aria-label="Mobile quick navigation" className="mobile-bottom-nav">
        {mobileTabs.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`mobile-bottom-link${active ? " is-active" : ""}`}
              href={href}
              key={href}
            >
              <Icon aria-hidden size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
