/**
 * 计划详情组件
 * 显示计划详情和子任务管理
 */
import { useState } from 'react'
import { X, Plus, Calendar, Clock, Check, Trash2 } from 'lucide-react'
import styles from './PlanDetail.module.css'

interface PlanTask {
  id: string
  title: string
  completed: boolean
  duration: number
  dueDate: string
}

interface PlanDetailProps {
  planName: string
  planSubject: string
  planGoal: string
  planEndDate: string
  planDailyMinutes: number
  tasks: PlanTask[]
  progress: number
  onClose: () => void
  onAddTask: (data: { title: string; duration: number; dueDate: string }) => void
  onToggleTaskComplete: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export default function PlanDetail({
  planName,
  planSubject,
  planGoal,
  planEndDate,
  planDailyMinutes,
  tasks,
  progress,
  onClose,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
}: PlanDetailProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDuration, setNewTaskDuration] = useState(30)
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  function handleAddTask() {
    if (!newTaskTitle.trim()) return
    onAddTask({
      title: newTaskTitle.trim(),
      duration: newTaskDuration,
      dueDate: newTaskDueDate,
    })
    setNewTaskTitle('')
    setNewTaskDuration(30)
    setNewTaskDueDate('')
    setShowAddForm(false)
  }

  const completedTasks = tasks.filter((t) => t.completed).length

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{planName}</h2>
            <span className={styles.subject}>{planSubject}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {/* 信息 */}
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <Calendar size={14} />
            <span>截止 {planEndDate}</span>
          </div>
          <div className={styles.infoItem}>
            <Clock size={14} />
            <span>每日 {planDailyMinutes} 分钟</span>
          </div>
        </div>

        {/* 学习目标 */}
        {planGoal && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {planGoal}
            </p>
          </div>
        )}

        {/* 进度 */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              完成进度 ({completedTasks}/{tasks.length})
            </span>
            <span className={styles.progressPercent}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 子任务列表 */}
        <div className={styles.taskSection}>
          <div className={styles.taskHeader}>
            <span className={styles.taskTitle}>子任务</span>
            {!showAddForm && (
              <button className={styles.addTaskBtn} onClick={() => setShowAddForm(true)}>
                <Plus size={14} />
                添加任务
              </button>
            )}
          </div>

          {/* 添加任务表单 */}
          {showAddForm && (
            <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <input
                type="text"
                placeholder="任务名称"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  marginBottom: 8,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="number"
                  placeholder="时长(分钟)"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(Number(e.target.value) || 30)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                  }}
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  确认添加
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--surface-hover)',
                    color: 'var(--text)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 任务列表 */}
          {tasks.length === 0 ? (
            <div className={styles.empty}>
              <p>暂无子任务，点击上方按钮添加</p>
            </div>
          ) : (
            <div className={styles.taskList}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskItem} ${task.completed ? styles.taskItemCompleted : ''}`}
                >
                  <button
                    className={`${styles.taskCheckbox} ${task.completed ? styles.taskCheckboxChecked : ''}`}
                    onClick={() => onToggleTaskComplete(task.id)}
                  >
                    {task.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <div className={styles.taskInfo}>
                    <div className={`${styles.taskName} ${task.completed ? styles.taskNameCompleted : ''}`}>
                      {task.title}
                    </div>
                    <div className={styles.taskMeta}>
                      {task.duration} 分钟
                      {task.dueDate && ` · 截止 ${task.dueDate}`}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <button
                      className={`${styles.taskActionBtn} ${styles.taskActionBtnDanger}`}
                      onClick={() => onDeleteTask(task.id)}
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
    </div>
  )
}
