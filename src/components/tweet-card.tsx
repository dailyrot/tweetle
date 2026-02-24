"use client";

import { Card } from "@/components/ui/card";

interface TweetCardProps {
  text: string;
  roundNumber: number;
  authorName?: string;
  authorHandle?: string;
  revealed?: boolean;
}

export function TweetCard({
  text,
  roundNumber,
  authorName,
  authorHandle,
  revealed,
}: TweetCardProps) {
  return (
    <Card className="w-full border-border/50 bg-card p-5 sm:p-6">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
          {revealed && authorName ? authorName[0] : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {revealed && authorName ? (
              <>
                <span className="truncate font-semibold text-foreground">
                  {authorName}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {authorHandle}
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-muted-foreground">
                  Who tweeted this?
                </span>
                <span className="text-sm text-muted-foreground">
                  Round {roundNumber}/3
                </span>
              </>
            )}
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground sm:text-base">
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}
