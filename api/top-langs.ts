import { fetchTopLangs, parseHideBorder, parsePositiveInt, parseTheme, resolveUsername } from "../lib/github.js";
import { renderError, renderTopLangsCard } from "../lib/svg.js";

export default async function handler(req: any, res: any) {
  const q = req.query ?? {};
  let username: string;
  try {
    username = resolveUsername({ username: q.username, user: q.user });
  } catch {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(400).send(renderError("missing ?username="));
  }
  try {
    const langs = await fetchTopLangs(username, {
      token: process.env.PAT_1 || process.env.GITHUB_TOKEN,
    });
    const svg = renderTopLangsCard(langs, {
      theme: parseTheme(String(q.theme ?? "dark")),
      maxLangs: parsePositiveInt(String(q.langs_count ?? "6"), 6, 1, 8),
      hideBorder: parseHideBorder(typeof q.hide_border === "string" ? q.hide_border : undefined),
    });
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(renderError(err instanceof Error ? err.message : "unknown error"));
  }
}
