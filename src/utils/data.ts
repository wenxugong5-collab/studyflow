/**
 * 统一数据访问层
 * 提供安全的数据读取和写入，确保数据一致性和错误处理
 */

import type { AppState, Task, StudyPlan, PlanTask, FocusSession } from '../types'

// localStorage key
const STORAGE_KEY = 'studyflow_data'
const TIMER_STATE_KEY = 'studyflow_timer_state'

// 安全 JSON 解析
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

// 获取本地日期字符串（YYYY-MM-DD）
export function getLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 判断两个日期是否为同一天（本地时间）
export function isSameLocalDay(date1: string, date2: string): boolean {
  return date1 === date2
}

// 标准化任务数据（补充缺失字段）
export function normalizeTask(task: Partial<Task>): Task {
  return {
    id: task.id || '',
    title: task.title || '',
    subject: task.subject || '其他',
    goalId: task.goalId,
    date: task.date || '',
    completed: task.completed ?? false,
    duration: task.duration ?? 0,
  }
}

// 标准化学习计划数据
export function normalizeStudyPlan(plan: Partial<StudyPlan>): StudyPlan {
  return {
    id: plan.id || '',
    name: plan.name || '',
    subject: plan.subject || '',
    goal: plan.goal || '',
    startDate: plan.startDate || '',
    endDate: plan.endDate || '',
    dailyMinutes: plan.dailyMinutes ?? 0,
    color: plan.color || '#2563eb',
    note: plan.note || '',
    createdAt: plan.createdAt || '',
  }
}

// 标准化计划子任务数据
export function normalizePlanTask(task: Partial<PlanTask>): PlanTask {
  return {
    id: task.id || '',
    planId: task.planId || '',
    title: task.title || '',
    completed: task.completed ?? false,
    duration: task.duration ?? 0,
    dueDate: task.dueDate || '',
    createdAt: task.createdAt || '',
  }
}

// 标准化专注记录数据
export function normalizeFocusSession(session: Partial<FocusSession>): FocusSession {
  return {
    id: session.id || '',
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    subject: session.subject,
    plannedMinutes: session.plannedMinutes ?? 0,
    actualMinutes: session.actualMinutes ?? 0,
    startedAt: session.startedAt || '',
    completedAt: session.completedAt || '',
    status: session.status ?? 'completed',
  }
}

// 读取全部数据
export function loadAllData(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        studyPlans: [],
        planTasks: [],
        tasks: [],
        focusSessions: [],
        streak: 0,
      }
    }
    const data = safeJsonParse<Partial<AppState>>(raw, {})
    return {
      studyPlans: Array.isArray(data.studyPlans) ? data.studyPlans.map(normalizeStudyPlan) : [],
      planTasks: Array.isArray(data.planTasks) ? data.planTasks.map(normalizePlanTask) : [],
      tasks: Array.isArray(data.tasks) ? data.tasks.map(normalizeTask) : [],
      focusSessions: Array.isArray(data.focusSessions) ? data.focusSessions.map(normalizeFocusSession) : [],
      streak: data.streak ?? 0,
    }
  } catch {
    return {
      studyPlans: [],
      planTasks: [],
      tasks: [],
      focusSessions: [],
      streak: 0,
    }
  }
}

// 保存全部数据
export function saveAllData(data: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    console.error('保存数据失败，可能是存储空间不足')
    return false
  }
}

// 读取计时器状态
export function loadTimerState(): string | null {
  try {
    return localStorage.getItem(TIMER_STATE_KEY)
  } catch {
    return null
  }
}

// 保存计时器状态
export function saveTimerState(state: string): boolean {
  try {
    localStorage.setItem(TIMER_STATE_KEY, state)
    return true
  } catch {
    return false
  }
}

// 清除计时器状态
export function clearTimerState(): void {
  try {
    localStorage.removeItem(TIMER_STATE_KEY)
  } catch {
    // 忽略
  }
}
