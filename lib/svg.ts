import type { CardOptions, LangStat, StatsData, StatKey } from "./types.js";
import type { StreakData, StreakDay } from "./streak.js";
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

const FF = "Segoe UI, Ubuntu, Sans-Serif";

function themeOf(opts: CardOptions) {
  return THEMES[opts.theme === "light" ? "light" : "dark"];
}

function borderOf(opts: CardOptions): string {
  const t = themeOf(opts);
  return opts.hideBorder ? "transparent" : t.border;
}

/** Minimal geometric glyphs on a 14x14 box. */
function icon(name: StatKey, color: string): string {
  const sw = `stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const shapes: Record<StatKey, string> = {
    stars: `<polygon points="7,1.2 8.6,5 12.7,5.3 9.6,8.1 10.6,12.2 7,9.9 3.4,12.2 4.4,8.1 1.3,5.3 5.4,5" ${sw}/>`,
    commits: `<circle cx="7" cy="7" r="2.6" ${sw}/><path d="M0.5 7H4.4M9.6 7H13.5" ${sw}/>`,
    prs: `<circle cx="3.2" cy="3.2" r="2" ${sw}/><circle cx="3.2" cy="10.8" r="2" ${sw}/><circle cx="10.8" cy="7" r="2" ${sw}/><path d="M3.2 5.2v3.6M5.2 6.4c1.6 0 2.2-.4 3.4-1.2" ${sw}/>`,
    issues: `<circle cx="7" cy="7" r="5.4" ${sw}/><circle cx="7" cy="7" r="1.1" fill="${color}" stroke="none"/>`,
    contribs: `<rect x="1" y="1" width="5" height="5" rx="1" ${sw}/><rect x="8" y="1" width="5" height="5" rx="1" ${sw}/><rect x="1" y="8" width="5" height="5" rx="1" ${sw}/><rect x="8" y="8" width="5" height="5" rx="1" fill="${color}" stroke="none" opacity="0.9"/>`,
    followers: `<circle cx="5" cy="4.6" r="2.6" ${sw}/><path d="M0.8 12.4c0-2.8 1.9-4.4 4.2-4.4s4.2 1.6 4.2 4.4" ${sw}/><circle cx="10.6" cy="4.2" r="2.1" ${sw}/><path d="M10 8.3c1.9.4 3.2 1.8 3.2 4.1" ${sw}/>`,
    repos: `<rect x="1.4" y="2.4" width="11.2" height="9.2" rx="1.6" ${sw}/><path d="M1.4 5.6h11.2" ${sw}/>`,
  };
  return `<g stroke="${color}">${shapes[name]}</g>`;
}

const CELLS: { key: StatKey; label: string }[] = [
  { key: "stars", label: "Stars" },
  { key: "commits", label: "Commits · yr" },
  { key: "prs", label: "PRs" },
  { key: "issues", label: "Issues" },
  { key: "contribs", label: "Contributed" },
  { key: "followers", label: "Followers" },
  { key: "repos", label: "Repos" },
];

export function renderStatsCard(data: StatsData, opts: CardOptions = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  const rp = rankProgress(typeof data.score === "number" ? data.score : 0);
  const ringR = 24;
  const ringC = 2 * Math.PI * ringR;
  const ringDash = ringC.toFixed(2);
  const ringOff = (ringC * (1 - rp.progress)).toFixed(2);
  const pct = Math.round(rp.progress * 100);
  const pctLabel = rp.nextRank === null ? "Top rank" : `${pct}% to ${rp.nextRank}`;
  const hidden = new Set(opts.hide ?? []);
  const visible = CELLS.filter((c) => !hidden.has(c.key));

  const gridTop = 104;
  const rowH = 54;
  const colX = [24, 234];
  const rows = Math.ceil(visible.length / 2);
  const cells = visible
    .map((c, i) => {
      const row = Math.floor(i / 2);
      const lastOdd = visible.length % 2 === 1 && i === visible.length - 1;
      const x = lastOdd ? 129 : colX[i % 2];
      const y = gridTop + row * rowH;
      return `<g transform="translate(${x}, ${y})"><g transform="translate(0, 2)">${icon(c.key, t.accent)}</g><text x="22" y="14" font-family="${FF}" font-size="19" font-weight="800" fill="${t.title}">${data[c.key]}</text><text x="0" y="34" font-family="${FF}" font-size="11" fill="${t.text}">${c.label}</text></g>`;
    })
    .join("");
  const height = gridTop + rows * rowH + 18;
  const avId = `ghav-${data.login.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const avatar = `<defs><clipPath id="${avId}"><circle cx="37" cy="40" r="19"/></clipPath></defs><circle cx="37" cy="40" r="19" fill="${t.bar}"/><image href="https://github.com/${escapeXml(data.login)}.png" x="18" y="21" width="38" height="38" clip-path="url(#${avId})"/>`;

  return `<svg width="450" height="${height}" viewBox="0 0 450 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.displayName)} GitHub stats"><rect x="0.5" y="0.5" rx="10" width="449" height="${height - 1}" fill="${t.bg}" stroke="${stroke}"/>${avatar}<g transform="translate(68, 34)"><text font-family="${FF}" font-size="18" font-weight="700" fill="${t.title}">${escapeXml(data.displayName)}</text></g><g transform="translate(68, 54)"><text font-family="${FF}" font-size="12" fill="${t.text}">@${escapeXml(data.login)} · score ${rp.score}</text></g><g transform="translate(398, 42)"><circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.accent}" stroke-opacity="0.25" stroke-width="6"/><circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${ringDash}" stroke-dashoffset="${ringOff}" transform="rotate(-90)"><title>${escapeXml(pctLabel)}</title></circle><text x="0" y="6" text-anchor="middle" font-family="${FF}" font-size="17" font-weight="800" fill="${t.title}">${escapeXml(data.rank)}</text></g><g transform="translate(398, 82)"><text text-anchor="middle" font-family="${FF}" font-size="10" fill="${t.text}">${escapeXml(pctLabel)}</text></g>${cells}</svg>`;
}

export function renderTopLangsCard(langs: LangStat[], opts: CardOptions & { maxLangs?: number } = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  const maxLangs = Math.min(8, Math.max(1, opts.maxLangs ?? 6));
  const top = langs.slice(0, maxLangs);
  if (top.length === 0) {
    return `<svg width="300" height="120" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="top languages"><rect x="0.5" y="0.5" rx="10" width="299" height="119" fill="${t.bg}" stroke="${stroke}"/><g transform="translate(25, 35)"><text font-family="${FF}" font-size="17" font-weight="600" fill="${t.title}">Top languages</text></g><g transform="translate(25, 65)"><text font-family="${FF}" font-size="13" fill="${t.text}">No language data</text></g></svg>`;
  }
  const total = top.reduce((a, l) => a + l.size, 0) || 1;
  const cx = 150;
  const cy = 108;
  const r = 44;
  const C = 2 * Math.PI * r;
  let cum = 0;
  const segs = top
    .map((l) => {
      const f = l.size / total;
      const len = Math.max(2, f * C);
      const rot = (-90 + 360 * cum).toFixed(1);
      cum += f;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${escapeXml(l.color)}" stroke-width="18" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" transform="rotate(${rot} ${cx} ${cy})"/>`;
    })
    .join("");
  const topPct = ((top[0].size / total) * 100).toFixed(0);
  const half = Math.ceil(top.length / 2);
  const legendY = 176;
  const col = (list: LangStat[], dx: number) =>
    list
      .map((l, i) => {
        const pct = ((l.size / total) * 100).toFixed(1);
        return `<g transform="translate(${dx}, ${legendY + i * 22})"><circle cx="5" cy="6" r="5" fill="${escapeXml(l.color)}"/><text x="15" y="10" font-family="${FF}" font-size="11" fill="${t.text}">${escapeXml(l.name)} ${pct}%</text></g>`;
      })
      .join("");
  const height = legendY + half * 22 + 16;
  return `<svg width="300" height="${height}" viewBox="0 0 300 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="top languages"><rect x="0.5" y="0.5" rx="10" width="299" height="${height - 1}" fill="${t.bg}" stroke="${stroke}"/><g transform="translate(25, 35)"><text font-family="${FF}" font-size="17" font-weight="600" fill="${t.title}">Top languages</text></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.bar}" stroke-width="18"/><g data-donut="${top.length}">${segs}</g><text x="${cx}" y="${cy - 2}" text-anchor="middle" font-family="${FF}" font-size="22" font-weight="800" fill="${t.title}">${topPct}%</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="${FF}" font-size="10" fill="${t.text}">${escapeXml(top[0].name)}</text>${col(top.slice(0, half), 28)}${col(top.slice(half), 158)}</svg>`;
}

export function renderError(message: string): string {
  const t = THEMES.dark;
  return `<svg width="450" height="120" viewBox="0 0 450 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="error"><rect x="0.5" y="0.5" rx="4.5" width="449" height="119" fill="${t.bg}" stroke="${t.border}"/><g transform="translate(25, 40)"><text font-family="${FF}" font-size="16" font-weight="600" fill="${t.title}">gh-stats error</text></g><g transform="translate(25, 65)"><text font-family="${FF}" font-size="13" fill="${t.text}">${escapeXml(message).slice(0, 200)}</text></g></svg>`;
}

function heatFill(count: number, max: number, t: ReturnType<typeof themeOf>): { fill: string; opacity: string } {
  if (count <= 0 || max <= 0) return { fill: t.bar, opacity: "1" };
  return { fill: t.accent, opacity: (0.3 + (0.7 * count) / max).toFixed(2) };
}

export function renderStreakCard(data: StreakData, opts: CardOptions = {}): string {
  const t = themeOf(opts);
  const stroke = borderOf(opts);
  const base = `<svg width="450" height="HEIGHT" viewBox="0 0 450 HEIGHT" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.displayName)} streak"><rect x="0.5" y="0.5" rx="10" width="449" height="HEIGHTM1" fill="${t.bg}" stroke="${stroke}"/><g transform="translate(25, 34)"><text font-family="${FF}" font-size="17" font-weight="700" fill="${t.title}">${escapeXml(data.displayName)}'s streak</text></g><g transform="translate(408, 30)"><text text-anchor="end" font-family="${FF}" font-size="12" fill="${t.text}">@${escapeXml(data.login)}</text></g><g transform="translate(80, 92)"><text text-anchor="middle" font-family="${FF}" font-size="13" fill="${t.text}">Longest</text><text x="0" y="30" text-anchor="middle" font-family="${FF}" font-size="26" font-weight="800" fill="${t.title}">${data.longest}</text></g><g transform="translate(225, 84)"><text text-anchor="middle" font-family="${FF}" font-size="46" font-weight="800" fill="${t.accent}">${data.current}</text><text x="0" y="24" text-anchor="middle" font-family="${FF}" font-size="13" fill="${t.text}">day streak</text></g><g transform="translate(370, 92)"><text text-anchor="middle" font-family="${FF}" font-size="13" fill="${t.text}">Total</text><text x="0" y="30" text-anchor="middle" font-family="${FF}" font-size="26" font-weight="800" fill="${t.title}">${data.total}</text></g>HEAT</svg>`;
  const days: StreakDay[] = (data.days ?? []).slice(-140);
  if (days.length === 0) {
    return base.replaceAll("HEIGHTM1", "169").replaceAll("HEIGHT", "170").replace("HEAT", "");
  }
  const max = Math.max(...days.map((d) => d.count));
  const step = 7;
  const size = 5;
  const cols = Math.ceil(days.length / 7);
  const w = cols * step - 2;
  const x0 = Math.round((450 - w) / 2);
  const y0 = 150;
  let cells = "";
  days.forEach((d, i) => {
    const colIdx = Math.floor(i / 7);
    const rowIdx = i % 7;
    const { fill, opacity } = heatFill(d.count, max, t);
    cells += `<rect x="${x0 + colIdx * step}" y="${y0 + rowIdx * step}" width="${size}" height="${size}" rx="1" fill="${fill}" opacity="${opacity}"/>`;
  });
  const h = y0 + 7 * step + 16;
  const heat = `<g data-heat="${days.length}">${cells}</g><g transform="translate(25, ${y0 + 44})"><text font-family="${FF}" font-size="10" fill="${t.text}">Last ${cols} weeks</text></g>`;
  return base.replaceAll("HEIGHTM1", String(h - 1)).replaceAll("HEIGHT", String(h)).replace("HEAT", heat);
}
