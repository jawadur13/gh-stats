import type { LangStat, StatKey, StatsData } from "./types.js";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

export function getYearWindow(now: Date = new Date()): { from: string; to: string } {
  const to = new Date(now);
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function mergePrivateCommits(
  publicCommits: number,
  restricted: number,
  includePrivate: boolean
): number {
  return includePrivate ? publicCommits + restricted : publicCommits;
}

const KNOWN_STATS: StatKey[] = ["stars", "commits", "prs", "issues", "contribs"];

export function parseHideParam(value: string | undefined): StatKey[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is StatKey => (KNOWN_STATS as string[]).includes(s));
}

export function parsePositiveInt(
  value: string | undefined,
  def: number,
  min: number,
  max: number
): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export function parseTheme(value: string | undefined): "dark" | "light" {
  return value === "light" ? "light" : "dark";
}

export function parseCountPrivate(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

export function parseHideBorder(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

/**
 * Accepts both `?username=` (stats/top-langs style) and `?user=`
 * (streak-stats style) so old links keep working.
 */
export function resolveUsername(query: { username?: unknown; user?: unknown }): string {
  const raw = String(query.username ?? query.user ?? "").trim();
  if (!raw || !/^[a-zA-Z0-9-]{1,39}$/.test(raw)) {
    throw new Error("missing or invalid ?username=");
  }
  return raw;
}

export interface ScoreInput {
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contribs: number;
}

/** Weighted activity score. Commits carry volume, stars/PRs/contribs carry weight. */
export function scoreOf(s: ScoreInput): number {
  return s.commits * 1 + s.stars * 5 + s.prs * 10 + s.issues * 5 + s.contribs * 10;
}

const TIERS: { min: number; rank: string }[] = [
  { min: 0, rank: "C" },
  { min: 150, rank: "C+" },
  { min: 300, rank: "B-" },
  { min: 500, rank: "B" },
  { min: 700, rank: "B+" },
  { min: 1000, rank: "A" },
  { min: 1500, rank: "A+" },
  { min: 2500, rank: "S" },
  { min: 4000, rank: "S+" },
  { min: 6500, rank: "SS" },
];

/** Original simple rank: weighted activity score -> letter. */
export function computeRank(s: ScoreInput): string {
  return rankProgress(scoreOf(s)).rank;
}

export interface RankProgress {
  rank: string;
  score: number;
  currentMin: number;
  nextMin: number | null;
  /** 0..1 fraction toward the next tier; 1 when on the top tier. */
  progress: number;
}

export function rankProgress(score: number): RankProgress {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].min) idx = i;
  }
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  const progress =
    next === null ? 1 : Math.min(1, Math.max(0, (score - current.min) / (next.min - current.min)));
  return { rank: current.rank, score, currentMin: current.min, nextMin: next?.min ?? null, progress };
}

export async function ghGraphQL<T>(token: string | undefined, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Empty GitHub API response");
  return json.data;
}

interface StatsQuery {
  user: {
    name: string | null;
    login: string;
    pullRequests: { totalCount: number };
    issues: { totalCount: number };
    contributionsCollection: {
      totalCommitContributions: number;
      restrictedContributionsCount: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalRepositoriesWithContributedCommits: number;
    };
  } | null;
}

const STATS_QUERY = `
query Stats($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    name
    login
    pullRequests(first: 1) { totalCount }
    issues(first: 1) { totalCount }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
    }
  }
}`;

interface StarsPage {
  user: {
    repositories: {
      nodes: { stargazerCount: number }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
}

const STARS_QUERY = `
query Stars($login: String!, $after: String, $privacy: RepositoryPrivacy) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: $privacy, after: $after) {
      nodes { stargazerCount }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

async function fetchTotalStars(
  login: string,
  token: string | undefined,
  includePrivate: boolean
): Promise<number> {
  // includePrivate=false -> public only (no leak). true -> all visible to token.
  // For other users, token only sees their public repos anyway.
  let total = 0;
  let after: string | null = null;
  for (let page = 0; page < 10; page++) {
    const data: StarsPage = await ghGraphQL<StarsPage>(token, STARS_QUERY, {
      login,
      after,
      privacy: includePrivate ? null : "PUBLIC",
    });
    const repos = data.user?.repositories ?? undefined;
    if (!repos) break;
    for (const n of repos.nodes) total += n.stargazerCount ?? 0;
    if (!repos.pageInfo.hasNextPage) break;
    after = repos.pageInfo.endCursor;
  }
  return total;
}

export async function fetchStats(
  login: string,
  opts: { token?: string; includePrivate?: boolean; now?: Date } = {}
): Promise<StatsData> {
  const clean = login.trim();
  if (!clean || !/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
    throw new Error(`invalid username "${login}"`);
  }
  const includePrivate = opts.includePrivate === true;
  const { from, to } = getYearWindow(opts.now);
  const [data, stars] = await Promise.all([
    ghGraphQL<StatsQuery>(opts.token, STATS_QUERY, { login: clean, from, to }),
    fetchTotalStars(clean, opts.token, includePrivate),
  ]);
  if (!data.user) throw new Error(`user "${clean}" not found`);
  const cc = data.user.contributionsCollection;
  const commits = mergePrivateCommits(
    cc.totalCommitContributions,
    cc.restrictedContributionsCount,
    includePrivate
  );
  const prs = cc.totalPullRequestContributions;
  const issues = cc.totalIssueContributions;
  const contribs = cc.totalRepositoriesWithContributedCommits;
  const base = { stars, commits, prs, issues, contribs };
  const score = scoreOf(base);
  return {
    login: data.user.login,
    displayName: data.user.name ?? data.user.login,
    ...base,
    score,
    rank: computeRank(base),
  };
}

interface LangsQuery {
  user: {
    repositories: {
      nodes: {
        languages: {
          edges: { size: number; node: { name: string; color: string | null } }[];
        };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
}

const LANGS_QUERY = `
query Langs($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, after: $after) {
      nodes {
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const FALLBACK_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#663399",
  Astro: "#ff5a03",
  PHP: "#4F5D95",
};

export async function fetchTopLangs(
  login: string,
  opts: { token?: string; maxReposPages?: number } = {}
): Promise<LangStat[]> {
  const clean = login.trim();
  if (!clean || !/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
    throw new Error(`invalid username "${login}"`);
  }
  const totals = new Map<string, { size: number; color: string }>();
  let after: string | null = null;
  const maxPages = opts.maxReposPages ?? 3;
  for (let page = 0; page < maxPages; page++) {
    const data: LangsQuery = await ghGraphQL<LangsQuery>(opts.token, LANGS_QUERY, { login: clean, after });
    const repos = data.user?.repositories ?? undefined;
    if (!repos) {
      if (page === 0) throw new Error(`user "${clean}" not found`);
      break;
    }
    for (const repo of repos.nodes) {
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const prev = totals.get(name);
        totals.set(name, {
          size: (prev?.size ?? 0) + edge.size,
          color: edge.node.color ?? prev?.color ?? FALLBACK_COLORS[name] ?? "#8b949e",
        });
      }
    }
    if (!repos.pageInfo.hasNextPage) break;
    after = repos.pageInfo.endCursor;
  }
  return [...totals.entries()]
    .map(([name, v]) => ({ name, color: v.color, size: v.size }))
    .sort((a, b) => b.size - a.size);
}
