"use client";

import { cn } from "@/lib/utils";

interface FunnyMessageProps {
  message: string;
  type: "correct" | "wrong";
}

export function FunnyMessage({ message, type }: FunnyMessageProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 rounded-lg px-4 py-3 text-center text-sm font-medium duration-300",
        type === "correct" && "bg-green-500/10 text-green-400",
        type === "wrong" && "bg-red-500/10 text-red-400"
      )}
    >
      {message}
    </div>
  );
}
