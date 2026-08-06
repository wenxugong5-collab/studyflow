/**
 * 登录/注册页面
 * 支持邮箱密码登录和注册，注册后提示验证邮箱
 */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import styles from './Login.module.css'

/** 页面模式：登录 或 注册 */
type Mode = 'signin' | 'signup'

/** 将 Supabase 错误转换为友好的中文提示 */
function getErrorMessage(error: string): string {
  if (error.includes('Invalid login credentials')) {
    return '邮箱或密码错误，请检查后重试'
  }
  if (error.includes('User already registered')) {
    return '该邮箱已注册，请直接登录'
  }
  if (error.includes('Email not confirmed')) {
    return '请先验证您的邮箱后再登录'
  }
  if (error.includes('weak')) {
    return '密码强度不足，请使用更复杂的密码'
  }
  if (error.includes('rate limit')) {
    return '请求过于频繁，请稍后再试'
  }
  return '操作失败，请稍后重试'
}

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /** 注册成功后的提示状态 */
  const [signupSuccess, setSignupSuccess] = useState(false)

  // 如果已登录，直接跳转到首页
  if (user) {
    navigate('/', { replace: true })
    return null
  }

  /** 切换登录/注册模式 */
  function switchMode(newMode: Mode) {
    setMode(newMode)
    setError('')
    setSignupSuccess(false)
  }

  /** 处理表单提交 */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // 验证邮箱格式
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    // 验证密码长度
    if (password.length < 8) {
      setError('密码至少需要 8 位字符')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        // 注册
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          setError(getErrorMessage(error.message))
        } else {
          setSignupSuccess(true)
        }
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setError(getErrorMessage(error.message))
        } else {
          navigate('/', { replace: true })
        }
      }
    } catch {
      setError('网络错误，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <Brain size={40} />
          <h1>StudyFlow</h1>
          <p>学习计划，从这里开始</p>
        </div>

        {/* 注册成功提示 */}
        {signupSuccess ? (
          <div className={styles.successBox}>
            <CheckCircle size={48} />
            <h2>注册成功！</h2>
            <p>
              我们已向 <strong>{email}</strong> 发送了验证邮件。
              <br />
              请检查邮箱并点击验证链接完成注册。
            </p>
            <button
              className={styles.primaryBtn}
              onClick={() => switchMode('signin')}
            >
              前往登录
            </button>
          </div>
        ) : (
          <>
            {/* 模式切换标签 */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
                onClick={() => switchMode('signin')}
                type="button"
              >
                登录
              </button>
              <button
                className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
                onClick={() => switchMode('signup')}
                type="button"
              >
                注册
              </button>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email">邮箱</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="password">密码</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="password"
                    type="password"
                    placeholder={
                      mode === 'signup' ? '至少 8 位字符' : '请输入密码'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && <div className={styles.error}>{error}</div>}

              {/* 提交按钮 */}
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className={styles.spin} />
                    处理中...
                  </>
                ) : mode === 'signin' ? (
                  '登录'
                ) : (
                  '注册'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
