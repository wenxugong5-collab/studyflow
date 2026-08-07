import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --------下面是所有数据库业务函数，不能丢！-------
export async function fetchGoals() {
  const { data } = await supabase.from('goals').select('*')
  return data
}

export async function fetchTasks() {
  const { data } = await supabase.from('tasks').select('*')
  return data
}

export async function fetchFocusSessions() {
  const { data } = await supabase.from('focus_sessions').select('*')
  return data
}

export async function migrateGoals(payload:any) {
  return await supabase.from('goals').insert(payload)
}

export async function migrateTasks(payload:any) {
  return await supabase.from('tasks').insert(payload)
}

export async function migrateFocusSessions(payload:any) {
  return await supabase.from('focus_sessions').insert(payload)
}

export async function insertGoal(payload:any) {
  return await supabase.from('goals').insert(payload)
}

export async function updateGoal(id:number,payload:any) {
  return await supabase.from('goals').update(payload).eq('id',id)
}

export async function deleteGoal(id:number) {
  return await supabase.from('goals').delete().eq('id',id)
}

export async function insertTask(payload:any) {
  return await supabase.from('tasks').insert(payload)
}

export function updateTask(id:number,payload:any) {
  return supabase.from('tasks').update(payload).eq('id',id)
}

export function deleteTask(id:number) {
  return supabase.from('tasks').delete().eq('id',id)
}

export async function insertPlanTask(payload:any) {
  return await supabase.from('plan_tasks').insert(payload)
}

export async function updatePlanTask(id:number,payload:any) {
  return await supabase.from('plan_tasks').update(payload).eq('id',id)
}

export async function deletePlanTask(id:number) {
  return await supabase.from('plan_tasks').delete().eq('id',id)
}