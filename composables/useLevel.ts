import type { Level } from '~/types'
import { LEVELS } from '~/types'

const KEYS = {
  questions: { storage: 'tcf-prep:level', fallback: 'A1' as Level },
  cards: { storage: 'tcf-prep:card-level', fallback: 'A2' as Level },
}

/**
 * 自己的程度。題目和單字卡分開設定（單字通常比文法程度高）：
 * questions 決定每日練習先出哪個等級，cards 決定先學哪個等級的新單字。只存在這台裝置。
 */
export function useLevel(scope: keyof typeof KEYS = 'questions') {
  const { storage, fallback } = KEYS[scope]
  const level = useState<Level>(`level-${scope}`, () => {
    try {
      const saved = localStorage.getItem(storage) as Level | null
      if (saved && LEVELS.includes(saved)) return saved
    } catch {
      /* 讀不到就用預設 */
    }
    return fallback
  })
  return computed({
    get: () => level.value,
    set: (v: Level) => {
      level.value = v
      try {
        localStorage.setItem(storage, v)
      } catch {
        /* 寫不進去就只在這次有效 */
      }
    },
  })
}
