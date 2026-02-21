"use client";

import { useState, useEffect } from "react";
import { loadConfig, saveConfig, clearConfig, type GitHubConfig } from "@/app/lib/github";
import { Modal } from "@/app/components/Modal";

interface Props {
  onClose: () => void;
}

export function GitHubModal({ onClose }: Props) {
  const [pat, setPat] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = loadConfig();
    if (config) {
      setPat(config.pat);
      setOwner(config.owner);
      setRepo(config.repo);
    }
  }, []);

  const handleSave = () => {
    if (!pat.trim() || !owner.trim() || !repo.trim()) return;
    saveConfig({ pat: pat.trim(), owner: owner.trim(), repo: repo.trim() });
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const handleClear = () => {
    clearConfig();
    setPat("");
    setOwner("");
    setRepo("");
  };

  const isValid = pat.trim() && owner.trim() && repo.trim();

  return (
    <Modal onClose={onClose} width={420}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">GitHub Settings</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Issues are created directly from your browser. Your token is stored
            in localStorage and never sent to any server.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Field
            label="Personal Access Token"
            placeholder="ghp_..."
            value={pat}
            onChange={setPat}
            type="password"
            hint='Needs "repo" scope'
          />
          <div className="flex gap-2">
            <Field
              label="Owner"
              placeholder="acme-corp"
              value={owner}
              onChange={setOwner}
            />
            <Field
              label="Repository"
              placeholder="backend"
              value={repo}
              onChange={setRepo}
            />
          </div>
        </div>

        {(owner || repo) && (
          <p className="text-zinc-600 text-xs font-mono -mt-2">
            → github.com/{owner || "owner"}/{repo || "repo"}/issues
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-2 text-xs font-medium bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          {loadConfig() && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-xs font-medium border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="flex items-baseline justify-between">
        <label className="text-zinc-500 text-xs">{label}</label>
        {hint && <span className="text-zinc-700 text-xs">{hint}</span>}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
      />
    </div>
  );
}
