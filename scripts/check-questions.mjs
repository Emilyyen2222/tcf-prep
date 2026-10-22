// 檢查題庫、文法筆記、單字卡格式：npm run check:questions
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../data/questions/', import.meta.url).pathname
const readData = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'))
const notes = readData('notes.json')
const vocab = readData('vocab.json')
const noteIds = new Set(notes.map((n) => n.id))
const ids = new Set()
const errors = []
const dist = [0, 0, 0, 0]
let total = 0

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const list = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  for (const q of list) {
    total++
    const where = `${file} ${q.id ?? '(no id)'}`
    for (const k of ['id', 'skill', 'level', 'topic', 'prompt', 'options', 'explanation']) {
      if (q[k] === undefined || q[k] === '') errors.push(`${where}: 缺少 ${k}`)
    }
    if (ids.has(q.id)) errors.push(`${where}: id 重複`)
    ids.add(q.id)
    if (!['reading', 'grammar', 'listening'].includes(q.skill)) errors.push(`${where}: skill 不正確`)
    if (!['A1', 'A2', 'B1', 'B2'].includes(q.level)) errors.push(`${where}: level 不正確`)
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${where}: 需要 4 個選項`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) errors.push(`${where}: answer 超出範圍`)
    else dist[q.answer]++
    if (q.skill === 'listening' && !q.audio) errors.push(`${where}: 聽力題需要 audio`)
    if (q.skill === 'reading' && !q.passage) errors.push(`${where}: 閱讀題需要 passage`)
    if (q.note !== undefined && !noteIds.has(q.note)) errors.push(`${where}: 找不到筆記 ${q.note}`)
    if (new Set(q.options ?? []).size !== (q.options?.length ?? 0)) errors.push(`${where}: 選項重複`)
  }
}

if (noteIds.size !== notes.length) errors.push('notes.json: id 重複')
for (const n of notes) {
  if (!n.id || !n.title || !n.body) errors.push(`notes.json ${n.id ?? '(no id)'}: 缺少 id / title / body`)
  if (!['A1', 'A2', 'B1', 'B2'].includes(n.level)) errors.push(`notes.json ${n.id}: level 不正確`)
}
const vocabIds = new Set()
for (const v of vocab) {
  if (!v.id?.startsWith('v-')) errors.push(`vocab.json ${v.id ?? '(no id)'}: id 要用 v- 開頭`)
  if (vocabIds.has(v.id)) errors.push(`vocab.json ${v.id}: id 重複`)
  vocabIds.add(v.id)
  if (!v.fr || !v.zh) errors.push(`vocab.json ${v.id}: 缺少 fr / zh`)
  if (!['A1', 'A2', 'B1', 'B2'].includes(v.level)) errors.push(`vocab.json ${v.id}: level 不正確`)
}

console.log(`筆記 ${notes.length} 篇，單字 ${vocab.length} 個`)
console.log(`共 ${total} 題，正確答案分布 A/B/C/D = ${dist.join(' / ')}`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('✓ 格式正確')
