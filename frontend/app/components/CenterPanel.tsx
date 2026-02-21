"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { SpecPreview } from "./SpecPreview";
import type { Spec } from "./SpecPreview";
import { AnalysisAnimation } from "./AnalysisAnimation";


// --- Recommendation banner ---

function RecommendationBanner({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="border border-zinc-700 bg-zinc-900/60 p-4 shrink-0">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        Recommendation
      </p>
      {lines.map((line, i) => {
        if (line.startsWith("STOP:")) {
          return (
            <div key={i} className="flex items-baseline gap-2.5 mb-1.5">
              <span className="text-xs font-mono font-bold text-red-400 w-10 shrink-0">
                STOP
              </span>
              <span className="text-zinc-300 text-sm">{line.slice(5).trim()}</span>
            </div>
          );
        }
        if (line.startsWith("BUILD:")) {
          return (
            <div key={i} className="flex items-baseline gap-2.5 mb-1.5">
              <span className="text-xs font-mono font-bold text-green-400 w-10 shrink-0">
                BUILD
              </span>
              <span className="text-white text-sm font-medium">
                {line.slice(6).trim()}
              </span>
            </div>
          );
        }
        if (line.startsWith("+")) {
          return (
            <p key={i} className="text-white font-mono text-lg font-bold mt-3">
              {line}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

// --- Themes table ---

type Theme = {
  name: string;
  enterprise_mentions: number;
  smb_mentions: number;
  enterprise_arr_weighted?: number;
  description: string;
};

function ThemeTable({ themes }: { themes: Theme[] }) {
  return (
    <div className="shrink-0">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Themes
      </p>
      {/* Single outer border + dividers between rows — no double border */}
      <div className="border border-zinc-800 divide-y divide-zinc-800">
        {themes.map((theme, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-zinc-900/40 px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <span className="text-white text-xs">{theme.name}</span>
              {theme.description && (
                <p className="text-zinc-600 text-xs mt-0.5 truncate">
                  {theme.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-3">
              <span className="text-zinc-500 text-xs font-mono">
                {theme.enterprise_mentions}E · {theme.smb_mentions}S
              </span>
              <span className="text-zinc-400 text-xs font-mono w-14 text-right">
                ${((theme.enterprise_arr_weighted ?? 0) / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Market evidence cards ---

type EvidenceDoc = {
  _id: string;
  company_name: string;
  finding: string;
  source?: string;
};

function EvidenceSection({ evidence }: { evidence: EvidenceDoc[] }) {
  return (
    <div className="shrink-0">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Market Evidence
      </p>
      <div className="grid grid-cols-3 gap-2">
        {evidence.map((card, i) => (
          <div
            key={card._id}
            className="border border-zinc-800 bg-zinc-900/40 p-3"
            style={{
              // "both" fill-mode: applies `from` values before start (hidden during delay)
              // and keeps `to` values after end (visible after animation)
              animation: `fadeInUp 0.4s ease both`,
              animationDelay: `${i * 120}ms`,
            }}
          >
            <p className="text-white text-xs font-medium mb-1.5">
              {card.company_name}
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">{card.finding}</p>
            {card.source && (
              <a
                href={card.source}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-zinc-600 hover:text-zinc-400 text-xs mt-2 font-mono transition-colors truncate"
              >
                {(() => {
                  try {
                    return new URL(card.source).hostname.replace(/^www\./, "");
                  } catch {
                    return card.source;
                  }
                })()}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main panel ---

// ── phase management ─────────────────────────────────────────────────────────
// "idle"    → no analysis, show empty state
// "running" → analysis in progress, show animation
// "done"    → just completed, hold animation on "complete" state briefly
// "content" → show normal results

type Phase = "idle" | "running" | "done" | "content";

// ── main panel ───────────────────────────────────────────────────────────────

export function CenterPanel() {
  const analysis = useQuery(api.analyses.getLatest);
  const evidence = useQuery(api.marketEvidence.list);
  const runAnalysis = useAction(api.analysis.runAnalysis);
  const [triggering, setTriggering] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const isRunning = analysis?.status !== undefined && analysis.status !== "complete";
  const isComplete = analysis?.status === "complete";
  const busy = triggering || isRunning;

  // Drive phase from analysis status
  useEffect(() => {
    if (isRunning) {
      setPhaseSync("running");
    } else if (isComplete) {
      if (phaseRef.current === "running") {
        // Just finished — hold animation on "complete" state for 2s then reveal content
        setPhaseSync("done");
        const t = setTimeout(() => setPhaseSync("content"), 2000);
        return () => clearTimeout(t);
      } else if (phaseRef.current === "idle") {
        // Page loaded with existing completed analysis — skip animation
        setPhaseSync("content");
      }
    }
  }, [isRunning, isComplete]);

  const handleRun = async () => {
    setTriggering(true);
    try {
      await runAnalysis({});
    } finally {
      setTriggering(false);
    }
  };

  // Data for animation
  const themes = Array.isArray(analysis?.themes) ? (analysis.themes as Theme[]) : [];
  const topTheme = themes[0]?.name;
  const rev = analysis?.revenue_exposure as { arr_at_risk?: number } | undefined;
  const arrAtRisk = rev?.arr_at_risk;

  const showAnimation = phase === "running" || phase === "done";
  const showContent = phase === "content";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Strategic Core
        </p>
        <button
          onClick={handleRun}
          disabled={busy}
          className="px-4 py-1.5 text-xs font-medium bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? "Running…" : isComplete ? "Re-run Analysis" : "Run Analysis"}
        </button>
      </div>

      {/* Content area — animation and results share the same space */}
      <div className="flex-1 min-h-0 relative overflow-hidden">

        {/* Animation layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            showAnimation ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {(showAnimation || phase === "done") && (
            <AnalysisAnimation
              status={analysis?.status ?? "extracting"}
              topTheme={topTheme}
              arrAtRisk={arrAtRisk}
              recommendation={analysis?.recommendation ?? undefined}
            />
          )}
        </div>

        {/* Results layer */}
        <div
          className={`h-full overflow-y-auto panel-scroll transition-opacity duration-700 ${
            showContent ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-4 pb-4 flex flex-col gap-5">
            {isComplete && analysis.recommendation && (
              <RecommendationBanner text={analysis.recommendation} />
            )}

            {isComplete &&
              themes.length > 0 && (
                <ThemeTable themes={themes} />
              )}

            {isComplete && evidence && evidence.length > 0 && (
              <EvidenceSection evidence={evidence as EvidenceDoc[]} />
            )}

            {isComplete && analysis.spec && (
              <SpecPreview spec={analysis.spec as unknown as Spec} />
            )}

            {phase === "idle" && !triggering && (
              <div className="h-64 flex items-center justify-center">
                <p className="text-zinc-700 text-sm">
                  Press Run Analysis to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
