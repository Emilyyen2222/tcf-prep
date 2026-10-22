import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'

/**
 * 有填 NUXT_PUBLIC_SUPABASE_URL / ANON_KEY 才會建立 client；
 * 沒填的話整個 App 改用 localStorage，方便本機直接跑起來。
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string

  const session = useState<Session | null>('sb-session', () => null)
  const ready = useState<boolean>('sb-ready', () => false)

  let client: SupabaseClient | null = null
  if (url && key) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
    const { data } = await client.auth.getSession()
    session.value = data.session
    client.auth.onAuthStateChange((_event, s) => {
      session.value = s
    })
  }
  ready.value = true

  return { provide: { supabase: client } }
})
