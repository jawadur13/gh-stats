export interface StatsData {
  login: string;
  displayName: string;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contribs: number;
  followers: number;
  repos: number;
  score?: number;
  rank: string;
  /** Embedded data-URI avatar (or null when unavailable). Never an external URL. */
  avatar?: string | null;
}

export interface LangStat {
  name: string;
  color: string;
  size: number;
}

export type ThemeName = "dark" | "light";

export type StatKey = "stars" | "commits" | "prs" | "issues" | "contribs" | "followers" | "repos";

export interface CardOptions {
  theme?: ThemeName;
  hide?: StatKey[];
  hideBorder?: boolean;
}
