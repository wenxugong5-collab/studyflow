/**
 * Supabase 客户端
 * 用于连接 Supabase 后端服务
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env.local 文件')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
