import type { GrammarNote } from '~/types'
import notes from '~/data/notes.json'

export const GRAMMAR_NOTES = notes as GrammarNote[]
const BY_ID = new Map(GRAMMAR_NOTES.map((n) => [n.id, n]))

export function getGrammarNote(id: string) {
  return BY_ID.get(id)
}
