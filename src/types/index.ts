/**
 * StudyFlow 全局类型定义
 * 这里定义了应用中所有数据的"形状"，TypeScript 会帮我们检查类型是否正确
 */

/** 学习计划 */
export interface StudyPlan {
  id: string
  name: string // 计划名称
  subject: string // 科目
  goal: string // 学习目标
  startDate: string // 开始日期
  endDate: string // 截止日期
  dailyMinutes: number // 每日建议学习时长
  color: string // 计划颜色标识
  note: string // 备注
  createdAt: string // 创建时间
}

/** 计划子任务 */
export interface PlanTask {
  id: string
  planId: string // 所属计划 ID
  title: string // 任务标题
  completed: boolean // 是否完成
  duration: number // 预计时长（分钟）
  dueDate: string // 截止日期
  createdAt: string // 创建时间
}

/** 学习任务（今日任务） */
export interface Task {
  id: string
  title: string // 任务标题
  subject: string // 科目
  goalId?: string // 关联的学习目标 ID
  date: string // 所属日期（YYYY-MM-DD）
  completed: boolean // 是否已完成
  duration: number // 实际学习分钟数
}

/** 专注记录（番茄钟） */
export interface FocusSession {
  id: string
  taskId?: string // 关联的任务 ID
  taskTitle?: string // 任务标题
  subject?: string // 学习科目
  plannedMinutes: number // 计划专注分钟数
  actualMinutes: number // 实际专注分钟数
  startedAt: string // 开始时间（ISO 格式）
  completedAt: string // 结束时间（ISO 格式）
  status: 'completed' | 'interrupted' // 完成状态
}

/** 全局应用状态 */
export interface AppState {
  studyPlans: StudyPlan[]
  planTasks: PlanTask[]
  tasks: Task[]
  focusSessions: FocusSession[]
  streak: number // 连续学习天数
}
