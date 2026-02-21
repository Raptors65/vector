"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// --- Types ---

type Customer = {
  company: string;
  segment: "Enterprise" | "SMB";
  arr: number;
  churned: boolean;
  churn_reason?: string;
};

type Ticket = {
  customer_id?: string;
  arr: number;
  issue_text: string;
};

type UsageMetric = {
  feature_name: string;
  enterprise_adoption: number;
  smb_adoption: number;
};

type ParsedFiles = {
  customers?: Customer[];
  tickets?: Ticket[];
  usage?: UsageMetric[];
};

// --- CSV Parsing ---

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()]));
  });
}

function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCustomers(text: string): Customer[] {
  return parseCSVRows(text)
    .map((row) => ({
      company: row["company"],
      segment: row["segment"] as "Enterprise" | "SMB",
      arr: parseFloat((row["arr"] ?? "0").replace(/[$,]/g, "")),
      churned: row["churned"]?.toLowerCase() === "true",
      churn_reason: row["churn_reason"] || undefined,
    }))
    .filter((c) => c.company && !isNaN(c.arr));
}

function parseTickets(text: string): Ticket[] {
  return parseCSVRows(text)
    .map((row) => ({
      customer_id: row["customer_id"] || undefined,
      arr: parseFloat((row["arr"] ?? "0").replace(/[$,]/g, "")),
      issue_text: row["issue"] ?? row["issue_text"] ?? "",
    }))
    .filter((t) => t.issue_text && !isNaN(t.arr));
}

function parseUsageMetrics(text: string): UsageMetric[] {
  return parseCSVRows(text)
    .map((row) => ({
      feature_name: row["feature"] ?? row["feature_name"] ?? "",
      enterprise_adoption: parseFloat(
        (row["enterprise_adoption"] ?? "0").replace("%", "")
      ),
      smb_adoption: parseFloat(
        (row["smb_adoption"] ?? "0").replace("%", "")
      ),
    }))
    .filter((m) => m.feature_name && !isNaN(m.enterprise_adoption));
}

function identifyFile(text: string): "customers" | "tickets" | "usage" | null {
  const header = text.split("\n")[0].toLowerCase();
  if (header.includes("segment") && header.includes("churned")) return "customers";
  if (header.includes("issue")) return "tickets";
  if (header.includes("adoption")) return "usage";
  return null;
}

// --- Component ---

export function UploadZone({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedFiles>({});
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingestCSVData = useMutation(api.upload.ingestCSVData);

  const processFiles = async (files: FileList | File[]) => {
    const results: ParsedFiles = {};

    await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target?.result as string;
              const type = identifyFile(text);
              if (type === "customers") results.customers = parseCustomers(text);
              else if (type === "tickets") results.tickets = parseTickets(text);
              else if (type === "usage") results.usage = parseUsageMetrics(text);
              resolve();
            };
            reader.readAsText(file);
          })
      )
    );

    setParsed((prev) => ({ ...prev, ...results }));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!parsed.customers || !parsed.tickets || !parsed.usage) return;
    setStatus("uploading");
    setError(null);
    try {
      await ingestCSVData({
        customers: parsed.customers,
        tickets: parsed.tickets,
        usageMetrics: parsed.usage,
      });
      onSuccess?.();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const allLoaded = !!(parsed.customers && parsed.tickets && parsed.usage);

  const fileSlots = [
    { key: "customers" as const, label: "customers.csv" },
    { key: "tickets" as const, label: "tickets.csv" },
    { key: "usage" as const, label: "usage.csv" },
  ];

  const integrations = [
    { name: "Salesforce", description: "Churn reasons · CRM data", domain: "salesforce.com" },
    { name: "Intercom", description: "Support tickets · NPS", domain: "intercom.com" },
    { name: "Gong", description: "Call transcripts · deal signals", domain: "gong.io" },
    { name: "Stripe", description: "Cancellations · billing events", domain: "stripe.com" },
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Connect your data</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Integrate your existing tools or upload a CSV to begin
        </p>
      </div>

      {/* Integration cards */}
      <div className="w-full flex flex-col gap-px">
        {integrations.map((integration) => (
          <button
            key={integration.name}
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 text-left opacity-50 cursor-not-allowed"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${integration.domain}&sz=32`}
              alt={integration.name}
              className="w-4 h-4 shrink-0"
            />
            <span className="text-white text-xs font-medium w-20 shrink-0">{integration.name}</span>
            <span className="text-zinc-500 text-xs">{integration.description}</span>
          </button>
        ))}
      </div>

      {/* CSV fallback */}
      <div className="w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">or upload CSV</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full border border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-white bg-zinc-900"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-950"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <p className="text-zinc-400 text-sm">
            Drop{" "}
            <span className="text-white font-mono text-xs">customers.csv</span>,{" "}
            <span className="text-white font-mono text-xs">tickets.csv</span>, and{" "}
            <span className="text-white font-mono text-xs">usage.csv</span>
          </p>
          <p className="text-zinc-600 text-xs mt-1.5">or click to browse</p>
        </div>

        {(parsed.customers || parsed.tickets || parsed.usage) && (
          <div className="flex gap-2 mt-3">
            {fileSlots.map(({ key, label }) => (
              <div
                key={key}
                className={`flex-1 px-3 py-2.5 text-center text-xs font-mono transition-colors flex flex-col items-center gap-0.5 ${
                  parsed[key]
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-950 text-zinc-600 border border-zinc-800"
                }`}
              >
                <span>{label}</span>
                {parsed[key] && (
                  <span className="text-zinc-400">✓ {parsed[key]!.length} rows</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!allLoaded || status === "uploading"}
        className="w-full py-3 font-medium text-sm transition-colors bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {status === "uploading" ? "Uploading..." : "Load Data"}
      </button>
    </div>
  );
}
