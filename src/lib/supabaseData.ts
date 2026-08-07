import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fdmoamczmyihfsczkrfi.supabase.co"
// 此处粘贴你在API Keys复制的 anon public 密钥（一大串字母数字）
const supabaseAnonKey = "sb_publishable_XrbuQwRrz65LcVfnT9L9pQ_MKVkKOiB"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)