"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Candidate, GameState, Puzzle, RoundResult } from "@/types";
import {
  calculateScore,
  getRandomWrongMessage,
  getTodaysPuzzle,
} from "@/lib/game-logic";
import {
  clearInProgressState,
  getInProgressState,
  getStats,
  saveGameResult,
  savePastGameResult,
  saveInProgressState,
  getTodayRecord,
} from "@/lib/storage";
import { TweetCard } from "./tweet-card";
import { AnswerButton } from "./answer-button";
import { FunnyMessage } from "./funny-message";
import { Results } from "./results";
import { StatsModal } from "./stats-modal";
import { Button } from "@/components/ui/button";

interface GameProps {
  puzzle?: Puzzle;
  mode?: "daily" | "past";
  onBack?: () => void;
  onPastTweets?: () => void;
}

export function Game({
  puzzle: puzzleProp,
  mode = "daily",
  onBack,
  onPastTweets,
}: GameProps) {
  const puzzle = useMemo(
    () => puzzleProp ?? getTodaysPuzzle(),
    [puzzleProp]
  );
  const isDaily = mode === "daily";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "correct" | "wrong";
  } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(getStats);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isDaily) {
      const existing = getTodayRecord();
      if (existing) {
        setGameState({
          puzzleId: puzzle.id,
          currentRound: 3,
          results: existing.results,
          selectedAnswers: existing.results.map(() => null),
          phase: "finished",
        });
        setStats(getStats());
        return;
      }

      const saved = getInProgressState();
      if (saved && saved.puzzleId === puzzle.id) {
        setGameState(saved);
        return;
      }
    }

    setGameState({
      puzzleId: puzzle.id,
      currentRound: 0,
      results: [null, null, null],
      selectedAnswers: [null, null, null],
      phase: "playing",
    });
  }, [puzzle.id, isDaily]);

  const handleAnswer = useCallback(
    (candidate: Candidate) => {
      if (!gameState || gameState.phase !== "playing") return;

      const round = puzzle.rounds[gameState.currentRound];
      const isCorrect = candidate.name === round.author;
      const result: RoundResult = isCorrect ? "correct" : "wrong";

      const newResults = [...gameState.results] as RoundResult[];
      newResults[gameState.currentRound] = result;

      const newAnswers = [...gameState.selectedAnswers];
      newAnswers[gameState.currentRound] = candidate.name;

      setFeedbackMsg({
        text: isCorrect
          ? "You actually knew that one! Nice."
          : getRandomWrongMessage(),
        type: isCorrect ? "correct" : "wrong",
      });

      const nextState: GameState = {
        ...gameState,
        results: newResults,
        selectedAnswers: newAnswers,
        phase: "reveal",
      };
      setGameState(nextState);
      if (isDaily) saveInProgressState(nextState);
    },
    [gameState, puzzle.rounds, isDaily]
  );

  const handleNext = useCallback(() => {
    if (!gameState) return;

    const nextRound = gameState.currentRound + 1;
    setFeedbackMsg(null);

    if (nextRound >= 3) {
      const score = calculateScore(gameState.results);
      if (isDaily) {
        saveGameResult(puzzle.id, gameState.results, score);
        clearInProgressState();
      } else {
        savePastGameResult(puzzle.id, gameState.results, score);
      }
      setStats(getStats());
      setGameState({ ...gameState, currentRound: 3, phase: "finished" });
    } else {
      const nextState: GameState = {
        ...gameState,
        currentRound: nextRound,
        phase: "playing",
      };
      setGameState(nextState);
      if (isDaily) saveInProgressState(nextState);
    }
  }, [gameState, puzzle.id, isDaily]);

  if (!mounted || !gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (gameState.phase === "finished") {
    const score = calculateScore(gameState.results);
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8">
        <Header
          label={isDaily ? "Today" : "Past"}
          onShowStats={() => setShowStats(true)}
          onBack={onBack}
          onPastTweets={onPastTweets}
          showPastTweets={isDaily}
        />
        <div className="flex flex-1 flex-col justify-center pb-16">
          <Results
            results={gameState.results}
            score={score}
            isDaily={isDaily}
            onShowStats={() => setShowStats(true)}
            onPastTweets={onPastTweets}
            onBack={onBack}
          />
        </div>
        <StatsModal
          open={showStats}
          onOpenChange={setShowStats}
          stats={stats}
        />
      </div>
    );
  }

  const currentRound = puzzle.rounds[gameState.currentRound];
  const correctAuthor = currentRound.author;
  const isRevealed = gameState.phase === "reveal";

  const getButtonState = (
    candidate: Candidate
  ): "idle" | "correct" | "wrong" | "dimmed" => {
    if (!isRevealed) return "idle";
    const selected = gameState.selectedAnswers[gameState.currentRound];
    if (candidate.name === correctAuthor) return "correct";
    if (candidate.name === selected) return "wrong";
    return "dimmed";
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8">
      <Header
        label={isDaily ? "Today" : "Past"}
        onShowStats={() => setShowStats(true)}
        onBack={onBack}
        onPastTweets={onPastTweets}
        showPastTweets={isDaily}
      />

      <div className="flex flex-1 flex-col justify-center gap-5 pb-16">
        <div className="flex justify-center gap-2">
          {gameState.results.map((r, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                i < gameState.currentRound
                  ? r === "correct"
                    ? "bg-green-500"
                    : "bg-red-500"
                  : i === gameState.currentRound
                    ? "bg-[#1d9bf0]"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <TweetCard
          text={currentRound.text}
          roundNumber={gameState.currentRound + 1}
          authorName={isRevealed ? correctAuthor : undefined}
          authorHandle={
            isRevealed
              ? puzzle.candidates.find((c) => c.name === correctAuthor)?.handle
              : undefined
          }
          revealed={isRevealed}
        />

        {feedbackMsg && (
          <FunnyMessage message={feedbackMsg.text} type={feedbackMsg.type} />
        )}

        <div className="grid grid-cols-2 gap-3">
          {puzzle.candidates.map((candidate) => (
            <AnswerButton
              key={candidate.name}
              candidate={candidate}
              onClick={() => handleAnswer(candidate)}
              disabled={isRevealed}
              state={getButtonState(candidate)}
            />
          ))}
        </div>

        {isRevealed && (
          <Button
            onClick={handleNext}
            size="lg"
            className="animate-in fade-in slide-in-from-bottom-2 w-full bg-[#1d9bf0] text-white duration-300 hover:bg-[#1a8cd8]"
          >
            {gameState.currentRound < 2 ? "Next Tweet" : "See Results"}
          </Button>
        )}
      </div>

      <StatsModal
        open={showStats}
        onOpenChange={setShowStats}
        stats={stats}
      />
    </div>
  );
}

function Header({
  label,
  onShowStats,
  onBack,
  onPastTweets,
  showPastTweets,
}: {
  label: string;
  onShowStats: () => void;
  onBack?: () => void;
  onPastTweets?: () => void;
  showPastTweets?: boolean;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Tweetle
          </h1>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showPastTweets && onPastTweets && (
          <Button variant="ghost" size="sm" onClick={onPastTweets}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onShowStats}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M7 16h2v-4H7z" />
            <path d="M11 16h2V8h-2z" />
            <path d="M15 16h2v-6h-2z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
