"use client";

import { useCallback, useState } from "react";
import type { Puzzle } from "@/types";
import { getRecentPastPuzzles } from "@/lib/game-logic";
import { getCompletedPuzzleIds } from "@/lib/storage";
import { Game } from "./game";
import { PuzzlePicker } from "./puzzle-picker";

type Screen =
  | { type: "daily" }
  | { type: "picker" }
  | { type: "past"; puzzle: Puzzle };

export function App() {
  const [screen, setScreen] = useState<Screen>({ type: "daily" });

  const goToPicker = useCallback(() => {
    setScreen({ type: "picker" });
  }, []);

  const goToDaily = useCallback(() => {
    setScreen({ type: "daily" });
  }, []);

  const playPast = useCallback((puzzle: Puzzle) => {
    setScreen({ type: "past", puzzle });
  }, []);

  if (screen.type === "picker") {
    const unplayed = getRecentPastPuzzles(getCompletedPuzzleIds());
    return (
      <PuzzlePicker
        puzzles={unplayed}
        onSelect={playPast}
        onBack={goToDaily}
      />
    );
  }

  if (screen.type === "past") {
    return (
      <Game
        key={screen.puzzle.id}
        puzzle={screen.puzzle}
        mode="past"
        onBack={goToPicker}
        onPastTweets={goToPicker}
      />
    );
  }

  return (
    <Game key="daily" mode="daily" onPastTweets={goToPicker} />
  );
}
