/**
 * 学习计划操作 Hook
 * 封装学习计划的增删改查逻辑
 * 所有回调与派生数据均经记忆化，避免父组件无关渲染时重建引用
 */
import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { generateId } from '../utils/helpers'
import { getToday } from '../utils/date'
import type { StudyPlan, PlanTask } from '../types'

export function useStudyPlans() {
  const { state, dispatch } = useAppContext()

  // 获取所有学习计划
  const studyPlans = state.studyPlans

  // 获取某个计划的子任务（记忆化，依赖 state.planTasks）
  const getPlanTasks = useCallback((planId: string) => {
    return state.planTasks.filter((t) => t.planId === planId)
  }, [state.planTasks])

  // 计算计划完成百分比
  const getPlanProgress = useCallback((planId: string): number => {
    const tasks = state.planTasks.filter((t) => t.planId === planId)
    if (tasks.length === 0) return 0
    const completed = tasks.filter((t) => t.completed).length
    return Math.round((completed / tasks.length) * 100)
  }, [state.planTasks])

  // 添加新计划
  const addPlan = useCallback((data: Omit<StudyPlan, 'id' | 'createdAt'>) => {
    const newPlan: StudyPlan = {
      ...data,
      id: generateId(),
      createdAt: getToday(),
    }
    dispatch({ type: 'ADD_STUDY_PLAN', payload: newPlan })
  }, [dispatch])

  // 更新计划
  const updatePlan = useCallback((id: string, data: Partial<Omit<StudyPlan, 'id' | 'createdAt'>>) => {
    const plan = state.studyPlans.find((p) => p.id === id)
    if (!plan) return
    dispatch({ type: 'UPDATE_STUDY_PLAN', payload: { ...plan, ...data } })
  }, [dispatch, state.studyPlans])

  // 删除计划（同时删除关联的子任务）
  const deletePlan = useCallback((id: string) => {
    dispatch({ type: 'DELETE_STUDY_PLAN', payload: id })
  }, [dispatch])

  // 添加子任务
  const addPlanTask = useCallback((data: Omit<PlanTask, 'id' | 'createdAt'>) => {
    const newTask: PlanTask = {
      ...data,
      id: generateId(),
      createdAt: getToday(),
    }
    dispatch({ type: 'ADD_PLAN_TASK', payload: newTask })
  }, [dispatch])

  // 更新子任务
  const updatePlanTask = useCallback((id: string, data: Partial<Omit<PlanTask, 'id' | 'createdAt'>>) => {
    const task = state.planTasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_PLAN_TASK', payload: { ...task, ...data } })
  }, [dispatch, state.planTasks])

  // 删除子任务
  const deletePlanTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PLAN_TASK', payload: id })
  }, [dispatch])

  // 切换子任务完成状态
  const togglePlanTaskComplete = useCallback((id: string) => {
    const task = state.planTasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_PLAN_TASK', payload: { ...task, completed: !task.completed } })
  }, [dispatch, state.planTasks])

  return {
    studyPlans,
    getPlanTasks,
    getPlanProgress,
    addPlan,
    updatePlan,
    deletePlan,
    addPlanTask,
    updatePlanTask,
    deletePlanTask,
    togglePlanTaskComplete,
  }
}
