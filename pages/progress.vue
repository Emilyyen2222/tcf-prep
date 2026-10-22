<script setup lang="ts">
import { SKILL_LABEL, type MockSection, type Skill } from '~/types'
import { accuracyBySkill, dailyCounts, localDay, streak } from '~/composables/useBank'

const { attempts, mocks, addMock, removeMock } = useStore()

const days = computed(() => dailyCounts(attempts.value, 14))
const maxDay = computed(() => Math.max(5, ...days.value.map((d) => d.count)))
const acc = computed(() => accuracyBySkill(attempts.value))
const skills: Skill[] = ['grammar', 'reading', 'listening']
const totalDays = computed(() => new Set(attempts.value.map((a) => localDay(a.created_at))).size)

const SECTION_LABEL: Record<MockSection, string> = {
  CO: '聽力 CO',
  CE: '閱讀 CE',
  EE: '寫作 EE',
  EO: '口說 EO',
  full: '全卷',
}
// IRCC 官方對照：TCF Canada 達到 NCLC 7 的最低分
const NCLC7: Partial<Record<MockSection, string>> = {
  CO: '458 / 699',
  CE: '453 / 699',
  EE: '10 / 20',
  EO: '10 / 20',
}

const form = reactive({
  taken_on: localDay(),
  source: 'TV5MONDE',
  section: 'CO' as MockSection,
  score: '' as string | number,
  note: '',
})
const saving = ref(false)

async function save() {
  if (form.score === '' || Number.isNaN(Number(form.score))) return
  saving.value = true
  await addMock({
    taken_on: form.taken_on,
    source: form.source.trim() || 'TV5MONDE',
    section: form.section,
    score: Number(form.score),
    note: form.note.trim() || null,
  })
  form.score = ''
  form.note = ''
  saving.value = false
}

const sortedMocks = computed(() => [...mocks.value].sort((a, b) => b.taken_on.localeCompare(a.taken_on)))
const inputClass = 'h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 text-brand-brown focus:border-brand-orange focus:outline-none'

useHead({ title: '進度 · TCF Prep' })
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-h1 font-bold">進度</h1>

    <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold text-brand-orange">{{ streak(attempts) }}</p>
          <p class="text-caption text-brand-brown-light">連續天數</p>
        </div>
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold">{{ totalDays }}</p>
          <p class="text-caption text-brand-brown-light">練習天數</p>
        </div>
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold">{{ attempts.length }}</p>
          <p class="text-caption text-brand-brown-light">累積作答</p>
        </div>
      </div>

      <h2 class="mb-3 mt-5 text-h3 font-bold">最近 14 天</h2>
      <div class="grid h-28 items-end gap-1" style="grid-template-columns: repeat(14, minmax(0, 1fr))" role="img" aria-label="最近 14 天每天作答題數">
        <div v-for="d in days" :key="d.day" class="flex h-full flex-col items-center justify-end gap-1" :title="`${d.day}：${d.count} 題`">
          <div
            class="w-full rounded-t"
            :class="d.count ? 'bg-brand-orange' : 'bg-brand-panel'"
            :style="{ height: d.count ? `${(d.count / maxDay) * 100}%` : '3px' }"
          />
          <span class="text-[10px] text-brand-brown-light">{{ Number(d.day.slice(8)) }}</span>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-h3 font-bold">各題型正確率</h2>
      <div class="space-y-3">
        <div v-for="s in skills" :key="s">
          <div class="mb-1 flex justify-between text-body">
            <span>{{ SKILL_LABEL[s] }}</span>
            <span class="text-brand-brown-light">
              {{ acc[s].total ? `${Math.round((acc[s].correct / acc[s].total) * 100)}%` : '—' }}
              <span class="text-caption">（{{ acc[s].correct }}/{{ acc[s].total }}）</span>
            </span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-brand-panel">
            <div
              class="h-full rounded-full bg-brand-green"
              :style="{ width: acc[s].total ? `${(acc[s].correct / acc[s].total) * 100}%` : '0%' }"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="mock" class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h2 class="text-h3 font-bold">官方模擬考紀錄</h2>
      <p class="mt-0.5 text-caption text-brand-brown-light">
        在 <a href="https://apprendre.tv5monde.com/fr/tcf/simulation-du-tcf" target="_blank" rel="noopener" class="text-brand-orange underline">TV5MONDE</a>
        或其他模擬考做完後，把分數記在這裡。
      </p>

      <form class="mt-4 grid grid-cols-2 gap-3" @submit.prevent="save">
        <label class="block">
          <span class="mb-1 block text-caption text-brand-brown-light">日期</span>
          <input v-model="form.taken_on" type="date" required :class="inputClass" />
        </label>
        <label class="block">
          <span class="mb-1 block text-caption text-brand-brown-light">項目</span>
          <select v-model="form.section" :class="inputClass">
            <option v-for="(l, k) in SECTION_LABEL" :key="k" :value="k">{{ l }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-caption text-brand-brown-light">分數</span>
          <input v-model="form.score" type="number" step="any" inputmode="decimal" required placeholder="例如 412" :class="inputClass" />
        </label>
        <label class="block">
          <span class="mb-1 block text-caption text-brand-brown-light">來源</span>
          <input v-model="form.source" type="text" :class="inputClass" />
        </label>
        <label class="col-span-2 block">
          <span class="mb-1 block text-caption text-brand-brown-light">備註（選填）</span>
          <input v-model="form.note" type="text" placeholder="例如：聽力後半段跟不上" :class="inputClass" />
        </label>
        <button
          type="submit"
          class="col-span-2 h-12 rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark disabled:opacity-50"
          :disabled="saving || form.score === ''"
        >
          記錄
        </button>
      </form>

      <div v-if="NCLC7[form.section]" class="mt-3 rounded-xl border-2 border-brand-gold bg-brand-cream p-3 text-small">
        移民目標 NCLC 7：TCF Canada {{ SECTION_LABEL[form.section] }} 至少 <b>{{ NCLC7[form.section] }}</b>
      </div>

      <ul v-if="sortedMocks.length" class="mt-3 divide-y divide-brand-border border-t border-brand-border">
        <li v-for="m in sortedMocks" :key="m.id" class="flex items-start justify-between gap-2 py-3">
          <div>
            <p class="text-body font-bold">{{ SECTION_LABEL[m.section] }} · {{ m.score }}</p>
            <p class="text-caption text-brand-brown-light">{{ m.taken_on }} · {{ m.source }}</p>
            <p v-if="m.note" class="mt-0.5 text-caption text-brand-brown-light">{{ m.note }}</p>
          </div>
          <button type="button" class="px-2 text-brand-brown-light" aria-label="刪除這筆紀錄" @click="removeMock(m.id)">✕</button>
        </li>
      </ul>
      <p v-else class="mt-3 text-caption text-brand-brown-light">還沒有紀錄。</p>
    </section>
  </div>
</template>
