import { Sidebar } from "@/components/sidebar";
import { Suspense } from "react";

import "./dashboard-shell-fix.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
