/**
 * 应用根组件
 * 配置路由和全局状态 Provider
 * 无需登录，打开即用
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout/Layout'
import Today from './pages/Today/Today'
import Goals from './pages/Goals/Goals'
import Calendar from './pages/Calendar/Calendar'
import Focus from './pages/Focus/Focus'
import Stats from './pages/Stats/Stats'

function AppRoutes() {
  return (
    <Routes>
      {/* 所有页面直接访问，无需登录 */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="goals" element={<Goals />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="focus" element={<Focus />} />
        <Route path="statistics" element={<Stats />} />
      </Route>

      {/* 其他路径重定向到首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
