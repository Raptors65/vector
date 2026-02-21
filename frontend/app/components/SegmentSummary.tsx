"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function formatARR(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  return `$${(arr / 1_000).toFixed(0)}k`;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function SegmentSummary() {
  const summary = useQuery(api.customers.segmentSummary);

  if (!summary) return null;

  const stats = [
    { label: "Enterprise ARR", value: formatARR(summary.enterpriseARR) },
    { label: "SMB ARR", value: formatARR(summary.smbARR) },
    {
      label: "Enterprise Churn",
      value: formatPercent(summary.enterpriseChurnRate),
      alert: summary.enterpriseChurnRate > 0.3,
    },
    { label: "SMB Churn", value: formatPercent(summary.smbChurnRate) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {stats.map(({ label, value, alert }) => (
        <div key={label} className="bg-zinc-900 rounded-none p-3">
          <p className="text-zinc-500 text-xs">{label}</p>
          <p
            className={`text-lg font-semibold mt-0.5 ${
              alert ? "text-red-400" : "text-white"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
