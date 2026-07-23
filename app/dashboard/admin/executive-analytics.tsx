"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./executive-analytics.css";

type Period = "today" | "7d" | "30d" | "90d" | "12m";
type Point = { date: string; revenue?: number; transactions?: number; registrations?: number };
type SubscriptionPoint = { plan: string; subscriptions: number };
type Payment = {
  reference: string;
  customer: string;
  email: string;
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed";
  date: string;
};

type Analytics = {
  period: Period;
  generated_at: string;
  currency: string;
  metrics: {
    total_users: number;
    new_users: number;
    active_subscriptions: number;
    total_revenue: number;
    period_revenue: number;
    cvs_created: number;
    ats_analyses: number;
    ai_sessions: number;
  };
  payment_status: {
    successful: number;
    pending: number;
    failed: number;
  };
  revenue_trend: Point[];
  user_growth: Point[];
  subscription_breakdown: SubscriptionPoint[];
  recent_payments: Payment[];
  platform_health: {
    status: string;
    database: string;
    api: string;
  };
};

const EMPTY: Analytics = {
  period: "30d",
  generated_at: "",
  currency: "ZAR",
  metrics: {
    total_users: 0,
    new_users: 0,
    active_subscriptions: 0,
    total_revenue: 0,
    period_revenue: 0,
    cvs_created: 0,
    ats_analyses: 0,
    ai_sessions: 0,
  },
  payment_status: { successful: 0, pending: 0, failed: 0 },
  revenue_trend: [],
  user_growth: [],
  subscription_breakdown: [],
  recent_payments: [],
  platform_health: { status: "unknown", database: "unknown", api: "unknown" },
};

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

function currency(value: number, code = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function dateTime(value: string) {
  if (!value) return "Not refreshed yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Bars({
  points,
  valueKey,
  formatter,
}: {
  points: Point[];
  valueKey: "revenue" | "registrations";
  formatter: (value: number) => string;
}) {
  const max = Math.max(...points.map((point) => Number(point[valueKey] || 0)), 1);
  if (!points.length) return <div className="executive-empty">No trend data is available for this period.</div>;

  return (
    <div className="executive-chart" role="img" aria-label={`${valueKey} trend`}>
      {points.map((point) => {
        const value = Number(point[valueKey] || 0);
        const height = Math.max((value / max) * 100, value > 0 ? 8 : 2);
        return (
          <div className="executive-chart-column" key={`${point.date}-${valueKey}`}>
            <span className="executive-chart-value">{formatter(value)}</span>
            <div className="executive-chart-track">
              <span className="executive-chart-bar" style={{ height: `${height}%` }} />
            </div>
            <small>{shortDate(point.date)}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function ExecutiveAnalytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/backend/api/admin/dashboard/analytics?period=${period}`,
        { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Analytics request failed (${response.status})`);
      }
      setAnalytics((await response.json()) as Analytics);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load executive analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const totalPayments =
    analytics.payment_status.successful +
    analytics.payment_status.pending +
    analytics.payment_status.failed;

  const successRate = totalPayments
    ? Math.round((analytics.payment_status.successful / totalPayments) * 100)
    : 0;

  const executiveSummary = useMemo(() => {
    const strongestPlan = [...analytics.subscription_breakdown].sort(
      (a, b) => b.subscriptions - a.subscriptions,
    )[0];

    const parts = [
      `${analytics.metrics.new_users.toLocaleString()} new users joined during the selected period.`,
      `${currency(analytics.metrics.period_revenue, analytics.currency)} was generated with a ${successRate}% payment success rate.`,
      `${analytics.metrics.cvs_created.toLocaleString()} CVs and ${analytics.metrics.ats_analyses.toLocaleString()} ATS analyses were completed.`,
    ];

    if (strongestPlan) {
      parts.push(`${strongestPlan.plan} is currently the leading active subscription plan.`);
    }

    return parts;
  }, [analytics, successRate]);

  return (
    <section className="executive-command-centre">
      <div className="executive-toolbar">
        <div>
          <span className="executive-eyebrow">Executive intelligence</span>
          <h2>CEO Command Centre</h2>
          <p>Real-time commercial, customer and product performance across Makwande Careers.</p>
        </div>
        <div className="executive-controls">
          <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            {periods.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => void load(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh now"}
          </button>
        </div>
      </div>

      {error && <div className="executive-error"><strong>Analytics unavailable</strong><span>{error}</span></div>}

      {loading ? (
        <div className="executive-loading-grid">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="executive-loading-card" />)}
        </div>
      ) : (
        <>
          <div className="executive-kpi-grid">
            {[
              ["Period revenue", currency(analytics.metrics.period_revenue, analytics.currency), "Revenue in selected period"],
              ["Total revenue", currency(analytics.metrics.total_revenue, analytics.currency), "Lifetime successful revenue"],
              ["Total users", analytics.metrics.total_users.toLocaleString(), `${analytics.metrics.new_users.toLocaleString()} new users`],
              ["Active subscriptions", analytics.metrics.active_subscriptions.toLocaleString(), "Currently paying members"],
              ["CVs created", analytics.metrics.cvs_created.toLocaleString(), "Documents produced"],
              ["ATS analyses", analytics.metrics.ats_analyses.toLocaleString(), "Optimisation scans"],
              ["AI sessions", analytics.metrics.ai_sessions.toLocaleString(), "AI-powered interactions"],
              ["Payment success", `${successRate}%`, `${analytics.payment_status.successful} successful payments`],
            ].map(([label, value, detail]) => (
              <article className="executive-kpi-card" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <span>{detail}</span>
              </article>
            ))}
          </div>

          <div className="executive-main-grid">
            <article className="executive-panel executive-panel-wide">
              <div className="executive-panel-heading">
                <div><span>Commercial performance</span><h3>Revenue trend</h3></div>
                <strong>{currency(analytics.metrics.period_revenue, analytics.currency)}</strong>
              </div>
              <Bars
                points={analytics.revenue_trend}
                valueKey="revenue"
                formatter={(value) => currency(value, analytics.currency)}
              />
            </article>

            <article className="executive-panel">
              <div className="executive-panel-heading">
                <div><span>Customer acquisition</span><h3>User growth</h3></div>
                <strong>{analytics.metrics.new_users}</strong>
              </div>
              <Bars
                points={analytics.user_growth}
                valueKey="registrations"
                formatter={(value) => value.toLocaleString()}
              />
            </article>

            <article className="executive-panel">
              <div className="executive-panel-heading">
                <div><span>Executive briefing</span><h3>CEO summary</h3></div>
              </div>
              <div className="executive-summary">
                {executiveSummary.map((line) => <p key={line}>{line}</p>)}
              </div>
            </article>

            <article className="executive-panel">
              <div className="executive-panel-heading">
                <div><span>Subscription mix</span><h3>Active plans</h3></div>
              </div>
              <div className="executive-plan-list">
                {analytics.subscription_breakdown.map((item) => {
                  const max = Math.max(...analytics.subscription_breakdown.map((plan) => plan.subscriptions), 1);
                  return (
                    <div key={item.plan}>
                      <span><strong>{item.plan}</strong><small>{item.subscriptions}</small></span>
                      <div><i style={{ width: `${(item.subscriptions / max) * 100}%` }} /></div>
                    </div>
                  );
                })}
                {!analytics.subscription_breakdown.length && <div className="executive-empty">No active subscriptions.</div>}
              </div>
            </article>

            <article className="executive-panel">
              <div className="executive-panel-heading">
                <div><span>Platform health</span><h3>System status</h3></div>
                <span className={`executive-health-pill executive-health-${analytics.platform_health.status}`}>
                  {analytics.platform_health.status}
                </span>
              </div>
              <div className="executive-health-list">
                <div><span>Application API</span><strong>{analytics.platform_health.api}</strong></div>
                <div><span>Database</span><strong>{analytics.platform_health.database}</strong></div>
                <div><span>Auto refresh</span><strong>Every 30 seconds</strong></div>
                <div><span>Last refreshed</span><strong>{dateTime(analytics.generated_at)}</strong></div>
              </div>
            </article>

            <article className="executive-panel executive-panel-full">
              <div className="executive-panel-heading">
                <div><span>Financial operations</span><h3>Recent payments</h3></div>
                <span className="executive-payment-summary">
                  {analytics.payment_status.successful} successful · {analytics.payment_status.pending} pending · {analytics.payment_status.failed} failed
                </span>
              </div>
              <div className="executive-table-wrap">
                <table className="executive-table">
                  <thead>
                    <tr><th>Customer</th><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {analytics.recent_payments.map((payment) => (
                      <tr key={payment.reference}>
                        <td><strong>{payment.customer}</strong><small>{payment.email}</small></td>
                        <td>{payment.reference}</td>
                        <td><strong>{currency(payment.amount, payment.currency)}</strong></td>
                        <td><span className={`executive-status executive-status-${payment.status}`}>{payment.status}</span></td>
                        <td>{dateTime(payment.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!analytics.recent_payments.length && <div className="executive-empty">No payment records are available.</div>}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
