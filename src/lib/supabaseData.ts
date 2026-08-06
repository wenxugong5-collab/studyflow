/**
 * Supabase 数据服务层
 * 封装 goals、tasks、focus_sessions 表的 CRUD 操作
 * 所有操作自动按当前登录用户 user_id 隔离
 *
 * ⚠️ 列名严格基于 public 表实际 schema（已通过 REST API 探测确认）：
 *   tasks:          id, user_id, title, subject, goal_id, planned_date, estimated_minutes, completed, created_at, updated_at
 *   goals:          id, user_id, subject, description, created_at, updated_at
 *   focus_sessions: id, user_id, task_id, task_title, subject, planned_minutes, actual_minutes, started_at, completed_at, status, created_at, updated_at
 *
 * ⚠️ ID 映射：
 *   前端 localStorage 使用 generateId() 产生的短 ID（如 msfxxxx），
 *   但 Supabase 的 id / user_id / goal_id / task_id 是 UUID 类型。
 *   本层通过 idMap（src/lib/idMap.ts）自动把本地短 ID 翻译成 UUID。
 *   新增记录用 crypto.randomUUID() 生成 UUID 并登记映射；
 *   外键（goal_id / task_id）找不到映射时写 null。
 */

import { supabase } from './supabase'
import { toUuid, toUuidOrNull } from './idMap'
import type { StudyPlan, PlanTask, Task, FocusSession } from '../types'

// ==================== 类型映射 ====================

/** goals 表的行结构（实际列） */
interface GoalRow {
  id: string
  user_id: string
  title: string
  subject: string
  description: string
  created_at: string
  updated_at: string
}

/** tasks 表的行结构（实际列） */
interface TaskRow {
  id: string
  user_id: string
  title: string
  subject: string
  goal_id: string | null
  planned_date: string
  estimated_minutes: number
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** goals.description 中存储的 StudyPlan 附属字段 */
interface GoalExtra {
  name: string
  goal: string
  startDate: string
  endDate: string
  dailyMinutes: number
  color: string
  note: string
}

/** focus_sessions 表的行结构 */
interface FocusSessionRow {
  id: string
  user_id: string
  task_id: string | null
  task_title: string | null
  subject: string | null
  planned_minutes: number
  actual_minutes: number
  started_at: string
  completed_at: string
  status: 'completed' | 'interrupted'
  created_at: string
  updated_at: string
}

// ==================== 转换函数 ====================

/** goals 行 → StudyPlan */
function rowToStudyPlan(row: GoalRow): StudyPlan {
  let extra: GoalExtra = {
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    dailyMinutes: 0,
    color: '#2563eb',
    note: '',
  }
  if (row.description) {
    try {
      const parsed = JSON.parse(row.description)
      extra = { ...extra, ...parsed }
    } catch {
      extra.name = row.description
    }
  }
  return {
    id: row.id,
    name: extra.name || row.title || row.subject, // 优先 title 列
    subject: row.subject,
    goal: extra.goal,
    startDate: extra.startDate,
    endDate: extra.endDate,
    dailyMinutes: extra.dailyMinutes,
    color: extra.color,
    note: extra.note,
    createdAt: row.created_at,
  }
}

/** StudyPlan → goals 行（id 由调用方传入 UUID） */
function studyPlanToRow(
  plan: Omit<StudyPlan, 'id' | 'createdAt'>,
  userId: string,
  id: string,
  createdAt: string
): GoalRow {
  const extra: GoalExtra = {
    name: plan.name,
    goal: plan.goal,
    startDate: plan.startDate,
    endDate: plan.endDate,
    dailyMinutes: plan.dailyMinutes,
    color: plan.color,
    note: plan.note,
  }
  return {
    id,
    user_id: userId,
    title: plan.name, // goals 表 title 列 NOT NULL
    subject: plan.subject,
    description: JSON.stringify(extra),
    created_at: createdAt,
    updated_at: createdAt,
  }
}

/** tasks 行 → Task（goal_id 为 null 时 = 今日任务） */
function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    goalId: row.goal_id ?? undefined,
    date: row.planned_date ?? '',
    completed: row.completed,
    duration: row.estimated_minutes,
  }
}

/** tasks 行 → PlanTask（goal_id 不为 null 时 = 计划子任务） */
function rowToPlanTask(row: TaskRow): PlanTask {
  return {
    id: row.id,
    planId: row.goal_id ?? '',
    title: row.title,
    completed: row.completed,
    duration: row.estimated_minutes,
    dueDate: row.planned_date ?? '',
    createdAt: row.created_at,
  }
}

/** Task → tasks 行（id 由调用方传入 UUID） */
function taskToRow(
  task: Omit<Task, 'id'>,
  userId: string,
  id: string
): TaskRow {
  return {
    id,
    user_id: userId,
    title: task.title,
    subject: task.subject,
    goal_id: toUuidOrNull(task.goalId),
    planned_date: task.date || new Date().toISOString().slice(0, 10), // NOT NULL
    estimated_minutes: task.duration,
    completed: task.completed,
    completed_at: task.completed ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/** PlanTask → tasks 行（id 由调用方传入 UUID） */
function planTaskToRow(
  task: Omit<PlanTask, 'id' | 'createdAt'>,
  userId: string,
  id: string,
  createdAt: string
): TaskRow {
  return {
    id,
    user_id: userId,
    title: task.title,
    subject: '',
    goal_id: toUuidOrNull(task.planId),
    planned_date: task.dueDate || new Date().toISOString().slice(0, 10), // NOT NULL
    estimated_minutes: task.duration,
    completed: task.completed,
    completed_at: task.completed ? new Date().toISOString() : null,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

/** focus_sessions 行 → FocusSession */
function rowToFocusSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title ?? undefined,
    subject: row.subject ?? undefined,
    plannedMinutes: row.planned_minutes,
    actualMinutes: row.actual_minutes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
  }
}

/** FocusSession → focus_sessions 行（id 由调用方传入 UUID） */
function focusSessionToRow(
  session: Omit<FocusSession, 'id'>,
  userId: string,
  id: string
): FocusSessionRow {
  return {
    id,
    user_id: userId,
    task_id: toUuidOrNull(session.taskId),
    task_title: session.taskTitle ?? null,
    subject: session.subject ?? null,
    planned_minutes: session.plannedMinutes,
    actual_minutes: session.actualMinutes,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    status: session.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ==================== Goals（学习计划）====================

/** 获取当前用户的所有学习计划 */
export async function fetchGoals(): Promise<StudyPlan[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`加载学习计划失败：${error.message}`)
  return (data as GoalRow[]).map(rowToStudyPlan)
}

/** 新增学习计划（localId 为前端短 ID） */
export async function insertGoal(
  plan: Omit<StudyPlan, 'id' | 'createdAt'>,
  userId: string,
  localId: string,
  createdAt: string
): Promise<void> {
  const row = studyPlanToRow(plan, userId, toUuid(localId), createdAt)
  const { error } = await supabase.from('goals').insert(row)
  if (error) throw new Error(`添加学习计划失败：${error.message}`)
}

/** 更新学习计划（plan.id 为前端短 ID 或 UUID） */
export async function updateGoal(plan: StudyPlan): Promise<void> {
  const extra: GoalExtra = {
    name: plan.name,
    goal: plan.goal,
    startDate: plan.startDate,
    endDate: plan.endDate,
    dailyMinutes: plan.dailyMinutes,
    color: plan.color,
    note: plan.note,
  }
  const { error } = await supabase
    .from('goals')
    .update({
      title: plan.name, // goals 表 title 列 NOT NULL
      subject: plan.subject,
      description: JSON.stringify(extra),
      updated_at: new Date().toISOString(),
    })
    .eq('id', toUuid(plan.id))
  if (error) throw new Error(`更新学习计划失败：${error.message}`)
}

/** 删除学习计划及其子任务（planId 为前端短 ID 或 UUID） */
export async function deleteGoal(planId: string): Promise<void> {
  const uuid = toUuid(planId)
  await deletePlanTasksByPlan(uuid)
  const { error } = await supabase.from('goals').delete().eq('id', uuid)
  if (error) throw new Error(`删除学习计划失败：${error.message}`)
}

// ==================== Tasks（学习任务）====================

/** 获取当前用户的所有任务（Task + PlanTask） */
export async function fetchTasks(): Promise<{ tasks: Task[]; planTasks: PlanTask[] }> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`加载任务失败：${error.message}`)

  const rows = data as TaskRow[]
  const tasks: Task[] = []
  const planTasks: PlanTask[] = []

  for (const row of rows) {
    if (row.goal_id) {
      planTasks.push(rowToPlanTask(row))
    } else {
      tasks.push(rowToTask(row))
    }
  }

  return { tasks, planTasks }
}

/** 新增今日任务（localId 为前端短 ID） */
export async function insertTask(
  task: Omit<Task, 'id'>,
  userId: string,
  localId: string
): Promise<void> {
  const row = taskToRow(task, userId, toUuid(localId))
  const { error } = await supabase.from('tasks').insert(row)
  if (error) throw new Error(`添加任务失败：${error.message}`)
}

/** 更新今日任务（task.id 为前端短 ID 或 UUID） */
export async function updateTask(task: Task): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: task.title,
      subject: task.subject,
      goal_id: toUuidOrNull(task.goalId),
      planned_date: task.date || new Date().toISOString().slice(0, 10),
      estimated_minutes: task.duration,
      completed: task.completed,
      completed_at: task.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', toUuid(task.id))
  if (error) throw new Error(`更新任务失败：${error.message}`)
}

/** 删除任务（localId 为前端短 ID 或 UUID） */
export async function deleteTask(localId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', toUuid(localId))
  if (error) throw new Error(`删除任务失败：${error.message}`)
}

/** 新增计划子任务（localId 为前端短 ID） */
export async function insertPlanTask(
  task: Omit<PlanTask, 'id' | 'createdAt'>,
  _userId: string,
  localId: string,
  createdAt: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("请先登录")

  const row = planTaskToRow(task, user.id, toUuid(localId), createdAt)
  const { error } = await supabase.from('tasks').insert(row)
  if (error) throw new Error(`添加子任务失败: ${error.message}`)
}

/** 更新计划子任务（task.id 为前端短 ID 或 UUID） */
export async function updatePlanTask(task: PlanTask): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: task.title,
      goal_id: toUuidOrNull(task.planId),
      planned_date: task.dueDate || new Date().toISOString().slice(0, 10),
      estimated_minutes: task.duration,
      completed: task.completed,
      completed_at: task.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', toUuid(task.id))
  if (error) throw new Error(`更新子任务失败：${error.message}`)
}

/** 删除计划子任务（localId 为前端短 ID 或 UUID） */
export async function deletePlanTask(localId: string): Promise<void> {
  await deleteTask(localId)
}

/** 删除某个计划的所有子任务（planUuid 已是 UUID） */
export async function deletePlanTasksByPlan(planUuid: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('goal_id', planUuid)
  if (error) throw new Error(`删除计划子任务失败：${error.message}`)
}

// ==================== Focus Sessions（专注记录）====================

/** 获取当前用户的所有专注记录 */
export async function fetchFocusSessions(): Promise<FocusSession[]> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .order('started_at', { ascending: false })

  if (error) throw new Error(`加载专注记录失败：${error.message}`)
  return (data as FocusSessionRow[]).map(rowToFocusSession)
}

/** 新增专注记录（localId 为前端短 ID） */
export async function insertFocusSession(
  session: Omit<FocusSession, 'id'>,
  userId: string,
  localId: string
): Promise<void> {
  const row = focusSessionToRow(session, userId, toUuid(localId))
  const { error } = await supabase.from('focus_sessions').insert(row)
  if (error) throw new Error(`保存专注记录失败：${error.message}`)
}

// ==================== 迁移辅助 ====================
/**
 * 迁移顺序（由 AppContext 保证）：
 *   1. migrateGoals  → 生成 goal UUID，登记映射
 *   2. migrateTasks  → 生成 task UUID，goal_id 通过 goal 映射转换
 *   3. migrateFocusSessions → 生成 session UUID，task_id 通过 task 映射转换
 * 使用 upsert 保证幂等（重复运行不会插入重复行）。
 */

/** 批量迁移学习计划（用于首次从 localStorage 迁移） */
export async function migrateGoals(
  plans: StudyPlan[],
  userId: string
): Promise<void> {
  if (plans.length === 0) return
  const rows = plans.map((plan) =>
    studyPlanToRow(plan, userId, toUuid(plan.id), plan.createdAt)
  )
  const { error } = await supabase
    .from('goals')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(`迁移学习计划失败：${error.message}`)
}

/** 批量迁移任务（用于首次从 localStorage 迁移） */
export async function migrateTasks(
  tasks: Task[],
  planTasks: PlanTask[],
  userId: string
): Promise<void> {
  const taskRows = tasks.map((t) => taskToRow(t, userId, toUuid(t.id)))
  const planTaskRows = planTasks.map((t) =>
    planTaskToRow(t, userId, toUuid(t.id), t.createdAt)
  )
  const allRows = [...taskRows, ...planTaskRows]
  if (allRows.length === 0) return
  const { error } = await supabase
    .from('tasks')
    .upsert(allRows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(`迁移任务失败：${error.message}`)
}

/** 批量迁移专注记录（用于首次从 localStorage 迁移） */
export async function migrateFocusSessions(
  sessions: FocusSession[],
  userId: string
): Promise<void> {
  if (sessions.length === 0) return
  const rows = sessions.map((s) =>
    focusSessionToRow(s, userId, toUuid(s.id))
  )
  const { error } = await supabase
    .from('focus_sessions')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(`迁移专注记录失败：${error.message}`)
}
