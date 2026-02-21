"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadZone } from "@/app/components/UploadZone";

export default function Home() {
  const customers = useQuery(api.customers.list);

  // Wait for Convex to respond before rendering
  if (customers === undefined) return null;

  if (customers.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <UploadZone />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 text-white p-4 gap-4">
      {/* Left panel — Signal Feed (Phase 3) */}
      <div className="w-72 shrink-0 rounded-xl border border-zinc-800 p-4">
        <p className="text-zinc-600 text-xs">Signal Feed</p>
      </div>

      {/* Center panel — Strategic Core (Phase 5) */}
      <div className="flex-1 rounded-xl border border-zinc-800 p-4">
        <p className="text-zinc-600 text-xs">Strategic Core</p>
      </div>

      {/* Right panel — Revenue Exposure (Phase 6) */}
      <div className="w-72 shrink-0 rounded-xl border border-zinc-800 p-4">
        <p className="text-zinc-600 text-xs">Revenue Exposure</p>
      </div>
    </main>
  );
}
