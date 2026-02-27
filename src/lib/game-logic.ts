import puzzles from "@/data/tweets.json";
import type { Puzzle } from "@/types";

const EPOCH = new Date("2025-01-01T00:00:00Z").getTime();
const MS_PER_DAY = 86400000;

// Puzzle #1 starts 3 days before launch day (Feb 24, 2026 = day 420).
// So day 417 = #1, day 418 = #2, day 419 = #3, day 420 (today) = #4.
const LAUNCH_DAY_INDEX = 417;

export function getDayIndex(): number {
  const now = new Date();
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((utcNow - EPOCH) / MS_PER_DAY);
}

export function getPuzzleNumber(dayOffset = 0): number {
  return getDayIndex() + dayOffset - LAUNCH_DAY_INDEX + 1;
}

export function getDateForOffset(dayOffset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset)
  );
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getAllPuzzles(): Puzzle[] {
  return puzzles as Puzzle[];
}

export function getTodaysPuzzle(): Puzzle {
  const allPuzzles = getAllPuzzles();
  const index = getDayIndex() % allPuzzles.length;
  return allPuzzles[index];
}

export function getPuzzleForDayOffset(offset: number): Puzzle {
  const allPuzzles = getAllPuzzles();
  const dayIndex = getDayIndex() + offset;
  const index = ((dayIndex % allPuzzles.length) + allPuzzles.length) % allPuzzles.length;
  return allPuzzles[index];
}

export interface PastPuzzleEntry {
  puzzle: Puzzle;
  dayOffset: number;
  puzzleNumber: number;
  date: Date;
}

export function getRecentPastPuzzles(completedIds: number[]): PastPuzzleEntry[] {
  const todaysPuzzle = getTodaysPuzzle();
  const seen = new Set<number>([todaysPuzzle.id]);
  const result: PastPuzzleEntry[] = [];

  for (let offset = -1; offset >= -3; offset--) {
    const puzzle = getPuzzleForDayOffset(offset);
    if (!seen.has(puzzle.id) && !completedIds.includes(puzzle.id)) {
      result.push({
        puzzle,
        dayOffset: offset,
        puzzleNumber: getPuzzleNumber(offset),
        date: getDateForOffset(offset),
      });
      seen.add(puzzle.id);
    }
  }

  return result;
}

export function getPuzzleById(id: number): Puzzle | undefined {
  return getAllPuzzles().find((p) => p.id === id);
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function calculateScore(results: ("correct" | "wrong" | null)[]): number {
  return results.filter((r) => r === "correct").length;
}

const WRONG_MESSAGES = [
  "That's embarrassing.",
  "Tell me you don't use Twitter without telling me...",
  "Your Twitter literacy is concerning.",
  "Yikes. Just yikes.",
  "Are you even on the internet?",
  "My grandma would've gotten that one.",
  "Respectfully... no.",
  "The confidence was there, the accuracy was not.",
  "You really thought? 💀",
  "Delete your account.",
  "That was so wrong it's almost impressive.",
  "Did you guess with your eyes closed?",
  "Not even close, bestie.",
  "Twitter is rolling in its grave.",
  "Elon would be disappointed. Actually, maybe not.",
  "That guess was more unhinged than the tweet itself.",
  "Were you even reading the tweet?",
  "I'm going to pretend I didn't see that.",
  "L + ratio + wrong answer.",
  "You must be new here.",
];

export function getRandomWrongMessage(): string {
  return WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
}

const RESULT_MESSAGES: Record<number, { title: string; subtitle: string }> = {
  0: {
    title: "Absolutely Cooked 💀",
    subtitle: "0/3 — Do you even have Twitter? Maybe touch some grass... or a phone.",
  },
  1: {
    title: "Barely Survived 😬",
    subtitle: "1/3 — One lucky guess doesn't make you a Twitter scholar.",
  },
  2: {
    title: "Not Bad! 🤔",
    subtitle: "2/3 — You clearly spend some time on the timeline. Respect.",
  },
  3: {
    title: "Tweet Whisperer 🏆",
    subtitle: "3/3 — You know unhinged tweets like the back of your hand. Iconic.",
  },
};

export function getResultMessage(score: number) {
  return RESULT_MESSAGES[score] ?? RESULT_MESSAGES[0];
}
