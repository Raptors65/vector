"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type RevenueExposure = {
  arr_at_risk: number;
  conservative: number;
  moderate: number;
  aggressive: number;
  total_arr: number;
  current_churn_rate: number;
};

const ASSUMPTIONS = [
  { label: "Conservative", key: "conservative" as const, pct: 40 },
  { label: "Moderate", key: "moderate" as const, pct: 60 },
  { label: "Aggressive", key: "aggressive" as const, pct: 80 },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}k`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function RightPanel() {
  const analysis = useQuery(api.analyses.getLatest);
  const [assumptionIdx, setAssumptionIdx] = useState(1); // default: Moderate

  const isComplete = analysis?.status === "complete";
  const rev = analysis?.revenue_exposure as RevenueExposure | undefined;

  if (!isComplete || !rev) {
    return (
      <div className="flex flex-col h-full p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Revenue Exposure
        </p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-700 text-sm text-center">Runs after analysis</p>
        </div>
      </div>
    );
  }

  const assumption = ASSUMPTIONS[assumptionIdx];
  const recovered = rev[assumption.key];
  const newChurnRate = Math.max(0, rev.current_churn_rate - recovered / rev.total_arr);

  return (
    <div className="flex flex-col h-full p-4 gap-5 overflow-y-auto panel-scroll">
      {/* Header */}
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider shrink-0">
        Revenue Exposure
      </p>

      {/* Current state */}
      <div className="shrink-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          Current
        </p>
        <div className="border border-zinc-800 divide-y divide-zinc-800">
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-500 text-xs">Total ARR</span>
            <span className="text-white text-xs font-mono">{fmt(rev.total_arr)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-500 text-xs">ARR at Risk</span>
            <span className="text-red-400 text-xs font-mono">{fmt(rev.arr_at_risk)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-500 text-xs">Churn Rate</span>
            <span className="text-red-400 text-xs font-mono">
              {fmtPct(rev.current_churn_rate)}
            </span>
          </div>
        </div>
      </div>

      {/* Recovery assumption selector */}
      <div className="shrink-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          Recovery Assumption
        </p>
        <div className="border border-zinc-800 divide-y divide-zinc-800">
          {ASSUMPTIONS.map((a, i) => (
            <button
              key={a.key}
              onClick={() => setAssumptionIdx(i)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                i === assumptionIdx
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === assumptionIdx ? "bg-white" : "bg-zinc-700"
                  }`}
                />
                <span className="font-medium">{a.label}</span>
              </div>
              <span className="font-mono text-zinc-400">{a.pct}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recovery outcome */}
      <div className="shrink-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          If Built
        </p>
        <div className="border border-zinc-700 divide-y divide-zinc-800">
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-400 text-xs">Recovered ARR</span>
            <span className="text-green-400 text-xs font-mono font-bold">
              +{fmt(recovered)}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-400 text-xs">New Churn Rate</span>
            <span className="text-green-400 text-xs font-mono font-bold">
              {fmtPct(newChurnRate)}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-2">
            <span className="text-zinc-400 text-xs">Churn Reduction</span>
            <span className="text-green-400 text-xs font-mono font-bold">
              −{fmtPct(rev.current_churn_rate - newChurnRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <p className="text-zinc-700 text-xs leading-relaxed shrink-0">
        {fmt(rev.arr_at_risk)} ARR from customers who cited this as their churn
        reason. Recovery range assumes {assumption.pct}% of at-risk customers
        retained. All assumptions visible — no hidden magic.
      </p>
    </div>
  );
}
