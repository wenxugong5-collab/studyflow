/**
 * 学习计划操作 Hook
 * 封装学习计划的增删改查逻辑
 */
import { useAppContext } from '../context/AppContext'
import { generateId } from '../utils/helpers'
import { getToday } from '../utils/date'
import type { StudyPlan, PlanTask } from '../types'

export function useStudyPlans() {
  const { state, dispatch } = useAppContext()

  // 获取所有学习计划
  const studyPlans = state.studyPlans

  // 获取某个计划的子任务
  function getPlanTasks(planId: string) {
    return state.planTasks.filter((t) => t.planId === planId)
  }

  // 计算计划完成百分比
  function getPlanProgress(planId: string): number {
    const tasks = getPlanTasks(planId)
    if (tasks.length === 0) return 0
    const completed = tasks.filter((t) => t.completed).length
    return Math.round((completed / tasks.length) * 100)
  }

  // 添加新计划
  function addPlan(data: Omit<StudyPlan, 'id' | 'createdAt'>) {
    const newPlan: StudyPlan = {
      ...data,
      id: generateId(),
      createdAt: getToday(),
    }
    dispatch({ type: 'ADD_STUDY_PLAN', payload: newPlan })
  }

  // 更新计划
  function updatePlan(id: string, data: Partial<Omit<StudyPlan, 'id' | 'createdAt'>>) {
    const plan = state.studyPlans.find((p) => p.id === id)
    if (!plan) return
    dispatch({ type: 'UPDATE_STUDY_PLAN', payload: { ...plan, ...data } })
  }

  // 删除计划（同时删除关联的子任务）
  function deletePlan(id: string) {
    dispatch({ type: 'DELETE_STUDY_PLAN', payload: id })
  }

  // 添加子任务
  function addPlanTask(data: Omit<PlanTask, 'id' | 'createdAt'>) {
    const newTask: PlanTask = {
      ...data,
      id: generateId(),
      createdAt: getToday(),
    }
    dispatch({ type: 'ADD_PLAN_TASK', payload: newTask })
  }

  // 更新子任务
  function updatePlanTask(id: string, data: Partial<Omit<PlanTask, 'id' | 'createdAt'>>) {
    const task = state.planTasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_PLAN_TASK', payload: { ...task, ...data } })
  }

  // 删除子任务
  function deletePlanTask(id: string) {
    dispatch({ type: 'DELETE_PLAN_TASK', payload: id })
  }

  // 切换子任务完成状态
  function togglePlanTaskComplete(id: string) {
    const task = state.planTasks.find((t) => t.id === id)
    if (!task) return
    dispatch({ type: 'UPDATE_PLAN_TASK', payload: { ...task, completed: !task.completed } })
  }

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
