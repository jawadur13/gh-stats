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
        followers: 13,
        repos: 52,
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
        followers: 13,
        repos: 52,
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
        followers: 13,
        repos: 52,
        rank: "B-",
      },
      { theme: "dark", hide: ["prs", "issues"] }
    );
    expect(svg).not.toContain(">PRs<");
    expect(svg).not.toContain(">Issues<");
    expect(svg).toContain(">Stars<");
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
        followers: 13,
        repos: 52,
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

  test("draws a donut with one segment per language", () => {
    const svg = renderTopLangsCard(
      [
        { name: "TypeScript", color: "#3178c6", size: 4651 },
        { name: "HTML", color: "#e34c26", size: 2042 },
      ],
      { theme: "dark" }
    );
    expect(svg).toContain('data-donut="2"');
    expect(svg).toContain("TypeScript");
  });
});

describe("renderError", () => {
  test("contains message safely escaped", () => {
    const svg = renderError("user <x> not found");
    expect(svg).toContain("user &lt;x&gt; not found");
    expect(svg.startsWith("<svg")).toBe(true);
  });
});

describe("rank progress ring", () => {
  test("shows exact arc toward next rank", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 1704,
        prs: 10,
        issues: 0,
        contribs: 46,
        followers: 13,
        repos: 52,
        score: 2354,
        rank: "A+",
      },
      { theme: "dark" }
    );
    // r=24 -> C=150.80, progress 854/1000 -> offset 150.80*0.146=22.02
    expect(svg).toContain('stroke-dasharray="150.80"');
    expect(svg).toContain('stroke-dashoffset="22.02"');
  });

  test("top tier draws a full ring", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 100,
        commits: 7000,
        prs: 100,
        issues: 50,
        contribs: 100,
        followers: 13,
        repos: 52,
        score: 7000,
        rank: "SS",
      },
      { theme: "dark" }
    );
    expect(svg).toContain('stroke-dashoffset="0.00"');
  });

  test("shows followers and repo counts with icons", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 1704,
        prs: 10,
        issues: 0,
        contribs: 46,
        followers: 13,
        repos: 52,
        score: 2354,
        rank: "A+",
      },
      { theme: "dark" }
    );
    expect(svg).toContain("Followers");
    expect(svg).toContain(">13<");
    expect(svg).toContain("Repos");
    expect(svg).toContain(">52<");
  });

  test("shows visible percent to next rank and avatar", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 1704,
        prs: 10,
        issues: 0,
        contribs: 46,
        followers: 13,
        repos: 52,
        score: 2354,
        rank: "A+",
        avatar: "data:image/png;base64,iVBORw0KGgo=",
      },
      { theme: "dark" }
    );
    expect(svg).toContain("85% to S");
    expect(svg).toContain("data:image/png;base64,iVBORw0KGgo=");
    expect(svg).not.toContain("github.com/jawadur13.png");
  });

  test("falls back to initials when avatar is missing", () => {
    const svg = renderStatsCard(
      {
        login: "jawadur13",
        displayName: "MD JAWADUR RAFID",
        stars: 18,
        commits: 1704,
        prs: 10,
        issues: 0,
        contribs: 46,
        followers: 13,
        repos: 52,
        score: 2354,
        rank: "A+",
        avatar: null,
      },
      { theme: "dark" }
    );
    expect(svg).not.toContain("<image");
    expect(svg).toContain("MJ");
  });
});
