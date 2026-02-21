"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadZone } from "@/app/components/UploadZone";
import { LeftPanel } from "@/app/components/LeftPanel";
import { CenterPanel } from "@/app/components/CenterPanel";
import { RightPanel } from "@/app/components/RightPanel";

function Navbar({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white">
          <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="6,2 12,2 12,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-white text-sm font-semibold tracking-widest uppercase font-mono">
          Vector
        </span>
      </div>
      <button
        onClick={onUploadClick}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v7M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-xs">Upload data</span>
      </button>
    </header>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-950 border border-zinc-700 p-8 w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
        <UploadZone onSuccess={onClose} />
      </div>
    </div>
  );
}

export default function Home() {
  const customers = useQuery(api.customers.list);
  const [modalOpen, setModalOpen] = useState(false);

  const showWarRoom = customers !== undefined && customers.length > 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      <Navbar onUploadClick={() => setModalOpen(true)} />
      <div className="flex-1 relative overflow-hidden min-h-0">

        {/* Initial upload overlay — fades out once data arrives */}
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
          <div className="w-72 shrink-0 border border-zinc-800 flex flex-col overflow-hidden">
            <LeftPanel />
          </div>
          <div className="flex-1 border border-zinc-800 overflow-hidden">
            <CenterPanel />
          </div>
          <div className="w-72 shrink-0 border border-zinc-800 overflow-hidden">
            <RightPanel />
          </div>
        </div>

        {/* Upload modal — available any time from navbar */}
        {modalOpen && <UploadModal onClose={() => setModalOpen(false)} />}
      </div>
    </div>
  );
}
