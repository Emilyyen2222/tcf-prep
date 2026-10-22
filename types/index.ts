export type Skill = 'reading' | 'grammar' | 'listening'
export type Level = 'A2' | 'B1' | 'B2'

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
