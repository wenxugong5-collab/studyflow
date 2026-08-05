/**
 * 任务操作 Hook
 * 封装任务的增删改查逻辑
 */
import { useAppContext } from '../context/AppContext'
import { getToday } from '../utils/date'
import { generateId } from '../utils/helpers'
import type { Task } from '../types'

export function useTasks() {
  const { state, dispatch } = useAppContext()
  const today = getToday()

  // 获取今天的任务列表
  const todayTasks = state.tasks.filter((t) => t.date === today)

  // 添加新任务
  function addTask(title: string, subject: string, duration: number) {
    const newTask: Task = {
      id: generateId(),
      title,
      subject,
      date: today,
      completed: false,
      duration,
    }
    dispatch({ type: 'ADD_TASK', payload: newTask })
  }

  // 更新任务
  function updateTask(id: string, updates: Partial<Omit<Task, 'id'>>) {
    const task = state.tasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, ...updates } })
  }

  // 删除任务
  function deleteTask(id: string) {
    dispatch({ type: 'DELETE_TASK', payload: id })
  }

  // 切换完成状态
  function toggleComplete(id: string) {
    const task = state.tasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, completed: !task.completed } })
  }

  return {
    todayTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  }
}
