"use client";

import { useState } from "react";
import { GitHubExportButton } from "@/app/components/GitHubExportButton";

type SchemaChange = { table: string; description: string; fields: string[] };
type ApiEndpoint = { method: string; path: string; description: string };
type Story = { title: string; subtasks: string[] };
type Epic = { epic: string; stories: Story[] };

export type Spec = {
  feature_name: string;
  summary: string;
  schema_changes: SchemaChange[];
  api_endpoints: ApiEndpoint[];
  ui_updates: string[];
  task_graph: Epic[];
};

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-zinc-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-3 pb-3 pt-1 border-t border-zinc-800">{children}</div>}
    </div>
  );
}

function parseTaskGraph(raw: Spec["task_graph"] | string): Epic[] {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Epic[];
    } catch {
      return [];
    }
  }
  return raw ?? [];
}

export function SpecPreview({
  spec,
  arrAtRisk,
  onOpenGitHubSettings,
}: {
  spec: Spec;
  arrAtRisk?: number;
  onOpenGitHubSettings: () => void;
}) {
  const taskGraph = parseTaskGraph(spec.task_graph as Spec["task_graph"] | string);

  return (
    <div className="shrink-0">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
        Spec
      </p>
      <p className="text-white text-sm font-medium mb-1">{spec.feature_name}</p>
      <p className="text-zinc-400 text-xs leading-relaxed mb-3">{spec.summary}</p>

      <div className="flex flex-col gap-px">
        <Section title="Task Graph" defaultOpen>
          {taskGraph.map((epic, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-white text-xs font-medium mb-1.5">{epic.epic}</p>
              {epic.stories?.map((story, j) => (
                <div key={j} className="ml-3 mb-1.5">
                  <p className="text-zinc-300 text-xs">▸ {story.title}</p>
                  {story.subtasks?.map((sub, k) => (
                    <p key={k} className="text-zinc-600 text-xs ml-4 mt-0.5">
                      · {sub}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section title={`API Endpoints (${spec.api_endpoints?.length ?? 0})`}>
          {spec.api_endpoints?.map((ep, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
              <span className="text-zinc-500 text-xs font-mono shrink-0 w-10">
                {ep.method}
              </span>
              <span className="text-white text-xs font-mono">{ep.path}</span>
              <span className="text-zinc-600 text-xs">— {ep.description}</span>
            </div>
          ))}
        </Section>

        <Section title={`Schema Changes (${spec.schema_changes?.length ?? 0})`}>
          {spec.schema_changes?.map((sc, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-white text-xs font-mono">{sc.table}</p>
              <p className="text-zinc-500 text-xs mb-1">{sc.description}</p>
              {sc.fields?.map((f, j) => (
                <p key={j} className="text-zinc-400 text-xs font-mono">
                  &nbsp;&nbsp;· {f}
                </p>
              ))}
            </div>
          ))}
        </Section>

        <Section title={`UI Updates (${spec.ui_updates?.length ?? 0})`}>
          {spec.ui_updates?.map((u, i) => (
            <p key={i} className="text-zinc-400 text-xs mb-1 last:mb-0">
              · {u}
            </p>
          ))}
        </Section>
      </div>

      <div className="mt-3">
        <GitHubExportButton
          spec={spec}
          arrAtRisk={arrAtRisk}
          onOpenSettings={onOpenGitHubSettings}
        />
      </div>
    </div>
  );
}
