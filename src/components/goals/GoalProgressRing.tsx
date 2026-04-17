"use client"

import { cn } from "@/lib/utils"

type Props = {
  percent: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function GoalProgressRing({
  percent,
  size = 80,
  strokeWidth = 8,
  className,
}: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  // Brand-aligned color scale
  const color =
    clamped >= 100
      ? "#10b981" // emerald-500 — complete/done
      : clamped >= 60
      ? "#8b5cf6" // violet-500 — good progress
      : clamped >= 25
      ? "#818cf8" // indigo-400 — started
      : "#94a3b8" // slate-400 — just beginning

  const trackColor = "rgba(148,163,184,0.15)"

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progress: ${Math.round(clamped)}%`}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s ease-in-out, stroke 0.3s ease",
          }}
        />
      </svg>

      {/* Center label */}
      <span
        className="absolute text-[10px] font-bold tabular-nums leading-none select-none"
        style={{ color }}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  )
}
