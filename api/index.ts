import { fetchStats, parseCountPrivate, parseHideBorder, parseHideParam, parseTheme, resolveUsername } from "../lib/github.js";
import { renderError, renderStatsCard } from "../lib/svg.js";

function cacheSeconds(): number {
  const v = Number.parseInt(process.env.CACHE_SECONDS ?? "3600", 10);
  return Number.isFinite(v) && v >= 60 ? v : 3600;
}

export default async function handler(req: any, res: any) {
  const q = req.query ?? {};
  let username: string;
  try {
    // Accepts ?username= and ?user= ; ignores hide_border/include_all_commits/layout extras.
    username = resolveUsername({ username: q.username, user: q.user });
  } catch {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(400).send(renderError("missing ?username="));
  }
  try {
    const data = await fetchStats(username, {
      token: process.env.PAT_1 || process.env.GITHUB_TOKEN,
      includePrivate: parseCountPrivate(String(q.count_private ?? "false")),
    });
    const svg = renderStatsCard(data, {
      theme: parseTheme(String(q.theme ?? "dark")),
      hide: parseHideParam(typeof q.hide === "string" ? q.hide : undefined),
      hideBorder: parseHideBorder(typeof q.hide_border === "string" ? q.hide_border : undefined),
    });
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds()}, stale-while-revalidate=86400`);
    return res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).send(renderError(err instanceof Error ? err.message : "unknown error"));
  }
}
