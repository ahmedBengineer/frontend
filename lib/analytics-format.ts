export type AnalyticsInterval = "day" | "week" | "month";

export interface DonutRow {
  key: string;
  label: string;
  count: number;
}

export interface DonutPoint {
  name: string;
  value: number;
  color: string;
}

export interface RatePoint {
  date: string;
  label: string;
  total: number;
  pickupRate: number;
  successRate: number;
  transferRate: number;
  voicemailRate: number;
  avgDuration: number;
  avgLatency: number;
}

export const INTERVAL_OPTIONS: { value: AnalyticsInterval; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export const RATE_SERIES = [
  { key: "pickupRate", name: "Pickup", color: "#0f766e" },
  { key: "successRate", name: "Success", color: "#10b981" },
  { key: "transferRate", name: "Transfer", color: "#6366f1" },
  { key: "voicemailRate", name: "Voicemail", color: "#f59e0b" },
] as const;

export const DONUT_PALETTES: Record<string, string[]> = {
  resolution: ["#10b981", "#f43f5e", "#94a3b8"],
  disconnection: [
    "#f59e0b",
    "#0f766e",
    "#3b82f6",
    "#64748b",
    "#6366f1",
    "#ef4444",
    "#14b8a6",
    "#8b5cf6",
    "#f43f5e",
    "#84cc16",
    "#06b6d4",
    "#a855f7",
    "#eab308",
    "#10b981",
    "#94a3b8",
  ],
  sentiment: ["#10b981", "#94a3b8", "#ef4444"],
  direction: ["#6366f1", "#06b6d4", "#94a3b8"],
};

/** `87.5%` — safe on null/undefined/NaN. */
export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Locale-grouped integer, e.g. `1,284`. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString();
}

/** `1m 45s` / `45s` / `1h 02m`. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(secs).padStart(2, "0")}s`;
}

/** Latency in ms when sub-second, otherwise seconds. */
export function formatLatency(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  if (seconds <= 0) return "0ms";
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${seconds.toFixed(2)}s`;
}

/** `1,284 min` */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return "—";
  }
  return `${minutes.toLocaleString(undefined, { maximumFractionDigits: 1 })} min`;
}

/** `$12.34` — zero-cost stays `$0.00` rather than an em dash. */
export function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined || Number.isNaN(cost)) return "—";
  return `$${cost.toFixed(2)}`;
}

/** `YYYY-MM-DD` for `<input type="date">` (local time, not UTC). */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inclusive `[from, to]` window ending today. */
export function defaultDateRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

/** Query string for `/api/reports/stats/*`; empty filters are omitted. */
export function buildStatsQuery(params: {
  from?: string;
  to?: string;
  interval?: AnalyticsInterval;
}): string {
  const search = new URLSearchParams();
  if (params.from) search.set("date_from", params.from);
  if (params.to) search.set("date_to", params.to);
  if (params.interval) search.set("interval", params.interval);
  return search.toString();
}

const MONTH_SHORT = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** Human label for a bucket start date (`2026-09-21` -> `Sep 21`). */
export function bucketLabel(dateStr: string, interval: AnalyticsInterval): string {
  const parts = (dateStr || "").split("-");
  if (parts.length < 3) return dateStr || "";
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const month = MONTH_SHORT[monthIndex] ?? parts[1];
  if (Number.isNaN(monthIndex) || !month) return dateStr;
  if (interval === "month") return `${month} ${String(year).slice(2)}`;
  if (interval === "week") return `${month} ${day}`;
  return `${month} ${day}`;
}

/** Backend distribution rows -> recharts pie data (zeros dropped, order kept). */
export function donutData(
  rows: DonutRow[] | null | undefined,
  palette: string[],
): DonutPoint[] {
  if (!rows || rows.length === 0) return [];
  return rows
    .filter((row) => (row?.count ?? 0) > 0)
    .map((row, index) => ({
      name: row.label || row.key,
      value: row.count,
      color: palette[index % palette.length],
    }));
}

/** Total of a donut's segments — used for the centre label. */
export function donutTotal(points: DonutPoint[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

/** Raw backend rate row — every field is optional so proxies can drift. */
export interface RawRateRow {
  date?: string;
  total_calls?: number;
  pickup_rate?: number;
  success_rate?: number;
  transfer_rate?: number;
  voicemail_rate?: number;
  avg_duration_seconds?: number;
  avg_latency_seconds?: number;
}

/** Backend `rates_over_time` / `monthly_rates` rows -> chart points. */
export function toRatePoints(
  rows: RawRateRow[] | null | undefined,
  interval: AnalyticsInterval
): RatePoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    date: row?.date ?? "",
    label: bucketLabel(row?.date ?? "", interval),
    total: row?.total_calls ?? 0,
    pickupRate: row?.pickup_rate ?? 0,
    successRate: row?.success_rate ?? 0,
    transferRate: row?.transfer_rate ?? 0,
    voicemailRate: row?.voicemail_rate ?? 0,
    avgDuration: row?.avg_duration_seconds ?? 0,
    avgLatency: row?.avg_latency_seconds ?? 0,
  }));
}
