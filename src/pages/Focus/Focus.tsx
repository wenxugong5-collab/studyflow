/**
 * 专注学习页
 * 番茄钟计时器：25分钟专注 + 5分钟休息，支持自定义时长
 * 使用 endTime 基准计时，确保后台/刷新后仍然准确
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Square, Check, Volume2, Bell } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getToday } from '../../utils/date'
import { generateId } from '../../utils/helpers'
import type { FocusSession } from '../../types'
import styles from './Focus.module.css'

// 计时器状态
type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'break'

// 预设模式
interface TimerMode {
  label: string
  focusMinutes: number
  breakMinutes: number
}

const PRESET_MODES: TimerMode[] = [
  { label: '25+5', focusMinutes: 25, breakMinutes: 5 },
  { label: '50+10', focusMinutes: 50, breakMinutes: 10 },
]

// 计时器状态持久化 key
const TIMER_STATE_KEY = 'studyflow_timer_state'

interface TimerState {
  status: TimerStatus
  endTime: number
  remainingSeconds: number
  mode: 'focus' | 'break'
  focusMinutes: number
  breakMinutes: number
  selectedTaskId: string | null
}

export default function Focus() {
  const { state, dispatch } = useAppContext()

  // 计时器状态
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [endTime, setEndTime] = useState<number>(0)
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)

  // 选中的任务
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // 设置
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  // 完成提示
  const [showComplete, setShowComplete] = useState(false)

  // 音频上下文（懒加载）
  const audioContextRef = useRef<AudioContext | null>(null)

  // 未完成任务列表
  const incompleteTasks = state.tasks?.filter((t) => !t.completed) || []

  // 选中的任务信息
  const selectedTask = selectedTaskId
    ? state.tasks?.find((t) => t.id === selectedTaskId)
    : null

  // 今日专注记录
  const todaySessions = state.focusSessions?.filter((s) => {
    const sessionDate = s.startedAt?.split('T')[0]
    return sessionDate === getToday()
  }) || []

  // 今日统计
  const todayTotalMinutes = todaySessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0)
  const todayCompletedCount = todaySessions.filter((s) => s.status === 'completed').length
  const currentStreak = calculateStreak(state.focusSessions || [])

  // 从 localStorage 恢复计时器状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STATE_KEY)
      if (saved) {
        const timerState: TimerState = JSON.parse(saved)
        if (timerState.status === 'running') {
          // 计算实际剩余时间
          const now = Date.now()
          const actualRemaining = Math.max(0, Math.ceil((timerState.endTime - now) / 1000))

          if (actualRemaining <= 0) {
            // 计时已结束
            setTimeout(() => handleTimerComplete(timerState), 0)
          } else {
            // 恢复计时
            setStatus('running')
            setEndTime(timerState.endTime)
            setRemainingSeconds(actualRemaining)
            setMode(timerState.mode)
            setFocusMinutes(timerState.focusMinutes)
            setBreakMinutes(timerState.breakMinutes)
            setSelectedTaskId(timerState.selectedTaskId)
          }
        }
      }
    } catch {
      // 解析失败，忽略
    }
  }, [])

  // 保存计时器状态到 localStorage
  const saveTimerState = useCallback(() => {
    const timerState: TimerState = {
      status,
      endTime,
      remainingSeconds,
      mode,
      focusMinutes,
      breakMinutes,
      selectedTaskId,
    }
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState))
  }, [status, endTime, remainingSeconds, mode, focusMinutes, breakMinutes, selectedTaskId])

  // 计时器核心逻辑
  useEffect(() => {
    if (status !== 'running') return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))

      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        handleTimerComplete()
      }
    }, 250)

    return () => clearInterval(interval)
  }, [status, endTime])

  // 保存状态变化
  useEffect(() => {
    if (status === 'running') {
      saveTimerState()
    }
  }, [status, endTime, saveTimerState])

  // 处理计时完成
  const handleTimerComplete = useCallback((timerState?: TimerState) => {
    const currentMode = timerState?.mode || mode
    const currentTaskId = timerState?.selectedTaskId || selectedTaskId
    const currentFocusMinutes = timerState?.focusMinutes || focusMinutes

    if (currentMode === 'focus') {
      // 专注完成，记录
      const now = new Date()
      const startedAt = new Date(now.getTime() - currentFocusMinutes * 60 * 1000)
      const task = currentTaskId ? state.tasks?.find((t) => t.id === currentTaskId) : null

      const session: FocusSession = {
        id: generateId(),
        taskId: currentTaskId || undefined,
        taskTitle: task?.title || undefined,
        subject: task?.subject || undefined,
        plannedMinutes: currentFocusMinutes,
        actualMinutes: currentFocusMinutes,
        startedAt: startedAt.toISOString(),
        completedAt: now.toISOString(),
        status: 'completed',
      }

      dispatch({ type: 'ADD_FOCUS_SESSION', payload: session })

      // 播放提示音
      if (soundEnabled) playNotificationSound()
      if (notificationEnabled) sendNotification('专注完成！', '休息一下吧')

      // 进入休息模式
      setStatus('break')
      setMode('break')
      setShowComplete(true)
      setTimeout(() => setShowComplete(false), 5000)
    } else {
      // 休息完成
      setStatus('completed')
    }

    // 清除持久化状态
    localStorage.removeItem(TIMER_STATE_KEY)
  }, [mode, selectedTaskId, focusMinutes, state.tasks, soundEnabled, notificationEnabled, dispatch])

  // 开始专注
  const startFocus = useCallback(() => {
    const totalSeconds = (mode === 'focus' ? focusMinutes : breakMinutes) * 60
    const newEndTime = Date.now() + totalSeconds * 1000

    setStatus('running')
    setEndTime(newEndTime)
    setRemainingSeconds(totalSeconds)
    setShowComplete(false)
  }, [mode, focusMinutes, breakMinutes])

  // 暂停
  const pauseTimer = useCallback(() => {
    setStatus('paused')
    localStorage.removeItem(TIMER_STATE_KEY)
  }, [])

  // 继续
  const resumeTimer = useCallback(() => {
    const newEndTime = Date.now() + remainingSeconds * 1000
    setStatus('running')
    setEndTime(newEndTime)
  }, [remainingSeconds])

  // 重置
  const resetTimer = useCallback(() => {
    setStatus('idle')
    setRemainingSeconds(focusMinutes * 60)
    setMode('focus')
    setShowComplete(false)
    localStorage.removeItem(TIMER_STATE_KEY)
  }, [focusMinutes])

  // 提前结束
  const stopEarly = useCallback(() => {
    if (mode === 'focus' && status === 'running') {
      // 记录已专注时长
      const now = new Date()
      const elapsed = focusMinutes * 60 - remainingSeconds
      if (elapsed > 60) { // 至少专注1分钟才记录
        const startedAt = new Date(now.getTime() - elapsed * 1000)
        const task = selectedTaskId ? state.tasks?.find((t) => t.id === selectedTaskId) : null

        const session: FocusSession = {
          id: generateId(),
          taskId: selectedTaskId || undefined,
          taskTitle: task?.title || undefined,
          subject: task?.subject || undefined,
          plannedMinutes: focusMinutes,
          actualMinutes: Math.round(elapsed / 60),
          startedAt: startedAt.toISOString(),
          completedAt: now.toISOString(),
          status: 'interrupted',
        }

        dispatch({ type: 'ADD_FOCUS_SESSION', payload: session })
      }
    }
    resetTimer()
  }, [mode, status, focusMinutes, remainingSeconds, selectedTaskId, state.tasks, dispatch, resetTimer])

  // 切换模式
  const selectMode = useCallback((preset: TimerMode) => {
    if (status !== 'idle') return
    setFocusMinutes(preset.focusMinutes)
    setBreakMinutes(preset.breakMinutes)
    setRemainingSeconds(preset.focusMinutes * 60)
  }, [status])

  // 播放提示音（Web Audio API）
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {
      // 音频播放失败，静默处理
    }
  }, [])

  // 发送桌面通知
  const sendNotification = useCallback((title: string, body: string) => {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' })
      }
    } catch {
      // 通知失败，静默处理
    }
  }, [])

  // 请求通知权限
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) return

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setNotificationEnabled(permission === 'granted')
      } else if (Notification.permission === 'granted') {
        setNotificationEnabled(true)
      }
    } catch {
      // 权限请求失败
    }
  }, [])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 计算进度
  const totalSeconds = (mode === 'focus' ? focusMinutes : breakMinutes) * 60
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0

  // 状态文本
  const statusText = {
    idle: '准备开始',
    running: mode === 'focus' ? '专注中' : '休息中',
    paused: '已暂停',
    completed: '完成',
    break: '休息中',
  }[status]

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>专注学习</h1>
          <p className={styles.subtitle}>专注当下，高效学习</p>
        </div>
      </header>

      {/* 完成提示 */}
      {showComplete && (
        <div className={styles.completeBanner}>
          <Check size={20} />
          <span>专注完成！休息一下吧</span>
        </div>
      )}

      {/* 主内容 */}
      <div className={styles.content}>
        {/* 左侧：计时器 */}
        <div className={styles.timerCard}>
          {/* 任务选择 */}
          <div className={styles.taskSelector}>
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || null)}
              disabled={status === 'running'}
              className={styles.select}
            >
              <option value="">自由专注</option>
              {incompleteTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.subject})
                </option>
              ))}
            </select>
            {selectedTask && (
              <div className={styles.selectedTask}>
                <span className={styles.taskTag}>{selectedTask.subject}</span>
                <span className={styles.taskDuration}>预计 {selectedTask.duration} 分钟</span>
              </div>
            )}
          </div>

          {/* 计时器圆环 */}
          <div className={styles.timerRing}>
            <svg className={styles.progressRing} viewBox="0 0 280 280">
              {/* 背景圆环 */}
              <circle
                className={styles.ringBg}
                cx="140"
                cy="140"
                r="130"
                fill="none"
                strokeWidth="8"
              />
              {/* 进度圆环 */}
              <circle
                className={styles.ringProgress}
                cx="140"
                cy="140"
                r="130"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 130}
                strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
                transform="rotate(-90 140 140)"
              />
            </svg>
            {/* 时间显示 */}
            <div className={styles.timeDisplay}>
              <span className={styles.timeText}>{formatTime(remainingSeconds)}</span>
              <span className={styles.statusText}>{statusText}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className={styles.controls}>
            {status === 'idle' && (
              <button className={styles.btnPrimary} onClick={startFocus}>
                <Play size={18} />
                开始专注
              </button>
            )}
            {status === 'running' && (
              <>
                <button className={styles.btnSecondary} onClick={pauseTimer}>
                  <Pause size={18} />
                  暂停
                </button>
                <button className={styles.btnText} onClick={stopEarly}>
                  <Square size={16} />
                  结束
                </button>
              </>
            )}
            {status === 'paused' && (
              <>
                <button className={styles.btnPrimary} onClick={resumeTimer}>
                  <Play size={18} />
                  继续
                </button>
                <button className={styles.btnText} onClick={resetTimer}>
                  <RotateCcw size={16} />
                  重置
                </button>
              </>
            )}
            {status === 'completed' && (
              <button className={styles.btnPrimary} onClick={resetTimer}>
                <RotateCcw size={18} />
                开始新一轮
              </button>
            )}
          </div>
        </div>

        {/* 右侧：设置和统计 */}
        <div className={styles.sidebar}>
          {/* 模式选择 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>专注模式</h3>
            <div className={styles.modeButtons}>
              {PRESET_MODES.map((preset) => (
                <button
                  key={preset.label}
                  className={`${styles.modeBtn} ${focusMinutes === preset.focusMinutes ? styles.modeBtnActive : ''}`}
                  onClick={() => selectMode(preset)}
                  disabled={status !== 'idle'}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className={styles.modeHint}>
              专注 {focusMinutes} 分钟 + 休息 {breakMinutes} 分钟
            </p>
          </div>

          {/* 今日统计 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>今日统计</h3>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{todayTotalMinutes}</span>
                <span className={styles.statLabel}>分钟</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{todayCompletedCount}</span>
                <span className={styles.statLabel}>次专注</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{currentStreak}</span>
                <span className={styles.statLabel}>连续轮数</span>
              </div>
            </div>
          </div>

          {/* 提醒设置 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>提醒设置</h3>
            <div className={styles.settings}>
              <label className={styles.settingItem}>
                <Volume2 size={16} />
                <span>声音提醒</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className={styles.checkbox}
                />
              </label>
              <label className={styles.settingItem}>
                <Bell size={16} />
                <span>桌面通知</span>
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      requestNotificationPermission()
                    } else {
                      setNotificationEnabled(false)
                    }
                  }}
                  className={styles.checkbox}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 今日专注记录 */}
      <div className={styles.recordsCard}>
        <h3 className={styles.cardTitle}>今日专注记录</h3>
        {todaySessions.length === 0 ? (
          <p className={styles.emptyText}>今天还没有专注记录</p>
        ) : (
          <div className={styles.recordsList}>
            {todaySessions.map((session) => (
              <div key={session.id} className={styles.recordItem}>
                <div className={styles.recordInfo}>
                  <span className={styles.recordTask}>
                    {session.taskTitle || '自由专注'}
                  </span>
                  <span className={styles.recordMeta}>
                    {session.subject && <span className={styles.taskTag}>{session.subject}</span>}
                    <span>{session.actualMinutes} 分钟</span>
                    <span>{formatTimeOnly(session.startedAt)}</span>
                  </span>
                </div>
                <span className={`${styles.recordStatus} ${session.status === 'completed' ? styles.statusCompleted : styles.statusInterrupted}`}>
                  {session.status === 'completed' ? '完成' : '中断'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 计算连续完成轮数
function calculateStreak(sessions: FocusSession[]): number {
  if (sessions.length === 0) return 0

  const today = getToday()
  const completedToday = sessions
    .filter((s) => s.status === 'completed' && s.startedAt?.startsWith(today))
    .length

  return completedToday
}

// 格式化时间（仅时分）
function formatTimeOnly(isoString: string): string {
  try {
    const date = new Date(isoString)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}
