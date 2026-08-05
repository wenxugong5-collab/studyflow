/**
 * 学习计划卡片组件
 * 显示计划基本信息、进度和操作按钮
 */
import { Calendar, Clock, Target } from 'lucide-react'
import styles from './PlanCard.module.css'

interface PlanCardProps {
  name: string
  subject: string
  goal: string
  endDate: string
  dailyMinutes: number
  progress: number
  completedTasks: number
  totalTasks: number
  status: 'active' | 'completed' | 'overdue'
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function PlanCard({
  name,
  subject,
  goal,
  endDate,
  dailyMinutes,
  progress,
  completedTasks,
  totalTasks,
  status,
  onView,
  onEdit,
  onDelete,
}: PlanCardProps) {
  // 状态标签映射
  const statusMap = {
    active: { label: '进行中', className: styles.statusActive },
    completed: { label: '已完成', className: styles.statusCompleted },
    overdue: { label: '已逾期', className: styles.statusOverdue },
  }

  const statusInfo = statusMap[status]

  return (
    <div className={styles.card}>
      {/* 头部：名称 + 状态 */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.subject}>{subject}</span>
        </div>
        <span className={`${styles.status} ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* 学习目标 */}
      <p className={styles.goal}>{goal}</p>

      {/* 信息行 */}
      <div className={styles.info}>
        <div className={styles.infoItem}>
          <Calendar size={14} />
          <span>截止 {endDate}</span>
        </div>
        <div className={styles.infoItem}>
          <Clock size={14} />
          <span>每日 {dailyMinutes} 分钟</span>
        </div>
        <div className={styles.infoItem}>
          <Target size={14} />
          <span>{completedTasks}/{totalTasks} 任务</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>完成进度</span>
          <span className={styles.progressPercent}>{progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onView}>
          查看详情
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onEdit}>
          编辑
        </button>
        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onDelete}>
          删除
        </button>
      </div>
    </div>
  )
}
