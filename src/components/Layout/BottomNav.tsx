/**
 * 底部导航栏（手机端使用）
 * 显示在屏幕底部，方便单手操作
 */
import { NavLink } from 'react-router-dom'
import { BookOpen, Target, Calendar, Timer, BarChart3 } from 'lucide-react'
import styles from './Nav.module.css'

/** 导航项配置 */
const navItems = [
  { to: '/', icon: BookOpen, label: '今日' },
  { to: '/goals', icon: Target, label: '计划' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/focus', icon: Timer, label: '专注' },
  { to: '/statistics', icon: BarChart3, label: '统计' },
]

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${styles.bottomNavItem} ${isActive ? styles.active : ''}`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
