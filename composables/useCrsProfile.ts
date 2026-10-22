import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { EMPTY_PROFILE, type CrsProfile } from '~/utils/crs'

const LS_PROFILE = 'tcf-prep:crs-profile'

/**
 * CRS 估算用的個人條件（生日、學歷、年資、英文）。
 * 登入時存在 Supabase 帳號的 user_metadata，不用另開資料表；沒登入就存 localStorage。
 * 這是個人資料，不要寫死在 repo 裡。
 */
export function useCrsProfile() {
  const { $supabase } = useNuxtApp()
  const sb = $supabase as SupabaseClient | null
  const session = useState<Session | null>('sb-session')
  // localStorage 不是響應式的，存檔後加一讓 profile 重新讀
  const localVersion = useState('crs-profile-version', () => 0)

  function readLocal(): CrsProfile | null {
    try {
      const raw = localStorage.getItem(LS_PROFILE)
      return raw ? (JSON.parse(raw) as CrsProfile) : null
    } catch {
      return null
    }
  }

  const profile = computed<CrsProfile>(() => {
    void localVersion.value
    const saved = (session.value?.user.user_metadata?.crs_profile as CrsProfile | undefined) ?? readLocal()
    return saved ? { ...EMPTY_PROFILE, ...saved, english: { ...EMPTY_PROFILE.english, ...saved.english } } : EMPTY_PROFILE
  })

  async function save(p: CrsProfile) {
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(p))
    } catch {
      /* 寫不進去就只存雲端 */
    }
    localVersion.value++
    if (sb && session.value) {
      const { data, error } = await sb.auth.updateUser({ data: { crs_profile: p } })
      if (error) throw error
      if (data.user && session.value) session.value = { ...session.value, user: data.user }
    }
  }

  return { profile, save }
}
