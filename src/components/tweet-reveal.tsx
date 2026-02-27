"use client";

import { Card } from "@/components/ui/card";
import type { Candidate, Round, RoundResult } from "@/types";

interface TweetRevealProps {
  rounds: Round[];
  results: RoundResult[];
  candidates: Candidate[];
}

export function TweetReveal({ rounds, results, candidates }: TweetRevealProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        The Tweets
      </h3>
      {rounds.map((round, i) => {
        const isCorrect = results[i] === "correct";
        const candidate = candidates.find((c) => c.name === round.author);

        return (
          <Card
            key={i}
            className="border-border/50 bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isCorrect
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {round.author[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {round.author}
                  </span>
                  {candidate && (
                    <span className="truncate text-xs text-muted-foreground">
                      {candidate.handle}
                    </span>
                  )}
                  <span
                    className={`ml-auto shrink-0 text-xs font-medium ${
                      isCorrect ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {round.text}
                </p>
                {round.sourceUrl && (
                  <a
                    href={round.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#1d9bf0] hover:underline"
                  >
                    View original tweet
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
