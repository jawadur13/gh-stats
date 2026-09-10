import { describe, expect, test } from "vitest";
import { computeStreaks } from "../lib/streak.js";
import { renderStreakCard } from "../lib/svg.js";
import type { StreakDay } from "../lib/streak.js";

function seq(start: string, counts: number[]): StreakDay[] {
  const [y, m, d] = start.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return counts.map((count, i) => ({
    date: new Date(base + i * 86400000).toISOString().slice(0, 10),
    count,
  }));
}

describe("computeStreaks", () => {
  test("current streak ending today", () => {
    const r = computeStreaks(seq("2026-09-01", [0, 0, 1, 2, 3]));
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
    expect(r.total).toBe(6);
  });

  test("today zero keeps streak from yesterday", () => {
    const r = computeStreaks(seq("2026-09-01", [1, 1, 0]));
    expect(r.current).toBe(2);
    expect(r.longest).toBe(2);
  });

  test("finds longest run in the middle", () => {
    const r = computeStreaks(seq("2026-09-01", [1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1]));
    expect(r.longest).toBe(4);
    expect(r.current).toBe(4);
  });

  test("broken at end means current is zero", () => {
    const r = computeStreaks(seq("2026-09-01", [1, 1, 0, 0]));
    expect(r.current).toBe(0);
    expect(r.longest).toBe(2);
  });

  test("empty input gives zeros", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0, total: 0 });
  });
});

describe("renderStreakCard", () => {
  test("shows login and all three numbers", () => {
    const svg = renderStreakCard(
      { login: "jawadur13", displayName: "MD JAWADUR RAFID", current: 5, longest: 12, total: 763 },
      { theme: "dark" }
    );
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("jawadur13");
    expect(svg).toContain("day streak");
    expect(svg).toContain(">12<");
  });

  test("draws a heatmap strip from calendar days", () => {
    const days = seq("2026-08-01", Array.from({ length: 28 }, (_, i) => i % 3));
    const svg = renderStreakCard(
      { login: "jawadur13", displayName: "MD JAWADUR RAFID", current: 2, longest: 2, total: 28, days },
      { theme: "dark" }
    );
    expect(svg).toContain('data-heat="28"');
  });

  test("works without days (heatmap hidden, no crash)", () => {
    const svg = renderStreakCard(
      { login: "jawadur13", displayName: "MD JAWADUR RAFID", current: 2, longest: 2, total: 28 },
      { theme: "dark" }
    );
    expect(svg).not.toContain("data-heat");
    expect(svg).toContain("day streak");
  });
});
