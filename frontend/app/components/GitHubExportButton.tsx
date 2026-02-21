"use client";

import { useState } from "react";
import {
  loadConfig,
  exportSpec,
  type ExportStory,
  type ExportProgress,
} from "@/app/lib/github";
import type { Spec } from "@/app/components/SpecPreview";

type Phase =
  | "idle"
  | "confirm"
  | "exporting"
  | "success"
  | "error";

function buildStories(spec: Spec): ExportStory[] {
  const taskGraph =
    typeof spec.task_graph === "string"
      ? (() => { try { return JSON.parse(spec.task_graph as string); } catch { return []; } })()
      : spec.task_graph ?? [];

  const stories: ExportStory[] = [];
  for (const epic of taskGraph) {
    for (const story of epic.stories ?? []) {
      stories.push({
        epicName: epic.epic,
        storyTitle: story.title,
        subtasks: story.subtasks ?? [],
      });
    }
  }
  return stories;
}

export function GitHubExportButton({
  spec,
  arrAtRisk,
  onOpenSettings,
}: {
  spec: Spec;
  arrAtRisk?: number;
  onOpenSettings: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const config = loadConfig();
  const stories = buildStories(spec);
  const epicCount = new Set(stories.map((s) => s.epicName)).size;

  if (!config) {
    return (
      <button
        onClick={onOpenSettings}
        className="w-full py-2 text-xs font-medium border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
      >
        Configure GitHub to export issues →
      </button>
    );
  }

  const handleExport = async () => {
    setPhase("exporting");
    setProgress(null);
    setErrorMsg("");
    try {
      const url = await exportSpec(
        config,
        stories,
        spec.feature_name,
        arrAtRisk,
        (p) => setProgress(p)
      );
      setRepoUrl(url);
      setPhase("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "AUTH") {
        setErrorMsg("Invalid or expired token. Check your GitHub settings.");
      } else if (msg === "NOT_FOUND") {
        setErrorMsg("Repository not found. Check the owner and repo name.");
      } else {
        setErrorMsg(`Export failed: ${msg}`);
      }
      setPhase("error");
    }
  };

  if (phase === "idle") {
    return (
      <button
        onClick={() => setPhase("confirm")}
        className="w-full py-2 text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
      >
        Export to GitHub →
      </button>
    );
  }

  if (phase === "confirm") {
    return (
      <div className="border border-zinc-700 p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-1">
            Ready to export
          </p>
          <p className="text-zinc-600 text-xs">
            This will create <span className="text-white">{stories.length} issues</span> across{" "}
            <span className="text-white">{epicCount} epics</span> in{" "}
            <span className="text-white font-mono">
              {config.owner}/{config.repo}
            </span>
            . A <span className="text-white font-mono">vector</span> label will
            be created if it doesn&apos;t exist.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2 text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Confirm Export
          </button>
          <button
            onClick={() => setPhase("idle")}
            className="px-4 py-2 text-xs font-medium border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "exporting") {
    const done = progress?.done ?? 0;
    const total = progress?.total ?? stories.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <div className="border border-zinc-800 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {done < total
              ? `Creating issues… ${done} / ${total}`
              : "Finishing up…"}
          </p>
          <p className="text-xs text-zinc-600 font-mono">{pct}%</p>
        </div>
        <div className="w-full h-px bg-zinc-800">
          <div
            className="h-px bg-white transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {progress?.currentTitle && (
          <p className="text-zinc-600 text-xs font-mono truncate">
            {progress.currentTitle}
          </p>
        )}
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="border border-zinc-800 p-4 flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-400">
          {stories.length} issues created
        </p>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white underline underline-offset-2 hover:text-zinc-300 transition-colors font-mono"
        >
          View in GitHub →
        </a>
        <button
          onClick={() => setPhase("idle")}
          className="text-left text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
        >
          Export again
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="border border-red-900/50 p-4 flex flex-col gap-2">
        <p className="text-xs text-red-400">{errorMsg}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPhase("idle")}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Try again
          </button>
          <span className="text-zinc-700 text-xs">·</span>
          <button
            onClick={onOpenSettings}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Check settings
          </button>
        </div>
      </div>
    );
  }

  return null;
}
