import { DashboardTopbar } from "@/components/dashboard-topbar";
import { Sidebar } from "@/components/sidebar";
import "./dashboard-topbar.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-frame">
      <DashboardTopbar />
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
