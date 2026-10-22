<script setup lang="ts">
import type { MockScore, MockSection } from '~/types'
import {
  ABILITIES,
  ABILITY_LABEL,
  EDUCATION_LABEL,
  LATEST_FRENCH_DRAW,
  ageOn,
  agePoints,
  calcCrs,
  tcfMinFor,
  tcfToNclc,
  type Ability,
  type CrsProfile,
  type Education,
} from '~/utils/crs'

const props = defineProps<{ mocks: MockScore[] }>()
const { profile, save } = useCrsProfile()

const SECTION_OF: Record<Ability, MockSection> = { listening: 'CO', reading: 'CE', writing: 'EE', speaking: 'EO' }

// 法文：每一項用最新一次模擬考成績
const latest = computed(() => {
  const out = {} as Record<Ability, MockScore | undefined>
  for (const a of ABILITIES) {
    out[a] = props.mocks
      .filter((m) => m.section === SECTION_OF[a])
      .sort((x, y) => y.taken_on.localeCompare(x.taken_on) || y.created_at.localeCompare(x.created_at))[0]
  }
  return out
})
const french = computed(() => {
  const out = {} as Record<Ability, number>
  for (const a of ABILITIES) out[a] = latest.value[a] ? tcfToNclc(a, latest.value[a]!.score) : 0
  return out
})
const hasFrench = computed(() => ABILITIES.some((a) => latest.value[a]))
const ready = computed(() => !!profile.value.birthDate)

const now = computed(() => calcCrs(profile.value, french.value))
const atNclc7 = computed(() =>
  calcCrs(profile.value, Object.fromEntries(ABILITIES.map((a) => [a, Math.max(7, french.value[a])])) as Record<Ability, number>),
)
const gap = computed(() => atNclc7.value.total - LATEST_FRENCH_DRAW.cutoff)

// 下次生日年齡分會掉多少
const nextBirthday = computed(() => {
  if (!ready.value) return null
  const age = ageOn(profile.value.birthDate)
  const drop = agePoints(age) - agePoints(age + 1)
  if (drop <= 0) return null
  const [, m, d] = profile.value.birthDate.split('-')
  const today = new Date()
  let next = new Date(`${today.getFullYear()}-${m}-${d}T00:00:00`)
  if (next <= today) next = new Date(`${today.getFullYear() + 1}-${m}-${d}T00:00:00`)
  return { date: next.toLocaleDateString('zh-TW'), age: age + 1, drop }
})

const rows = computed(() => [
  ['年齡', now.value.age],
  ['學歷', now.value.education],
  [`第一官方語言（${now.value.first === 'english' ? '英文' : '法文'}）`, now.value.firstLanguage],
  [`第二官方語言（${now.value.first === 'english' ? '法文' : '英文'}）`, now.value.secondLanguage],
  ['加拿大工作經驗', now.value.canadianWork],
  ['技能轉移（學歷、海外年資 × 語言）', now.value.transferability],
  ['法文額外加分', now.value.frenchBonus],
])

// 編輯條件
const editing = ref(false)
const draft = ref<CrsProfile>(structuredClone(toRaw(profile.value)))
const saving = ref(false)
const saveError = ref<string | null>(null)
watch(editing, (v) => {
  if (v) draft.value = JSON.parse(JSON.stringify(profile.value))
})
watch(ready, (v) => {
  if (!v) editing.value = true
}, { immediate: true })

async function submit() {
  saving.value = true
  saveError.value = null
  try {
    await save(JSON.parse(JSON.stringify(draft.value)))
    editing.value = false
  } catch (e: any) {
    saveError.value = e?.message ?? String(e)
  } finally {
    saving.value = false
  }
}

const educationOptions = Object.entries(EDUCATION_LABEL) as [Education, string][]
const clbOptions = [0, 4, 5, 6, 7, 8, 9, 10]
const inputClass = 'h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 text-brand-ink focus:border-brand-accent focus:outline-none'
</script>

<template>
  <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-h3 font-bold">移民分數（CRS 估算）</h2>
      <button v-if="ready && !editing" type="button" class="shrink-0 text-small font-bold text-brand-accent underline" @click="editing = true">
        我的條件
      </button>
    </div>

    <template v-if="ready && !editing">
      <div class="mt-3 grid grid-cols-2 gap-2">
        <div class="rounded-xl bg-brand-soft p-3">
          <p class="text-caption text-brand-muted">現在大約</p>
          <p class="text-h1 font-bold text-brand-accent">{{ now.total }}</p>
          <p class="text-caption text-brand-muted">{{ hasFrench ? '法文用最新模擬考成績' : '法文還沒有成績' }}</p>
        </div>
        <div class="rounded-xl bg-brand-soft p-3">
          <p class="text-caption text-brand-muted">法文四項都到 NCLC 7</p>
          <p class="text-h1 font-bold">{{ atNclc7.total }}</p>
          <p class="text-caption text-brand-muted">可以參加法語抽籤</p>
        </div>
      </div>

      <div
        class="mt-2 rounded-xl border-2 p-3 text-small"
        :class="now.frenchDrawEligible && now.total >= LATEST_FRENCH_DRAW.cutoff ? 'border-green-200 bg-green-50' : 'border-brand-peach bg-brand-bg'"
      >
        最近一次法語抽籤（{{ LATEST_FRENCH_DRAW.date }}）分數線 <b>{{ LATEST_FRENCH_DRAW.cutoff }}</b>。
        <template v-if="now.frenchDrawEligible">
          你現在{{ now.total >= LATEST_FRENCH_DRAW.cutoff ? '已經超過' : '還差' }}
          <b>{{ Math.abs(now.total - LATEST_FRENCH_DRAW.cutoff) }}</b> 分。
        </template>
        <template v-else>
          法文四項都到 NCLC 7 之後是 {{ atNclc7.total }} 分，{{ gap >= 0 ? '高出' : '還差' }}分數線 <b>{{ Math.abs(gap) }}</b> 分。
        </template>
        <span class="text-brand-muted">2026 年法語抽籤大約在 382～435 之間。</span>
      </div>

      <h3 class="mt-4 text-body font-bold">法文離 NCLC 7 還差多少</h3>
      <ul class="mt-1 divide-y divide-brand-border">
        <li v-for="a in ABILITIES" :key="a" class="flex items-center justify-between gap-3 py-2 text-body">
          <span class="w-8 font-bold">{{ ABILITY_LABEL[a] }}</span>
          <span class="flex-1 text-brand-muted">
            <template v-if="latest[a]">{{ latest[a]!.score }} 分 · NCLC {{ french[a] || '4 以下' }}</template>
            <template v-else>還沒有成績</template>
          </span>
          <span v-if="french[a] >= 7" class="font-bold text-brand-green">✓ 達標</span>
          <span v-else-if="latest[a]" class="text-small font-bold text-brand-accent">差 {{ tcfMinFor(a, 7)! - latest[a]!.score }} 分</span>
          <span v-else class="text-small text-brand-muted">目標 {{ tcfMinFor(a, 7) }}</span>
        </li>
      </ul>

      <p v-if="nextBirthday" class="mt-3 text-small text-brand-muted">
        ⏳ {{ nextBirthday.date }} 滿 {{ nextBirthday.age }} 歲，年齡分會少 {{ nextBirthday.drop }} 分。
      </p>

      <details class="mt-3 rounded-xl border border-brand-border p-3">
        <summary class="cursor-pointer text-small font-bold">分數明細</summary>
        <ul class="mt-2 space-y-1 text-small">
          <li v-for="[label, pts] in rows" :key="label" class="flex justify-between gap-3">
            <span class="text-brand-muted">{{ label }}</span>
            <span class="font-bold tabular-nums">{{ pts }}</span>
          </li>
        </ul>
      </details>

      <p class="mt-3 text-caption text-brand-muted">
        只估算單身申請。各項考到不同等級時分數會不同，正式分數請用
        <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html" target="_blank" rel="noopener" class="text-brand-accent underline">IRCC 官方計算機</a>
        確認。IRCC 正在討論修改 CRS（包括法文加分），規則改了要更新。
      </p>
    </template>

    <form v-else class="mt-3 space-y-3" @submit.prevent="submit">
      <p class="text-small text-brand-muted">填一次就好，登入後會存在你的帳號裡。</p>
      <label class="block">
        <span class="mb-1 block text-caption text-brand-muted">生日</span>
        <input v-model="draft.birthDate" type="date" required :class="inputClass" />
      </label>
      <label class="block">
        <span class="mb-1 block text-caption text-brand-muted">最高學歷（加拿大以外的學歷要做 ECA 認證）</span>
        <select v-model="draft.education" :class="inputClass">
          <option v-for="[k, l] in educationOptions" :key="k" :value="k">{{ l }}</option>
        </select>
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block min-w-0">
          <span class="mb-1 block text-caption text-brand-muted">海外工作年資</span>
          <select v-model.number="draft.foreignWorkYears" :class="inputClass">
            <option :value="0">沒有</option>
            <option :value="1">1 年</option>
            <option :value="2">2 年</option>
            <option :value="3">3 年以上</option>
          </select>
        </label>
        <label class="block min-w-0">
          <span class="mb-1 block text-caption text-brand-muted">加拿大工作年資</span>
          <select v-model.number="draft.canadianWorkYears" :class="inputClass">
            <option v-for="y in [0, 1, 2, 3, 4, 5]" :key="y" :value="y">{{ y === 0 ? '沒有' : y === 5 ? '5 年以上' : `${y} 年` }}</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend class="mb-1 text-caption text-brand-muted">英文 CLB（IELTS General / CELPIP / PTE Core；托福不算）</legend>
        <div class="grid grid-cols-4 gap-2">
          <label v-for="a in ABILITIES" :key="a" class="block min-w-0">
            <span class="mb-1 block text-center text-caption font-bold">{{ ABILITY_LABEL[a] }}</span>
            <select v-model.number="draft.english[a]" :class="[inputClass, 'px-1 text-center']">
              <option v-for="c in clbOptions" :key="c" :value="c">{{ c === 0 ? '無' : c === 10 ? '10+' : c }}</option>
            </select>
          </label>
        </div>
        <p class="mt-1 text-caption text-brand-muted">還沒考的話先填預估的程度。IELTS 每項 6.0 ≈ CLB 7；聽 8、讀寫說 7 ≈ CLB 9。</p>
      </fieldset>
      <div class="flex gap-2">
        <button
          type="submit"
          class="h-12 flex-1 rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark disabled:opacity-50"
          :disabled="saving || !draft.birthDate"
        >
          {{ saving ? '儲存中…' : '算分數' }}
        </button>
        <button v-if="ready" type="button" class="h-12 rounded-xl border-2 border-brand-border bg-white px-5 text-body font-bold" @click="editing = false">
          取消
        </button>
      </div>
      <p v-if="saveError" class="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-body text-red-700">{{ saveError }}</p>
    </form>
  </section>
</template>
