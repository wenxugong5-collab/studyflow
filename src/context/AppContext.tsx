/**
 * 全局状态管理
 * 使用 React Context + useReducer 管理应用的所有数据
 * 数据自动同步到 Supabase，同时保留 localStorage 作为备份
 *
 * 数据流：
 * 1. 用户登录后从 Supabase 加载数据
 * 2. 如果 Supabase 为空且 localStorage 有数据，执行一次性迁移
 * 3. 所有变更同时写入 Supabase 和 localStorage
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, StudyPlan, PlanTask, Task, FocusSession } from '../types'
import { loadData, saveData } from '../utils/storage'
import { getToday } from '../utils/date'
import { generateId } from '../utils/helpers'
import { getAnonymousUserId } from '../lib/anonymousUser'
import * as supabaseData from '../lib/supabaseData'

// 初始状态（当 localStorage 为空时使用）
const initialState: AppState = {
  studyPlans: [],
  planTasks: [],
  tasks: [],
  focusSessions: [],
  streak: 0,
}

/** 已迁移记录 ID 集合的 localStorage key（保证每条只迁移一次） */
const MIGRATED_IDS_KEY = 'studyflow_migrated_ids'

/** 读取已迁移 ID 集合 */
function loadMigratedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(MIGRATED_IDS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

/** 持久化已迁移 ID 集合 */
function saveMigratedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(MIGRATED_IDS_KEY, JSON.stringify([...ids]))
  } catch {
    // 存储失败不影响功能
  }
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
export type Action =
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
  /** 是否正在从 Supabase 加载数据 */
  loading: boolean
  /** 数据加载错误信息 */
  error: string | null
  /** 最近一次 Supabase 同步错误（用于 UI 提示） */
  syncError: string | null
  /** 清除同步错误 */
  clearSyncError: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

/** Provider 组件：包裹整个应用 */
export function AppProvider({ children }: { children: ReactNode }) {
  // 匿名用户 ID：首次访问生成，持久化到 localStorage，无需登录
  const [anonymousUserId] = useState(() => getAnonymousUserId())
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    // 初始化时从 localStorage 读取数据作为初始状态
    const saved = loadData<AppState | null>(null)
    if (saved && saved.tasks && saved.tasks.length > 0) {
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  // 用户 ID ref（供 syncToSupabase 使用，使用匿名用户 ID，无需登录）
  const userIdRef = useRef<string>(anonymousUserId)
  // 是否已完成初始加载
  const loadedRef = useRef(false)
  // 总是持有最新的 state，用于乐观更新失败时回滚
  const stateRef = useRef<AppState>(state)
  // 防抖保存计时器
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 正在进行中的 Supabase 请求标识（防止重复点击产生重复写入）
  const inflightRef = useRef<Set<string>>(new Set())

  const clearSyncError = useCallback(() => setSyncError(null), [])

  // 保持 stateRef 始终最新
  stateRef.current = state

  // 应用启动时从 Supabase 加载数据（无需登录，使用匿名用户 ID）
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadFromSupabase(anonymousUserId)
  }, [anonymousUserId])

  /** 从 Supabase 加载数据 */
  async function loadFromSupabase(userId: string) {
    setLoading(true)
    setError(null)

    try {
      const [goals, taskData, sessions] = await Promise.all([
        supabaseData.fetchGoals(),
        supabaseData.fetchTasks(),
        supabaseData.fetchFocusSessions(),
      ])

      // 如果 Supabase 有数据，使用 Supabase 数据
      if (goals.length > 0 || taskData.tasks.length > 0 || taskData.planTasks.length > 0) {
        dispatch({
          type: 'SET_STATE',
          payload: {
            studyPlans: goals,
            planTasks: taskData.planTasks,
            tasks: taskData.tasks,
            focusSessions: sessions,
            streak: 0,
          },
        })
      } else {
        // Supabase 为空，尝试从 localStorage 迁移（按 ID 去重，每条只迁移一次）
        const didMigrate = await migrateFromLocalStorage(userId)
        if (didMigrate) {
          // 迁移成功：本地 state 已是最新数据，无需再全量请求 Supabase。
          // 仅触发一次持久化，让 localStorage 与当前 state 同步。
          saveData(stateRef.current)
        }
        // 无需迁移则保持当前 state（localStorage 数据）
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载数据失败，请检查网络连接'
      setError(message)
      // 出错时使用 localStorage 数据作为后备（已在初始化时加载）
    } finally {
      setLoading(false)
    }
  }

  /**
   * 从 localStorage 迁移数据到 Supabase。
   * 使用已迁移 ID 集合保证每条记录只迁移一次，避免重复。
   * 返回是否实际写入了新数据。
   */
  async function migrateFromLocalStorage(userId: string): Promise<boolean> {
    const saved = loadData<AppState | null>(null)
    if (!saved) return false

    const plans = saved.studyPlans ?? []
    const tasks = saved.tasks ?? []
    const planTasks = saved.planTasks ?? []
    const sessions = saved.focusSessions ?? []

    const migratedIds = loadMigratedIds()

    // 按 ID 过滤，只迁移尚未迁移过的记录
    const plansToMigrate = plans.filter((p) => !migratedIds.has(p.id))
    const tasksToMigrate = tasks.filter((t) => !migratedIds.has(t.id))
    const planTasksToMigrate = planTasks.filter((t) => !migratedIds.has(t.id))
    const sessionsToMigrate = sessions.filter((s) => !migratedIds.has(s.id))

    const total =
      plansToMigrate.length +
      tasksToMigrate.length +
      planTasksToMigrate.length +
      sessionsToMigrate.length
    if (total === 0) return false

    try {
      // 迁移顺序：先 goals（生成 goal UUID 并登记映射），
      // 再 tasks（goal_id 通过 goal 映射转换为 UUID），
      // 最后 sessions（task_id 通过 task 映射转换为 UUID）。
      if (plansToMigrate.length > 0) {
        await supabaseData.migrateGoals(plansToMigrate, userId)
      }
      if (tasksToMigrate.length > 0 || planTasksToMigrate.length > 0) {
        await supabaseData.migrateTasks(tasksToMigrate, planTasksToMigrate, userId)
      }
      if (sessionsToMigrate.length > 0) {
        await supabaseData.migrateFocusSessions(sessionsToMigrate, userId)
      }

      // 把这些 ID 加入已迁移集合
      const newMigrated = new Set(migratedIds)
      plansToMigrate.forEach((p) => newMigrated.add(p.id))
      tasksToMigrate.forEach((t) => newMigrated.add(t.id))
      planTasksToMigrate.forEach((t) => newMigrated.add(t.id))
      sessionsToMigrate.forEach((s) => newMigrated.add(s.id))
      saveMigratedIds(newMigrated)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '数据迁移失败'
      // 迁移失败必须明确报错，不能静默
      console.error('[Supabase] 数据迁移失败:', err)
      setError(message)
      return false
    }
  }

  /**
   * 同步单个操作到 Supabase。
   *
   * 设计要点：
   * - 返回 Promise，便于调用方 await 并在失败时回滚乐观更新。
   * - 通过 inflightRef 对同 type:id 的请求去重，防止快速双击产生重复写入。
   * - 失败时把错误冒给调用方处理（回滚 + 提示），不再仅 console.error。
   */
  function syncToSupabase(action: Action): Promise<void> {
    const userId = userIdRef.current
    if (!userId) return Promise.resolve()

    // 计算去重键：type + 目标 id
    let targetId: string = action.type
    const payload = action.payload
    if (typeof payload === 'string') {
      targetId = payload
    } else if (payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string') {
      targetId = payload.id
    } else if (typeof payload === 'number') {
      targetId = String(payload)
    }
    const dedupKey = `${action.type}:${targetId}`

    // 同一操作已在进行中则跳过，避免重复写入
    if (inflightRef.current.has(dedupKey)) {
      return Promise.resolve()
    }
    inflightRef.current.add(dedupKey)

    const cleanup = () => inflightRef.current.delete(dedupKey)

    // 把错误集中处理：控制台明确输出 + 更新 syncError 状态
    const handleError = (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[Supabase 同步失败] ${action.type}:`, err)
      setSyncError(`${action.type}：${message}`)
    }

    // 异步同步，不阻塞 UI
    let p: Promise<void>
    switch (action.type) {
      case 'ADD_STUDY_PLAN':
        p = supabaseData.insertGoal(action.payload, userId, action.payload.id, action.payload.createdAt)
        break
      case 'UPDATE_STUDY_PLAN':
        p = supabaseData.updateGoal(action.payload)
        break
      case 'DELETE_STUDY_PLAN':
        p = supabaseData.deleteGoal(action.payload)
        break
      case 'ADD_TASK':
        p = supabaseData.insertTask(action.payload, userId, action.payload.id)
        break
      case 'UPDATE_TASK':
        p = supabaseData.updateTask(action.payload)
        break
      case 'DELETE_TASK':
        p = supabaseData.deleteTask(action.payload)
        break
      case 'ADD_PLAN_TASK':
        p = supabaseData.insertPlanTask(action.payload, userId, action.payload.id, action.payload.createdAt)
        break
      case 'UPDATE_PLAN_TASK':
        p = supabaseData.updatePlanTask(action.payload)
        break
      case 'DELETE_PLAN_TASK':
        p = supabaseData.deletePlanTask(action.payload)
        break
      case 'ADD_FOCUS_SESSION':
        p = supabaseData.insertFocusSession(action.payload, userId, action.payload.id)
        break
      default:
        cleanup()
        return Promise.resolve()
    }

    return p.catch((err) => {
      handleError(err)
      throw err // 冒给调用方，用于乐观更新回滚
    }).finally(cleanup)
  }

  /**
   * 包装 dispatch：乐观更新 + 后台同步 + 失败回滚。
   *
   * - 先 dispatch 更新本地 state（界面立即响应）。
   * - 再异步同步 Supabase。
   * - 同步失败则 dispatch 逆向 action 回滚到之前的状态。
   */
  const wrappedDispatch = useCallback((action: Action) => {
    // 记录回滚前的状态，用于失败时恢复
    const prevState = stateRef.current

    dispatch(action)

    syncToSupabase(action).catch(() => {
      // 回滚：恢复到操作前的状态
      dispatch({ type: 'SET_STATE', payload: prevState })
    })
  }, [])

  // 状态变化时防抖保存到 localStorage（作为离线备份）。
  // 使用 300ms 防抖，避免每次 dispatch 都同步 JSON.stringify 大对象阻塞主线程。
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveData(state)
      saveTimerRef.current = null
    }, 300)

    // 卸载时立即刷完未写入的数据
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [state])

  // 页面隐藏/关闭时立即把未保存的改动写入 localStorage，防止数据丢失
  useEffect(() => {
    const flush = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        saveData(stateRef.current)
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  // 记忆化 context value，避免无关 state 变化导致所有消费者重渲染
  const contextValue = useMemo<AppContextValue>(
    () => ({ state, dispatch: wrappedDispatch, loading, error, syncError, clearSyncError }),
    [state, wrappedDispatch, loading, error, syncError, clearSyncError]
  )

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

/** 自定义 Hook：方便在组件中使用全局状态 */
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext 必须在 AppProvider 内部使用')
  }
  return context
}
