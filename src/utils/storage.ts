/**
 * localStorage 读写封装
 * localStorage 是浏览器提供的本地存储，数据会持久保存（除非用户清除）
 */

const STORAGE_KEY = 'studyflow_data'

/** 从本地存储读取数据 */
export function loadData<T>(defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    // 如果解析失败，返回默认值
    return defaultValue
  }
}

/** 保存数据到本地存储 */
export function saveData<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    console.error('保存数据失败，可能是存储空间不足')
  }
}
