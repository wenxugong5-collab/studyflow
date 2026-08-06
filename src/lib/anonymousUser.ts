/**
 * 匿名用户标识
 * 首次访问时生成一个持久化的 UUID，存储在 localStorage。
 * 无需登录即可使用全部功能，数据仍按 user_id 同步到 Supabase。
 */
const ANON_USER_KEY = 'studyflow_anon_user_id'

export function getAnonymousUserId(): string {
  let id = localStorage.getItem(ANON_USER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_USER_KEY, id)
  }
  return id
}
