import { describe, expect, test } from "vitest";
import {
  computeRank,
  getYearWindow,
  mergePrivateCommits,
  parseHideParam,
  parsePositiveInt,
  rankProgress,
  resolveUsername,
} from "../lib/github.js";

describe("getYearWindow", () => {
  test("spans one year ending now", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");
    const { from, to } = getYearWindow(now);
    expect(to).toBe("2026-09-10T00:00:00.000Z");
    // ~365 days earlier (allows leap tolerance by checking year)
    expect(from.startsWith("2025-09-")).toBe(true);
  });
});

describe("mergePrivateCommits", () => {
  test("adds restricted count only when includePrivate", () => {
    expect(mergePrivateCommits(763, 120, true)).toBe(883);
    expect(mergePrivateCommits(763, 120, false)).toBe(763);
  });
});

describe("parseHideParam", () => {
  test("parses csv, lowercases, drops unknowns", () => {
    expect(parseHideParam("prs,Issues, bogus")).toEqual(["prs", "issues"]);
    expect(parseHideParam(undefined)).toEqual([]);
  });
});

describe("parsePositiveInt", () => {
  test("clamps to min/max", () => {
    expect(parsePositiveInt("8", 6, 1, 10)).toBe(8);
    expect(parsePositiveInt("99", 6, 1, 10)).toBe(10);
    expect(parsePositiveInt("abc", 6, 1, 10)).toBe(6);
  });
});

describe("resolveUsername", () => {
  test("prefers username, falls back to user alias (streak-style links)", () => {
    expect(resolveUsername({ username: "jawadur13" })).toBe("jawadur13");
    expect(resolveUsername({ user: "jawadur13" })).toBe("jawadur13");
    expect(resolveUsername({ username: " a ", user: "b" })).toBe("a");
  });

  test("rejects missing or invalid names", () => {
    expect(() => resolveUsername({})).toThrow();
    expect(() => resolveUsername({ username: "not valid!" })).toThrow();
  });
});

describe("computeRank", () => {
  test("ranks known scores including tiers above S", () => {
    const base = { stars: 0, commits: 0, prs: 0, issues: 0, contribs: 0 };
    expect(computeRank({ ...base, commits: 100 })).toBe("C");
    expect(computeRank({ ...base, commits: 2354 })).toBe("A+");
    expect(computeRank({ ...base, commits: 2500 })).toBe("S");
    expect(computeRank({ ...base, commits: 4000 })).toBe("S+");
    expect(computeRank({ ...base, commits: 7000 })).toBe("SS");
  });
});

describe("rankProgress", () => {
  test("partial progress toward next tier", () => {
    const r = rankProgress(2354);
    expect(r.rank).toBe("A+");
    expect(r.nextMin).toBe(2500);
    expect(r.progress).toBeCloseTo(0.854, 3);
  });

  test("exact threshold starts next tier at zero", () => {
    const r = rankProgress(2500);
    expect(r.rank).toBe("S");
    expect(r.nextMin).toBe(4000);
    expect(r.progress).toBe(0);
  });

  test("top tier is complete with no next", () => {
    const r = rankProgress(7000);
    expect(r.rank).toBe("SS");
    expect(r.nextMin).toBeNull();
    expect(r.progress).toBe(1);
  });
});
