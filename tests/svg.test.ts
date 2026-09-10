import { describe, expect, test } from "vitest";
import { renderError, renderStatsCard, renderTopLangsCard } from "../lib/svg.js";

describe("renderStatsCard", () => {
  test("includes login, title and all numbers", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 763,
        prs: 10,
        issues: 0,
        contribs: 5,
        rank: "B-",
      },
      { theme: "dark" }
    );
    expect(svg).toContain("jawadur13");
    expect(svg).toContain("18");
    expect(svg).toContain("763");
    expect(svg).toContain("B-");
    expect(svg.startsWith("<svg")).toBe(true);
  });

  test("hideBorder removes the card border", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 1,
        commits: 2,
        prs: 3,
        issues: 4,
        contribs: 5,
        rank: "C",
      },
      { theme: "dark", hideBorder: true }
    );
    expect(svg).toContain('stroke="transparent"');
    expect(svg).not.toContain("#e4e2e2");
  });

  test("hides requested fields", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 763,
        prs: 10,
        issues: 0,
        contribs: 5,
        rank: "B-",
      },
      { theme: "dark", hide: ["prs", "issues"] }
    );
    expect(svg).not.toContain("Total PRs");
    expect(svg).not.toContain("Total Issues");
    expect(svg).toContain("Total Stars");
  });

  test("escapes XML in names", () => {
    const svg = renderStatsCard(
      {
        login: "a<b",
        displayName: "A&B",
        stars: 1,
        commits: 2,
        prs: 3,
        issues: 4,
        contribs: 5,
        rank: "C",
      },
      { theme: "dark" }
    );
    expect(svg).not.toContain("<b");
    expect(svg).toContain("&lt;b");
    expect(svg).toContain("A&amp;B");
  });
});

describe("renderTopLangsCard", () => {
  test("lists languages with percentages", () => {
    const svg = renderTopLangsCard(
      [
        { name: "TypeScript", color: "#3178c6", size: 4651 },
        { name: "HTML", color: "#e34c26", size: 2042 },
      ],
      { theme: "dark" }
    );
    expect(svg).toContain("TypeScript");
    expect(svg).toContain("HTML");
    expect(svg).toContain("%");
  });

  test("empty langs renders fallback, not crash", () => {
    const svg = renderTopLangsCard([], { theme: "dark" });
    expect(svg).toContain("No language data");
  });
});

describe("renderError", () => {
  test("contains message safely escaped", () => {
    const svg = renderError("user <x> not found");
    expect(svg).toContain("user &lt;x&gt; not found");
    expect(svg.startsWith("<svg")).toBe(true);
  });
});
