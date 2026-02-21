"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadZone } from "@/app/components/UploadZone";
import { LeftPanel } from "@/app/components/LeftPanel";
import { CenterPanel } from "@/app/components/CenterPanel";
import { RightPanel } from "@/app/components/RightPanel";
import { GitHubModal } from "@/app/components/GitHubModal";
import { Modal } from "@/app/components/Modal";

function Navbar({
  onUploadClick,
  onGitHubClick,
}: {
  onUploadClick: () => void;
  onGitHubClick: () => void;
}) {
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
        <span className="text-zinc-800 text-xs mx-1">|</span>
        <span className="text-zinc-500 text-xs font-mono">Meridian</span>
      </div>
      <div className="flex items-center gap-3">
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
        <button
          onClick={onGitHubClick}
          title="GitHub settings"
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <UploadZone onSuccess={onClose} />
    </Modal>
  );
}

export default function Home() {
  const customers = useQuery(api.customers.list);
  const [modalOpen, setModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  const showWarRoom = customers !== undefined && customers.length > 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      <Navbar
        onUploadClick={() => setModalOpen(true)}
        onGitHubClick={() => setGithubModalOpen(true)}
      />
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
            <CenterPanel onOpenGitHubSettings={() => setGithubModalOpen(true)} />
          </div>
          <div className="w-72 shrink-0 border border-zinc-800 overflow-hidden">
            <RightPanel />
          </div>
        </div>

        {/* Upload modal — available any time from navbar */}
        {modalOpen && <UploadModal onClose={() => setModalOpen(false)} />}

        {/* GitHub settings modal */}
        {githubModalOpen && <GitHubModal onClose={() => setGithubModalOpen(false)} />}
      </div>
    </div>
  );
}
