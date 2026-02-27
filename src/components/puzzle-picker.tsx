"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatShortDate, type PastPuzzleEntry } from "@/lib/game-logic";

interface PuzzlePickerProps {
  entries: PastPuzzleEntry[];
  onSelect: (entry: PastPuzzleEntry) => void;
  onBack: () => void;
}

export function PuzzlePicker({ entries, onSelect, onBack }: PuzzlePickerProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
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
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Tweetle
          </h1>
          <p className="text-xs text-muted-foreground">
            {entries.length} missed {entries.length === 1 ? "day" : "days"} to catch up on
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center gap-4 pt-16 text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="text-xl font-bold">All caught up!</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve played all the recent ones. Come back tomorrow for a new
            daily puzzle.
          </p>
          <Button variant="outline" onClick={onBack}>
            Back to Daily
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const previewText =
              entry.puzzle.rounds[0].text.length > 80
                ? entry.puzzle.rounds[0].text.slice(0, 80) + "..."
                : entry.puzzle.rounds[0].text;
            const names = entry.puzzle.candidates.map((c) => c.name).join(", ");

            return (
              <Card
                key={entry.puzzle.id}
                className="cursor-pointer border-border/50 bg-card p-4 transition-colors hover:border-[#1d9bf0]/40 hover:bg-accent"
                onClick={() => onSelect(entry)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1d9bf0]">
                    Puzzle #{entry.puzzleNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatShortDate(entry.date)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{previewText}&rdquo;
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{names}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
