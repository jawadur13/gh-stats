import { getYearWindow, ghGraphQL } from "./github.js";

export interface StreakDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface StreakResult {
  current: number;
  longest: number;
  total: number;
}

export interface StreakData extends StreakResult {
  login: string;
  displayName: string;
  /** Full calendar (ascending). Optional so old callers keep working. */
  days?: StreakDay[];
}

/** Pure streak math over ascending calendar days. Zero-days break runs. */
export function computeStreaks(days: StreakDay[]): StreakResult {
  if (days.length === 0) return { current: 0, longest: 0, total: 0 };
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let total = 0;
  let longest = 0;
  let run = 0;
  for (const d of sorted) {
    total += d.count;
    if (d.count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  // Current streak walks back from the end. A trailing zero just means
  // today isn't done yet, so one trailing zero is skipped.
  let current = 0;
  let i = sorted.length - 1;
  if (sorted[i].count === 0) i -= 1;
  for (; i >= 0; i--) {
    if (sorted[i].count > 0) current += 1;
    else break;
  }
  return { current, longest, total };
}

interface StreakQuery {
  user: {
    name: string | null;
    login: string;
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
      };
    };
  } | null;
}

const STREAK_QUERY = `
query Streak($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    name
    login
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

export async function fetchStreak(
  login: string,
  opts: { token?: string; now?: Date } = {}
): Promise<StreakData> {
  const clean = login.trim();
  if (!clean || !/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
    throw new Error(`invalid username "${login}"`);
  }
  const { from, to } = getYearWindow(opts.now);
  const data: StreakQuery = await ghGraphQL<StreakQuery>(opts.token, STREAK_QUERY, {
    login: clean,
    from,
    to,
  });
  if (!data.user) throw new Error(`user "${clean}" not found`);
  const days: StreakDay[] = data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  );
  return {
    login: data.user.login,
    displayName: data.user.name ?? data.user.login,
    ...computeStreaks(days),
    days,
  };
}
