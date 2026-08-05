/**
 * 单个任务项组件
 * 显示任务信息、完成状态和操作按钮
 * 优化：增强完成态视觉区分
 */
import { Check, Pencil, Trash2 } from 'lucide-react'
import styles from './TaskItem.module.css'

interface TaskItemProps {
  title: string
  subject: string
  duration: number
  completed: boolean
  onToggleComplete: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function TaskItem({
  title,
  subject,
  duration,
  completed,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskItemProps) {
  return (
    <div className={`${styles.taskItem} ${completed ? styles.taskItemCompleted : ''}`}>
      {/* 完成状态复选框 */}
      <button
        className={`${styles.checkbox} ${completed ? styles.checkboxChecked : ''}`}
        onClick={onToggleComplete}
        aria-label={completed ? '标记为未完成' : '标记为已完成'}
      >
        {completed && <Check size={14} strokeWidth={3} />}
      </button>

      {/* 任务信息 */}
      <div className={styles.taskInfo}>
        <div className={`${styles.taskTitle} ${completed ? styles.taskTitleCompleted : ''}`}>
          {title}
        </div>
        <div className={styles.taskMeta}>
          <span className={styles.subjectTag}>{subject}</span>
          <span>预计 {duration} 分钟</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={onEdit} aria-label="编辑任务">
          <Pencil size={16} />
        </button>
        <button
          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
          onClick={onDelete}
          aria-label="删除任务"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
