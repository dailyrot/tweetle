"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DailyStats } from "@/types";

interface StatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: DailyStats;
}

export function StatsModal({ open, onOpenChange, stats }: StatsModalProps) {
  const maxDist = Math.max(...stats.distribution, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Statistics</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4 text-center">
          <div>
            <div className="text-3xl font-bold">{stats.gamesPlayed}</div>
            <div className="text-xs text-muted-foreground">Played</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.maxStreak}</div>
            <div className="text-xs text-muted-foreground">Max Streak</div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Score Distribution
          </h3>
          {stats.distribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-sm font-medium">{i}/3</span>
              <div className="flex-1">
                <div
                  className="flex h-6 items-center justify-end rounded bg-[#1d9bf0]/80 px-2 text-xs font-bold text-white transition-all duration-500"
                  style={{
                    width: `${Math.max((count / maxDist) * 100, count > 0 ? 12 : 4)}%`,
                  }}
                >
                  {count > 0 && count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
