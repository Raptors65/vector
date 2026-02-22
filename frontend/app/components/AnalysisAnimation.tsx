"use client";

import { useEffect, useRef } from "react";

// ── constants ────────────────────────────────────────────────────────────────

const CW = 9;   // cell width px
const CH = 14;  // cell height px
const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*[]{}|<>?~=+";
const BG = "#09090b"; // zinc-950

// ── helpers ──────────────────────────────────────────────────────────────────

function rand(n: number) { return Math.floor(Math.random() * n); }
function randChar() { return POOL[rand(POOL.length)]; }

// ── types ────────────────────────────────────────────────────────────────────

type Cell = {
  char: string;
  target: string;
  resolved: boolean;
  timer: number;
  speed: number;
};

type Line = { row: number; col: number; text: string; bright: boolean };

// ── layout helpers ───────────────────────────────────────────────────────────

function centered(text: string, cols: number, row: number, bright: boolean): Line {
  return { row, col: Math.max(0, Math.floor((cols - text.length) / 2)), text, bright };
}

function bar(len: number) {
  return "─".repeat(Math.max(0, len));
}

function fmtARR(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M ARR AT RISK`
    : `$${Math.round(n / 1000)}K ARR AT RISK`;
}

function buildLines(
  status: string,
  cols: number,
  rows: number,
  topTheme?: string,
  arrAtRisk?: number,
  recommendation?: string,
): Line[] {
  const mid = Math.floor(rows / 2);

  if (status === "extracting") {
    return [
      centered("SCANNING CUSTOMER SIGNALS", cols, mid - 1, false),
      centered("EXTRACTING THEMES", cols, mid + 1, false),
    ];
  }

  if (status === "researching" && topTheme) {
    const t = topTheme.toUpperCase();
    const b = bar(Math.min(t.length + 6, cols - 4));
    return [
      centered("TOP THEME IDENTIFIED", cols, mid - 3, false),
      centered(b, cols, mid - 2, false),
      centered(t, cols, mid, true),
      centered(b, cols, mid + 2, false),
    ];
  }

  if (status === "generating" && topTheme) {
    const t = topTheme.toUpperCase();
    const arr = arrAtRisk != null ? fmtARR(arrAtRisk) : "";
    const b = bar(Math.min(Math.max(t.length, arr.length) + 6, cols - 4));
    return [
      centered(b, cols, mid - 3, false),
      centered(t, cols, mid - 1, true),
      centered(arr, cols, mid + 1, true),
      centered(b, cols, mid + 3, false),
    ];
  }

  if (status === "complete" && recommendation) {
    const parts = recommendation.split("\n").filter(Boolean);
    const totalHeight = parts.length * 2 - 1;
    const startRow = mid - Math.floor(totalHeight / 2);
    return parts.map((p, i) => {
      const bright = p.startsWith("BUILD") || p.startsWith("+");
      return centered(p.toUpperCase(), cols, startRow + i * 2, bright);
    });
  }

  return [];
}

// ── cycle messages ────────────────────────────────────────────────────────────

const EXTRACTING_CYCLES = [
  ["SCANNING CUSTOMER SIGNALS", "EXTRACTING THEMES"],
  ["WEIGHTING BY ARR TIER", "CORRELATING PATTERNS"],
  ["ANALYZING FEATURE ADOPTION", "CROSS-REFERENCING SEGMENTS"],
  ["PROCESSING CHURN SIGNALS", "BUILDING THEME MODEL"],
  ["RANKING BY REVENUE IMPACT", "IDENTIFYING TOP THEME"],
];

const GENERATING_CYCLES = [
  ["DRAFTING SCHEMA CHANGES", "GENERATING SPEC"],
  ["DEFINING API ENDPOINTS", "MAPPING DATA MODELS"],
  ["BUILDING TASK GRAPH", "SCOPING EPICS + STORIES"],
  ["ESTIMATING COMPLEXITY", "WRITING SUBTASKS"],
  ["FINALIZING SPEC", "VALIDATING STRUCTURE"],
];

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  status: string;
  topTheme?: string;
  arrAtRisk?: number;
  recommendation?: string;
}

export function AnalysisAnimation({ status, topTheme, arrAtRisk, recommendation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const gridRef = useRef<{ cols: number; rows: number; cells: Cell[][] } | null>(null);
  const sweepRef = useRef({ front: 0, active: false, speed: 2 });
  const linesRef = useRef<Line[]>([]);

  // Stored so the cycling interval can call it without stale closures
  const fireSweepRef = useRef<(lines: Line[]) => void>(() => {});

  // ── init canvas + render loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width: w, height: h } = canvas.parentElement!.getBoundingClientRect();
    canvas.width = w;
    canvas.height = h;

    const cols = Math.floor(w / CW);
    const rows = Math.floor(h / CH);

    gridRef.current = {
      cols,
      rows,
      cells: Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          char: randChar(),
          target: " ",
          resolved: false,
          timer: rand(6),
          speed: rand(5) + 1,
        }))
      ),
    };

    const sweepSpeed = Math.max(2, Math.floor(cols / 55));
    sweepRef.current.speed = sweepSpeed;

    // Reusable sweep trigger — reads from refs so safe to call from intervals
    fireSweepRef.current = (lines: Line[]) => {
      const grid = gridRef.current;
      if (!grid) return;
      linesRef.current = lines;
      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const cell = grid.cells[r][c];
          cell.resolved = false;
          cell.char = randChar();
          cell.target = " ";
          cell.timer = rand(6);
        }
      }
      for (const line of lines) {
        if (line.row >= grid.rows) continue;
        for (let i = 0; i < line.text.length; i++) {
          const col = line.col + i;
          if (col >= grid.cols) break;
          grid.cells[line.row][col].target = line.text[i];
        }
      }
      sweepRef.current = { front: 0, active: true, speed: sweepSpeed };
    };

    const ctx = canvas.getContext("2d")!;
    ctx.font = `${Math.round(CH * 0.78)}px ui-monospace, "Geist Mono", "Courier New", monospace`;
    ctx.textBaseline = "top";

    const draw = () => {
      const grid = gridRef.current!;
      const sweep = sweepRef.current;

      // Advance sweep
      if (sweep.active) {
        sweep.front += sweep.speed;
        if (sweep.front >= grid.cols) {
          sweep.front = grid.cols;
          sweep.active = false;
        }
      }

      // Update cells
      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const cell = grid.cells[r][c];
          if (cell.resolved) continue;
          if (c <= sweep.front) {
            cell.resolved = true;
            cell.char = cell.target;
            continue;
          }
          if (++cell.timer >= cell.speed) {
            cell.timer = 0;
            cell.char = randChar();
          }
        }
      }

      // Clear
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // Build bright cell lookup
      const brightSet = new Set<number>();
      for (const l of linesRef.current) {
        if (!l.bright) continue;
        for (let i = 0; i < l.text.length; i++) {
          brightSet.add(l.row * grid.cols + l.col + i);
        }
      }

      // Draw chars
      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const cell = grid.cells[r][c];
          if (cell.char === " ") continue;

          let alpha: number;
          if (cell.resolved) {
            alpha = brightSet.has(r * grid.cols + c) ? 0.88 : 0.5;
          } else {
            alpha = 0.09 + (Math.random() > 0.97 ? 0.06 : 0);
          }

          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillText(cell.char, c * CW, r * CH);
        }
      }

      // Sweep glow
      if (sweep.active && sweep.front > 0) {
        const gx = sweep.front * CW;
        const grad = ctx.createLinearGradient(gx - 40, 0, gx + 4, 0);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.09)");
        ctx.fillStyle = grad;
        ctx.fillRect(Math.max(0, gx - 40), 0, 44, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── react to status/data changes → fire sweep ────────────────────────────
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const lines = buildLines(status, grid.cols, grid.rows, topTheme, arrAtRisk, recommendation);
    fireSweepRef.current(lines);
  }, [status, topTheme, arrAtRisk, recommendation]);

  // ── cycle messages during long phases ────────────────────────────────────
  useEffect(() => {
    const cycles =
      status === "extracting" ? EXTRACTING_CYCLES :
      status === "generating" ? GENERATING_CYCLES :
      null;
    if (!cycles) return;

    const grid = gridRef.current;
    if (!grid) return;

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % cycles.length;
      const [line1, line2] = cycles[idx];
      const mid = Math.floor(grid.rows / 2);
      fireSweepRef.current([
        centered(line1, grid.cols, mid - 1, false),
        centered(line2, grid.cols, mid + 1, false),
      ]);
    }, 3500);

    return () => clearInterval(interval);
  }, [status]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
