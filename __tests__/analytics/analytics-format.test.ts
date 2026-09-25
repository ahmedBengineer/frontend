import { describe, expect, it } from "vitest";

import {
  buildStatsQuery,
  bucketLabel,
  defaultDateRange,
  donutData,
  donutTotal,
  formatCost,
  formatCount,
  formatDuration,
  formatLatency,
  formatMinutes,
  formatPercent,
  toDateInputValue,
  toRatePoints,
} from "@/lib/analytics-format";

describe("formatPercent", () => {
  it("formats with one decimal by default", () => {
    expect(formatPercent(87.555)).toBe("87.6%");
    expect(formatPercent(100)).toBe("100.0%");
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("honours a custom precision", () => {
    expect(formatPercent(87.5, 0)).toBe("88%");
  });

  it("renders a dash for missing values", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("handles seconds, minutes and hours", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(105)).toBe("1m 45s");
    expect(formatDuration(3725)).toBe("1h 02m");
  });

  it("clamps negatives and dashes missing values", () => {
    expect(formatDuration(-5)).toBe("0s");
    expect(formatDuration(null)).toBe("—");
  });
});

describe("formatLatency", () => {
  it("switches to ms below one second", () => {
    expect(formatLatency(0.85)).toBe("850ms");
    expect(formatLatency(1.5)).toBe("1.50s");
    expect(formatLatency(null)).toBe("—");
  });
});

describe("formatCount / formatMinutes / formatCost", () => {
  it("groups, suffixes and prefixes", () => {
    expect(formatCount(1284)).toBe("1,284");
    expect(formatMinutes(1284.4)).toBe("1,284.4 min");
    expect(formatCost(12.3456)).toBe("$12.35");
    expect(formatCost(0)).toBe("$0.00");
    expect(formatCost(null)).toBe("—");
  });
});

describe("date helpers", () => {
  it("formats a date for the date input", () => {
    expect(toDateInputValue(new Date(2026, 8, 5))).toBe("2026-09-05");
  });

  it("defaults to a window ending today", () => {
    const { from, to } = defaultDateRange(30);
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
    expect(diffDays).toBe(29);
  });
});

describe("buildStatsQuery", () => {
  it("includes only provided filters", () => {
    expect(buildStatsQuery({ from: "2026-09-01", to: "2026-09-30", interval: "month" })).toBe(
      "date_from=2026-09-01&date_to=2026-09-30&interval=month",
    );
    expect(buildStatsQuery({})).toBe("");
    expect(buildStatsQuery({ interval: "week" })).toBe("interval=week");
  });
});

describe("bucketLabel", () => {
  it("labels day, week and month buckets differently", () => {
    expect(bucketLabel("2026-09-21", "day")).toBe("Sep 21");
    expect(bucketLabel("2026-09-21", "week")).toBe("Sep 21");
    expect(bucketLabel("2026-09-01", "month")).toBe("Sep 26");
  });

  it("falls back to the raw value when unparseable", () => {
    expect(bucketLabel("", "day")).toBe("");
    expect(bucketLabel("nonsense", "day")).toBe("nonsense");
  });
});

describe("donutData", () => {
  const rows = [
    { key: "resolved", label: "Resolved", count: 3 },
    { key: "unresolved", label: "Unresolved", count: 1 },
    { key: "unknown", label: "Unknown", count: 0 },
  ];

  it("drops zero segments and cycles the palette", () => {
    const points = donutData(rows, ["#10b981", "#ef4444"]);
    expect(points).toEqual([
      { name: "Resolved", value: 3, color: "#10b981" },
      { name: "Unresolved", value: 1, color: "#ef4444" },
    ]);
    expect(donutTotal(points)).toBe(4);
  });

  it("returns an empty list for no data", () => {
    expect(donutData([], ["#000"])).toEqual([]);
    expect(donutData(null, ["#000"])).toEqual([]);
  });
});

describe("toRatePoints", () => {
  it("maps backend rows and defaults missing rates to zero", () => {
    const points = toRatePoints(
      [{ date: "2026-09-01", total_calls: 4, pickup_rate: 75.5 }],
      "month",
    );
    expect(points).toEqual([
      {
        date: "2026-09-01",
        label: "Sep 26",
        total: 4,
        pickupRate: 75.5,
        successRate: 0,
        transferRate: 0,
        voicemailRate: 0,
        avgDuration: 0,
        avgLatency: 0,
      },
    ]);
    expect(toRatePoints(undefined, "day")).toEqual([]);
  });
});
