/**
 * 环形进度条组件
 * 显示任务完成百分比
 * 圆环中心只显示百分比和"完成"标签
 */
import styles from './ProgressRing.module.css'

interface ProgressRingProps {
  percent: number // 0-100
  label?: string
}

export default function ProgressRing({ percent, label = '完成' }: ProgressRingProps) {
  // 限制百分比在 0-100 范围内，防止 NaN 或 Infinity
  const safePercent = Math.min(100, Math.max(0, isFinite(percent) ? percent : 0))

  const radius = 30
  const circumference = 2 * Math.PI * radius // 周长 = 2πr ≈ 188.5

  // strokeDashoffset 控制进度：
  // - 0% 时 offset = 周长（无蓝色弧线）
  // - 100% 时 offset = 0（完整圆环）
  const offset = circumference - (safePercent / 100) * circumference

  return (
    <div className={styles.ring}>
      <svg className={styles.svg} width="72" height="72">
        {/* 背景圆环（灰色轨道） */}
        <circle className={styles.track} cx="36" cy="36" r={radius} strokeWidth="6" />
        {/* 进度圆环（蓝色弧线） */}
        <circle
          className={styles.progress}
          cx="36"
          cy="36"
          r={radius}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {/* 中心文字：百分比 + 标签 */}
      <div className={styles.text}>
        <span className={styles.percent}>{Math.round(safePercent)}%</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  )
}
