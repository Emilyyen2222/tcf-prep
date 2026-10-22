import type { Level } from '~/types'
import { LEVELS } from '~/types'

const LS_LEVEL = 'tcf-prep:level'

/** 自己的程度，決定每日練習先出哪個等級的題目。只存在這台裝置。 */
export function useLevel() {
  const level = useState<Level>('level', () => {
    try {
      const saved = localStorage.getItem(LS_LEVEL) as Level | null
      if (saved && LEVELS.includes(saved)) return saved
    } catch {
      /* 讀不到就用預設 */
    }
    return 'A1'
  })
  return computed({
    get: () => level.value,
    set: (v: Level) => {
      level.value = v
      try {
        localStorage.setItem(LS_LEVEL, v)
      } catch {
        /* 寫不進去就只在這次有效 */
      }
    },
  })
}
