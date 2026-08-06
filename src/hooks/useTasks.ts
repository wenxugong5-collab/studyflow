/**
 * 任务操作 Hook
 * 封装任务的增删改查逻辑
 * 所有回调与派生数据均经记忆化，避免父组件无关渲染时重建引用
 */
import { useCallback, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { getToday } from '../utils/date'
import { generateId } from '../utils/helpers'
import type { Task } from '../types'

export function useTasks() {
  const { state, dispatch } = useAppContext()
  const today = getToday()

  // 仅当 tasks 引用变化时重新计算
  const todayTasks = useMemo(
    () => state.tasks.filter((t) => t.date === today),
    [state.tasks, today]
  )

  // 添加新任务
  const addTask = useCallback((title: string, subject: string, duration: number) => {
    const newTask: Task = {
      id: generateId(),
      title,
      subject,
      date: today,
      completed: false,
      duration,
    }
    dispatch({ type: 'ADD_TASK', payload: newTask })
  }, [dispatch, today])

  // 更新任务
  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id'>>) => {
    const task = state.tasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, ...updates } })
  }, [dispatch, state.tasks])

  // 删除任务
  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id })
  }, [dispatch])

  // 切换完成状态
  const toggleComplete = useCallback((id: string) => {
    const task = state.tasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, completed: !task.completed } })
  }, [dispatch, state.tasks])

  return {
    todayTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  }
}
