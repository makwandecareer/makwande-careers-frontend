import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { Suspense } from "react";

import "./dashboard-shell-fix.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-frame">
      <DashboardTopbar />
      <div className="app-shell">
        <Suspense
          fallback={
            <aside className="sidebar" aria-label="Loading navigation" />
          }
        >
          <Sidebar />
        </Suspense>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
