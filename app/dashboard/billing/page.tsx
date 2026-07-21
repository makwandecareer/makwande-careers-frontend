"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  DISPLAY_PLANS,
  formatZar,
  type PlanId,
} from "@/lib/billing";

type BackendPlanCode = "trial_14_day" | "premium_30_day";

type PaymentResponse = {
  plan_code?: string;
  reference?: string;
  authorization_url?: string;
  access_code?: string;
  amount?: number;
  display_amount?: number;
  currency?: string;
  detail?:
    | string
    | {
        code?: string;
        message?: string;
        required_plan?: string;
      };
};

const benefits: Record<PlanId, string[]> = {
  trial_14_days: [
    "Unlimited CV creation for 14 days",
    "AI CV Builder and CV Studio access",
    "ATS optimisation tools",
    "OpenAI career tools",
  ],
  premium_30_days: [
    "Unlimited CV creation for 30 days",
    "Full AI Career Engine access",
    "Cover letters and interview preparation",
    "Job matching and skills-gap analysis",
    "Priority access to premium tools",
  ],
};

function toBackendPlanCode(plan: PlanId): BackendPlanCode {
  return plan === "trial_14_days"
    ? "trial_14_day"
    : "premium_30_day";
}

function getErrorMessage(
  response: PaymentResponse | null,
  statusCode: number
): string {
  if (!response) {
    return `Could not start checkout. Server returned ${statusCode}.`;
  }

  if (typeof response.detail === "string") {
    return response.detail;
  }

  if (
    response.detail &&
    typeof response.detail === "object" &&
    typeof response.detail.message === "string"
  ) {
    return response.detail.message;
  }

  return `Could not start checkout. Server returned ${statusCode}.`;
}

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  async function checkout(displayPlan: PlanId): Promise<void> {
    if (loadingPlan !== null) return;

    setLoadingPlan(displayPlan);
    setError("");

    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const backendPlan = toBackendPlanCode(displayPlan);

      const request = await fetch(
        "/api/backend/api/billing/initialize",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: backendPlan,
            callback_url: callbackUrl,
          }),
        }
      );

      const responseText = await request.text();
      let response: PaymentResponse | null = null;

      if (responseText) {
        try {
          response = JSON.parse(responseText) as PaymentResponse;
        } catch {
          response = null;
        }
      }

      if (!request.ok) {
        throw new Error(
          getErrorMessage(response, request.status)
        );
      }

      const authorizationUrl = response?.authorization_url;

      if (
        typeof authorizationUrl !== "string" ||
        !authorizationUrl.startsWith("https://")
      ) {
        throw new Error(
          "Paystack did not return a valid checkout URL."
        );
      }

      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not start checkout."
      );
      setLoadingPlan(null);
    }
  }

  return (
    <>
      <header className="page-header builder-header">
        <div>
          <span className="eyebrow">
            Secure payments by Paystack
          </span>
          <h1>Choose your access plan</h1>
          <p className="muted">
            Build unlimited CVs and use Makwande Careers AI tools
            during your selected access period.
          </p>
        </div>

        <div className="builder-status">
          <span>Currency</span>
          <strong>ZAR</strong>
        </div>
      </header>

      {error && (
        <div className="error" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      <div className="billing-grid">
        {(
          Object.entries(DISPLAY_PLANS) as Array<
            [PlanId, (typeof DISPLAY_PLANS)[PlanId]]
          >
        ).map(([id, plan]) => {
          const isPremium = id === "premium_30_days";
          const isLoading = loadingPlan === id;

          return (
            <article
              className={`card pricing-card ${
                isPremium ? "pricing-featured" : ""
              }`}
              key={id}
            >
              {isPremium && (
                <div className="pricing-badge">Best value</div>
              )}

              <div>
                <span className="eyebrow">
                  {plan.duration_days}-day access
                </span>
                <h2>{plan.name}</h2>
                <div className="price-line">
                  <strong>{formatZar(plan.amount)}</strong>
                  <span>once-off</span>
                </div>
              </div>

              <div className="pricing-benefits">
                {benefits[id].map((benefit) => (
                  <div key={benefit}>
                    <CheckCircle2 size={18} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="button button-primary button-wide"
                disabled={loadingPlan !== null}
                onClick={() => void checkout(id)}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="spin-icon" size={18} />
                    Opening Paystack…
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Choose {plan.duration_days}-day plan
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>

      <section className="card payment-trust">
        <ShieldCheck size={28} />
        <div>
          <strong>Secure checkout</strong>
          <p className="muted">
            Payment details are handled by Paystack. Makwande
            Careers does not store your card information.
          </p>
        </div>
      </section>
    </>
  );
}