"use client";

import { useEffect, useCallback, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getResultMessage, getPuzzleNumber } from "@/lib/game-logic";
import type { Candidate, Round, RoundResult } from "@/types";
import { TweetReveal } from "./tweet-reveal";

function copyViaTextarea(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

interface ResultsProps {
  results: RoundResult[];
  score: number;
  isDaily: boolean;
  rounds: Round[];
  candidates: Candidate[];
  onShowStats: () => void;
  onPastTweets?: () => void;
  onBack?: () => void;
}

export function Results({
  results,
  score,
  isDaily,
  rounds,
  candidates,
  onShowStats,
  onPastTweets,
  onBack,
}: ResultsProps) {
  const { title, subtitle } = getResultMessage(score);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (score === 3) {
      const end = Date.now() + 2000;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [score]);

  const puzzleNum = getPuzzleNumber();

  const getShareText = useCallback(() => {
    const emojis = results
      .map((r) => (r === "correct" ? "✅" : "❌"))
      .join("");
    const taunt =
      score === 3
        ? `I got a perfect score on Tweetle #${puzzleNum}. Beat that.`
        : score === 0
          ? `I got 0/3 on Tweetle #${puzzleNum}. Surely you can do better...`
          : `I got ${score}/3 on Tweetle #${puzzleNum}. Think you can beat me?`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    return `${taunt}\n\n${emojis}\n\n${url}`;
  }, [results, score, puzzleNum]);

  const handleShare = async () => {
    const text = getShareText();

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    let didCopy = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        didCopy = true;
      } catch {
        didCopy = false;
      }
    }

    if (!didCopy) {
      didCopy = copyViaTextarea(text);
    }

    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-6 duration-500">
      <Card className="w-full border-border/50 bg-card p-6 text-center sm:p-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>

        <div className="mt-6 flex justify-center gap-3">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold ${
                r === "correct"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {r === "correct" ? "✓" : "✗"}
            </div>
          ))}
        </div>

        <div className="mt-4 text-5xl font-black tracking-tight">
          {score}
          <span className="text-2xl text-muted-foreground">/3</span>
        </div>
      </Card>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full gap-3">
          <Button
            onClick={handleShare}
            className={`flex-1 text-white transition-colors ${
              copied
                ? "bg-green-600 hover:bg-green-600"
                : "bg-[#1d9bf0] hover:bg-[#1a8cd8]"
            }`}
            size="lg"
          >
            {copied ? "Copied!" : "Share Result"}
          </Button>
          <Button
            onClick={onShowStats}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            View Stats
          </Button>
        </div>

        {isDaily && onPastTweets && (
          <Button
            onClick={onPastTweets}
            variant="outline"
            size="lg"
            className="w-full border-[#1d9bf0]/30 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
          >
            Play Past Tweets
          </Button>
        )}

        {!isDaily && onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Back to Past Tweets
          </Button>
        )}
      </div>

      <TweetReveal rounds={rounds} results={results} candidates={candidates} />
    </div>
  );
}
