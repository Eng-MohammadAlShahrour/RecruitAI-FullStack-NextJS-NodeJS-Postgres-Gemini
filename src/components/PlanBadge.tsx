"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Plan = {
  plan: "free" | "paid";
  searches_remaining: number | null;
};

export function PlanBadge() {
  const [data, setData] = useState<Plan | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    apiFetch<Plan>("/api/plan")
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const isFree = data.plan === "free";

  return (
    <>
      <button
        type="button"
        className={isFree ? "secondary" : "ghost"}
        onClick={() => setShowUpgrade(true)}
        style={{ fontSize: 13 }}
      >
        {isFree
          ? "Free · " + data.searches_remaining + " search left"
          : "Paid plan"}
      </button>

      {showUpgrade && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100,
          }}
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              {isFree ? "Upgrade to Paid" : "You are on the Paid plan"}
            </h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              {isFree
                ? "Free plan includes 2 searches total. Upgrade for unlimited searches, saved briefs, and shortlists."
                : "Thanks for being a paid customer. You have unlimited searches."}
            </p>
            {isFree && (
              <p
                style={{
                  fontSize: 13,
                  background: "#f3f4f6",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                To upgrade, contact <strong>sales@MohammadALShahrour.com</strong> or use the
                Stripe billing portal.
              </p>
            )}
            <button
              type="button"
              className="secondary"
              onClick={() => setShowUpgrade(false)}
              style={{ width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}