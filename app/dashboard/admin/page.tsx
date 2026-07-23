"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./admin-dashboard.css";

type UserStatus = "active" | "suspended" | "pending";
type PaymentStatus = "success" | "pending" | "failed";
type Tab = "overview" | "users" | "payments" | "activity";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  plan: string;
  joinedAt: string;
  lastActive: string;
};

type Payment = {
  id: string;
  user: string;
  email: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  date: string;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "user" | "payment" | "cv" | "security" | "system";
};

type DashboardData = {
  users: AdminUser[];
  payments: Payment[];
  activities: Activity[];
  metrics: {
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    cvsCreated: number;
    atsAnalyses: number;
    aiSessions: number;
  };
};

type UnknownRecord = Record<string, unknown>;

const EMPTY_DATA: DashboardData = {
  users: [],
  payments: [],
  activities: [],
  metrics: {
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    cvsCreated: 0,
    atsAnalyses: 0,
    aiSessions: 0,
  },
};

const ENDPOINTS = {
  overview: ["/api/backend/api/admin/dashboard", "/api/backend/admin/dashboard"],
  users: ["/api/backend/api/admin/users", "/api/backend/admin/users"],
  payments: ["/api/backend/api/admin/payments", "/api/backend/admin/payments"],
  activity: ["/api/backend/api/admin/activity", "/api/backend/admin/activity"],
} as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function text(value: unknown, fallback = "—"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function arrayFrom(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      for (const nestedKey of keys) {
        const nested = candidate[nestedKey];
        if (Array.isArray(nested)) return nested;
      }
    }
  }
  return [];
}

function normalizeUser(value: unknown, index: number): AdminUser {
  const row = isRecord(value) ? value : {};
  const rawStatus = text(pick(row, ["status", "account_status"]), "active").toLowerCase();
  const status: UserStatus =
    ["suspended", "blocked", "disabled", "inactive"].includes(rawStatus)
      ? "suspended"
      : ["pending", "unverified"].includes(rawStatus)
        ? "pending"
        : "active";

  return {
    id: text(pick(row, ["id", "user_id", "uuid"]), `user-${index}`),
    name: text(pick(row, ["name", "full_name", "fullName"]), "Unnamed user"),
    email: text(pick(row, ["email"]), "No email"),
    role: text(pick(row, ["role", "user_role"]), "candidate"),
    status,
    plan: text(pick(row, ["plan", "subscription_plan", "plan_name"]), "Free"),
    joinedAt: text(pick(row, ["joined_at", "created_at"]), ""),
    lastActive: text(pick(row, ["last_active", "last_login", "updated_at"]), ""),
  };
}

function normalizePayment(value: unknown, index: number): Payment {
  const row = isRecord(value) ? value : {};
  const rawStatus = text(pick(row, ["status", "payment_status"]), "success").toLowerCase();
  const status: PaymentStatus =
    ["failed", "declined", "cancelled", "canceled"].includes(rawStatus)
      ? "failed"
      : ["pending", "processing", "initiated"].includes(rawStatus)
        ? "pending"
        : "success";

  return {
    id: text(pick(row, ["id", "reference"]), `payment-${index}`),
    user: text(pick(row, ["user_name", "customer_name", "name"]), "Customer"),
    email: text(pick(row, ["email", "customer_email"]), "No email"),
    amount: numberValue(pick(row, ["amount", "total", "value"])),
    currency: text(pick(row, ["currency"]), "ZAR").toUpperCase(),
    status,
    reference: text(pick(row, ["reference", "transaction_reference"]), "—"),
    date: text(pick(row, ["paid_at", "created_at", "date"]), ""),
  };
}

function normalizeActivity(value: unknown, index: number): Activity {
  const row = isRecord(value) ? value : {};
  const rawType = text(pick(row, ["type", "category", "event_type"]), "system").toLowerCase();
  const type: Activity["type"] =
    rawType.includes("pay") ? "payment" :
    rawType.includes("user") || rawType.includes("auth") ? "user" :
    rawType.includes("cv") || rawType.includes("resume") ? "cv" :
    rawType.includes("security") || rawType.includes("login") ? "security" :
    "system";

  return {
    id: text(pick(row, ["id", "activity_id"]), `activity-${index}`),
    title: text(pick(row, ["title", "action", "event"]), "Platform activity"),
    description: text(pick(row, ["description", "details", "message"]), ""),
    time: text(pick(row, ["created_at", "timestamp", "time"]), ""),
    type,
  };
}

function normalizeDashboard(
  overviewPayload: unknown,
  usersPayload: unknown,
  paymentsPayload: unknown,
  activityPayload: unknown,
): DashboardData {
  const overview = isRecord(overviewPayload)
    ? (isRecord(overviewPayload.data) ? overviewPayload.data : overviewPayload)
    : {};
  const metricsSource = isRecord(overview.metrics) ? overview.metrics : overview;

  return {
    users: arrayFrom(usersPayload, ["users", "results", "items", "data"]).map(normalizeUser),
    payments: arrayFrom(paymentsPayload, ["payments", "transactions", "results", "items", "data"]).map(normalizePayment),
    activities: arrayFrom(activityPayload, ["activities", "logs", "results", "items", "data"]).map(normalizeActivity),
    metrics: {
      totalUsers: numberValue(pick(metricsSource, ["total_users", "users", "user_count"])),
      activeSubscriptions: numberValue(pick(metricsSource, ["active_subscriptions", "subscriptions"])),
      monthlyRevenue: numberValue(pick(metricsSource, ["monthly_revenue", "revenue", "mrr"])),
      cvsCreated: numberValue(pick(metricsSource, ["cvs_created", "total_cvs"])),
      atsAnalyses: numberValue(pick(metricsSource, ["ats_analyses", "ats_scans"])),
      aiSessions: numberValue(pick(metricsSource, ["ai_sessions", "ai_requests"])),
    },
  };
}

async function fetchFirst(paths: readonly string[]): Promise<unknown> {
  let lastError: Error | null = null;
  for (const path of paths) {
    try {
      const response = await fetch(path, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Request failed");
    }
  }
  throw lastError ?? new Error("Admin API is unavailable.");
}

function formatCurrency(value: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MC";
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [overview, users, payments, activity] = await Promise.all([
        fetchFirst(ENDPOINTS.overview).catch(() => null),
        fetchFirst(ENDPOINTS.users).catch(() => null),
        fetchFirst(ENDPOINTS.payments).catch(() => null),
        fetchFirst(ENDPOINTS.activity).catch(() => null),
      ]);
      if (!overview && !users && !payments && !activity) {
        throw new Error("The admin API could not be reached.");
      }
      setData(normalizeDashboard(overview, users, payments, activity));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load admin portal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesQuery =
        !needle ||
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        user.plan.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [data.users, query, statusFilter, roleFilter]);

  const updateUser = async (user: AdminUser, patch: { status?: "active" | "suspended"; role?: string }) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/backend/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Update failed with status ${response.status}`);
      }

      const updated = normalizeUser(await response.json(), 0);
      setData((current) => ({
        ...current,
        users: current.users.map((item) =>
          item.id === user.id
            ? { ...item, ...updated, plan: item.plan, lastActive: item.lastActive }
            : item,
        ),
      }));
      setSelectedUser((current) =>
        current?.id === user.id ? { ...current, ...updated, plan: current.plan, lastActive: current.lastActive } : current,
      );
      setNotice(`${user.name}'s account was updated successfully.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update user.");
    } finally {
      setSaving(false);
    }
  };

  const activeAccounts = data.users.filter((user) => user.status === "active").length;
  const activeRate = data.metrics.totalUsers
    ? Math.round((activeAccounts / data.metrics.totalUsers) * 100)
    : 0;
  const successfulPayments = data.payments.filter((payment) => payment.status === "success").length;
  const paymentRate = data.payments.length
    ? Math.round((successfulPayments / data.payments.length) * 100)
    : 0;

  const exportUsers = () => {
    const header = ["Name", "Email", "Role", "Plan", "Status", "Joined", "Last Active"];
    const rows = filteredUsers.map((user) => [
      user.name, user.email, user.role, user.plan, user.status, user.joinedAt, user.lastActive,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `makwande-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-hero">
        <div>
          <div className="admin-kicker"><span className="admin-live-dot" />Makwande Careers Control Centre</div>
          <h1>Management Portal</h1>
          <p>Manage customers, subscriptions, payments, platform activity and administrator operations.</p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-secondary-button" onClick={() => void loadDashboard(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <button className="admin-primary-button" onClick={() => setActiveTab("users")}>Manage users</button>
        </div>
      </header>

      {error && <section className="admin-alert"><div><strong>Action required</strong><p>{error}</p></div><button onClick={() => setError("")}>Dismiss</button></section>}
      {notice && <section className="admin-success"><strong>Success</strong><span>{notice}</span></section>}

      <nav className="admin-tabs">
        {(["overview", "users", "payments", "activity"] as Tab[]).map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <section className="admin-loading-grid">{Array.from({ length: 8 }, (_, i) => <div className="admin-skeleton" key={i} />)}</section>
      ) : (
        <>
          {activeTab === "overview" && (
            <>
              <section className="admin-metrics-grid">
                {[
                  ["Total users", data.metrics.totalUsers.toLocaleString(), `${activeRate}% active`, "US"],
                  ["Active subscriptions", data.metrics.activeSubscriptions.toLocaleString(), "Paid memberships", "MB"],
                  ["Monthly revenue", formatCurrency(data.metrics.monthlyRevenue), `${paymentRate}% payment success`, "R"],
                  ["CVs created", data.metrics.cvsCreated.toLocaleString(), "Documents generated", "CV"],
                  ["ATS analyses", data.metrics.atsAnalyses.toLocaleString(), "Scans completed", "ATS"],
                  ["AI sessions", data.metrics.aiSessions.toLocaleString(), "Career interactions", "AI"],
                ].map(([label, value, detail, icon]) => (
                  <article className="admin-metric-card" key={label}>
                    <div className="admin-metric-icon">{icon}</div>
                    <div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>
                  </article>
                ))}
              </section>

              <section className="admin-dashboard-grid">
                <section className="admin-panel">
                  <div className="admin-panel-header"><div><span className="admin-eyebrow">Customer operations</span><h2>Recent users</h2></div><button onClick={() => setActiveTab("users")}>View all</button></div>
                  <div className="admin-user-list">
                    {data.users.slice(0, 7).map((user) => (
                      <button className="admin-user-row" key={user.id} onClick={() => setSelectedUser(user)}>
                        <span className="admin-avatar">{initials(user.name)}</span>
                        <span className="admin-user-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
                        <span className={`admin-status admin-status-${user.status}`}>{user.status}</span>
                        <span className="admin-plan">{user.plan}</span>
                      </button>
                    ))}
                    {!data.users.length && <p className="admin-empty">No users were returned.</p>}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-header"><div><span className="admin-eyebrow">Financial health</span><h2>Recent payments</h2></div><button onClick={() => setActiveTab("payments")}>View all</button></div>
                  {data.payments.slice(0, 7).map((payment) => (
                    <div className="admin-payment-row" key={payment.id}>
                      <div><strong>{payment.user}</strong><small>{payment.reference}</small></div>
                      <div className="admin-payment-amount"><strong>{formatCurrency(payment.amount, payment.currency)}</strong><span className={`admin-status admin-status-${payment.status}`}>{payment.status}</span></div>
                    </div>
                  ))}
                  {!data.payments.length && <p className="admin-empty">No payment records.</p>}
                </section>
              </section>
            </>
          )}

          {activeTab === "users" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header admin-wrap-header">
                <div><span className="admin-eyebrow">Account management</span><h2>Users</h2><p>Search, filter, inspect and manage customer access.</p></div>
                <div className="admin-filter-row">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option>
                  </select>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All roles</option><option value="candidate">Candidate</option><option value="employer">Employer</option><option value="admin">Admin</option>
                  </select>
                  <button className="admin-export-button" onClick={exportUsers}>Export CSV</button>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Role</th><th>Plan</th><th>Status</th><th>Joined</th><th>Last active</th><th /></tr></thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td><div className="admin-table-user"><span className="admin-avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td>
                        <td>{user.role}</td><td><span className="admin-plan">{user.plan}</span></td><td><span className={`admin-status admin-status-${user.status}`}>{user.status}</span></td>
                        <td>{formatDate(user.joinedAt)}</td><td>{formatDate(user.lastActive)}</td><td><button className="admin-link-button" onClick={() => setSelectedUser(user)}>Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && <p className="admin-empty">No users match the filters.</p>}
              </div>
            </section>
          )}

          {activeTab === "payments" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header"><div><span className="admin-eyebrow">Revenue operations</span><h2>Payments</h2><p>Monitor transaction outcomes and references.</p></div><span className="admin-summary-pill">{formatCurrency(data.metrics.monthlyRevenue)} this month</span></div>
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>
                {data.payments.map((payment) => <tr key={payment.id}><td><strong>{payment.user}</strong><small>{payment.email}</small></td><td>{payment.reference}</td><td><strong>{formatCurrency(payment.amount, payment.currency)}</strong></td><td><span className={`admin-status admin-status-${payment.status}`}>{payment.status}</span></td><td>{formatDate(payment.date)}</td></tr>)}
              </tbody></table></div>
            </section>
          )}

          {activeTab === "activity" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header"><div><span className="admin-eyebrow">Audit and accountability</span><h2>Activity log</h2><p>Review important platform events.</p></div></div>
              <div className="admin-timeline">
                {data.activities.map((activity) => <div className="admin-timeline-item" key={activity.id}><span className={`admin-timeline-icon admin-timeline-${activity.type}`} /><div><strong>{activity.title}</strong><p>{activity.description}</p><small>{formatDate(activity.time)}</small></div></div>)}
                {!data.activities.length && <p className="admin-empty">No activity records.</p>}
              </div>
            </section>
          )}
        </>
      )}

      {selectedUser && (
        <div className="admin-modal-backdrop" onMouseDown={() => setSelectedUser(null)}>
          <section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>×</button>
            <span className="admin-avatar admin-avatar-large">{initials(selectedUser.name)}</span>
            <h2>{selectedUser.name}</h2><p>{selectedUser.email}</p>
            <div className="admin-profile-grid">
              <div><span>Status</span><strong>{selectedUser.status}</strong></div>
              <div><span>Plan</span><strong>{selectedUser.plan}</strong></div>
              <div><span>Role</span><strong>{selectedUser.role}</strong></div>
              <div><span>Joined</span><strong>{formatDate(selectedUser.joinedAt)}</strong></div>
            </div>
            <div className="admin-management-block">
              <label>Account status
                <select value={selectedUser.status === "pending" ? "active" : selectedUser.status} disabled={saving} onChange={(event) => void updateUser(selectedUser, { status: event.target.value as "active" | "suspended" })}>
                  <option value="active">Active</option><option value="suspended">Suspended</option>
                </select>
              </label>
              <label>User role
                <select value={selectedUser.role.toLowerCase()} disabled={saving} onChange={(event) => void updateUser(selectedUser, { role: event.target.value })}>
                  <option value="candidate">Candidate</option><option value="employer">Employer</option><option value="admin">Administrator</option>
                </select>
              </label>
            </div>
            <p className="admin-modal-note">{saving ? "Saving changes…" : "Changes are applied through the protected administrator endpoint."}</p>
          </section>
        </div>
      )}
    </main>
  );
}
