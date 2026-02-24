export interface Candidate {
  name: string;
  handle: string;
}

export interface Round {
  text: string;
  author: string;
}

export interface Puzzle {
  id: number;
  candidates: Candidate[];
  rounds: Round[];
}

export type RoundResult = "correct" | "wrong" | null;

export interface GameState {
  puzzleId: number;
  currentRound: number;
  results: RoundResult[];
  selectedAnswers: (string | null)[];
  phase: "playing" | "reveal" | "finished";
}

export interface DailyStats {
  gamesPlayed: number;
  currentStreak: number;
  maxStreak: number;
  distribution: [number, number, number, number]; // [0/3, 1/3, 2/3, 3/3]
}

export interface DailyRecord {
  date: string;
  puzzleId: number;
  results: RoundResult[];
  score: number;
}
