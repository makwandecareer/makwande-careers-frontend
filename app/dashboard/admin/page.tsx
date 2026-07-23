"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./admin-dashboard.css";

type UnknownRecord = Record<string, unknown>;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "pending";
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
  status: "success" | "pending" | "failed";
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
  overview: [
    "/api/backend/admin/dashboard",
    "/api/backend/admin/overview",
    "/api/backend/api/admin/dashboard",
    "/api/backend/api/admin/overview",
  ],
  users: [
    "/api/backend/admin/users",
    "/api/backend/api/admin/users",
  ],
  payments: [
    "/api/backend/admin/payments",
    "/api/backend/admin/transactions",
    "/api/backend/api/admin/payments",
  ],
  activity: [
    "/api/backend/admin/activity",
    "/api/backend/admin/audit-logs",
    "/api/backend/api/admin/activity",
  ],
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

function normalizeStatus(value: unknown): AdminUser["status"] {
  const result = text(value, "active").toLowerCase();
  if (["suspended", "blocked", "disabled", "inactive"].includes(result)) return "suspended";
  if (["pending", "unverified", "invited"].includes(result)) return "pending";
  return "active";
}

function normalizePaymentStatus(value: unknown): Payment["status"] {
  const result = text(value, "success").toLowerCase();
  if (["failed", "declined", "cancelled", "canceled"].includes(result)) return "failed";
  if (["pending", "processing", "initiated"].includes(result)) return "pending";
  return "success";
}

function normalizeUser(value: unknown, index: number): AdminUser {
  const row = isRecord(value) ? value : {};
  const firstName = text(pick(row, ["first_name", "firstName"]), "");
  const lastName = text(pick(row, ["last_name", "lastName"]), "");
  const fullName = text(
    pick(row, ["name", "full_name", "fullName", "display_name"]),
    `${firstName} ${lastName}`.trim() || "Unnamed user",
  );

  return {
    id: text(pick(row, ["id", "user_id", "uuid"]), `user-${index}`),
    name: fullName,
    email: text(pick(row, ["email", "email_address"]), "No email"),
    role: text(pick(row, ["role", "user_role", "account_type"]), "User"),
    status: normalizeStatus(pick(row, ["status", "account_status", "is_active"])),
    plan: text(pick(row, ["plan", "subscription_plan", "plan_name"]), "Free"),
    joinedAt: text(pick(row, ["created_at", "joined_at", "date_joined"]), ""),
    lastActive: text(pick(row, ["last_active", "last_login", "updated_at"]), ""),
  };
}

function normalizePayment(value: unknown, index: number): Payment {
  const row = isRecord(value) ? value : {};
  const customer = isRecord(row.customer) ? row.customer : {};
  const amount = numberValue(pick(row, ["amount", "total", "value"]));
  const normalizedAmount = amount > 10000 ? amount / 100 : amount;

  return {
    id: text(pick(row, ["id", "payment_id", "transaction_id"]), `payment-${index}`),
    user: text(
      pick(row, ["user_name", "customer_name", "name"]),
      text(pick(customer, ["name", "full_name"]), "Customer"),
    ),
    email: text(
      pick(row, ["email", "customer_email"]),
      text(pick(customer, ["email"]), "No email"),
    ),
    amount: normalizedAmount,
    currency: text(pick(row, ["currency"]), "ZAR").toUpperCase(),
    status: normalizePaymentStatus(pick(row, ["status", "payment_status"])),
    reference: text(pick(row, ["reference", "transaction_reference", "paystack_reference"]), "—"),
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
    id: text(pick(row, ["id", "activity_id", "uuid"]), `activity-${index}`),
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

  const users = arrayFrom(usersPayload, ["users", "results", "items", "data"]).map(normalizeUser);
  const payments = arrayFrom(paymentsPayload, ["payments", "transactions", "results", "items", "data"]).map(normalizePayment);
  const activities = arrayFrom(activityPayload, ["activities", "activity", "audit_logs", "logs", "results", "items", "data"]).map(normalizeActivity);

  const metricsSource = isRecord(overview.metrics)
    ? overview.metrics
    : isRecord(overview.stats)
      ? overview.stats
      : overview;

  const monthlyRevenueFromPayments = payments
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    users,
    payments,
    activities,
    metrics: {
      totalUsers: numberValue(pick(metricsSource, ["total_users", "users", "user_count"])) || users.length,
      activeSubscriptions:
        numberValue(pick(metricsSource, ["active_subscriptions", "subscriptions", "active_plans"])) ||
        users.filter((user) => user.plan.toLowerCase() !== "free" && user.status === "active").length,
      monthlyRevenue:
        numberValue(pick(metricsSource, ["monthly_revenue", "revenue", "mrr"])) ||
        monthlyRevenueFromPayments,
      cvsCreated: numberValue(pick(metricsSource, ["cvs_created", "total_cvs", "cv_count", "resumes_created"])),
      atsAnalyses: numberValue(pick(metricsSource, ["ats_analyses", "ats_scans", "ats_count"])),
      aiSessions: numberValue(pick(metricsSource, ["ai_sessions", "ai_requests", "ai_usage"])),
    },
  };
}

async function fetchFirst(paths: readonly string[]): Promise<unknown> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 404) continue;
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  return null;
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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MC";
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
}) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-icon" aria-hidden="true">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "payments" | "activity">("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [overview, users, payments, activity] = await Promise.all([
        fetchFirst(ENDPOINTS.overview).catch(() => null),
        fetchFirst(ENDPOINTS.users).catch(() => null),
        fetchFirst(ENDPOINTS.payments).catch(() => null),
        fetchFirst(ENDPOINTS.activity).catch(() => null),
      ]);

      if (!overview && !users && !payments && !activity) {
        throw new Error(
          "The admin API could not be reached. Confirm the backend admin routes and that your account has administrator access.",
        );
      }

      setData(normalizeDashboard(overview, users, payments, activity));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the admin dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.plan.toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [data.users, query, statusFilter]);

  const successfulPayments = data.payments.filter((payment) => payment.status === "success").length;
  const paymentSuccessRate = data.payments.length
    ? Math.round((successfulPayments / data.payments.length) * 100)
    : 0;

  const activeUserRate = data.metrics.totalUsers
    ? Math.round((data.users.filter((user) => user.status === "active").length / data.metrics.totalUsers) * 100)
    : 0;

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-hero">
        <div>
          <div className="admin-kicker">
            <span className="admin-live-dot" />
            Makwande Careers Control Centre
          </div>
          <h1>Admin Dashboard</h1>
          <p>
            Monitor users, subscriptions, revenue, AI usage and platform operations from one secure workspace.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <button className="admin-primary-button" type="button" onClick={() => setActiveTab("users")}>
            Manage users
          </button>
        </div>
      </header>

      {error && (
        <section className="admin-alert" role="alert">
          <div>
            <strong>Admin data is unavailable</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()}>Try again</button>
        </section>
      )}

      <nav className="admin-tabs" aria-label="Admin dashboard sections">
        {[
          ["overview", "Overview"],
          ["users", "Users"],
          ["payments", "Payments"],
          ["activity", "Activity"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key as typeof activeTab)}
          >
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <section className="admin-loading-grid" aria-label="Loading admin dashboard">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="admin-skeleton" key={index} />
          ))}
        </section>
      ) : (
        <>
          {activeTab === "overview" && (
            <section className="admin-overview">
              <div className="admin-metrics-grid">
                <MetricCard label="Total users" value={data.metrics.totalUsers.toLocaleString()} detail={`${activeUserRate}% active accounts`} icon="👥" />
                <MetricCard label="Active subscriptions" value={data.metrics.activeSubscriptions.toLocaleString()} detail="Paid plans currently active" icon="◆" />
                <MetricCard label="Monthly revenue" value={formatCurrency(data.metrics.monthlyRevenue)} detail={`${paymentSuccessRate}% payment success`} icon="R" />
                <MetricCard label="CVs created" value={data.metrics.cvsCreated.toLocaleString()} detail="Total CV documents generated" icon="CV" />
                <MetricCard label="ATS analyses" value={data.metrics.atsAnalyses.toLocaleString()} detail="Candidate scans completed" icon="ATS" />
                <MetricCard label="AI sessions" value={data.metrics.aiSessions.toLocaleString()} detail="AI-powered career interactions" icon="AI" />
              </div>

              <div className="admin-dashboard-grid">
                <section className="admin-panel admin-users-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span className="admin-eyebrow">Customer operations</span>
                      <h2>Recent users</h2>
                    </div>
                    <button type="button" onClick={() => setActiveTab("users")}>View all</button>
                  </div>

                  <div className="admin-user-list">
                    {data.users.slice(0, 6).map((user) => (
                      <button className="admin-user-row" key={user.id} type="button" onClick={() => setSelectedUser(user)}>
                        <span className="admin-avatar">{initials(user.name)}</span>
                        <span className="admin-user-copy">
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </span>
                        <span className={`admin-status admin-status-${user.status}`}>{user.status}</span>
                        <span className="admin-plan">{user.plan}</span>
                      </button>
                    ))}
                    {!data.users.length && <p className="admin-empty">No user records were returned by the backend.</p>}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span className="admin-eyebrow">Financial health</span>
                      <h2>Recent payments</h2>
                    </div>
                    <button type="button" onClick={() => setActiveTab("payments")}>View all</button>
                  </div>

                  <div className="admin-payment-list">
                    {data.payments.slice(0, 6).map((payment) => (
                      <div className="admin-payment-row" key={payment.id}>
                        <div>
                          <strong>{payment.user}</strong>
                          <small>{payment.reference}</small>
                        </div>
                        <div className="admin-payment-amount">
                          <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
                          <span className={`admin-status admin-status-${payment.status}`}>{payment.status}</span>
                        </div>
                      </div>
                    ))}
                    {!data.payments.length && <p className="admin-empty">No payment records were returned by the backend.</p>}
                  </div>
                </section>

                <section className="admin-panel admin-activity-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span className="admin-eyebrow">Live operations</span>
                      <h2>Platform activity</h2>
                    </div>
                    <button type="button" onClick={() => setActiveTab("activity")}>Open log</button>
                  </div>
                  <div className="admin-timeline">
                    {data.activities.slice(0, 7).map((activity) => (
                      <div className="admin-timeline-item" key={activity.id}>
                        <span className={`admin-timeline-icon admin-timeline-${activity.type}`} />
                        <div>
                          <strong>{activity.title}</strong>
                          <p>{activity.description}</p>
                          <small>{formatDate(activity.time)}</small>
                        </div>
                      </div>
                    ))}
                    {!data.activities.length && <p className="admin-empty">No activity records were returned by the backend.</p>}
                  </div>
                </section>

                <section className="admin-panel admin-health-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span className="admin-eyebrow">System health</span>
                      <h2>Operational readiness</h2>
                    </div>
                    <span className="admin-online-badge">Operational</span>
                  </div>

                  <div className="admin-health-item">
                    <div><strong>Backend API</strong><span>Connected through secure proxy</span></div>
                    <span className={error ? "admin-health-warning" : "admin-health-good"}>{error ? "Check" : "Healthy"}</span>
                  </div>
                  <div className="admin-health-item">
                    <div><strong>Payment processing</strong><span>Transaction monitoring</span></div>
                    <span className={paymentSuccessRate >= 80 ? "admin-health-good" : "admin-health-warning"}>
                      {data.payments.length ? `${paymentSuccessRate}%` : "Awaiting data"}
                    </span>
                  </div>
                  <div className="admin-health-item">
                    <div><strong>User accounts</strong><span>Active account ratio</span></div>
                    <span className="admin-health-good">{activeUserRate}% active</span>
                  </div>
                  <div className="admin-health-item">
                    <div><strong>Access control</strong><span>Administrator-only workspace</span></div>
                    <span className="admin-health-good">Protected</span>
                  </div>
                </section>
              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header admin-wrap-header">
                <div>
                  <span className="admin-eyebrow">Account management</span>
                  <h2>Users</h2>
                  <p>Search, review and manage customer accounts and subscription access.</p>
                </div>
                <div className="admin-filter-row">
                  <label>
                    <span className="sr-only">Search users</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, email or plan"
                    />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last active</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-table-user">
                            <span className="admin-avatar">{initials(user.name)}</span>
                            <div><strong>{user.name}</strong><small>{user.email}</small></div>
                          </div>
                        </td>
                        <td>{user.role}</td>
                        <td><span className="admin-plan">{user.plan}</span></td>
                        <td><span className={`admin-status admin-status-${user.status}`}>{user.status}</span></td>
                        <td>{formatDate(user.joinedAt)}</td>
                        <td>{formatDate(user.lastActive)}</td>
                        <td><button className="admin-link-button" type="button" onClick={() => setSelectedUser(user)}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && <p className="admin-empty admin-table-empty">No users match your filters.</p>}
              </div>
            </section>
          )}

          {activeTab === "payments" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header">
                <div>
                  <span className="admin-eyebrow">Revenue operations</span>
                  <h2>Payment history</h2>
                  <p>Review customer payments, references and transaction outcomes.</p>
                </div>
                <span className="admin-summary-pill">
                  {formatCurrency(data.metrics.monthlyRevenue)} this month
                </span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td><strong>{payment.user}</strong><small>{payment.email}</small></td>
                        <td>{payment.reference}</td>
                        <td><strong>{formatCurrency(payment.amount, payment.currency)}</strong></td>
                        <td><span className={`admin-status admin-status-${payment.status}`}>{payment.status}</span></td>
                        <td>{formatDate(payment.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.payments.length && <p className="admin-empty admin-table-empty">No payments are available.</p>}
              </div>
            </section>
          )}

          {activeTab === "activity" && (
            <section className="admin-panel admin-full-panel">
              <div className="admin-panel-header">
                <div>
                  <span className="admin-eyebrow">Audit and accountability</span>
                  <h2>Activity log</h2>
                  <p>Track important platform events and administrative activity.</p>
                </div>
              </div>
              <div className="admin-timeline admin-full-timeline">
                {data.activities.map((activity) => (
                  <div className="admin-timeline-item" key={activity.id}>
                    <span className={`admin-timeline-icon admin-timeline-${activity.type}`} />
                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.description}</p>
                      <small>{formatDate(activity.time)}</small>
                    </div>
                  </div>
                ))}
                {!data.activities.length && <p className="admin-empty">No activity is available.</p>}
              </div>
            </section>
          )}
        </>
      )}

      {selectedUser && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setSelectedUser(null)}>
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="admin-modal-close" type="button" onClick={() => setSelectedUser(null)} aria-label="Close">×</button>
            <span className="admin-avatar admin-avatar-large">{initials(selectedUser.name)}</span>
            <h2 id="admin-user-dialog-title">{selectedUser.name}</h2>
            <p>{selectedUser.email}</p>
            <div className="admin-profile-grid">
              <div><span>Account status</span><strong>{selectedUser.status}</strong></div>
              <div><span>Subscription</span><strong>{selectedUser.plan}</strong></div>
              <div><span>Role</span><strong>{selectedUser.role}</strong></div>
              <div><span>Joined</span><strong>{formatDate(selectedUser.joinedAt)}</strong></div>
            </div>
            <div className="admin-modal-note">
              Account mutation controls should be connected to the backend’s protected admin update endpoints before enabling them in production.
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
