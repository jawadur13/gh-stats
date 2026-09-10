export interface StatsData {
  login: string;
  displayName: string;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contribs: number;
  rank: string;
}

export interface LangStat {
  name: string;
  color: string;
  size: number;
}

export type ThemeName = "dark" | "light";

export type StatKey = "stars" | "commits" | "prs" | "issues" | "contribs";

export interface CardOptions {
  theme?: ThemeName;
  hide?: StatKey[];
  hideBorder?: boolean;
}
