import type { Attempt, Question, Skill } from '~/types'
import grammar from '~/data/questions/grammar.json'
import reading from '~/data/questions/reading.json'
import listening from '~/data/questions/listening.json'

export const ALL_QUESTIONS = [...(grammar as Question[]), ...(reading as Question[]), ...(listening as Question[])]
const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))

export function getQuestion(id: string) {
  return BY_ID.get(id)
}

/** 依瀏覽器所在時區取 YYYY-MM-DD */
export function localDay(iso: string | Date = new Date()) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('sv-SE')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 每題最後一次作答 */
export function latestByQuestion(attempts: Attempt[]) {
  const map = new Map<string, Attempt>()
  for (const a of attempts) {
    const prev = map.get(a.question_id)
    if (!prev || prev.created_at <= a.created_at) map.set(a.question_id, a)
  }
  return map
}

/** 錯題：最後一次作答是錯的題目（再答對就會自動畢業） */
export function wrongQuestions(attempts: Attempt[]) {
  const latest = latestByQuestion(attempts)
  return [...latest.values()]
    .filter((a) => !a.correct)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((a) => getQuestion(a.question_id))
    .filter((q): q is Question => !!q)
}

/** 連續練習天數（今天還沒練不算斷，從昨天往回算） */
export function streak(attempts: Attempt[]) {
  const days = new Set(attempts.map((a) => localDay(a.created_at)))
  const cursor = new Date()
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1)
  let n = 0
  while (days.has(localDay(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return n
}

export function accuracyBySkill(attempts: Attempt[]) {
  const out: Record<Skill, { total: number; correct: number }> = {
    grammar: { total: 0, correct: 0 },
    reading: { total: 0, correct: 0 },
    listening: { total: 0, correct: 0 },
  }
  for (const a of attempts) {
    const q = getQuestion(a.question_id)
    if (!q) continue
    out[q.skill].total++
    if (a.correct) out[q.skill].correct++
  }
  return out
}

/** 最近 14 天每天作答題數 */
export function dailyCounts(attempts: Attempt[], days = 14) {
  const counts = new Map<string, number>()
  for (const a of attempts) {
    const d = localDay(a.created_at)
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  const out: { day: string; count: number }[] = []
  const c = new Date()
  c.setDate(c.getDate() - (days - 1))
  for (let i = 0; i < days; i++) {
    const d = localDay(c)
    out.push({ day: d, count: counts.get(d) ?? 0 })
    c.setDate(c.getDate() + 1)
  }
  return out
}

/**
 * 每日練習：10 題，大約 4 文法 / 3 閱讀 / 3 聽力。
 * 先放最多 3 題錯題複習，其餘優先沒做過的題，再來是最久沒碰的題。
 */
export function buildDailySet(attempts: Attempt[], size = 10): Question[] {
  const latest = latestByQuestion(attempts)
  const wrong = shuffle(wrongQuestions(attempts)).slice(0, 3)
  const picked = new Set(wrong.map((q) => q.id))
  const quota: Record<Skill, number> = { grammar: 4, reading: 3, listening: 3 }
  for (const q of wrong) quota[q.skill] = Math.max(0, quota[q.skill] - 1)

  const rank = (q: Question) => {
    const a = latest.get(q.id)
    return a ? a.created_at : '' // 沒做過的排最前面
  }

  const result: Question[] = [...wrong]
  for (const skill of ['grammar', 'reading', 'listening'] as Skill[]) {
    const pool = shuffle(ALL_QUESTIONS.filter((q) => q.skill === skill && !picked.has(q.id))).sort((a, b) =>
      rank(a).localeCompare(rank(b)),
    )
    for (const q of pool.slice(0, quota[skill])) {
      result.push(q)
      picked.add(q.id)
    }
  }
  // 題庫某類不夠時，用其他題補滿
  if (result.length < size) {
    const rest = shuffle(ALL_QUESTIONS.filter((q) => !picked.has(q.id))).sort((a, b) => rank(a).localeCompare(rank(b)))
    result.push(...rest.slice(0, size - result.length))
  }
  // 閱讀、聽力放後面，先用文法暖身
  const order: Record<Skill, number> = { grammar: 0, reading: 1, listening: 2 }
  return result.slice(0, size).sort((a, b) => order[a.skill] - order[b.skill])
}

export function buildSkillSet(attempts: Attempt[], skill: Skill, size = 10): Question[] {
  const latest = latestByQuestion(attempts)
  const rank = (q: Question) => latest.get(q.id)?.created_at ?? ''
  return shuffle(ALL_QUESTIONS.filter((q) => q.skill === skill))
    .sort((a, b) => rank(a).localeCompare(rank(b)))
    .slice(0, size)
}
