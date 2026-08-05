/**
 * 学习日历页
 * 月历视图查看每日任务、计划和完成状态
 * 优化：精确布局修正，严格等宽等高网格
 */
import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, Pencil, Trash2 } from 'lucide-react'
import { getCalendarDays, getMonthName, WEEKDAYS, isDateOverdue } from '../../utils/calendar'
import { getToday, getWeekday } from '../../utils/date'
import { useAppContext } from '../../context/AppContext'
import { generateId } from '../../utils/helpers'
import Modal, { ConfirmModal } from '../../components/Modal/Modal'
import styles from './Calendar.module.css'

// 日历中显示的任务类型
interface CalendarTask {
  id: string
  title: string
  subject: string
  duration: number
  completed: boolean
  date: string
  planName?: string
  type: 'task' | 'planTask'
}

export default function Calendar() {
  const { state, dispatch } = useAppContext()

  // 当前显示的年月
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // 选中的日期
  const [selectedDate, setSelectedDate] = useState<string>(getToday())

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<CalendarTask | null>(null)

  // 生成日历数据
  const calendarDays = useMemo(
    () => getCalendarDays(currentDate.year, currentDate.month),
    [currentDate.year, currentDate.month]
  )

  // 整合所有任务数据（今日任务 + 计划子任务）
  const allTasks = useMemo(() => {
    const tasks: CalendarTask[] = []

    if (state.tasks && Array.isArray(state.tasks)) {
      state.tasks.forEach((task) => {
        if (task.date) {
          tasks.push({
            id: task.id,
            title: task.title,
            subject: task.subject,
            duration: task.duration,
            completed: task.completed,
            date: task.date,
            type: 'task',
          })
        }
      })
    }

    if (state.planTasks && Array.isArray(state.planTasks)) {
      state.planTasks.forEach((pt) => {
        if (pt.dueDate) {
          const plan = state.studyPlans?.find((p) => p.id === pt.planId)
          tasks.push({
            id: pt.id,
            title: pt.title,
            subject: plan?.subject || '其他',
            duration: pt.duration,
            completed: pt.completed,
            date: pt.dueDate,
            planName: plan?.name,
            type: 'planTask',
          })
        }
      })
    }

    return tasks
  }, [state.tasks, state.planTasks, state.studyPlans])

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {}
    allTasks.forEach((task) => {
      if (!map[task.date]) {
        map[task.date] = []
      }
      map[task.date].push(task)
    })
    return map
  }, [allTasks])

  // 选中日期的任务
  const selectedDateTasks = tasksByDate[selectedDate] || []
  const completedCount = selectedDateTasks.filter((t) => t.completed).length
  const totalMinutes = selectedDateTasks.reduce((sum, t) => sum + t.duration, 0)

  // 月份导航
  function goToPrevMonth() {
    setCurrentDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  function goToNextMonth() {
    setCurrentDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  function goToToday() {
    const now = new Date()
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDate(getToday())
  }

  // 添加任务
  function handleAddTask(data: {
    title: string
    subject: string
    date: string
    duration: number
    planId?: string
  }) {
    if (data.planId) {
      dispatch({
        type: 'ADD_PLAN_TASK',
        payload: {
          id: generateId(),
          planId: data.planId,
          title: data.title,
          completed: false,
          duration: data.duration,
          dueDate: data.date,
          createdAt: getToday(),
        },
      })
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: generateId(),
          title: data.title,
          subject: data.subject,
          date: data.date,
          completed: false,
          duration: data.duration,
        },
      })
    }
  }

  // 切换任务完成状态
  function handleToggleComplete(task: CalendarTask) {
    if (task.type === 'task') {
      const t = state.tasks?.find((item) => item.id === task.id)
      if (t) {
        dispatch({ type: 'UPDATE_TASK', payload: { ...t, completed: !t.completed } })
      }
    } else {
      const pt = state.planTasks?.find((item) => item.id === task.id)
      if (pt) {
        dispatch({ type: 'UPDATE_PLAN_TASK', payload: { ...pt, completed: !pt.completed } })
      }
    }
  }

  // 删除任务
  function handleDeleteTask(task: CalendarTask) {
    if (task.type === 'task') {
      dispatch({ type: 'DELETE_TASK', payload: task.id })
    } else {
      dispatch({ type: 'DELETE_PLAN_TASK', payload: task.id })
    }
  }

  // 格式化日期为中文格式
  function formatChineseDate(dateStr: string): string {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = getWeekday(dateStr)
    return `${month}月${day}日 ${weekday}`
  }

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>学习日历</h1>
          <p className={styles.subtitle}>在日历中安排和回顾学习任务</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          添加任务
        </button>
      </header>

      {/* 主内容 */}
      <div className={styles.content}>
        {/* 日历 */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <h2 className={styles.monthTitle}>
              {getMonthName(currentDate.year, currentDate.month)}
            </h2>
            <div className={styles.navBtns}>
              <button className={styles.navBtn} onClick={goToPrevMonth} aria-label="上个月">
                <ChevronLeft size={16} />
              </button>
              <button className={styles.todayBtn} onClick={goToToday}>
                今天
              </button>
              <button className={styles.navBtn} onClick={goToNextMonth} aria-label="下个月">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.weekday}>
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className={styles.days}>
            {calendarDays.map((day) => {
              const dayTasks = tasksByDate[day.date] || []
              const isSelected = day.date === selectedDate
              const todoCount = dayTasks.filter((t) => !t.completed && !isDateOverdue(t.date)).length
              const doneCount = dayTasks.filter((t) => t.completed).length
              const overdueCount = dayTasks.filter((t) => !t.completed && isDateOverdue(t.date)).length

              return (
                <div
                  key={day.date}
                  className={`${styles.day} ${!day.isCurrentMonth ? styles.dayOther : ''} ${day.isToday ? styles.dayToday : ''} ${isSelected ? styles.daySelected : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedDate(day.date)
                    }
                  }}
                >
                  <span className={styles.dayNumber}>{day.day}</span>
                  {dayTasks.length > 0 && (
                    <div className={styles.taskDots}>
                      {todoCount > 0 && <span className={`${styles.dot} ${styles.dotTodo}`} />}
                      {doneCount > 0 && <span className={`${styles.dot} ${styles.dotDone}`} />}
                      {overdueCount > 0 && <span className={`${styles.dot} ${styles.dotOverdue}`} />}
                      <span className={styles.taskCount}>{dayTasks.length}项</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 详情面板 */}
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div className={styles.detailDate}>
              {formatChineseDate(selectedDate)}
            </div>
            <div className={styles.detailStats}>
              {selectedDateTasks.length}项任务 · 已完成{completedCount}项 · {totalMinutes}分钟
            </div>
          </div>

          {selectedDateTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>当天没有任务</p>
              <button
                className={styles.emptyBtn}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} />
                添加任务
              </button>
            </div>
          ) : (
            <div className={styles.taskList}>
              {selectedDateTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <button
                    className={`${styles.taskCheckbox} ${task.completed ? styles.taskCheckboxChecked : ''}`}
                    onClick={() => handleToggleComplete(task)}
                    aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
                  >
                    {task.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <div className={styles.taskInfo}>
                    <div className={`${styles.taskTitle} ${task.completed ? styles.taskTitleCompleted : ''}`}>
                      {task.title}
                    </div>
                    <div className={styles.taskMeta}>
                      <span className={styles.taskTag}>{task.subject}</span>
                      <span>{task.duration}分钟</span>
                      {task.planName && <span>· {task.planName}</span>}
                      {!task.completed && isDateOverdue(task.date) && (
                        <span className={`${styles.taskTag} ${styles.taskTagOverdue}`}>已逾期</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <button
                      className={styles.taskActionBtn}
                      onClick={() => setEditingTask(task)}
                      aria-label="编辑任务"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.taskActionBtnDanger}
                      onClick={() => setDeletingTask(task)}
                      aria-label="删除任务"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加任务弹窗 */}
      {showAddModal && (
        <CalendarTaskForm
          plans={state.studyPlans || []}
          initialDate={selectedDate}
          onSubmit={(data) => {
            handleAddTask(data)
            setShowAddModal(false)
          }}
          onCancel={() => setShowAddModal(false)}
          submitLabel="添加任务"
        />
      )}

      {/* 编辑任务弹窗 */}
      {editingTask && (
        <CalendarTaskForm
          plans={state.studyPlans || []}
          initialDate={selectedDate}
          initialData={{
            title: editingTask.title,
            subject: editingTask.subject,
            date: editingTask.date,
            duration: editingTask.duration,
            planId: editingTask.type === 'planTask'
              ? state.planTasks?.find((pt) => pt.id === editingTask.id)?.planId
              : undefined,
          }}
          onSubmit={(data) => {
            if (editingTask.type === 'task') {
              const t = state.tasks?.find((item) => item.id === editingTask.id)
              if (t) {
                dispatch({ type: 'UPDATE_TASK', payload: { ...t, ...data } })
              }
            } else {
              const pt = state.planTasks?.find((item) => item.id === editingTask.id)
              if (pt) {
                dispatch({
                  type: 'UPDATE_PLAN_TASK',
                  payload: {
                    ...pt,
                    title: data.title,
                    duration: data.duration,
                    dueDate: data.date,
                  },
                })
              }
            }
            setEditingTask(null)
          }}
          onCancel={() => setEditingTask(null)}
          submitLabel="保存修改"
        />
      )}

      {/* 删除确认弹窗 */}
      {deletingTask && (
        <ConfirmModal
          title="删除任务"
          message="确定要删除这个任务吗？删除后无法恢复。"
          onConfirm={() => {
            handleDeleteTask(deletingTask)
            setDeletingTask(null)
          }}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  )
}

/**
 * 日历任务表单组件
 */
interface CalendarTaskFormProps {
  plans: { id: string; name: string }[]
  initialDate: string
  initialData?: {
    title: string
    subject: string
    date: string
    duration: number
    planId?: string
  }
  onSubmit: (data: {
    title: string
    subject: string
    date: string
    duration: number
    planId?: string
  }) => void
  onCancel: () => void
  submitLabel: string
}

function CalendarTaskForm({
  plans,
  initialDate,
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: CalendarTaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [subject, setSubject] = useState(initialData?.subject || '')
  const [date, setDate] = useState(initialData?.date || initialDate)
  const [duration, setDuration] = useState(initialData?.duration || 30)
  const [planId, setPlanId] = useState(initialData?.planId || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) {
      newErrors.title = '请输入任务名称'
    }
    if (!date) {
      newErrors.date = '请选择日期'
    }
    if (duration < 0) {
      newErrors.duration = '时长不能为负数'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      title: title.trim(),
      subject: subject.trim() || '其他',
      date,
      duration,
      planId: planId || undefined,
    })
  }

  const inputStyle = {
    width: '100%' as const,
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)' as const,
    display: 'block',
    marginBottom: 6,
  }

  return (
    <Modal title={submitLabel === '添加任务' ? '添加任务' : '编辑任务'} onClose={onCancel}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>
            任务名称 <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="例如：复习数学第三章"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
          {errors.title && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.title}</span>}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>科目</label>
            <input
              type="text"
              placeholder="例如：数学"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>预计时长（分钟）</label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 0)}
              style={inputStyle}
            />
            {errors.duration && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.duration}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>
              日期 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
            {errors.date && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.date}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>所属计划</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              style={inputStyle}
            >
              <option value="">不关联计划</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: 11,
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '11px 18px',
              background: 'var(--surface-hover)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            取消
          </button>
        </div>
      </form>
    </Modal>
  )
}
