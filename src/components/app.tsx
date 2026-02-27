"use client";

import { useCallback, useState } from "react";
import type { Puzzle } from "@/types";
import {
  getRecentPastPuzzles,
  type PastPuzzleEntry,
} from "@/lib/game-logic";
import { getCompletedPuzzleIds } from "@/lib/storage";
import { Game } from "./game";
import { PuzzlePicker } from "./puzzle-picker";

type Screen =
  | { type: "daily" }
  | { type: "picker" }
  | { type: "past"; entry: PastPuzzleEntry };

export function App() {
  const [screen, setScreen] = useState<Screen>({ type: "daily" });

  const goToPicker = useCallback(() => {
    setScreen({ type: "picker" });
  }, []);

  const goToDaily = useCallback(() => {
    setScreen({ type: "daily" });
  }, []);

  const playPast = useCallback((entry: PastPuzzleEntry) => {
    setScreen({ type: "past", entry });
  }, []);

  if (screen.type === "picker") {
    const entries = getRecentPastPuzzles(getCompletedPuzzleIds());
    return (
      <PuzzlePicker
        entries={entries}
        onSelect={playPast}
        onBack={goToDaily}
      />
    );
  }

  if (screen.type === "past") {
    const { entry } = screen;
    return (
      <Game
        key={entry.puzzle.id}
        puzzle={entry.puzzle}
        mode="past"
        puzzleNumber={entry.puzzleNumber}
        dateLabel={entry.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })}
        onBack={goToPicker}
        onPastTweets={goToPicker}
      />
    );
  }

  return (
    <Game key="daily" mode="daily" onPastTweets={goToPicker} />
  );
}
