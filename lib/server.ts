import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url) });
import { createServer } from "node:http";
import { fetchStats, fetchTopLangs, parseCountPrivate, parseHideBorder, parseHideParam, parsePositiveInt, parseTheme, resolveUsername } from "./github.js";
import { fetchStreak } from "./streak.js";
import { renderError, renderStatsCard, renderStreakCard, renderTopLangsCard } from "./svg.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;
const token = process.env.PAT_1 || process.env.GITHUB_TOKEN;

function qp(url: URL, name: string): string | undefined {
  return url.searchParams.get(name) ?? undefined;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  try {
    if (url.pathname === "/api" || url.pathname === "/api/") {
      const username = resolveUsername({ username: qp(url, "username"), user: qp(url, "user") });
      const data = await fetchStats(username, {
        token,
        includePrivate: parseCountPrivate(qp(url, "count_private")),
      });
      const svg = renderStatsCard(data, {
        theme: parseTheme(qp(url, "theme")),
        hide: parseHideParam(qp(url, "hide")),
        hideBorder: parseHideBorder(qp(url, "hide_border")),
      });
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60" });
      res.end(svg);
    } else if (url.pathname === "/api/top-langs") {
      const username = resolveUsername({ username: qp(url, "username"), user: qp(url, "user") });
      const langs = await fetchTopLangs(username, { token });
      const svg = renderTopLangsCard(langs, {
        theme: parseTheme(qp(url, "theme")),
        maxLangs: parsePositiveInt(qp(url, "langs_count"), 6, 1, 8),
        hideBorder: parseHideBorder(qp(url, "hide_border")),
      });
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60" });
      res.end(svg);
    } else if (url.pathname === "/api/streak") {
      const username = resolveUsername({ username: qp(url, "username"), user: qp(url, "user") });
      const data = await fetchStreak(username, { token });
      const svg = renderStreakCard(data, {
        theme: parseTheme(qp(url, "theme")),
        hideBorder: parseHideBorder(qp(url, "hide_border")),
      });
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60" });
      res.end(svg);
    } else {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("gh-stats ok. Try /api?username=jawadur13 or /api/streak?user=jawadur13 or /api/top-langs?username=jawadur13");
    }
  } catch (err) {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(renderError(err instanceof Error ? err.message : "unknown error"));
  }
}).listen(port, () => console.log(`gh-stats dev on http://localhost:${port}`));
