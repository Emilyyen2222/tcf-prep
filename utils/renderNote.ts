/**
 * 把筆記的簡易格式轉成 HTML。內建筆記和自己寫的筆記都用這個。
 * 先整段跳脫 HTML 再套格式，所以筆記裡打 <script> 也只會顯示成文字。
 *
 * 支援的格式（段落之間空一行）：
 *   ## 標題          ### 小標題
 *   - 項目清單
 *   > 提醒框
 *   | 表格 | 第一列是表頭 |   （|---| 分隔列可有可無）
 *   **粗體**
 */
function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(s: string) {
  return escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => inline(c.trim()))
}

function block(lines: string[]): string {
  const first = lines[0]
  if (lines.length === 1 && first.startsWith('### ')) return `<h4>${inline(first.slice(4))}</h4>`
  if (lines.length === 1 && first.startsWith('## ')) return `<h3>${inline(first.slice(3))}</h3>`
  if (lines.every((l) => l.startsWith('- '))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`
  if (lines.every((l) => l.startsWith('>'))) {
    return `<aside>${lines.map((l) => inline(l.replace(/^>\s?/, ''))).join('<br>')}</aside>`
  }
  if (lines.every((l) => l.trim().startsWith('|'))) {
    const rows = lines.filter((l) => !/^\|?[\s|:-]+\|?$/.test(l.trim()))
    const [head, ...body] = rows
    return (
      '<div class="note-table"><table>' +
      `<thead><tr>${cells(head).map((c) => `<th>${c}</th>`).join('')}</tr></thead>` +
      `<tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>` +
      '</table></div>'
    )
  }
  return `<p>${lines.map(inline).join('<br>')}</p>`
}

export function renderNote(src: string) {
  const out: string[] = []
  let buf: string[] = []
  const flush = () => {
    if (buf.length) out.push(block(buf))
    buf = []
  }
  for (const raw of src.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) flush()
    else if (/^#{2,3} /.test(line)) {
      // 標題自成一段，不用前後空行
      flush()
      out.push(block([line]))
    } else buf.push(line)
  }
  flush()
  return out.join('')
}
