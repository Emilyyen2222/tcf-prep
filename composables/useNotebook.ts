import type { SupabaseClient, Session } from '@supabase/supabase-js'
import type { CardProgress, UserCard, UserNote } from '~/types'

const LS_NOTES = 'tcf-prep:notes'
const LS_CARDS = 'tcf-prep:cards'
const LS_PROGRESS = 'tcf-prep:card-progress'

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
 * 自己的筆記、自己加的單字、單字卡進度。跟 useStore 一樣：
 * 登入 Supabase 就存雲端，沒登入就存 localStorage，第一次登入時把本機資料搬上去。
 */
export function useNotebook() {
  const { $supabase } = useNuxtApp()
  const sb = $supabase as SupabaseClient | null
  const session = useState<Session | null>('sb-session')

  const notes = useState<UserNote[]>('user-notes', () => [])
  const cards = useState<UserCard[]>('user-cards', () => [])
  const progress = useState<Record<string, CardProgress>>('card-progress', () => ({}))
  const loaded = useState<string | null>('notebook-loaded-for', () => null)
  const error = useState<string | null>('store-error', () => null)

  const remote = computed(() => !!sb && !!session.value)
  const userId = computed(() => session.value?.user.id ?? null)

  function saveLocal() {
    if (remote.value) return
    writeLocal(LS_NOTES, notes.value)
    writeLocal(LS_CARDS, cards.value)
    writeLocal(LS_PROGRESS, Object.values(progress.value))
  }

  async function migrateLocal() {
    if (!sb || !userId.value) return
    const ln = readLocal<UserNote>(LS_NOTES)
    const lc = readLocal<UserCard>(LS_CARDS)
    const lp = readLocal<CardProgress>(LS_PROGRESS)
    const uid = userId.value
    if (ln.length) {
      const { error: e } = await sb.from('notes').upsert(ln.map((n) => ({ ...n, user_id: uid })))
      if (!e) writeLocal(LS_NOTES, [])
    }
    if (lc.length) {
      const { error: e } = await sb
        .from('cards')
        .upsert(lc.map(({ id, fr, zh, note, created_at }) => ({ id, fr, zh, note, created_at, user_id: uid })))
      if (!e) writeLocal(LS_CARDS, [])
    }
    if (lp.length) {
      const { error: e } = await sb
        .from('card_progress')
        .upsert(lp.map((p) => ({ ...p, user_id: uid })), { onConflict: 'user_id,card_id' })
      if (!e) writeLocal(LS_PROGRESS, [])
    }
  }

  async function load(force = false) {
    const key = userId.value ?? 'local'
    if (!force && loaded.value === key) return
    try {
      if (remote.value && sb) {
        await migrateLocal()
        const [n, c, p] = await Promise.all([
          sb.from('notes').select('id, title, body, created_at, updated_at').order('updated_at', { ascending: false }),
          sb.from('cards').select('id, fr, zh, note, created_at').order('created_at', { ascending: false }),
          sb.from('card_progress').select('card_id, box, due_on, reviewed_at'),
        ])
        if (n.error) throw n.error
        if (c.error) throw c.error
        if (p.error) throw p.error
        notes.value = n.data as UserNote[]
        cards.value = c.data as UserCard[]
        progress.value = Object.fromEntries((p.data as CardProgress[]).map((r) => [r.card_id, r]))
      } else {
        notes.value = readLocal<UserNote>(LS_NOTES)
        cards.value = readLocal<UserCard>(LS_CARDS)
        progress.value = Object.fromEntries(readLocal<CardProgress>(LS_PROGRESS).map((r) => [r.card_id, r]))
      }
      loaded.value = key
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    }
  }

  async function saveNote(input: { id?: string; title: string; body: string }) {
    const now = new Date().toISOString()
    const existing = input.id ? notes.value.find((n) => n.id === input.id) : undefined
    const row: UserNote = existing
      ? { ...existing, title: input.title, body: input.body, updated_at: now }
      : { id: crypto.randomUUID(), title: input.title, body: input.body, created_at: now, updated_at: now }
    notes.value = [row, ...notes.value.filter((n) => n.id !== row.id)]
    if (remote.value && sb) {
      const { error: e } = await sb.from('notes').upsert({ ...row, user_id: userId.value })
      if (e) error.value = e.message
    } else saveLocal()
    return row.id
  }

  async function removeNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    if (remote.value && sb) {
      const { error: e } = await sb.from('notes').delete().eq('id', id)
      if (e) error.value = e.message
    } else saveLocal()
  }

  async function addCard(input: { fr: string; zh: string; note?: string | null }) {
    const row: UserCard = {
      id: crypto.randomUUID(),
      fr: input.fr,
      zh: input.zh,
      note: input.note || null,
      created_at: new Date().toISOString(),
    }
    cards.value = [row, ...cards.value]
    if (remote.value && sb) {
      const { error: e } = await sb.from('cards').insert({ ...row, user_id: userId.value })
      if (e) error.value = e.message
    } else saveLocal()
  }

  async function removeCard(id: string) {
    cards.value = cards.value.filter((c) => c.id !== id)
    const { [id]: _gone, ...rest } = progress.value
    progress.value = rest
    if (remote.value && sb) {
      const [a, b] = await Promise.all([
        sb.from('cards').delete().eq('id', id),
        sb.from('card_progress').delete().eq('card_id', id),
      ])
      if (a.error || b.error) error.value = (a.error ?? b.error)!.message
    } else saveLocal()
  }

  async function setProgress(row: CardProgress) {
    progress.value = { ...progress.value, [row.card_id]: row }
    if (remote.value && sb) {
      const { error: e } = await sb
        .from('card_progress')
        .upsert({ ...row, user_id: userId.value }, { onConflict: 'user_id,card_id' })
      if (e) error.value = e.message
    } else saveLocal()
  }

  return { notes, cards, progress, loaded, load, saveNote, removeNote, addCard, removeCard, setProgress }
}
