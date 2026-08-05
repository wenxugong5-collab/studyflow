/**
 * 学习统计页
 * 回顾学习节奏，了解自己的进步
 */
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Target, TrendingUp } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import {
  type TimeRange,
  type Period,
  getCurrentPeriod,
  getPreviousPeriod,
  getNextPeriod,
  isFuturePeriod,
  filterSessionsByRange,
  filterTasksByRange,
  getTotalMinutes,
  getCompletedCount,
  getCompletionRate,
  groupBySubject,
  groupTasksBySubject,
  getDailyMinutes,
  formatMinutesToHours,
  generateInsights,
} from '../../utils/statistics'
import type { FocusSession, Task } from '../../types'
import styles from './Stats.module.css'

export default function Stats() {
  const { state } = useAppContext()

  const [range, setRange] = useState<TimeRange>('week')
  const [period, setPeriod] = useState<Period>(() => getCurrentPeriod('week'))

  // 安全获取数据
  const focusSessions: FocusSession[] = Array.isArray(state.focusSessions) ? state.focusSessions : []
  const tasks: Task[] = Array.isArray(state.tasks) ? state.tasks : []

  // 当前周期的记录和任务
  const currentSessions = useMemo(
    () => filterSessionsByRange(focusSessions, period.start, period.end),
    [focusSessions, period]
  )

  const currentTasks = useMemo(
    () => filterTasksByRange(tasks, period.start, period.end),
    [tasks, period]
  )

  // 上一周期的数据（用于对比）
  const previousPeriod = useMemo(() => getPreviousPeriod(range, period), [range, period])
  const previousSessions = useMemo(
    () => filterSessionsByRange(focusSessions, previousPeriod.start, previousPeriod.end),
    [focusSessions, previousPeriod]
  )

  // 统计数据
  const totalMinutes = useMemo(() => getTotalMinutes(currentSessions), [currentSessions])
  const completedCount = useMemo(() => getCompletedCount(currentSessions), [currentSessions])
  const completionRate = useMemo(() => getCompletionRate(currentTasks), [currentTasks])
  const previousMinutes = useMemo(() => getTotalMinutes(previousSessions), [previousSessions])

  // 学科分布
  const subjectDistribution = useMemo(
    () => groupBySubject(currentSessions.filter((s) => s.status === 'completed')),
    [currentSessions]
  )

  // 按学科的任务完成情况
  const tasksBySubject = useMemo(() => groupTasksBySubject(currentTasks), [currentTasks])

  // 每日专注数据
  const dailyData = useMemo(() => {
    const days = range === 'week' ? 7 : new Date(period.end.getFullYear(), period.end.getMonth() + 1, 0).getDate()
    return getDailyMinutes(
      currentSessions.filter((s) => s.status === 'completed'),
      period.start,
      days
    )
  }, [currentSessions, period, range])

  // 学习洞察
  const insights = useMemo(
    () => generateInsights(currentSessions, currentTasks, totalMinutes, previousMinutes),
    [currentSessions, currentTasks, totalMinutes, previousMinutes]
  )

  // 切换时间范围
  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange)
    setPeriod(getCurrentPeriod(newRange))
  }

  // 上一周期
  const handlePrevious = () => {
    setPeriod(getPreviousPeriod(range, period))
  }

  // 下一周期
  const handleNext = () => {
    const next = getNextPeriod(range, period)
    if (!isFuturePeriod(next)) {
      setPeriod(next)
    }
  }

  // 回到当前
  const handleCurrent = () => {
    setPeriod(getCurrentPeriod(range))
  }

  const canGoNext = !isFuturePeriod(getNextPeriod(range, period))

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>学习统计</h1>
          <p className={styles.subtitle}>回顾学习节奏，了解自己的进步</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.rangeToggle}>
            <button
              className={`${styles.rangeBtn} ${range === 'week' ? styles.rangeBtnActive : ''}`}
              onClick={() => handleRangeChange('week')}
            >
              本周
            </button>
            <button
              className={`${styles.rangeBtn} ${range === 'month' ? styles.rangeBtnActive : ''}`}
              onClick={() => handleRangeChange('month')}
            >
              本月
            </button>
          </div>
        </div>
      </header>

      {/* 周期导航 */}
      <div className={styles.periodNav}>
        <button className={styles.navBtn} onClick={handlePrevious}>
          <ChevronLeft size={18} />
        </button>
        <span className={styles.periodLabel}>{period.label}</span>
        <button
          className={styles.navBtn}
          onClick={handleNext}
          disabled={!canGoNext}
        >
          <ChevronRight size={18} />
        </button>
        <button className={styles.currentBtn} onClick={handleCurrent}>
          回到当前
        </button>
      </div>

      {/* 概览卡片 */}
      <div className={styles.overviewCards}>
        <div className={styles.card}>
          <Clock size={20} color="var(--primary)" />
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{formatMinutesToHours(totalMinutes)}</span>
            <span className={styles.cardLabel}>学习总时长</span>
          </div>
        </div>
        <div className={styles.card}>
          <CheckCircle size={20} color="var(--success)" />
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>
              {currentTasks.filter((t) => t.completed).length} / {currentTasks.length}
            </span>
            <span className={styles.cardLabel}>完成任务</span>
          </div>
        </div>
        <div className={styles.card}>
          <Target size={20} color="var(--accent)" />
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{completedCount}</span>
            <span className={styles.cardLabel}>专注次数</span>
          </div>
        </div>
        <div className={styles.card}>
          <TrendingUp size={20} color="var(--primary)" />
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{completionRate}%</span>
            <span className={styles.cardLabel}>任务完成率</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className={styles.chartsRow}>
        {/* 学习时长趋势 */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>学习时长趋势</h3>
          {dailyData.some((d) => d.minutes > 0) ? (
            <div className={styles.barChart}>
              {dailyData.map((day) => (
                <div key={day.date} className={styles.barWrapper}>
                  <div className={styles.barContainer}>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.min(100, (day.minutes / Math.max(...dailyData.map((d) => d.minutes), 1)) * 100)}%` }}
                      title={`${day.date}: ${day.minutes} 分钟`}
                    />
                  </div>
                  <span className={styles.barLabel}>
                    {range === 'week'
                      ? ['日', '一', '二', '三', '四', '五', '六'][new Date(day.date).getDay()]
                      : `${new Date(day.date).getDate()}日`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>该时间范围内还没有专注记录</p>
          )}
        </div>

        {/* 学科分布 */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>学科投入分布</h3>
          {subjectDistribution.length > 0 ? (
            <div className={styles.subjectList}>
              {subjectDistribution.slice(0, 5).map((item, index) => {
                const total = subjectDistribution.reduce((sum, s) => sum + s.minutes, 0)
                const percent = total > 0 ? Math.round((item.minutes / total) * 100) : 0
                return (
                  <div key={item.subject} className={styles.subjectItem}>
                    <div className={styles.subjectInfo}>
                      <span
                        className={styles.subjectDot}
                        style={{ background: getSubjectColor(index) }}
                      />
                      <span className={styles.subjectName}>{item.subject}</span>
                    </div>
                    <div className={styles.subjectBar}>
                      <div
                        className={styles.subjectBarFill}
                        style={{ width: `${percent}%`, background: getSubjectColor(index) }}
                      />
                    </div>
                    <span className={styles.subjectMinutes}>{item.minutes}分钟</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className={styles.emptyText}>该时间范围内还没有专注记录</p>
          )}
        </div>
      </div>

      {/* 任务完成情况和活跃度 */}
      <div className={styles.bottomRow}>
        {/* 任务完成情况 */}
        <div className={styles.card}>
          <h3 className={styles.chartTitle}>任务完成情况</h3>
          <div className={styles.taskStats}>
            <div className={styles.taskOverview}>
              <span className={styles.taskTotal}>{currentTasks.length} 项任务</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            {tasksBySubject.map((item) => (
              <div key={item.subject} className={styles.taskSubjectItem}>
                <span className={styles.taskSubjectName}>{item.subject}</span>
                <span className={styles.taskSubjectCount}>
                  {item.completed} / {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 学习活跃度 */}
        <div className={styles.card}>
          <h3 className={styles.chartTitle}>学习活跃度</h3>
          <div className={styles.activityGrid}>
            {dailyData.slice(0, range === 'week' ? 7 : 35).map((day) => (
              <div
                key={day.date}
                className={styles.activityCell}
                style={{ background: getActivityColor(day.minutes) }}
                title={`${day.date}: ${day.minutes} 分钟`}
              />
            ))}
          </div>
          <div className={styles.activityLegend}>
            <span>少</span>
            <div className={styles.legendCells}>
              <div className={styles.legendCell} style={{ background: '#f1f5f9' }} />
              <div className={styles.legendCell} style={{ background: '#dbeafe' }} />
              <div className={styles.legendCell} style={{ background: '#93c5fd' }} />
              <div className={styles.legendCell} style={{ background: '#2563eb' }} />
            </div>
            <span>多</span>
          </div>
        </div>
      </div>

      {/* 学习洞察 */}
      <div className={styles.insightsCard}>
        <h3 className={styles.chartTitle}>学习洞察</h3>
        <ul className={styles.insightsList}>
          {insights.map((insight, index) => (
            <li key={index} className={styles.insightItem}>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// 学科颜色（低饱和、易区分）
function getSubjectColor(index: number): string {
  const colors = ['#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6']
  return colors[index % colors.length]
}

// 活跃度颜色
function getActivityColor(minutes: number): string {
  if (minutes === 0) return '#f1f5f9'
  if (minutes < 25) return '#dbeafe'
  if (minutes < 50) return '#93c5fd'
  return '#2563eb'
}
