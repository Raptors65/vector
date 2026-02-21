"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadZone } from "@/app/components/UploadZone";
import { LeftPanel } from "@/app/components/LeftPanel";
import { CenterPanel } from "@/app/components/CenterPanel";

export default function Home() {
  const customers = useQuery(api.customers.list);

  if (customers === undefined) return null;

  if (customers.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <UploadZone />
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-zinc-950 text-white p-4 gap-4 overflow-hidden">
      {/* Left panel — Signal Feed */}
      <div className="w-72 shrink-0 rounded-none border border-zinc-800 p-4 flex flex-col overflow-hidden">
        <LeftPanel />
      </div>

      {/* Center panel — Strategic Core */}
      <div className="flex-1 rounded-none border border-zinc-800 overflow-hidden">
        <CenterPanel />
      </div>

      {/* Right panel — Revenue Exposure (Phase 6) */}
      <div className="w-72 shrink-0 rounded-none border border-zinc-800 p-4">
        <p className="text-zinc-600 text-xs">Revenue Exposure</p>
      </div>
    </main>
  );
}
