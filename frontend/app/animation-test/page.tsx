"use client";

import { useState } from "react";
import { AnalysisAnimation } from "@/app/components/AnalysisAnimation";

const STAGES = [
  {
    label: "Extracting",
    props: { status: "extracting" },
  },
  {
    label: "Researching",
    props: { status: "researching", topTheme: "Enterprise SSO" },
  },
  {
    label: "Generating",
    props: {
      status: "generating",
      topTheme: "Enterprise SSO",
      arrAtRisk: 420000,
    },
  },
  {
    label: "Complete",
    props: {
      status: "complete",
      topTheme: "Enterprise SSO",
      arrAtRisk: 420000,
      recommendation:
        "STOP: Mobile Redesign\nBUILD: Enterprise SSO\n+$252k–$336k retained ARR",
    },
  },
] as const;

export default function AnimationTest() {
  const [idx, setIdx] = useState(0);
  const stage = STAGES[idx];

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Controls */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <span className="text-zinc-500 text-xs font-mono mr-2">Animation test</span>
        {STAGES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setIdx(i)}
            className={`px-3 py-1 text-xs font-mono transition-colors ${
              i === idx
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <AnalysisAnimation {...stage.props} />
      </div>
    </div>
  );
}
