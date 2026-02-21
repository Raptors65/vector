"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function formatARR(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  return `$${(arr / 1_000).toFixed(0)}k`;
}

export function SignalFeed() {
  const signals = useQuery(api.signals.list);

  if (!signals) return null;

  return (
    <div className="flex flex-col gap-2">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className={`rounded-none p-3 border ${
            signal.type === "churn"
              ? "border-red-900/50 bg-red-950/20"
              : "border-zinc-800 bg-zinc-900/40"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">
                {signal.type === "churn" ? "⚠" : "🎫"}
              </span>
              {signal.company && (
                <span className="text-white text-xs font-medium">
                  {signal.company}
                </span>
              )}
              {signal.segment && (
                <span className="text-zinc-600 text-xs">{signal.segment}</span>
              )}
            </div>
            <span
              className={`text-xs font-mono font-medium ${
                signal.type === "churn" ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {formatARR(signal.arr)}
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
            {signal.text}
          </p>
        </div>
      ))}
    </div>
  );
}
