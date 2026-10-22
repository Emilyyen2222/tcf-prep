/**
 * Express Entry CRS 估算（只算單身、沒有配偶一起申請的情況）。
 * 規則照 IRCC 官方 CRS 表（2026-10 查），職缺加分 2025-03 已取消所以不算。
 * IRCC 改規則時要更新這裡；正式分數以 IRCC 的 CRS 計算機為準。
 */

export type Ability = 'listening' | 'reading' | 'writing' | 'speaking'
export const ABILITIES: Ability[] = ['listening', 'reading', 'writing', 'speaking']
export const ABILITY_LABEL: Record<Ability, string> = { listening: '聽', reading: '讀', writing: '寫', speaking: '說' }

export type Education = 'none' | 'secondary' | 'one-year' | 'two-year' | 'bachelor' | 'two-or-more' | 'master' | 'phd'
export const EDUCATION_LABEL: Record<Education, string> = {
  none: '高中以下',
  secondary: '高中',
  'one-year': '一年制專科',
  'two-year': '二年制專科',
  bachelor: '學士（三年以上）',
  'two-or-more': '兩個以上學位（其中一個三年以上）',
  master: '碩士',
  phd: '博士',
}

export interface CrsProfile {
  /** YYYY-MM-DD */
  birthDate: string
  education: Education
  /** 海外（加拿大以外）專業工作年資，最近 10 年內 */
  foreignWorkYears: number
  /** 加拿大專業工作年資 */
  canadianWorkYears: number
  /** 英文 CLB（IELTS General / CELPIP / PTE Core 換算），0 = 沒有成績 */
  english: Record<Ability, number>
}

export const EMPTY_PROFILE: CrsProfile = {
  birthDate: '',
  education: 'bachelor',
  foreignWorkYears: 0,
  canadianWorkYears: 0,
  english: { listening: 7, reading: 7, writing: 7, speaking: 7 },
}

/** 最近一次法語類別抽籤。抽籤分數線每次都不同，有新的就更新這裡 */
export const LATEST_FRENCH_DRAW = { date: '2026-10-16', cutoff: 435 }

// TCF Canada 分數 → NCLC（IRCC 語言測驗對照表）。聽讀 0–699，寫說 0–20。
// 每列是該 NCLC 等級的最低分，由高到低。
const TCF_TO_NCLC: Record<Ability, [number, number][]> = {
  listening: [[549, 10], [523, 9], [503, 8], [458, 7], [398, 6], [369, 5], [331, 4]],
  reading: [[549, 10], [524, 9], [499, 8], [453, 7], [406, 6], [375, 5], [342, 4]],
  writing: [[16, 10], [14, 9], [12, 8], [10, 7], [7, 6], [6, 5], [4, 4]],
  speaking: [[16, 10], [14, 9], [12, 8], [10, 7], [7, 6], [6, 5], [4, 4]],
}

export function tcfToNclc(ability: Ability, score: number) {
  for (const [min, level] of TCF_TO_NCLC[ability]) if (score >= min) return level
  return 0
}

/** 要到某個 NCLC 等級，TCF Canada 至少要幾分 */
export function tcfMinFor(ability: Ability, level: number) {
  return TCF_TO_NCLC[ability].find(([, l]) => l === level)?.[0] ?? null
}

export function ageOn(birthDate: string, on = new Date()) {
  const b = new Date(`${birthDate}T00:00:00`)
  let age = on.getFullYear() - b.getFullYear()
  const m = on.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) age--
  return age
}

export function agePoints(age: number) {
  if (age < 18 || age >= 45) return 0
  if (age >= 20 && age <= 29) return 110
  const table: Record<number, number> = {
    18: 99, 19: 105, 30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55,
    40: 50, 41: 39, 42: 28, 43: 17, 44: 6,
  }
  return table[age]
}

const EDUCATION_POINTS: Record<Education, number> = {
  none: 0, secondary: 30, 'one-year': 90, 'two-year': 98, bachelor: 120, 'two-or-more': 128, master: 135, phd: 150,
}

function firstLanguagePoints(clb: number) {
  if (clb >= 10) return 34
  return ({ 9: 31, 8: 23, 7: 17, 6: 9, 5: 6, 4: 6 } as Record<number, number>)[clb] ?? 0
}

function secondLanguagePoints(clb: number) {
  if (clb >= 9) return 6
  if (clb >= 7) return 3
  if (clb >= 5) return 1
  return 0
}

function canadianWorkPoints(years: number) {
  return [0, 40, 53, 64, 72, 80][Math.min(years, 5)]
}

const minOf = (levels: Record<Ability, number>) => Math.min(...ABILITIES.map((a) => levels[a]))

export interface CrsBreakdown {
  total: number
  age: number
  education: number
  firstLanguage: number
  secondLanguage: number
  canadianWork: number
  transferability: number
  frenchBonus: number
  /** 第一官方語言是英文還是法文（取分數高的那個） */
  first: 'english' | 'french'
  /** 法文四項都到 NCLC 7，可以參加法語類別抽籤 */
  frenchDrawEligible: boolean
}

export function calcCrs(p: CrsProfile, french: Record<Ability, number>, on = new Date()): CrsBreakdown {
  const age = p.birthDate ? agePoints(ageOn(p.birthDate, on)) : 0
  const education = EDUCATION_POINTS[p.education]
  const canadianWork = canadianWorkPoints(p.canadianWorkYears)

  // 第一、第二官方語言可以自己選，取總分高的那個
  const options = (['english', 'french'] as const).map((first) => {
    const a = first === 'english' ? p.english : french
    const b = first === 'english' ? french : p.english
    const firstLanguage = ABILITIES.reduce((s, k) => s + firstLanguagePoints(a[k]), 0)
    const secondLanguage = Math.min(24, ABILITIES.reduce((s, k) => s + secondLanguagePoints(b[k]), 0))

    // 技能轉移：都用第一官方語言「四項最低」的等級判斷
    const lang = minOf(a)
    const langTier = lang >= 9 ? 2 : lang >= 7 ? 1 : 0
    const cwTier = p.canadianWorkYears >= 2 ? 2 : p.canadianWorkYears >= 1 ? 1 : 0
    const strongEdu = ['two-or-more', 'master', 'phd'].includes(p.education)
    const someEdu = ['one-year', 'two-year', 'bachelor'].includes(p.education)
    const eduStep = strongEdu ? [0, 25, 50] : someEdu ? [0, 13, 25] : [0, 0, 0]
    const eduPart = Math.min(50, eduStep[langTier] + eduStep[cwTier])
    const fw = p.foreignWorkYears >= 3 ? [0, 25, 50] : p.foreignWorkYears >= 1 ? [0, 13, 25] : [0, 0, 0]
    const fwPart = Math.min(50, fw[langTier] + fw[cwTier])
    const transferability = Math.min(100, eduPart + fwPart)

    return { first, firstLanguage, secondLanguage, transferability }
  })
  const best = options.reduce((x, y) =>
    x.firstLanguage + x.secondLanguage + x.transferability >= y.firstLanguage + y.secondLanguage + y.transferability ? x : y,
  )

  const frenchDrawEligible = minOf(french) >= 7
  const frenchBonus = frenchDrawEligible ? (minOf(p.english) >= 5 ? 50 : 25) : 0

  const total = age + education + canadianWork + best.firstLanguage + best.secondLanguage + best.transferability + frenchBonus
  return { total, age, education, canadianWork, ...best, frenchBonus, frenchDrawEligible }
}
