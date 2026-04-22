"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { useAnalyticsStore } from "@/store/analytics-store"
import { getEstimationProfile } from "@/lib/analytics-api"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Leaf,
  Minus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"

import type { EstimationProfile, GoalAnalytics } from "@/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMinutes(mins: number): string {
  if (!mins || mins === 0) return "0 min"
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(toDateStr(d))
  }
  return days
}

function getShortWeekday(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  })
}

function getShortMonthDay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function getWeekLabel(weekStart: string): string {
  return new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  iconBg: string
  loading?: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {label}
              </p>
              <p className="text-3xl font-bold text-foreground leading-none mb-1.5 truncate">
                {value}
              </p>
              {sub && (
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              )}
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0 ml-3", iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── BreakdownRow ─────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full shrink-0", color)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <Icon className="h-8 w-8 text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ─── SimpleBarChart ───────────────────────────────────────────────────────────

function SimpleBarChart({
  data,
  maxValue,
  barColor = "bg-violet-500",
  labelKey,
  valueKey,
  formatValue = (v: number) => String(v),
}: {
  data: Array<Record<string, unknown>>
  maxValue: number
  barColor?: string
  labelKey: string
  valueKey: string
  formatValue?: (v: number) => string
}) {
  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex items-end gap-1 h-28 w-full">
        {data.map((item, i) => {
          const value = (item[valueKey] as number) ?? 0
          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
          const label = item[labelKey] as string
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center flex-1 h-full cursor-default group">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all duration-300 group-hover:opacity-75",
                        value > 0 ? barColor : "bg-muted/40"
                      )}
                      style={{ height: `${Math.max(pct, value > 0 ? 6 : 2)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground">{formatValue(value)}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// ─── ActivityHeatmap ──────────────────────────────────────────────────────────

function heatmapColor(minutes: number): string {
  if (minutes === 0) return "bg-muted/30 dark:bg-muted/20"
  if (minutes < 30) return "bg-violet-300/50 dark:bg-violet-800/50"
  if (minutes < 90) return "bg-violet-400/60 dark:bg-violet-600/60"
  if (minutes < 180) return "bg-violet-500/80 dark:bg-violet-500/80"
  return "bg-violet-600 dark:bg-violet-400"
}

function ActivityHeatmap({
  days,
  dataMap,
}: {
  days: string[]
  dataMap: Map<string, number>
}) {
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <TooltipProvider delayDuration={80}>
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map((day) => {
              const mins = dataMap.get(day) ?? 0
              return (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-8 flex-1 rounded-sm cursor-default transition-opacity hover:opacity-80",
                        heatmapColor(mins)
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{getShortMonthDay(day)}</p>
                    <p className="text-muted-foreground">
                      {mins > 0 ? formatMinutes(mins) : "No activity"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[
            "bg-muted/30",
            "bg-violet-300/50",
            "bg-violet-400/60",
            "bg-violet-500/80",
            "bg-violet-600",
          ].map((cls, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", cls)} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── ConsistencyRing ──────────────────────────────────────────────────────────

function ConsistencyRing({
  pct,
  size = 52,
  stroke = 5,
  color = "#8b5cf6",
}: {
  pct: number
  size?: number
  stroke?: number
  color?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── TrendBadge ───────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: "IMPROVING" | "DECLINING" | "STABLE" }) {
  if (trend === "IMPROVING")
    return (
      <Badge variant="success" className="gap-1">
        <TrendingUp className="h-3 w-3" /> Improving
      </Badge>
    )
  if (trend === "DECLINING")
    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" /> Declining
      </Badge>
    )
  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="h-3 w-3" /> Stable
    </Badge>
  )
}

// ─── GoalAnalyticsCard ────────────────────────────────────────────────────────

function GoalAnalyticsCard({ goal }: { goal: GoalAnalytics }) {
  const {
    goalTitle,
    totalLoggedMinutes,
    completionPercent,
    consistencyScore,
    weeklyAvgMinutes,
    avgEfficiencyScore,
    isOnTrack,
    projectedCompletionDate,
    taskCount,
    completedTaskCount,
  } = goal

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-snug line-clamp-2">
              {goalTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatMinutes(totalLoggedMinutes)} logged
            </p>
          </div>
          {isOnTrack === true && (
            <Badge variant="success" className="text-[10px] shrink-0">
              On Track
            </Badge>
          )}
          {isOnTrack === false && (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              Behind
            </Badge>
          )}
        </div>

        {/* Ring metrics */}
        <div className="flex items-center justify-around py-1">
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <ConsistencyRing pct={completionPercent} color="#8b5cf6" />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                {completionPercent}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <ConsistencyRing pct={consistencyScore} color="#10b981" />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                {consistencyScore}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Consistency</p>
          </div>
          {avgEfficiencyScore != null && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <ConsistencyRing
                  pct={Math.min(avgEfficiencyScore, 100)}
                  color="#f59e0b"
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                  {avgEfficiencyScore}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Efficiency</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Stats */}
        <div className="space-y-2">
          <BreakdownRow
            label="Tasks"
            value={`${completedTaskCount} / ${taskCount}`}
            color="bg-violet-500"
          />
          <BreakdownRow
            label="Weekly avg"
            value={formatMinutes(weeklyAvgMinutes)}
            color="bg-blue-500"
          />
          {projectedCompletionDate && (
            <BreakdownRow
              label="Projected done"
              value={new Date(projectedCompletionDate).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              )}
              color={isOnTrack ? "bg-emerald-500" : "bg-amber-500"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const {
    dashboard,
    dailyRange,
    weeklyHistory,
    goalsAnalytics,
    loading,
    fetchDashboard,
    fetchDailyRange,
    fetchWeeklyHistory,
    fetchGoalsAnalytics,
  } = useAnalyticsStore()

  const [estimation, setEstimation] = useState<EstimationProfile | null>(null)
  const [estimationLoading, setEstimationLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const todayStr = toDateStr(today)
    const start = new Date(today)
    start.setDate(today.getDate() - 29)

    fetchDashboard()
    fetchDailyRange(toDateStr(start), todayStr)
    fetchWeeklyHistory(8)
    fetchGoalsAnalytics()

    getEstimationProfile()
      .then(setEstimation)
      .catch(() => null)
      .finally(() => setEstimationLoading(false))
  }, [fetchDashboard, fetchDailyRange, fetchWeeklyHistory, fetchGoalsAnalytics])

  const handleRefresh = () => {
    const today = new Date()
    const todayStr = toDateStr(today)
    const start = new Date(today)
    start.setDate(today.getDate() - 29)

    fetchDashboard()
    fetchDailyRange(toDateStr(start), todayStr)
    fetchWeeklyHistory(8)
    fetchGoalsAnalytics()

    setEstimationLoading(true)
    getEstimationProfile()
      .then(setEstimation)
      .catch(() => null)
      .finally(() => setEstimationLoading(false))
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const last30Days = useMemo(() => getLast30Days(), [])

  const dailyMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of dailyRange) map.set(d.date, d.totalLoggedMinutes)
    return map
  }, [dailyRange])

  const last7Days = useMemo(() =>
    last30Days.slice(-7).map((day) => ({
      date: day,
      label: getShortWeekday(day),
      minutes: dailyMap.get(day) ?? 0,
    })),
    [last30Days, dailyMap]
  )

  const weeklyChartData = useMemo(() =>
    [...weeklyHistory].reverse().map((w) => ({
      label: getWeekLabel(w.weekStart),
      minutes: w.totalLoggedMinutes,
    })),
    [weeklyHistory]
  )

  const maxWeeklyMinutes = useMemo(
    () => Math.max(...weeklyChartData.map((w) => w.minutes), 1),
    [weeklyChartData]
  )

  const maxDailyMinutes = useMemo(
    () => Math.max(...last7Days.map((d) => d.minutes), 1),
    [last7Days]
  )

  const activeDays = dailyRange.filter((d) => d.totalLoggedMinutes > 0).length
  const todayData = dashboard?.daily
  const weekData = dashboard?.weekly
  const estimationSamples = estimation?.recentAccuracies ?? []
  const maxAccuracy = useMemo(
    () => Math.max(...estimationSamples.map((s) => s.accuracy), 150),
    [estimationSamples]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-full overflow-x-clip bg-background">
      {/* Ambient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10rem] top-[28rem] h-80 w-80 rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.22 160) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm sm:p-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "linear-gradient(130deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 48%, rgba(16,185,129,0.12) 100%)",
            }}
          />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Performance Analytics
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your focus data, distilled into clarity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="w-fit border border-border/60 bg-background/70 px-2.5 py-1 text-[11px]"
              >
                <Activity className="mr-1 h-3.5 w-3.5" />
                {activeDays} active day{activeDays !== 1 ? "s" : ""} this month
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground"
                onClick={handleRefresh}
                title="Refresh analytics"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Top Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <StatCard
            icon={Clock}
            label="Today's Focus"
            value={formatMinutes(todayData?.totalLoggedMinutes ?? 0)}
            sub={
              todayData
                ? `${todayData.sessionCount} session${todayData.sessionCount !== 1 ? "s" : ""}`
                : "No data yet"
            }
            iconBg="bg-blue-500/10 text-blue-500"
            loading={loading}
          />
          <StatCard
            icon={CheckCircle}
            label="Tasks Today"
            value={
              todayData
                ? `${todayData.completedTaskCount}/${todayData.totalTaskCount}`
                : "—"
            }
            sub={
              todayData
                ? `${todayData.taskCompletionRate}% completion rate`
                : "No tasks logged"
            }
            iconBg="bg-violet-500/10 text-violet-500"
            loading={loading}
          />
          <StatCard
            icon={Leaf}
            label="Habits Today"
            value={
              todayData
                ? `${todayData.completedHabitCount}/${todayData.totalHabitCount}`
                : "—"
            }
            sub={
              todayData
                ? `${todayData.habitCompletionRate}% completion rate`
                : "No habits tracked"
            }
            iconBg="bg-emerald-500/10 text-emerald-500"
            loading={loading}
          />
          <StatCard
            icon={Brain}
            label="Deep Work"
            value={formatMinutes(todayData?.deepWorkMinutes ?? 0)}
            sub={
              todayData
                ? `${formatMinutes(todayData.shallowWorkMinutes)} shallow`
                : "No sessions yet"
            }
            iconBg="bg-emerald-500/10 text-emerald-500"
            loading={loading}
          />
          <StatCard
            icon={Award}
            label="Est. Accuracy"
            value={
              estimation?.rollingAverage != null
                ? `${estimation.rollingAverage}%`
                : "—"
            }
            sub={
              estimation?.trend
                ? `Trend: ${estimation.trend.toLowerCase()}`
                : "Complete more tasks"
            }
            iconBg="bg-amber-500/10 text-amber-500"
            loading={estimationLoading}
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="estimation" className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Estimation
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-6 space-y-6">

            {/* 30-day heatmap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500" />
                  30-Day Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-36 w-full rounded-lg" />
                ) : (
                  <ActivityHeatmap days={last30Days} dataMap={dailyMap} />
                )}
              </CardContent>
            </Card>

            {/* Last 7 days + today breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

              {/* Bar chart */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <Skeleton className="h-28 w-full rounded-lg" />
                  ) : (
                    <>
                      <SimpleBarChart
                        data={last7Days.map((d) => ({
                          label: d.label,
                          minutes: d.minutes,
                        }))}
                        maxValue={maxDailyMinutes}
                        barColor="bg-blue-500"
                        labelKey="label"
                        valueKey="minutes"
                        formatValue={formatMinutes}
                      />
                      <div className="flex gap-1">
                        {last7Days.map((d) => (
                          <p
                            key={d.date}
                            className="flex-1 text-center text-[10px] text-muted-foreground"
                          >
                            {d.label}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Today's breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Today's Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-full rounded" />
                      ))}
                    </div>
                  ) : !todayData ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="h-8 w-8 mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        No data for today yet
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Complete a session to see analytics
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <BreakdownRow
                        label="Total logged"
                        value={formatMinutes(todayData.totalLoggedMinutes)}
                        color="bg-blue-500"
                      />
                      <BreakdownRow
                        label="Deep work"
                        value={formatMinutes(todayData.deepWorkMinutes)}
                        color="bg-violet-500"
                      />
                      <BreakdownRow
                        label="Distractions"
                        value={
                          `${todayData.totalDistractions}` +
                          (todayData.totalDistractionMinutes > 0
                            ? ` (${todayData.totalDistractionMinutes}m)`
                            : "")
                        }
                        color="bg-rose-500"
                      />
                      <Separator />
                      <BreakdownRow
                        label="Task completion"
                        value={`${todayData.taskCompletionRate}%`}
                        color="bg-emerald-500"
                      />
                      <BreakdownRow
                        label="Habit completion"
                        value={`${todayData.completedHabitCount}/${todayData.totalHabitCount} (${todayData.habitCompletionRate}%)`}
                        color="bg-lime-500"
                      />
                      {todayData.skippedHabitCount > 0 && (
                        <BreakdownRow
                          label="Habits skipped"
                          value={String(todayData.skippedHabitCount)}
                          color="bg-blue-500"
                        />
                      )}
                      {todayData.missedHabitCount > 0 && (
                        <BreakdownRow
                          label="Habits missed"
                          value={String(todayData.missedHabitCount)}
                          color="bg-rose-500"
                        />
                      )}
                      {todayData.avgEfficiencyScore != null && (
                        <BreakdownRow
                          label="Avg efficiency"
                          value={`${todayData.avgEfficiencyScore}%`}
                          color="bg-amber-500"
                        />
                      )}
                      {todayData.timeLeaks.length > 0 && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 mt-1">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {todayData.timeLeaks.length} time leak
                            {todayData.timeLeaks.length > 1 ? "s" : ""} detected
                          </p>
                          {todayData.timeLeaks.slice(0, 2).map((leak, i) => (
                            <p
                              key={i}
                              className="text-[11px] text-muted-foreground mt-1"
                            >
                              {leak.startTime} → {leak.endTime} ({leak.gapMinutes}m gap)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── WEEKLY ───────────────────────────────────────────────── */}
          <TabsContent value="weekly" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Current week summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-500" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full rounded" />
                      ))}
                    </div>
                  ) : !weekData ? (
                    <EmptyState icon={Calendar} message="No weekly data yet" />
                  ) : (
                    <>
                      <div className="text-center py-2">
                        <p className="text-4xl font-bold">
                          {formatMinutes(weekData.totalLoggedMinutes)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          total logged this week
                        </p>
                      </div>
                      <Separator />
                      <BreakdownRow
                        label="Sessions"
                        value={String(weekData.totalSessions)}
                        color="bg-blue-500"
                      />
                      <BreakdownRow
                        label="Tasks completed"
                        value={String(weekData.totalCompletedTasks)}
                        color="bg-violet-500"
                      />
                      <BreakdownRow
                        label="Avg / day"
                        value={formatMinutes(weekData.avgDailyMinutes)}
                        color="bg-emerald-500"
                      />
                      <BreakdownRow
                        label="Deep focus"
                        value={formatMinutes(weekData.deepWorkMinutes)}
                        color="bg-indigo-500"
                      />
                      {weekData.timeLeaksIdentified > 0 && (
                        <BreakdownRow
                          label="Time leaks"
                          value={String(weekData.timeLeaksIdentified)}
                          color="bg-amber-500"
                        />
                      )}
                      {weekData.bestDay && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            🏆 Best day
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {getShortMonthDay(weekData.bestDay.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMinutes(weekData.bestDay.minutes)}
                          </p>
                        </div>
                      )}
                      {weekData.worstDay && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
                          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                            📉 Lightest day
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {getShortMonthDay(weekData.worstDay.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMinutes(weekData.worstDay.minutes)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 8-week bar chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Weekly Trend (last 8 weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <Skeleton className="h-32 w-full rounded-lg" />
                  ) : weeklyChartData.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      message="Not enough data yet — keep logging!"
                    />
                  ) : (
                    <>
                      <SimpleBarChart
                        data={weeklyChartData}
                        maxValue={maxWeeklyMinutes}
                        barColor="bg-emerald-500"
                        labelKey="label"
                        valueKey="minutes"
                        formatValue={formatMinutes}
                      />
                      <div className="flex gap-1">
                        {weeklyChartData.map((w, i) => (
                          <p
                            key={i}
                            className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                          >
                            {w.label}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Goal breakdown for current week */}
            {weekData?.goalBreakdown && weekData.goalBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Goal Breakdown This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...weekData.goalBreakdown]
                      .sort((a, b) => b.minutesLogged - a.minutesLogged)
                      .map((g) => {
                        const pct =
                          weekData.totalLoggedMinutes > 0
                            ? Math.round(
                                (g.minutesLogged /
                                  weekData.totalLoggedMinutes) *
                                  100
                              )
                            : 0
                        return (
                          <div key={g.goalId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate max-w-[65%]">
                                {g.goalTitle}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatMinutes(g.minutesLogged)} ({pct}%)
                              </span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── GOALS ────────────────────────────────────────────────── */}
          <TabsContent value="goals" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : goalsAnalytics.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Target className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No goal analytics yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Complete sessions linked to goals to see data
                  </p>
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link href="/goals">
                      View Goals{" "}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {goalsAnalytics.map((g) => (
                  <GoalAnalyticsCard key={g.goalId} goal={g} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── ESTIMATION ───────────────────────────────────────────── */}
          <TabsContent value="estimation" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={Award}
                label="Rolling Average"
                value={
                  estimation?.rollingAverage != null
                    ? `${estimation.rollingAverage}%`
                    : "—"
                }
                sub={
                  estimationSamples.length > 0
                    ? `Based on ${estimationSamples.length} task${estimationSamples.length !== 1 ? "s" : ""}`
                    : "No data yet"
                }
                iconBg="bg-amber-500/10 text-amber-500"
                loading={estimationLoading}
              />
              <StatCard
                icon={TrendingUp}
                label="Accuracy Trend"
                value={estimation?.trend ?? "—"}
                sub={
                  estimation?.trend === "IMPROVING"
                    ? "You're getting better! 🎯"
                    : estimation?.trend === "DECLINING"
                    ? "Review your estimates"
                    : estimation
                    ? "Consistent estimator"
                    : "Complete more tasks"
                }
                iconBg={
                  estimation?.trend === "IMPROVING"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : estimation?.trend === "DECLINING"
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-muted text-muted-foreground"
                }
                loading={estimationLoading}
              />
              <StatCard
                icon={Zap}
                label="Samples"
                value={
                  estimationSamples.length > 0
                    ? String(estimationSamples.length)
                    : "—"
                }
                sub={
                  estimationSamples.length > 0
                    ? "Tasks with actual duration"
                    : "No tasks completed yet"
                }
                iconBg="bg-violet-500/10 text-violet-500"
                loading={estimationLoading}
              />
            </div>

            {/* Accuracy chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-amber-500" />
                    Accuracy — last {Math.min(estimationSamples.length, 20)} tasks
                  </CardTitle>
                  {estimation?.trend && <TrendBadge trend={estimation.trend} />}
                </div>
              </CardHeader>
              <CardContent>
                {estimationLoading ? (
                  <Skeleton className="h-36 w-full rounded-lg" />
                ) : estimationSamples.length === 0 ? (
                  <EmptyState
                    icon={Brain}
                    message="Complete tasks with tracked duration to see accuracy"
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      100% = estimated perfectly. &gt;100% = finished faster than estimated.
                    </p>

                    {/* Bar chart */}
                    <div className="flex items-end gap-1 h-32 w-full relative">
                      {/* 100% reference line */}
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30 pointer-events-none"
                        style={{ bottom: `${(100 / maxAccuracy) * 100}%` }}
                      />
                      <TooltipProvider delayDuration={80}>
                        {[...estimationSamples]
                          .reverse()
                          .slice(0, 20)
                          .map((s, i) => {
                            const pct = (s.accuracy / maxAccuracy) * 100
                            const isGood = s.accuracy >= 80 && s.accuracy <= 120
                            const isOver = s.accuracy > 120
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center flex-1 h-full cursor-default group">
                                    <div className="w-full flex-1 flex items-end">
                                      <div
                                        className={cn(
                                          "w-full rounded-sm transition-all",
                                          isGood
                                            ? "bg-emerald-500 group-hover:bg-emerald-400"
                                            : isOver
                                            ? "bg-blue-500 group-hover:bg-blue-400"
                                            : "bg-amber-500 group-hover:bg-amber-400"
                                        )}
                                        style={{
                                          height: `${Math.max(pct, 4)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-semibold">
                                    {s.accuracy}% accuracy
                                  </p>
                                  <p className="text-muted-foreground">
                                    Est: {formatMinutes(Math.round(s.estimated / 60_000))}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Actual: {formatMinutes(Math.round(s.actual / 60_000))}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                      </TooltipProvider>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                        80–120% (on target)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
                        &gt;120% (faster than expected)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" />
                        &lt;80% (took longer)
                      </span>
                    </div>

                    {/* Rolling average bar */}
                    {estimation?.rollingAverage != null && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Rolling Average</span>
                            <span className="font-bold">
                              {estimation.rollingAverage}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(estimation.rollingAverage, 100)}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {estimation.rollingAverage >= 95 &&
                            estimation.rollingAverage <= 105
                              ? "Near-perfect calibration — you know your velocity! 🎯"
                              : estimation.rollingAverage > 105
                              ? "You tend to overestimate time — try trimming estimates by 10–15%"
                              : "You tend to underestimate — add a time buffer to your tasks"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
