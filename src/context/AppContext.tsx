/**
 * 全局状态管理
 * 使用 React Context + useReducer 管理应用的所有数据
 * 数据会自动保存到 localStorage
 */
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { AppState, StudyPlan, PlanTask, Task, FocusSession } from '../types'
import { loadData, saveData } from '../utils/storage'
import { getToday } from '../utils/date'
import { generateId } from '../utils/helpers'

// 初始状态（当 localStorage 为空时使用）
const initialState: AppState = {
  studyPlans: [],
  planTasks: [],
  tasks: [],
  focusSessions: [],
  streak: 0,
}

/** 创建演示任务数据 */
function createDemoTasks(): Task[] {
  const today = getToday()
  return [
    {
      id: generateId(),
      title: '复习数学第三章：函数与极限',
      subject: '数学',
      date: today,
      completed: false,
      duration: 45,
    },
    {
      id: generateId(),
      title: '背诵英语单词 List 15',
      subject: '英语',
      date: today,
      completed: true,
      duration: 30,
    },
    {
      id: generateId(),
      title: '阅读《红楼梦》第五回',
      subject: '语文',
      date: today,
      completed: false,
      duration: 25,
    },
  ]
}

/** 创建演示学习计划数据 */
function createDemoPlans(): { plans: StudyPlan[]; tasks: PlanTask[] } {
  const today = getToday()
  const plan1Id = generateId()
  const plan2Id = generateId()

  const plans: StudyPlan[] = [
    {
      id: plan1Id,
      name: '高等数学期中考试复习',
      subject: '数学',
      goal: '系统复习高等数学上册全部内容，掌握极限、导数、积分等核心概念',
      startDate: today,
      endDate: '2026-09-15',
      dailyMinutes: 60,
      color: '#2563eb',
      note: '重点复习第三章和第五章',
      createdAt: today,
    },
    {
      id: plan2Id,
      name: '英语四级备考',
      subject: '英语',
      goal: '通过英语四级考试，提升词汇量和听力水平',
      startDate: today,
      endDate: '2026-10-20',
      dailyMinutes: 45,
      color: '#06b6d4',
      note: '每天背诵50个单词，完成一套真题',
      createdAt: today,
    },
  ]

  const tasks: PlanTask[] = [
    {
      id: generateId(),
      planId: plan1Id,
      title: '复习极限的定义与性质',
      completed: true,
      duration: 30,
      dueDate: today,
      createdAt: today,
    },
    {
      id: generateId(),
      planId: plan1Id,
      title: '练习极限计算题',
      completed: false,
      duration: 45,
      dueDate: '2026-08-08',
      createdAt: today,
    },
    {
      id: generateId(),
      planId: plan1Id,
      title: '复习导数的概念',
      completed: false,
      duration: 40,
      dueDate: '2026-08-10',
      createdAt: today,
    },
    {
      id: generateId(),
      planId: plan2Id,
      title: '背诵四级词汇 List 1-5',
      completed: true,
      duration: 30,
      dueDate: today,
      createdAt: today,
    },
    {
      id: generateId(),
      planId: plan2Id,
      title: '完成 2025年12月听力真题',
      completed: false,
      duration: 45,
      dueDate: '2026-08-09',
      createdAt: today,
    },
  ]

  return { plans, tasks }
}

/** 可以执行的操作类型 */
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'ADD_STUDY_PLAN'; payload: StudyPlan }
  | { type: 'UPDATE_STUDY_PLAN'; payload: StudyPlan }
  | { type: 'DELETE_STUDY_PLAN'; payload: string }
  | { type: 'ADD_PLAN_TASK'; payload: PlanTask }
  | { type: 'UPDATE_PLAN_TASK'; payload: PlanTask }
  | { type: 'DELETE_PLAN_TASK'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_FOCUS_SESSION'; payload: FocusSession }
  | { type: 'SET_STREAK'; payload: number }

/** Reducer：根据 action 更新状态 */
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload
    case 'ADD_STUDY_PLAN':
      return { ...state, studyPlans: [...state.studyPlans, action.payload] }
    case 'UPDATE_STUDY_PLAN':
      return {
        ...state,
        studyPlans: state.studyPlans.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      }
    case 'DELETE_STUDY_PLAN':
      return {
        ...state,
        studyPlans: state.studyPlans.filter((p) => p.id !== action.payload),
        planTasks: state.planTasks.filter((t) => t.planId !== action.payload),
      }
    case 'ADD_PLAN_TASK':
      return { ...state, planTasks: [...state.planTasks, action.payload] }
    case 'UPDATE_PLAN_TASK':
      return {
        ...state,
        planTasks: state.planTasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      }
    case 'DELETE_PLAN_TASK':
      return { ...state, planTasks: state.planTasks.filter((t) => t.id !== action.payload) }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) }
    case 'ADD_FOCUS_SESSION':
      return { ...state, focusSessions: [...state.focusSessions, action.payload] }
    case 'SET_STREAK':
      return { ...state, streak: action.payload }
    default:
      return state
  }
}

/** Context 包含状态和 dispatch 函数 */
interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

/** Provider 组件：包裹整个应用 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    // 初始化时从 localStorage 读取数据
    const saved = loadData<AppState | null>(null)
    if (saved && saved.tasks && saved.tasks.length > 0) {
      // 兼容旧数据：确保新字段存在，不会因为缺少字段导致页面崩溃
      return {
        ...initialState,
        ...saved,
        studyPlans: saved.studyPlans ?? [],
        planTasks: saved.planTasks ?? [],
      }
    }
    // 否则使用演示数据
    const demoData = createDemoPlans()
    return {
      ...initialState,
      tasks: createDemoTasks(),
      studyPlans: demoData.plans,
      planTasks: demoData.tasks,
    }
  })

  // 每次状态变化时保存到 localStorage
  useEffect(() => {
    saveData(state)
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

/** 自定义 Hook：方便在组件中使用全局状态 */
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext 必须在 AppProvider 内部使用')
  }
  return context
}
