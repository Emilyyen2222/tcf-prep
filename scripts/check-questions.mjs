// 檢查題庫格式：npm run check:questions
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../data/questions/', import.meta.url).pathname
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
    if (!['A2', 'B1', 'B2'].includes(q.level)) errors.push(`${where}: level 不正確`)
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${where}: 需要 4 個選項`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) errors.push(`${where}: answer 超出範圍`)
    else dist[q.answer]++
    if (q.skill === 'listening' && !q.audio) errors.push(`${where}: 聽力題需要 audio`)
    if (q.skill === 'reading' && !q.passage) errors.push(`${where}: 閱讀題需要 passage`)
    if (new Set(q.options ?? []).size !== (q.options?.length ?? 0)) errors.push(`${where}: 選項重複`)
  }
}

console.log(`共 ${total} 題，正確答案分布 A/B/C/D = ${dist.join(' / ')}`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('✓ 題庫格式正確')
