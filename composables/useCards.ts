import type { Card, CardProgress, Level, UserCard } from '~/types'
import { LEVELS } from '~/types'
import vocab from '~/data/vocab.json'
import { localDay } from '~/composables/useBank'

export const BUILTIN_CARDS = vocab as Card[]

/** 答「會」之後，依 box 決定幾天後再出現（Leitner 盒子法） */
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15, 30]
export const MAX_BOX = INTERVAL_DAYS.length - 1
/** 每次最多出幾張沒看過的新卡 */
export const NEW_PER_SESSION = 10

export function allCards(userCards: UserCard[]): Card[] {
  return [...userCards.map((c) => ({ ...c, tag: '我加的' })), ...BUILTIN_CARDS]
}

export function cardTags(userCards: UserCard[]) {
  const tags = new Set<string>()
  if (userCards.length) tags.add('我加的')
  for (const c of BUILTIN_CARDS) if (c.tag) tags.add(c.tag)
  return [...tags]
}

function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDay(d)
}

/** 按「太簡單」：直接放到最熟的盒子，很久以後才會再出現 */
export function masteredProgress(cardId: string): CardProgress {
  return { card_id: cardId, box: MAX_BOX, due_on: addDays(INTERVAL_DAYS[MAX_BOX]), reviewed_at: new Date().toISOString() }
}

export function nextProgress(cardId: string, prev: CardProgress | undefined, knew: boolean): CardProgress {
  const box = knew ? Math.min((prev?.box ?? 0) + 1, MAX_BOX) : 0
  return { card_id: cardId, box, due_on: addDays(knew ? INTERVAL_DAYS[box] : 0), reviewed_at: new Date().toISOString() }
}

/** 到期要複習的卡（看過但到期了） */
export function dueCards(cards: Card[], progress: Record<string, CardProgress>) {
  const today = localDay()
  return cards
    .filter((c) => progress[c.id] && progress[c.id].due_on <= today)
    .sort((a, b) => progress[a.id].due_on.localeCompare(progress[b.id].due_on))
}

/**
 * 還沒學過的卡。順序：自己加的 → 選的程度 → 更難的 → 更簡單的。
 * 簡單的排最後，是因為覺得太簡單時會把程度往上調。
 */
export function newCards(cards: Card[], progress: Record<string, CardProgress>, level: Level) {
  const target = LEVELS.indexOf(level)
  const rank = (c: Card) => {
    if (!c.level) return -1
    const d = LEVELS.indexOf(c.level) - target
    return d >= 0 ? d : 10 - d
  }
  return cards.filter((c) => !progress[c.id]).sort((a, b) => rank(a) - rank(b))
}

/** 一輪複習：先到期的舊卡，再補最多 NEW_PER_SESSION 張新卡 */
export function buildCardSession(cards: Card[], progress: Record<string, CardProgress>, level: Level) {
  return [...dueCards(cards, progress), ...newCards(cards, progress, level).slice(0, NEW_PER_SESSION)]
}
