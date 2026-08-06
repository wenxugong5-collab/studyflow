/**
 * 本地 ID <-> Supabase UUID 映射层
 *
 * 前端 localStorage 沿用 generateId() 产生的短 ID（如 msfxxxx），
 * 但 Supabase 的 id / user_id / goal_id 等列是 UUID 类型。
 * 本模块负责在写入 Supabase 时把本地短 ID 翻译成 UUID，
 * 读取时保留 UUID（已是合法值，可直接使用）。
 *
 * 映射持久化到 localStorage，页面刷新后依旧可用。
 * 新增记录一律用 crypto.randomUUID() 生成 UUID，并登记映射。
 */

/** UUID v4 正则 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** 映射存储 key */
const MAP_KEY = 'studyflow_uuid_map'

/** 本地 ID -> UUID 映射类型 */
type IdMap = Record<string, string>

/** 内存缓存，避免频繁读 localStorage */
let cache: IdMap | null = null

/** 判断字符串是否已经是合法 UUID */
export function isUuid(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** 从 localStorage 加载映射（带缓存） */
function loadMap(): IdMap {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(MAP_KEY)
    cache = raw ? (JSON.parse(raw) as IdMap) : {}
  } catch {
    cache = {}
  }
  return cache!
}

/** 持久化映射到 localStorage */
function saveMap(map: IdMap): void {
  cache = map
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map))
  } catch {
    // 存储失败不影响主流程
  }
}

/**
 * 把本地 ID 翻译成 UUID。
 * - 如果已经是 UUID，直接返回。
 * - 如果有已登记映射，返回映射值。
 * - 否则生成新 UUID 登记并返回（用于新增记录）。
 */
export function toUuid(localId: string | undefined | null): string {
  if (!localId) throw new Error('toUuid: id 不能为空')
  if (isUuid(localId)) return localId
  const map = loadMap()
  const existing = map[localId]
  if (existing) return existing
  const uuid = crypto.randomUUID()
  map[localId] = uuid
  saveMap(map)
  return uuid
}

/**
 * 把本地 ID 翻译成 UUID，找不到映射时返回 null（不新建）。
 * 用于可空的外键（如 goal_id）。
 */
export function toUuidOrNull(
  localId: string | undefined | null
): string | null {
  if (!localId) return null
  if (isUuid(localId)) return localId
  const map = loadMap()
  return map[localId] ?? null
}

/**
 * 显式登记一条映射（迁移时用：先生成 UUID 再写入，再登记）。
 */
export function registerMapping(localId: string, uuid: string): void {
  if (isUuid(localId)) return
  const map = loadMap()
  map[localId] = uuid
  saveMap(map)
}

/** 反向查找：UUID -> 本地 ID（暂无需要，留作调试） */
export function localIdFromUuid(uuid: string): string | undefined {
  if (!isUuid(uuid)) return uuid
  const map = loadMap()
  for (const [local, u] of Object.entries(map)) {
    if (u === uuid) return local
  }
  return undefined
}
