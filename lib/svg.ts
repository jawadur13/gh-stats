import type { CardOptions, LangStat, StatsData } from "./types.js";
import type { StreakData } from "./streak.js";
import { rankProgress } from "./github.js";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const THEMES = {
  dark: {
    bg: "#151515",
    border: "#e4e2e2",
    title: "#ffffff",
    text: "#9f9f9f",
    accent: "#79ff97",
    bar: "#303030",
  },
  light: {
    bg: "#ffffff",
    border: "#e4e2e2",
    title: "#1f2328",
    text: "#59636e",
    accent: "#1a7f37",
    bar: "#eaeef2",
  },
} as const;

function themeOf(opts: CardOptions) {
  return THEMES[opts.theme === "light" ? "light" : "dark"];
}

function borderOf(opts: CardOptions): string {
  const t = themeOf(opts);
  return opts.hideBorder ? "transparent" : t.border;
}

const ROWS: { key: "stars" | "commits" | "prs" | "issues" | "contribs"; label: string }[] = [
  { key: "stars", label: "Total Stars" },
  { key: "commits", label: "Commits (last year)" },
  { key: "prs", label: "Total PRs" },
  { key: "issues", label: "Total Issues" },
  { key: "contribs", label: "Contributed to" },
];

export function renderStatsCard(data: StatsData, opts: CardOptions = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  const rp = rankProgress(typeof data.score === "number" ? data.score : 0);
  const ringC = 2 * Math.PI * 26;
  const ringDash = ringC.toFixed(2);
  const ringOff = (ringC * (1 - rp.progress)).toFixed(2);
  const hidden = new Set(opts.hide ?? []);
  const visible = ROWS.filter((r) => !hidden.has(r.key));
  const rowH = 25;
  const height = 55 + visible.length * rowH + 20;

  const rows = visible
    .map((r, i) => {
      const y = 55 + i * rowH;
      return `<g transform="translate(25, ${y})"><text x="0" y="14" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14" font-weight="600" fill="${t.text}">${r.label}:</text><text x="205" y="14" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14" font-weight="700" fill="${t.text}">${data[r.key]}</text></g>`;
    })
    .join("");

  return `<svg width="450" height="${height}" viewBox="0 0 450 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.displayName)} GitHub stats"><rect x="0.5" y="0.5" rx="4.5" width="449" height="${height - 1}" fill="${t.bg}" stroke="${stroke}"/><rect x="0" y="0" width="6" height="${height}" fill="${t.accent}"/><g transform="translate(25, 35)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="17" font-weight="600" fill="${t.title}">${escapeXml(data.displayName)}'s stats · ${escapeXml(data.login)}</text></g><g transform="translate(360, 60)"><circle cx="0" cy="0" r="26" fill="none" stroke="${t.accent}" stroke-opacity="0.25" stroke-width="6"/><circle cx="0" cy="0" r="26" fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${ringDash}" stroke-dashoffset="${ringOff}" transform="rotate(-90)"><title>${rp.progress === 1 ? "Top rank " + rp.rank : Math.round(rp.progress * 100) + "% to next rank"}</title></circle><text x="0" y="7" text-anchor="middle" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="20" font-weight="800" fill="${t.text}">${escapeXml(data.rank)}</text></g>${rows}</svg>`;
}

export function renderTopLangsCard(langs: LangStat[], opts: CardOptions & { maxLangs?: number } = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  const maxLangs = Math.min(8, Math.max(1, opts.maxLangs ?? 6));
  const top = langs.slice(0, maxLangs);
  if (top.length === 0) {
    return `<svg width="300" height="120" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="top languages"><rect x="0.5" y="0.5" rx="4.5" width="299" height="119" fill="${t.bg}" stroke="${stroke}"/><g transform="translate(25, 35)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="17" font-weight="600" fill="${t.title}">Top languages</text></g><g transform="translate(25, 65)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="${t.text}">No language data</text></g></svg>`;
  }
  const total = top.reduce((a, l) => a + l.size, 0) || 1;
  const barW = 250;
  let x = 0;
  const segs = top
    .map((l) => {
      const w = Math.max(4, (l.size / total) * barW);
      const s = `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="8" fill="${escapeXml(l.color)}"/>`;
      x += w;
      return s;
    })
    .join("");
  const half = Math.ceil(top.length / 2);
  const left = top.slice(0, half);
  const right = top.slice(half);
  const col = (list: LangStat[], dx: number) =>
    list
      .map((l, i) => {
        const pct = ((l.size / total) * 100).toFixed(1);
        return `<g transform="translate(${dx}, ${i * 25})"><circle cx="5" cy="6" r="5" fill="${escapeXml(l.color)}"/><text x="15" y="10" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="11" fill="${t.text}">${escapeXml(l.name)} ${pct}%</text></g>`;
      })
      .join("");
  const height = 55 + 20 + half * 25 + 15;
  return `<svg width="300" height="${height}" viewBox="0 0 300 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="top languages"><rect x="0.5" y="0.5" rx="4.5" width="299" height="${height - 1}" fill="${t.bg}" stroke="${stroke}"/><g transform="translate(25, 35)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="17" font-weight="600" fill="${t.title}">Top languages</text></g><g transform="translate(25, 55)">${segs}</g><g transform="translate(25, 80)">${col(left, 0)}${col(right, 150)}</g></svg>`;
}

export function renderError(message: string): string {
  const t = THEMES.dark;
  return `<svg width="450" height="120" viewBox="0 0 450 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="error"><rect x="0.5" y="0.5" rx="4.5" width="449" height="119" fill="${t.bg}" stroke="${t.border}"/><g transform="translate(25, 40)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="16" font-weight="600" fill="${t.title}">gh-stats error</text></g><g transform="translate(25, 65)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="${t.text}">${escapeXml(message).slice(0, 200)}</text></g></svg>`;
}

export function renderStreakCard(data: StreakData, opts: CardOptions = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  return `<svg width="450" height="170" viewBox="0 0 450 170" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.displayName)} streak"><rect x="0.5" y="0.5" rx="4.5" width="449" height="169" fill="${t.bg}" stroke="${stroke}"/><rect x="0" y="0" width="6" height="170" fill="${t.accent}"/><g transform="translate(25, 35)"><text font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="17" font-weight="600" fill="${t.title}">${escapeXml(data.displayName)}'s streak · ${escapeXml(data.login)}</text></g><g transform="translate(225, 105)"><text x="0" y="0" text-anchor="middle" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="44" font-weight="800" fill="${t.title}">${data.current}</text><text x="0" y="22" text-anchor="middle" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="${t.text}">day streak</text></g><g transform="translate(25, 80)"><text x="0" y="0" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="${t.text}">Longest</text><text x="0" y="24" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="22" font-weight="700" fill="${t.title}">${data.longest}</text></g><g transform="translate(360, 80)"><text x="0" y="0" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="${t.text}">Total</text><text x="0" y="24" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="22" font-weight="700" fill="${t.title}">${data.total}</text></g></svg>`;
}
