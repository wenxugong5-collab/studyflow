/**
 * 应用根组件
 * 配置路由和全局状态 Provider
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout/Layout'
import Today from './pages/Today/Today'
import Goals from './pages/Goals/Goals'
import Calendar from './pages/Calendar/Calendar'
import Focus from './pages/Focus/Focus'
import Stats from './pages/Stats/Stats'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="goals" element={<Goals />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="focus" element={<Focus />} />
            <Route path="statistics" element={<Stats />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
