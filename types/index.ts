export type Skill = 'reading' | 'grammar' | 'listening'
export type Level = 'A1' | 'A2' | 'B1' | 'B2'
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2']

export interface Question {
  /** 唯一 id，例如 gr-a2-001。上線後不要改，作答紀錄靠它對應 */
  id: string
  skill: Skill
  level: Level
  /** 主題標籤，例如 passé composé、日常購物 */
  topic: string
  /** 閱讀題的文章 / 告示 */
  passage?: string
  /** 聽力題要朗讀的法文（作答後才顯示文字稿） */
  audio?: string
  /** 題目 */
  prompt: string
  options: string[]
  /** 正確選項的 index（0 起算） */
  answer: number
  /** 中文解析 */
  explanation: string
  /** 相關文法筆記的 id（data/notes.json） */
  note?: string
}

export interface Attempt {
  question_id: string
  chosen: number
  correct: boolean
  created_at: string
}

export type MockSection = 'CO' | 'CE' | 'EE' | 'EO' | 'full'

export interface MockScore {
  id: string
  taken_on: string
  source: string
  section: MockSection
  score: number
  note: string | null
  created_at: string
}

export const SKILL_LABEL: Record<Skill, string> = {
  reading: '閱讀',
  grammar: '文法單字',
  listening: '聽力',
}

/** 內建文法筆記（data/notes.json），body 用簡易格式，見 utils/renderNote.ts */
export interface GrammarNote {
  id: string
  level: Level
  title: string
  body: string
}

/** 自己寫的筆記 */
export interface UserNote {
  id: string
  title: string
  body: string
  created_at: string
  updated_at: string
}

/** 單字卡：內建的在 data/vocab.json（id 開頭 v-），自己加的存在資料庫 */
export interface Card {
  id: string
  fr: string
  zh: string
  note?: string | null
  tag?: string
  /** 內建單字才有；自己加的沒有等級 */
  level?: Level
}

export interface UserCard extends Card {
  created_at: string
}

/** 單字卡複習進度：box 越高代表越熟，due_on 是下次該複習的日期 */
export interface CardProgress {
  card_id: string
  box: number
  due_on: string
  reviewed_at: string
}
