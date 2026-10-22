<script setup lang="ts">
import { SKILL_LABEL, type Skill } from '~/types'
import { ALL_QUESTIONS, accuracyBySkill, localDay, streak, wrongQuestions } from '~/composables/useBank'

const { attempts } = useStore()

const todayCount = computed(() => attempts.value.filter((a) => localDay(a.created_at) === localDay()).length)
const days = computed(() => streak(attempts.value))
const wrongCount = computed(() => wrongQuestions(attempts.value).length)
const acc = computed(() => accuracyBySkill(attempts.value))
const counts = computed(() => {
  const c: Record<Skill, number> = { grammar: 0, reading: 0, listening: 0 }
  for (const q of ALL_QUESTIONS) c[q.skill]++
  return c
})
const skills: Skill[] = ['grammar', 'reading', 'listening']
const pct = (s: Skill) => {
  const a = acc.value[s]
  return a.total ? `${Math.round((a.correct / a.total) * 100)}%` : '—'
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <p class="text-body text-brand-brown-light">{{ greeting }}, Emily</p>
      <h1 class="text-h1 font-bold">{{ todayCount ? `今天練了 ${todayCount} 題` : '今天還沒練習' }}</h1>
    </header>

    <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold text-brand-orange">{{ days }}</p>
          <p class="text-caption text-brand-brown-light">連續天數</p>
        </div>
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold">{{ attempts.length }}</p>
          <p class="text-caption text-brand-brown-light">累積作答</p>
        </div>
        <div class="rounded-xl bg-brand-hover p-3">
          <p class="text-h2 font-bold" :class="wrongCount ? 'text-red-600' : ''">{{ wrongCount }}</p>
          <p class="text-caption text-brand-brown-light">待複習錯題</p>
        </div>
      </div>
      <NuxtLink
        to="/practice?mode=daily"
        class="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark"
      >
        開始今日練習 · 10 題
      </NuxtLink>
      <p class="mt-2 text-center text-caption text-brand-brown-light">文法暖身 → 閱讀 → 聽力，會自動混入之前答錯的題目</p>
    </section>

    <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-h3 font-bold">單項練習</h2>
      <div class="space-y-2">
        <NuxtLink
          v-for="s in skills"
          :key="s"
          :to="`/practice?mode=skill&skill=${s}`"
          class="flex min-h-12 items-center justify-between rounded-xl border-2 border-brand-border px-4 py-2.5 transition active:bg-brand-hover"
        >
          <span class="text-body font-bold">{{ SKILL_LABEL[s] }}</span>
          <span class="text-caption text-brand-brown-light">{{ counts[s] }} 題 · 正確率 {{ pct(s) }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="wrongCount"
          to="/practice?mode=wrong"
          class="flex min-h-12 items-center justify-between rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5"
        >
          <span class="text-body font-bold text-red-700">複習錯題（{{ wrongCount }}）</span>
          <span class="text-caption text-red-700">再答對就畢業</span>
        </NuxtLink>
      </div>
    </section>

    <section class="rounded-2xl border border-brand-panel bg-brand-hover p-4">
      <h2 class="text-h3 font-bold">官方模擬考</h2>
      <p class="mt-1 text-body text-brand-brown-light">
        每 1～2 個月到 TV5MONDE 做一次免費模擬考（題目由 TCF 主辦單位設計），做完把分數記回來，追蹤真實程度。
      </p>
      <div class="mt-3 flex gap-2">
        <a
          href="https://apprendre.tv5monde.com/tcf"
          target="_blank"
          rel="noopener"
          class="flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-brown text-body font-bold text-white transition active:bg-brand-brown-hover"
        >
          前往 TV5MONDE ↗
        </a>
        <NuxtLink
          to="/progress#mock"
          class="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-brand-border bg-white text-body font-bold"
        >
          記錄分數
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
