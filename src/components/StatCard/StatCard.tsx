/**
 * 统计卡片组件
 * 显示一个统计数值和标签
 */
import type { ReactNode } from 'react'
import styles from './StatCard.module.css'

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  color?: string
}

export default function StatCard({ icon, value, label, color = 'var(--primary-bg)' }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} style={{ background: color }}>
        {icon}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}
