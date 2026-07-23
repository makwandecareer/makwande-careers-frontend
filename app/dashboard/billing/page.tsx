"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, Download, FileCheck2, LoaderCircle, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { DISPLAY_PLANS, formatZar, type PlanId } from "@/lib/billing";

type BackendPlanCode = "trial_14_day" | "premium_30_day";
type PaymentResponse = { authorization_url?: string; detail?: string | { message?: string } };
type Subscription = { plan_code: BackendPlanCode; name: string; amount: number; currency: string; duration_days: number; status: string; starts_at: string; expires_at: string; payment_reference: string };
type BillingStatus = { provider: string; has_access: boolean; subscription?: Subscription | null; trial_available: boolean; trial_used: boolean; recommended_plan: BackendPlanCode };

const benefits: Record<PlanId, string[]> = {
  trial_14_days: ["Unlimited CV creation and editing for 14 days", "AI CV Builder, CV Revamp and CV Studio", "ATS analysis and recruiter-ready templates", "PDF and DOCX document exports"],
  premium_30_days: ["Unlimited CV creation and editing for 30 days", "Complete AI Career Engine and Career Copilot", "Cover letters and interview preparation", "Job matching, skills-gap and market insights", "Priority access to premium career tools"],
};
const shared = [
  { title: "Career documents", text: "Create, improve and export professional CVs and cover letters.", icon: FileCheck2 },
  { title: "AI career tools", text: "Use evidence-based writing guidance, ATS analysis and career intelligence.", icon: Sparkles },
  { title: "Secure downloads", text: "Save supported documents in PDF and DOCX formats.", icon: Download },
];
function backendCode(plan: PlanId): BackendPlanCode { return plan === "trial_14_days" ? "trial_14_day" : "premium_30_day"; }
function errorMessage(response: PaymentResponse | null, status: number) { if (typeof response?.detail === "string") return response.detail; if (response?.detail && typeof response.detail === "object" && response.detail.message) return response.detail.message; return `Could not start checkout. Server returned ${status}.`; }
function formatDate(value?: string | null) { if (!value) return "Not available"; const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return "Not available"; return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(parsed); }
function daysRemaining(value?: string | null) { if (!value) return 0; const expiry = new Date(value).getTime(); if (Number.isNaN(expiry)) return 0; return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000)); }

export default function BillingPage() {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);

  async function loadBillingStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/backend/api/billing/status", { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json() as BillingStatus | { detail?: string };
      if (!response.ok) throw new Error("detail" in data && data.detail ? data.detail : "Could not load billing status.");
      setBillingStatus(data as BillingStatus);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load billing status."); }
    finally { setStatusLoading(false); }
  }
  useEffect(() => { void loadBillingStatus(); }, []);

  async function checkout(plan: PlanId) {
    if (loading || !accepted) return;
    setLoading(plan); setError("");
    try {
      const request = await fetch("/api/backend/api/billing/initialize", { method: "POST", credentials: "include", cache: "no-store", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ plan: backendCode(plan), callback_url: `${window.location.origin}/payment/callback` }) });
      const text = await request.text(); let response: PaymentResponse | null = null;
      try { response = text ? JSON.parse(text) as PaymentResponse : null; } catch { response = null; }
      if (!request.ok) throw new Error(errorMessage(response, request.status));
      if (!response?.authorization_url?.startsWith("https://")) throw new Error("Paystack did not return a valid checkout URL.");
      window.location.assign(response.authorization_url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not start checkout."); setLoading(null); }
  }

  const subscription = billingStatus?.subscription ?? null;
  const remaining = useMemo(() => daysRemaining(subscription?.expires_at), [subscription?.expires_at]);

  return <>
    <header className="page-header builder-header"><div><span className="eyebrow">Secure once-off access</span><h1>Billing & access</h1><p className="muted">View your active access, payment details and available Makwande Careers plans.</p></div><div className="builder-status"><span>Currency</span><strong>ZAR</strong></div></header>
    {error && <div className="error" style={{ marginBottom: 18 }}>{error}</div>}
    {statusLoading ? <section className="card access-loading"><LoaderCircle className="spin-icon" size={22}/><span>Checking your payment and access status…</span></section> : subscription && billingStatus?.has_access ? <section className="active-access-card">
      <div className="active-access-top"><div className="access-status-icon"><CheckCircle2 size={28}/></div><div className="access-title"><span className="access-pill">Payment confirmed · Access active</span><h2>{subscription.plan_code === "trial_14_day" ? "14-Day Trial Access" : "30-Day Premium Access"}</h2><p>{subscription.plan_code === "trial_14_day" ? "Your 14-Day Trial access is active." : "Your 30-Day Premium access is active."}</p></div><div className="days-remaining"><strong>{remaining}</strong><span>days remaining</span></div></div>
      <div className="access-detail-grid"><article><CalendarDays size={20}/><span>Access started</span><strong>{formatDate(subscription.starts_at)}</strong></article><article><Clock3 size={20}/><span>Access expires</span><strong>{formatDate(subscription.expires_at)}</strong></article><article><CreditCard size={20}/><span>Amount paid</span><strong>{formatZar(subscription.amount)}</strong></article><article><ReceiptText size={20}/><span>Payment reference</span><strong className="payment-reference">{subscription.payment_reference}</strong></article></div>
      <div className="access-progress-wrap"><div><span>{subscription.plan_code === "trial_14_day" ? "Trial access period" : "Premium access period"}</span><strong>{remaining} of {subscription.duration_days} days remaining</strong></div><div className="access-progress"><span style={{ width: `${Math.min(100, Math.max(0, remaining / subscription.duration_days * 100))}%` }}/></div></div>
      <div className="active-access-actions"><Link className="button button-primary" href="/dashboard/cvs">Start building your CV</Link><button className="button button-secondary" type="button" onClick={() => void loadBillingStatus()}>Refresh payment status</button></div>
    </section> : <section className="card no-active-access"><ShieldCheck size={28}/><div><strong>No active access plan</strong><p className="muted">Choose a plan below to unlock the CV Builder, ATS tools, AI guidance and document downloads.</p></div></section>}
    <section className="billing-includes"><div><span className="eyebrow">All plans include</span><h2>Everything required to build a stronger application</h2></div><div className="billing-shared">{shared.map(({title,text,icon:Icon}) => <article key={title}><Icon size={22}/><div><strong>{title}</strong><p>{text}</p></div></article>)}</div></section>
    <div className="billing-grid">{(Object.entries(DISPLAY_PLANS) as Array<[PlanId,(typeof DISPLAY_PLANS)[PlanId]]>).map(([id,plan]) => { const premium=id==="premium_30_days", isLoading=loading===id; return <article className={`card pricing-card ${premium?"pricing-featured":""}`} key={id}>{premium&&<div className="pricing-badge">Best value</div>}<div><span className="eyebrow">{id === "trial_14_days" ? "14-day trial" : "30-day premium"}</span><h2>{plan.name}</h2><div className="price-line"><strong>{formatZar(plan.amount)}</strong><span>once-off</span></div><p className="muted">{id === "trial_14_days" ? "One-time 14-Day Trial access for new clients. It expires automatically after 14 days and does not renew." : "One-time 30-Day Premium access with the full premium feature set. It expires automatically after 30 days and does not renew."}</p></div><div className="pricing-benefits">{benefits[id].map(benefit=><div key={benefit}><CheckCircle2 size={18}/><span>{benefit}</span></div>)}</div><button type="button" className="button button-primary button-wide" disabled={loading!==null||!accepted} onClick={()=>void checkout(id)}>{isLoading?<><LoaderCircle className="spin-icon" size={18}/>Opening Paystack…</>:<><CreditCard size={18}/>Pay {formatZar(plan.amount)} securely</>}</button></article>})}</div>
    <section className="card checkout-consent"><label><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/><span>I agree to the <Link href="/terms">Terms & conditions</Link> and acknowledge the <Link href="/privacy">Privacy notice</Link>, once-off price and selected access period.</span></label>{!accepted&&<small>Select this agreement to enable secure checkout.</small>}</section>
    <section className="card payment-trust"><ShieldCheck size={30}/><div><strong>Paystack secure checkout</strong><p className="muted">Card details are entered on Paystack&apos;s protected payment page. Makwande Careers does not store your card number, PIN, CVV or one-time password.</p><p className="payment-links"><Link href="/contact">Payment support</Link><Link href="/terms">Refund and access terms</Link></p></div></section>
  </>;
}
