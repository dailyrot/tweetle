"use client";

import { Button } from "@/components/ui/button";
import type { Candidate } from "@/types";
import { cn } from "@/lib/utils";

interface AnswerButtonProps {
  candidate: Candidate;
  onClick: () => void;
  disabled: boolean;
  state: "idle" | "correct" | "wrong" | "dimmed";
}

export function AnswerButton({
  candidate,
  onClick,
  disabled,
  state,
}: AnswerButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-auto w-full justify-start gap-3 px-4 py-3 text-left transition-all duration-300",
        state === "idle" &&
          "border-border/60 hover:border-primary/40 hover:bg-accent",
        state === "correct" &&
          "border-green-500 bg-green-500/15 text-green-400 hover:bg-green-500/15",
        state === "wrong" &&
          "border-red-500 bg-red-500/15 text-red-400 hover:bg-red-500/15",
        state === "dimmed" && "opacity-40"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
        {candidate.name[0]}
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium">{candidate.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {candidate.handle}
        </div>
      </div>
    </Button>
  );
}
