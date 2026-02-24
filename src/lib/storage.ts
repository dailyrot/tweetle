import type { DailyRecord, DailyStats, GameState, RoundResult } from "@/types";
import { getTodayDateString } from "./game-logic";

const STATS_KEY = "tweetle-stats";
const HISTORY_KEY = "tweetle-history";
const GAME_STATE_KEY = "tweetle-state";
const PLAYED_IDS_KEY = "tweetle-played-ids";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_STATS: DailyStats = {
  gamesPlayed: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0],
};

export function getStats(): DailyStats {
  return getItem<DailyStats>(STATS_KEY, DEFAULT_STATS);
}

export function getHistory(): DailyRecord[] {
  return getItem<DailyRecord[]>(HISTORY_KEY, []);
}

export function getCompletedPuzzleIds(): number[] {
  return getItem<number[]>(PLAYED_IDS_KEY, []);
}

function markPuzzlePlayed(puzzleId: number): void {
  const ids = getCompletedPuzzleIds();
  if (!ids.includes(puzzleId)) {
    ids.push(puzzleId);
    setItem(PLAYED_IDS_KEY, ids);
  }
}

export function getTodayRecord(): DailyRecord | null {
  const history = getHistory();
  const today = getTodayDateString();
  return history.find((r) => r.date === today) ?? null;
}

export function hasPlayedToday(): boolean {
  return getTodayRecord() !== null;
}

export function saveGameResult(
  puzzleId: number,
  results: RoundResult[],
  score: number
): void {
  const today = getTodayDateString();

  const history = getHistory();
  if (history.some((r) => r.date === today)) return;

  const record: DailyRecord = { date: today, puzzleId, results, score };
  history.push(record);
  setItem(HISTORY_KEY, history);

  markPuzzlePlayed(puzzleId);

  const stats = getStats();
  stats.gamesPlayed += 1;
  stats.distribution[score] = (stats.distribution[score] || 0) + 1;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (history.some((r) => r.date === yesterdayStr)) {
    stats.currentStreak += 1;
  } else {
    stats.currentStreak = 1;
  }
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

  setItem(STATS_KEY, stats);
}

export function savePastGameResult(
  puzzleId: number,
  results: RoundResult[],
  score: number
): void {
  const played = getCompletedPuzzleIds();
  if (played.includes(puzzleId)) return;

  markPuzzlePlayed(puzzleId);

  const stats = getStats();
  stats.gamesPlayed += 1;
  stats.distribution[score] = (stats.distribution[score] || 0) + 1;
  setItem(STATS_KEY, stats);
}

export function saveInProgressState(state: GameState): void {
  setItem(GAME_STATE_KEY, { ...state, date: getTodayDateString() });
}

export function getInProgressState(): GameState | null {
  const data = getItem<GameState & { date?: string }>(GAME_STATE_KEY, null as unknown as GameState);
  if (!data) return null;
  if (data.date !== getTodayDateString()) {
    localStorage.removeItem(GAME_STATE_KEY);
    return null;
  }
  return data;
}

export function clearInProgressState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GAME_STATE_KEY);
}
