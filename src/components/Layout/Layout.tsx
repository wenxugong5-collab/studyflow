/**
 * 布局组件
 * 根据屏幕宽度自动切换底部导航（手机）和侧边导航（电脑）
 * 数据加载时显示加载状态
 */
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import { useAppContext } from '../../context/AppContext'
import styles from './Nav.module.css'

/** 电脑端断点：1024px */
const DESKTOP_BREAKPOINT = 1024

export default function Layout() {
  const { loading, error, syncError, clearSyncError } = useAppContext()

  /** 当前是否为电脑端（屏幕宽度 >= 1024px） */
  const [isDesktop, setIsDesktop] = useState(
    window.innerWidth >= DESKTOP_BREAKPOINT
  )

  // 监听窗口大小变化
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 数据加载中显示加载状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.loadingSpinner} />
        <p>正在加载数据...</p>
      </div>
    )
  }

  return (
    <>
      {/* 根据屏幕大小渲染不同的导航 */}
      {isDesktop ? <SideNav /> : <BottomNav />}

      {/* 主内容区域 */}
      <main
        className={`${styles.mainContent} ${
          isDesktop ? styles.mainContentDesktop : styles.mainContentMobile
        }`}
      >
        {/* 错误提示 */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Supabase 同步错误提示（可关闭） */}
        {syncError && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{syncError}</span>
            <button
              onClick={clearSyncError}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        )}

        {/* Outlet 会渲染当前路由对应的页面 */}
        <Outlet />
      </main>
    </>
  )
}
