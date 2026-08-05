/**
 * 日期工具函数
 * 处理日期格式化、比较等常见操作
 */

/** 获取今天的日期字符串（YYYY-MM-DD） */
export function getToday(): string {
  return formatDate(new Date())
}

/** 将 Date 对象格式化为 YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 获取星期几的中文名称 */
export function getWeekday(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return weekdays[date.getDay()]
}

/** 计算两个日期之间相差的天数 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diff = d2.getTime() - d1.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/** 判断日期是否已过期（早于今天） */
export function isOverdue(dateStr: string): boolean {
  return dateStr < getToday()
}
