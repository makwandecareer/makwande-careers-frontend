"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutTemplate,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

const primaryLinks = [
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/cvs", label: "Documents", icon: FileText },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/career", label: "Resources", icon: BookOpen },
  { href: "/dashboard/ai-engine", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/billing", label: "Pricing", icon: CreditCard },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="dashboard-topbar">
      <Link className="dashboard-topbar-brand" href="/dashboard" aria-label="Makwande Careers dashboard">
        <Image
          src="/makwande-careers-logo.jpeg"
          alt=""
          width={40}
          height={40}
          priority
        />
        <span>
          <strong>Makwande Careers</strong>
          <small>Career Platform</small>
        </span>
      </Link>

      <nav className="dashboard-topbar-links" aria-label="Primary dashboard navigation">
        {primaryLinks.map(({ href, label, icon: Icon }) => (
          <Link
            className={isActive(pathname, href) ? "dashboard-topbar-link is-active" : "dashboard-topbar-link"}
            href={href}
            key={href}
          >
            <Icon aria-hidden size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="dashboard-topbar-actions">
        <Link
          aria-label="Search jobs"
          className="dashboard-icon-button"
          href="/dashboard/job-matcher"
          title="Search"
        >
          <Search aria-hidden size={20} />
        </Link>

        <Link
          aria-label="Notifications"
          className="dashboard-icon-button"
          href="/dashboard/notifications"
          title="Notifications"
        >
          <Bell aria-hidden size={20} />
        </Link>

        <div className="dashboard-account" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="dashboard-account-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="dashboard-account-avatar">
              <UserRound aria-hidden size={18} />
            </span>
            <span className="dashboard-account-copy">
              <strong>My Account</strong>
              <small>Member</small>
            </span>
            <ChevronDown aria-hidden size={17} />
          </button>

          {menuOpen && (
            <div className="dashboard-account-menu" role="menu">
              <Link href="/dashboard/profile" role="menuitem">
                <UserRound aria-hidden size={17} />
                Profile
              </Link>
              <Link href="/dashboard/settings" role="menuitem">
                <Settings aria-hidden size={17} />
                Settings
              </Link>
              <Link href="/dashboard/security" role="menuitem">
                <ShieldCheck aria-hidden size={17} />
                Security
              </Link>
              <Link href="/dashboard/billing" role="menuitem">
                <CreditCard aria-hidden size={17} />
                Billing & Plans
              </Link>
              <Link href="/contact" role="menuitem">
                <BookOpen aria-hidden size={17} />
                Contact Support
              </Link>
              <button onClick={logout} role="menuitem" type="button">
                <LogOut aria-hidden size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
