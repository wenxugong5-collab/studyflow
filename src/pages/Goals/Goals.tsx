/**
 * 学习计划页
 * 管理长期学习目标和子任务
 */
import { useState, useMemo } from 'react'
import { Plus, Target, TrendingUp, Calendar, BookOpen } from 'lucide-react'
import { useStudyPlans } from '../../hooks/useStudyPlans'
import { isOverdue } from '../../utils/date'
import PlanCard from '../../components/PlanCard/PlanCard'
import PlanForm from '../../components/PlanForm/PlanForm'
import PlanDetail from '../../components/PlanDetail/PlanDetail'
import Modal, { ConfirmModal } from '../../components/Modal/Modal'
import StatCard from '../../components/StatCard/StatCard'
import styles from './Goals.module.css'

export default function Goals() {
  const {
    studyPlans,
    getPlanTasks,
    getPlanProgress,
    addPlan,
    updatePlan,
    deletePlan,
    addPlanTask,
    togglePlanTaskComplete,
    deletePlanTask,
  } = useStudyPlans()

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null)
  const [viewingPlan, setViewingPlan] = useState<string | null>(null)

  // 计算统计数据
  const stats = useMemo(() => {
    const total = studyPlans.length
    const active = studyPlans.filter((p) => !isOverdue(p.endDate) || getPlanProgress(p.id) < 100).length
    const avgProgress = total === 0
      ? 0
      : Math.round(studyPlans.reduce((sum, p) => sum + getPlanProgress(p.id), 0) / total)

    // 最近的截止日期
    const sortedByDate = [...studyPlans].sort((a, b) => a.endDate.localeCompare(b.endDate))
    const nearestDeadline = sortedByDate[0]?.endDate || '-'

    // 本周需要完成的任务数
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    const thisWeekTasks = studyPlans.reduce((count, plan) => {
      const tasks = getPlanTasks(plan.id)
      return count + tasks.filter((t) => !t.completed && t.dueDate <= weekEndStr).length
    }, 0)

    return { total, active, avgProgress, nearestDeadline, thisWeekTasks }
  }, [studyPlans, getPlanTasks, getPlanProgress])

  // 获取编辑中的计划数据
  const editingPlanData = editingPlan
    ? studyPlans.find((p) => p.id === editingPlan)
    : null

  // 获取查看中的计划数据
  const viewingPlanData = viewingPlan
    ? studyPlans.find((p) => p.id === viewingPlan)
    : null

  // 计算计划状态
  function getPlanStatus(planId: string): 'active' | 'completed' | 'overdue' {
    const progress = getPlanProgress(planId)
    if (progress === 100) return 'completed'
    // 这里简化处理，实际应该检查计划是否逾期
    return 'active'
  }

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>学习计划</h1>
          <p className={styles.subtitle}>制定长期目标，拆分每日任务</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          新建计划
        </button>
      </header>

      {/* 统计卡片 */}
      <div className={styles.stats}>
        <StatCard
          icon={<Target size={18} color="var(--primary)" />}
          value={stats.active}
          label="进行中"
          color="var(--primary-bg)"
        />
        <StatCard
          icon={<TrendingUp size={18} color="var(--success)" />}
          value={`${stats.avgProgress}%`}
          label="平均完成率"
          color="var(--success-bg)"
        />
        <StatCard
          icon={<Calendar size={18} color="var(--accent)" />}
          value={stats.nearestDeadline}
          label="最近截止"
          color="var(--accent-bg)"
        />
        <StatCard
          icon={<BookOpen size={18} color="var(--warning)" />}
          value={stats.thisWeekTasks}
          label="本周任务"
          color="var(--warning-bg)"
        />
      </div>

      {/* 计划列表 */}
      {studyPlans.length === 0 ? (
        <div className={styles.empty}>
          <Target size={48} className={styles.emptyIcon} />
          <p>还没有学习计划<br />点击上方按钮创建你的第一个计划吧</p>
          <button className={styles.emptyBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            创建计划
          </button>
        </div>
      ) : (
        <div className={styles.planList}>
          {studyPlans.map((plan) => {
            const tasks = getPlanTasks(plan.id)
            const progress = getPlanProgress(plan.id)
            const completedTasks = tasks.filter((t) => t.completed).length
            const status = getPlanStatus(plan.id)

            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                subject={plan.subject}
                goal={plan.goal}
                endDate={plan.endDate}
                dailyMinutes={plan.dailyMinutes}
                progress={progress}
                completedTasks={completedTasks}
                totalTasks={tasks.length}
                status={status}
                onView={() => setViewingPlan(plan.id)}
                onEdit={() => setEditingPlan(plan.id)}
                onDelete={() => setDeletingPlan(plan.id)}
              />
            )
          })}
        </div>
      )}

      {/* 新建计划弹窗 */}
      {showAddModal && (
        <Modal title="新建学习计划" onClose={() => setShowAddModal(false)}>
          <PlanForm
            onSubmit={(data) => {
              addPlan({ ...data, color: '#2563eb' })
              setShowAddModal(false)
            }}
            onCancel={() => setShowAddModal(false)}
            submitLabel="创建计划"
          />
        </Modal>
      )}

      {/* 编辑计划弹窗 */}
      {editingPlan && editingPlanData && (
        <Modal title="编辑学习计划" onClose={() => setEditingPlan(null)}>
          <PlanForm
            initialData={{
              name: editingPlanData.name,
              subject: editingPlanData.subject,
              goal: editingPlanData.goal,
              startDate: editingPlanData.startDate,
              endDate: editingPlanData.endDate,
              dailyMinutes: editingPlanData.dailyMinutes,
              note: editingPlanData.note,
            }}
            onSubmit={(data) => {
              updatePlan(editingPlan, { ...data, color: editingPlanData.color })
              setEditingPlan(null)
            }}
            onCancel={() => setEditingPlan(null)}
            submitLabel="保存修改"
          />
        </Modal>
      )}

      {/* 删除确认弹窗 */}
      {deletingPlan && (
        <ConfirmModal
          title="删除学习计划"
          message="确定要删除这个学习计划吗？相关的子任务也会被删除，且无法恢复。"
          onConfirm={() => {
            deletePlan(deletingPlan)
            setDeletingPlan(null)
          }}
          onCancel={() => setDeletingPlan(null)}
        />
      )}

      {/* 计划详情弹窗 */}
      {viewingPlan && viewingPlanData && (
        <PlanDetail
          planName={viewingPlanData.name}
          planSubject={viewingPlanData.subject}
          planGoal={viewingPlanData.goal}
          planEndDate={viewingPlanData.endDate}
          planDailyMinutes={viewingPlanData.dailyMinutes}
          tasks={getPlanTasks(viewingPlan)}
          progress={getPlanProgress(viewingPlan)}
          onClose={() => setViewingPlan(null)}
          onAddTask={(data) => {
            addPlanTask({
              planId: viewingPlan,
              title: data.title,
              duration: data.duration,
              dueDate: data.dueDate,
              completed: false,
            })
          }}
          onToggleTaskComplete={togglePlanTaskComplete}
          onDeleteTask={deletePlanTask}
        />
      )}
    </div>
  )
}
