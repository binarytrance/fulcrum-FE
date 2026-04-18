import { create } from 'zustand'
import * as tasksApi from '../lib/tasks-api'
import type { Task, CreateTaskDto, UpdateTaskDto, TaskType, TaskStatus } from '../types'

type TasksState = {
  tasks: Task[]
  loading: boolean
  error: string | null
  currentDate: string
  fetchTasks: (filters?: { date?: string; type?: TaskType; status?: TaskStatus; goalId?: string }) => Promise<void>
  createTask: (data: CreateTaskDto) => Promise<Task>
  updateTask: (id: string, data: UpdateTaskDto) => Promise<Task>
  completeTask: (id: string, actualDuration?: number) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  setCurrentDate: (date: string) => void
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  currentDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })(),

  fetchTasks: async (filters) => {
    set({ loading: true, error: null })
    try {
      const tasks = await tasksApi.getTasks(filters)
      set({ tasks, loading: false })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load tasks' })
    }
  },

  createTask: async (data) => {
    const task = await tasksApi.createTask(data)
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },

  updateTask: async (id, data) => {
    const updated = await tasksApi.updateTask(id, data)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
    return updated
  },

  completeTask: async (id, actualDuration) => {
    const completed = await tasksApi.completeTask(id, actualDuration)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? completed : t)) }))
    return completed
  },

  deleteTask: async (id) => {
    await tasksApi.deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  setCurrentDate: (date) => set({ currentDate: date }),
}))