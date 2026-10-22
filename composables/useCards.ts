import type { Card, CardProgress, UserCard } from '~/types'
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

export function newCards(cards: Card[], progress: Record<string, CardProgress>) {
  return cards.filter((c) => !progress[c.id])
}

/** 一輪複習：先到期的舊卡，再補最多 NEW_PER_SESSION 張新卡 */
export function buildCardSession(cards: Card[], progress: Record<string, CardProgress>) {
  return [...dueCards(cards, progress), ...newCards(cards, progress).slice(0, NEW_PER_SESSION)]
}
