"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadZone } from "@/app/components/UploadZone";
import { LeftPanel } from "@/app/components/LeftPanel";
import { CenterPanel } from "@/app/components/CenterPanel";
import { RightPanel } from "@/app/components/RightPanel";

function Navbar() {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-white"
        >
          <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="6,2 12,2 12,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-white text-sm font-semibold tracking-widest uppercase font-mono">
          Vector
        </span>
      </div>
      <span className="text-zinc-600 text-xs tracking-wide">
        Autonomous Product Strategy
      </span>
    </header>
  );
}

export default function Home() {
  const customers = useQuery(api.customers.list);

  const showWarRoom = customers !== undefined && customers.length > 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      <Navbar />
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Upload overlay — fades out once data arrives */}
        <div
          className={`absolute inset-0 bg-black flex items-center justify-center z-10 transition-opacity duration-700 ${
            showWarRoom ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <UploadZone />
        </div>

        {/* War room — fades in once data arrives */}
        <div
          className={`flex h-full p-4 gap-4 transition-opacity duration-700 ${
            showWarRoom ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Left panel — Signal Feed */}
          <div className="w-72 shrink-0 border border-zinc-800 flex flex-col overflow-hidden">
            <LeftPanel />
          </div>

          {/* Center panel — Strategic Core */}
          <div className="flex-1 border border-zinc-800 overflow-hidden">
            <CenterPanel />
          </div>

          {/* Right panel — Revenue Exposure */}
          <div className="w-72 shrink-0 border border-zinc-800 overflow-hidden">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
