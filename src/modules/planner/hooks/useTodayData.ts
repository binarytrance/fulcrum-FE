"use client";

import { useEffect, useState } from "react";
import { getTasks } from "@/modules/tasks/api/tasks-api";
import { getHabits } from "@/modules/habits/api/habits-api";
import { getFocusSessions } from "@/modules/focus/api/focus-sessions-api";
import { getGoals } from "@/modules/goals/api/goals-api";
import { getDailyInsights } from "@/modules/insights/api/insights-api";
import type { TaskResponse } from "@/modules/tasks/types";
import type { HabitWithHistory } from "@/modules/habits/types";
import type { FocusSessionResponse } from "@/modules/focus/types";
import type { GoalResponse } from "@/modules/goals/api/goals-api";
import type { DailyInsightsResponse } from "@/modules/insights/types";

export type TodayData = {
  loading: boolean;
  tasks: TaskResponse[] | null;
  habits: HabitWithHistory[] | null;
  sessions: FocusSessionResponse[] | null;
  goals: GoalResponse[] | null;
  dailyInsights: DailyInsightsResponse | null;
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function useTodayData(): TodayData {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskResponse[] | null>(null);
  const [habits, setHabits] = useState<HabitWithHistory[] | null>(null);
  const [sessions, setSessions] = useState<FocusSessionResponse[] | null>(null);
  const [goals, setGoals] = useState<GoalResponse[] | null>(null);
  const [dailyInsights, setDailyInsights] = useState<DailyInsightsResponse | null>(null);

  useEffect(() => {
    const today = getTodayDate();

    Promise.all([
      getTasks({ date: today, limit: 50 }),
      getHabits({ status: "ACTIVE", limit: 50 }),
      getFocusSessions({ startDate: today, endDate: today, limit: 50 }),
      getGoals({ status: "ACTIVE", limit: 50 }),
      getDailyInsights(today),
    ]).then(async ([tasksRes, habitsRes, sessionsRes, goalRes, analyticsRes]) => {
      if (tasksRes.payload && "success" in tasksRes.payload && tasksRes.payload.success) {
        setTasks(tasksRes.payload.data.items);
      } else {
        setTasks([]);
      }

      if (habitsRes.payload && "success" in habitsRes.payload && habitsRes.payload.success) {
        setHabits(habitsRes.payload.data.items);
      } else {
        setHabits([]);
      }

      if (sessionsRes.payload && "success" in sessionsRes.payload && sessionsRes.payload.success) {
        setSessions(sessionsRes.payload.data.items);
      } else {
        setSessions([]);
      }

      if (goalRes.payload && "success" in goalRes.payload && goalRes.payload.success) {
        setGoals(goalRes.payload.data.items);
      } else {
        setGoals([]);
      }

      // 404 = no activity today yet — treat as null (cards show zero state)
      if (analyticsRes.payload && "success" in analyticsRes.payload && analyticsRes.payload.success) {
        setDailyInsights(analyticsRes.payload.data);
      } else {
        setDailyInsights(null);
      }

      setLoading(false);
    });
  }, []);

  return { loading, tasks, habits, sessions, goals, dailyInsights };
}
