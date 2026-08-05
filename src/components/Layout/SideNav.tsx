/**
 * 侧边导航栏（电脑端使用）
 * 显示在屏幕左侧，空间更充裕
 */
import { NavLink } from 'react-router-dom'
import { BookOpen, Target, Calendar, Timer, BarChart3, Brain } from 'lucide-react'
import styles from './Nav.module.css'

/** 导航项配置 */
const navItems = [
  { to: '/', icon: BookOpen, label: '今日学习' },
  { to: '/goals', icon: Target, label: '学习计划' },
  { to: '/calendar', icon: Calendar, label: '学习日历' },
  { to: '/focus', icon: Timer, label: '专注学习' },
  { to: '/statistics', icon: BarChart3, label: '学习统计' },
]

export default function SideNav() {
  return (
    <nav className={styles.sideNav}>
      {/* Logo 区域 */}
      <div className={styles.sideNavLogo}>
        <Brain size={28} />
        <span>StudyFlow</span>
      </div>

      {/* 导航列表 */}
      <div className={styles.sideNavList}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.sideNavItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
