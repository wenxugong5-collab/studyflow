/**
 * 统计工具函数
 * 统一处理日期范围、数据汇总等统计逻辑
 */

import type { FocusSession, Task } from '../types'

// 本地日期格式化（避免 UTC 偏移）
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 获取本周一
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// 获取本周日
function getSunday(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

// 获取本月第一天
function getMonthFirstDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// 获取本月最后一天
function getMonthLastDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

// 时间范围类型
export type TimeRange = 'week' | 'month'

// 周期类型
export interface Period {
  start: Date
  end: Date
  label: string
}

// 获取当前周期
export function getCurrentPeriod(range: TimeRange): Period {
  const now = new Date()
  if (range === 'week') {
    const monday = getMonday(now)
    const sunday = getSunday(monday)
    return {
      start: monday,
      end: sunday,
      label: `${formatLocalDate(monday)}–${formatLocalDate(sunday)}`,
    }
  } else {
    const first = getMonthFirstDay(now)
    const last = getMonthLastDay(now)
    return {
      start: first,
      end: last,
      label: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    }
  }
}

// 获取上一周期
export function getPreviousPeriod(range: TimeRange, current: Period): Period {
  if (range === 'week') {
    const start = new Date(current.start)
    start.setDate(start.getDate() - 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return {
      start,
      end,
      label: `${formatLocalDate(start)}–${formatLocalDate(end)}`,
    }
  } else {
    const start = new Date(current.start)
    start.setMonth(start.getMonth() - 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    return {
      start,
      end,
      label: `${start.getFullYear()}年${start.getMonth() + 1}月`,
    }
  }
}

// 获取下一周期
export function getNextPeriod(range: TimeRange, current: Period): Period {
  if (range === 'week') {
    const start = new Date(current.start)
    start.setDate(start.getDate() + 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return {
      start,
      end,
      label: `${formatLocalDate(start)}–${formatLocalDate(end)}`,
    }
  } else {
    const start = new Date(current.start)
    start.setMonth(start.getMonth() + 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    return {
      start,
      end,
      label: `${start.getFullYear()}年${start.getMonth() + 1}月`,
    }
  }
}

// 检查周期是否在未来
export function isFuturePeriod(period: Period): boolean {
  return period.start > new Date()
}

// 检查日期是否在范围内
function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  try {
    const date = new Date(dateStr)
    return date >= start && date <= end
  } catch {
    return false
  }
}

// 过滤时间范围内的专注记录
export function filterSessionsByRange(
  sessions: FocusSession[],
  start: Date,
  end: Date
): FocusSession[] {
  if (!Array.isArray(sessions)) return []
  return sessions.filter((s) => {
    if (!s.startedAt) return false
    return isDateInRange(s.startedAt, start, end)
  })
}

// 过滤时间范围内的任务
export function filterTasksByRange(
  tasks: Task[],
  start: Date,
  end: Date
): Task[] {
  if (!Array.isArray(tasks)) return []
  return tasks.filter((t) => {
    if (!t.date) return false
    return isDateInRange(t.date, start, end)
  })
}

// 计算总专注分钟数
export function getTotalMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0)
}

// 计算完成专注次数
export function getCompletedCount(sessions: FocusSession[]): number {
  return sessions.filter((s) => s.status === 'completed').length
}

// 计算任务完成率
export function getCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((t) => t.completed).length
  return Math.round((completed / tasks.length) * 100)
}

// 按学科分组专注时长
export function groupBySubject(sessions: FocusSession[]): { subject: string; minutes: number }[] {
  const map: Record<string, number> = {}
  sessions.forEach((s) => {
    const subject = s.subject || '未分类'
    map[subject] = (map[subject] || 0) + (s.actualMinutes || 0)
  })
  return Object.entries(map)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

// 按学科分组任务
export function groupTasksBySubject(tasks: Task[]): { subject: string; total: number; completed: number }[] {
  const map: Record<string, { total: number; completed: number }> = {}
  tasks.forEach((t) => {
    const subject = t.subject || '未分类'
    if (!map[subject]) map[subject] = { total: 0, completed: 0 }
    map[subject].total++
    if (t.completed) map[subject].completed++
  })
  return Object.entries(map)
    .map(([subject, data]) => ({ subject, ...data }))
    .sort((a, b) => b.total - a.total)
}

// 按天汇总专注时长
export function getDailyMinutes(sessions: FocusSession[], start: Date, days: number): { date: string; minutes: number }[] {
  const result: { date: string; minutes: number }[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const dateStr = formatLocalDate(date)
    const dayMinutes = sessions
      .filter((s) => s.startedAt?.startsWith(dateStr))
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0)
    result.push({ date: dateStr, minutes: dayMinutes })
  }
  return result
}

// 格式化分钟为小时+分钟
export function formatMinutesToHours(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 生成学习洞察
export function generateInsights(
  sessions: FocusSession[],
  tasks: Task[],
  currentMinutes: number,
  previousMinutes: number
): string[] {
  const insights: string[] = []

  if (sessions.length === 0) {
    return ['完成几次专注后，这里会生成你的学习洞察。']
  }

  // 1. 专注时长最多的学科
  const subjectGroups = groupBySubject(sessions.filter((s) => s.status === 'completed'))
  if (subjectGroups.length > 0) {
    const top = subjectGroups[0]
    insights.push(`你在${top.subject}上投入最多，共 ${top.minutes} 分钟。`)
  }

  // 2. 专注时长最高的一天
  const dailyData = getDailyMinutes(
    sessions.filter((s) => s.status === 'completed'),
    new Date(),
    7
  )
  const maxDay = dailyData.reduce((max, d) => (d.minutes > max.minutes ? d : max), dailyData[0])
  if (maxDay && maxDay.minutes > 0) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dayName = weekdays[new Date(maxDay.date).getDay()]
    insights.push(`${dayName}是你专注时间最长的一天，共 ${maxDay.minutes} 分钟。`)
  }

  // 3. 周期对比
  if (previousMinutes > 0 && currentMinutes > 0) {
    const change = Math.round(((currentMinutes - previousMinutes) / previousMinutes) * 100)
    if (change > 0) {
      insights.push(`相比上一周期，你的专注时长增加了 ${change}%。`)
    } else if (change < 0) {
      insights.push(`相比上一周期，你的专注时长减少了 ${Math.abs(change)}%。`)
    }
  }

  // 4. 平均专注时长
  const completedSessions = sessions.filter((s) => s.status === 'completed')
  if (completedSessions.length > 0) {
    const avgMinutes = Math.round(getTotalMinutes(completedSessions) / completedSessions.length)
    insights.push(`平均每次专注时长为 ${avgMinutes} 分钟。`)
  }

  // 5. 任务完成率
  if (tasks.length > 0) {
    const rate = getCompletionRate(tasks)
    const incomplete = tasks.filter((t) => !t.completed).length
    insights.push(`任务完成率为 ${rate}%，还有 ${incomplete} 项任务未完成。`)
  }

  return insights.slice(0, 3)
}
