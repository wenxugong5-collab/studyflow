/**
 * 布局组件
 * 根据屏幕宽度自动切换底部导航（手机）和侧边导航（电脑）
 */
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import styles from './Nav.module.css'

/** 电脑端断点：1024px */
const DESKTOP_BREAKPOINT = 1024

export default function Layout() {
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
        {/* Outlet 会渲染当前路由对应的页面 */}
        <Outlet />
      </main>
    </>
  )
}
