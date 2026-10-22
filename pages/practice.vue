<script setup lang="ts">
import type { Question, Skill } from '~/types'
import { SKILL_LABEL } from '~/types'
import { buildDailySet, buildSkillSet, wrongQuestions } from '~/composables/useBank'

const route = useRoute()
const { attempts, addAttempt } = useStore()
const level = useLevel()
const loadedFor = useState<string | null>('store-loaded-for')

const mode = computed(() => (route.query.mode as string) || 'daily')
const skill = computed(() => route.query.skill as Skill | undefined)

const title = computed(() => {
  if (mode.value === 'wrong') return '錯題複習'
  if (mode.value === 'skill' && skill.value) return `${SKILL_LABEL[skill.value]}練習`
  return '今日練習'
})

const set = ref<Question[]>([])
const index = ref(0)
const results = ref<boolean[]>([])
const answeredCurrent = ref(false)

function build() {
  if (mode.value === 'wrong') set.value = wrongQuestions(attempts.value).slice(0, 10)
  else if (mode.value === 'skill' && skill.value) set.value = buildSkillSet(attempts.value, skill.value, level.value)
  else set.value = buildDailySet(attempts.value, level.value)
  index.value = 0
  results.value = []
  answeredCurrent.value = false
}

// 等資料載入後才出題（才知道哪些做過、哪些錯過）
watch(
  loadedFor,
  (v) => {
    if (v !== null && set.value.length === 0) build()
  },
  { immediate: true },
)

const current = computed(() => set.value[index.value])
const done = computed(() => set.value.length > 0 && index.value >= set.value.length)
const score = computed(() => results.value.filter(Boolean).length)
const progressPct = computed(() =>
  set.value.length ? (Math.min(index.value + (answeredCurrent.value ? 1 : 0), set.value.length) / set.value.length) * 100 : 0,
)

async function onAnswered(chosen: number, correct: boolean) {
  answeredCurrent.value = true
  results.value.push(correct)
  await addAttempt(current.value.id, chosen, correct)
}

function next() {
  index.value++
  answeredCurrent.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

useHead({ title: () => `${title.value} · TCF Prep` })
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="grid h-9 w-9 place-items-center rounded-full text-h3 text-brand-muted" aria-label="離開練習">✕</NuxtLink>
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-brand-panel">
        <div class="h-full rounded-full bg-brand-primary transition-all duration-300" :style="{ width: `${progressPct}%` }" />
      </div>
      <span class="w-12 text-right text-small tabular-nums text-brand-muted">
        {{ Math.min(index + 1, set.length) }}/{{ set.length }}
      </span>
    </div>

    <p v-if="loadedFor === null" class="text-body text-brand-muted">載入中…</p>

    <div v-else-if="set.length === 0" class="rounded-2xl border border-brand-border bg-white p-6 text-center">
      <p class="text-h3 font-bold">{{ mode === 'wrong' ? '錯題本是空的 🎉' : '沒有題目' }}</p>
      <p class="mt-1 text-body text-brand-muted">{{ mode === 'wrong' ? '目前沒有待複習的錯題。' : '題庫裡還沒有這類題目。' }}</p>
      <NuxtLink to="/" class="mt-4 inline-block text-body font-medium text-brand-accent underline">回首頁</NuxtLink>
    </div>

    <template v-else-if="!done && current">
      <QuestionCard :question="current" @answered="onAnswered" />
      <div
        v-if="answeredCurrent"
        class="fixed inset-x-0 bottom-0 border-t border-brand-border bg-brand-bg/95 p-4 backdrop-blur"
        style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))"
      >
        <button
          type="button"
          class="mx-auto block h-12 w-full max-w-lg rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark"
          @click="next"
        >
          {{ index + 1 < set.length ? '下一題 →' : '看結果' }}
        </button>
      </div>
      <div v-if="answeredCurrent" class="h-20" />
    </template>

    <div v-else-if="done" class="rounded-2xl border border-brand-border bg-white p-6 text-center shadow-sm">
      <p class="text-body text-brand-muted">{{ title }}完成</p>
      <p class="mt-2 text-h1 font-bold">
        <span class="text-brand-accent">{{ score }}</span>
        <span class="text-h2 text-brand-muted"> / {{ set.length }}</span>
      </p>
      <p class="mt-2 text-body">
        {{
          score === set.length
            ? 'Parfait ! 全對！'
            : score / set.length >= 0.7
              ? 'Très bien ! 錯的題目已收進錯題本。'
              : '錯的題目已收進錯題本，之後會再出現。'
        }}
      </p>
      <div class="mt-5 flex gap-2">
        <NuxtLink to="/" class="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-brand-border bg-white text-body font-bold">
          回首頁
        </NuxtLink>
        <button
          type="button"
          class="h-12 flex-1 rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark"
          @click="build"
        >
          再來一組
        </button>
      </div>
    </div>
  </div>
</template>
