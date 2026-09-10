import { describe, expect, test } from "vitest";
import {
  getYearWindow,
  mergePrivateCommits,
  parseHideParam,
  parsePositiveInt,
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
