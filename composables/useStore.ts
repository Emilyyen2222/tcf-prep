import type { SupabaseClient, Session } from '@supabase/supabase-js'
import type { Attempt, MockScore } from '~/types'

const LS_ATTEMPTS = 'tcf-prep:attempts'
const LS_MOCKS = 'tcf-prep:mocks'

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}
function writeLocal<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    /* 私密模式等情況寫不進去就算了 */
  }
}

/**
 * 資料層：登入 Supabase 就存雲端，沒登入（或沒設定 Supabase）就存 localStorage。
 * 第一次登入時，會把本機紀錄搬上雲端。
 */
export function useStore() {
  const { $supabase } = useNuxtApp()
  const sb = $supabase as SupabaseClient | null
  const session = useState<Session | null>('sb-session')

  const attempts = useState<Attempt[]>('attempts', () => [])
  const mocks = useState<MockScore[]>('mocks', () => [])
  const loaded = useState<string | null>('store-loaded-for', () => null)
  const loading = useState<boolean>('store-loading', () => false)
  const error = useState<string | null>('store-error', () => null)

  const remote = computed(() => !!sb && !!session.value)
  const userId = computed(() => session.value?.user.id ?? null)
  const mode = computed(() => (remote.value ? 'cloud' : 'local'))

  async function migrateLocal() {
    if (!sb || !userId.value) return
    const la = readLocal<Attempt>(LS_ATTEMPTS)
    const lm = readLocal<MockScore>(LS_MOCKS)
    if (la.length) {
      const { error: e } = await sb.from('attempts').insert(la.map((a) => ({ ...a, user_id: userId.value })))
      if (!e) writeLocal(LS_ATTEMPTS, [])
    }
    if (lm.length) {
      const { error: e } = await sb
        .from('mock_scores')
        .insert(lm.map(({ id: _id, ...m }) => ({ ...m, user_id: userId.value })))
      if (!e) writeLocal(LS_MOCKS, [])
    }
  }

  async function load(force = false) {
    const key = userId.value ?? 'local'
    if (!force && loaded.value === key) return
    loading.value = true
    error.value = null
    try {
      if (remote.value && sb) {
        await migrateLocal()
        const [a, m] = await Promise.all([
          sb.from('attempts').select('question_id, chosen, correct, created_at').order('created_at', { ascending: true }),
          sb.from('mock_scores').select('*').order('taken_on', { ascending: true }),
        ])
        if (a.error) throw a.error
        if (m.error) throw m.error
        attempts.value = a.data as Attempt[]
        mocks.value = m.data as MockScore[]
      } else {
        attempts.value = readLocal<Attempt>(LS_ATTEMPTS)
        mocks.value = readLocal<MockScore>(LS_MOCKS)
      }
      loaded.value = key
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  async function addAttempt(question_id: string, chosen: number, correct: boolean) {
    const row: Attempt = { question_id, chosen, correct, created_at: new Date().toISOString() }
    attempts.value = [...attempts.value, row]
    if (remote.value && sb) {
      const { error: e } = await sb.from('attempts').insert({ ...row, user_id: userId.value })
      if (e) error.value = e.message
    } else {
      writeLocal(LS_ATTEMPTS, attempts.value)
    }
  }

  async function addMock(input: Omit<MockScore, 'id' | 'created_at'>) {
    if (remote.value && sb) {
      const { data, error: e } = await sb
        .from('mock_scores')
        .insert({ ...input, user_id: userId.value })
        .select('*')
        .single()
      if (e) {
        error.value = e.message
        return
      }
      mocks.value = [...mocks.value, data as MockScore]
    } else {
      const row: MockScore = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      mocks.value = [...mocks.value, row]
      writeLocal(LS_MOCKS, mocks.value)
    }
    mocks.value = [...mocks.value].sort((a, b) => a.taken_on.localeCompare(b.taken_on))
  }

  async function removeMock(id: string) {
    mocks.value = mocks.value.filter((m) => m.id !== id)
    if (remote.value && sb) {
      const { error: e } = await sb.from('mock_scores').delete().eq('id', id)
      if (e) error.value = e.message
    } else {
      writeLocal(LS_MOCKS, mocks.value)
    }
  }

  return { attempts, mocks, loading, error, mode, remote, load, addAttempt, addMock, removeMock }
}
