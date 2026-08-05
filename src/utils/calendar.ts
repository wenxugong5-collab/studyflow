/**
 * 日历工具函数
 * 处理月历生成、日期计算等操作
 * 注意：所有日期使用本地时区，避免 UTC 转换导致日期偏移
 */

/** 获取某个月的天数 */
export function getDaysInMonth(year: number, month: number): number {
  // month 是 0-11，传入 12 会自动到下一年
  return new Date(year, month + 1, 0).getDate()
}

/** 获取某个月第一天是星期几（0=周日，1=周一，...6=周六） */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/** 获取日历网格数据（包含上月、当月、下月的日期） */
export interface CalendarDay {
  date: string // YYYY-MM-DD
  day: number // 日期数字
  isCurrentMonth: boolean // 是否属于当前月份
  isToday: boolean // 是否是今天
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const todayStr = formatDateSimple(today)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month) // 0=周日

  const days: CalendarDay[] = []

  // 上个月的日期（填充第一周）
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  // 如果第一天是周日（0），不需要填充上月日期
  // 否则填充上月最后几天
  const startDay = firstDay === 0 ? 7 : firstDay // 转换为 1-7（周一=1，周日=7）
  for (let i = startDay - 1; i > 0; i--) {
    const day = daysInPrevMonth - i + 1
    const dateStr = formatDateSimple(new Date(prevYear, prevMonth, day))
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateSimple(new Date(year, month, day))
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    })
  }

  // 下个月的日期（填充最后一周，凑满 6 行 7 列 = 42 格）
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const remainingDays = 42 - days.length

  for (let day = 1; day <= remainingDays; day++) {
    const dateStr = formatDateSimple(new Date(nextYear, nextMonth, day))
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

/** 格式化日期为 YYYY-MM-DD（本地时区） */
function formatDateSimple(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 获取月份的中文名称 */
export function getMonthName(year: number, month: number): string {
  return `${year}年${month + 1}月`
}

/** 获取星期标题（周一开始） */
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 判断日期是否逾期（早于今天且未完成） */
export function isDateOverdue(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date < today
}

/** 判断两个日期是否为同一天 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2
}
