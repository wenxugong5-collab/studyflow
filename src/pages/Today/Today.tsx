/**
 * 今日学习页
 * 显示今日任务、进度统计和快速添加功能
 * 优化：修复进度圆环显示问题
 */
import { useState, useMemo } from 'react'
import { Plus, Clock, Flame, BookOpen } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { getToday, getWeekday } from '../../utils/date'
import { formatMinutes } from '../../utils/helpers'
import TaskItem from '../../components/TaskItem/TaskItem'
import TaskForm from '../../components/TaskForm/TaskForm'
import Modal, { ConfirmModal } from '../../components/Modal/Modal'
import ProgressRing from '../../components/ProgressRing/ProgressRing'
import StatCard from '../../components/StatCard/StatCard'
import styles from './Today.module.css'

export default function Today() {
  const { todayTasks, addTask, updateTask, deleteTask, toggleComplete } = useTasks()

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [deletingTask, setDeletingTask] = useState<string | null>(null)

  // 计算统计数据
  const stats = useMemo(() => {
    const total = todayTasks.length
    const completed = todayTasks.filter((t) => t.completed).length
    // 计算百分比：已完成 ÷ 总数 × 100，没有任务时为 0
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    const totalMinutes = todayTasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + t.duration, 0)
    return { total, completed, percent, totalMinutes }
  }, [todayTasks])

  // 获取编辑中的任务数据
  const editingTaskData = editingTask
    ? todayTasks.find((t) => t.id === editingTask)
    : null

  // 获取今天的日期显示
  const todayStr = getToday()
  const weekday = getWeekday(todayStr)

  // 根据小时显示问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了，注意休息哦'
    if (hour < 12) return '早上好，开启元气满满的一天'
    if (hour < 14) return '中午好，适当休息一下'
    if (hour < 18) return '下午好，继续保持专注'
    if (hour < 22) return '晚上好，今天学到了什么'
    return '夜深了，注意休息哦'
  }

  return (
    <div className={styles.container}>
      {/* 头部：问候语 + 日期 */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.date}>{todayStr} {weekday}</p>
      </header>

      {/* 进度卡片 */}
      <div className={styles.progressCard}>
        <ProgressRing percent={stats.percent} />
        <div className={styles.progressInfo}>
          <div className={styles.progressTitle}>今日进度</div>
          <div className={styles.progressFraction}>
            已完成 {stats.completed} / {stats.total} 项任务
          </div>
          <div className={styles.progressDetail}>
            {stats.total === 0 ? '还没有任务，开始添加吧' : `完成率 ${stats.percent}%`}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.stats}>
        <StatCard
          icon={<Clock size={18} color="var(--primary)" />}
          value={formatMinutes(stats.totalMinutes)}
          label="今日学习时长"
          color="var(--primary-bg)"
        />
        <StatCard
          icon={<Flame size={18} color="var(--accent)" />}
          value="0 天"
          label="连续学习"
          color="var(--accent-bg)"
        />
        <StatCard
          icon={<BookOpen size={18} color="var(--success)" />}
          value={stats.total}
          label="今日任务数"
          color="var(--success-bg)"
        />
      </div>

      {/* 任务列表 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            今日任务
            {stats.total > 0 && <span className={styles.taskCount}>({stats.total})</span>}
          </h2>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            添加任务
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p>今天还没有任务<br />点击上方按钮添加一个吧</p>
          </div>
        ) : (
          <div className={styles.taskList}>
            {todayTasks.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                subject={task.subject}
                duration={task.duration}
                completed={task.completed}
                onToggleComplete={() => toggleComplete(task.id)}
                onEdit={() => setEditingTask(task.id)}
                onDelete={() => setDeletingTask(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 添加任务弹窗 */}
      {showAddModal && (
        <Modal title="添加任务" onClose={() => setShowAddModal(false)}>
          <TaskForm
            onSubmit={(data) => {
              addTask(data.title, data.subject, data.duration)
              setShowAddModal(false)
            }}
            onCancel={() => setShowAddModal(false)}
            submitLabel="添加任务"
          />
        </Modal>
      )}

      {/* 编辑任务弹窗 */}
      {editingTask && editingTaskData && (
        <Modal title="编辑任务" onClose={() => setEditingTask(null)}>
          <TaskForm
            initialTitle={editingTaskData.title}
            initialSubject={editingTaskData.subject}
            initialDuration={editingTaskData.duration}
            onSubmit={(data) => {
              updateTask(editingTask, {
                title: data.title,
                subject: data.subject,
                duration: data.duration,
              })
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
            submitLabel="保存修改"
          />
        </Modal>
      )}

      {/* 删除确认弹窗 */}
      {deletingTask && (
        <ConfirmModal
          title="删除任务"
          message="确定要删除这个任务吗？删除后无法恢复。"
          onConfirm={() => {
            deleteTask(deletingTask)
            setDeletingTask(null)
          }}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  )
}
