<script setup lang="ts">
import { SKILL_LABEL } from '~/types'
import { latestByQuestion, wrongQuestions } from '~/composables/useBank'
import { getGrammarNote } from '~/composables/useNotes'

const { attempts } = useStore()
const list = computed(() => wrongQuestions(attempts.value))
const latest = computed(() => latestByQuestion(attempts.value))
const open = ref<string | null>(null)

useHead({ title: '錯題本 · TCF Prep' })
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-baseline justify-between">
      <h1 class="text-h1 font-bold">錯題本</h1>
      <NuxtLink v-if="list.length" to="/practice?mode=wrong" class="text-body font-medium text-brand-accent underline">全部重做</NuxtLink>
    </header>
    <p class="text-body text-brand-muted">最後一次答錯的題目會留在這裡，再答對一次就會自動移除。</p>

    <div v-if="!list.length" class="rounded-2xl border border-brand-border bg-white p-8 text-center text-body text-brand-muted">
      目前沒有錯題，繼續保持！
    </div>

    <article v-for="q in list" :key="q.id" class="rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        class="w-full p-4 text-left"
        :aria-expanded="open === q.id"
        @click="open = open === q.id ? null : q.id"
      >
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-brand-soft px-3 py-0.5 text-caption font-bold text-brand-accent">{{ SKILL_LABEL[q.skill] }}</span>
          <span class="text-caption text-brand-muted">{{ q.level }} · {{ q.topic }}</span>
          <span class="ml-auto text-brand-muted">{{ open === q.id ? '−' : '+' }}</span>
        </div>
        <p class="mt-2 text-body font-bold">{{ q.prompt }}</p>
      </button>
      <div v-if="open === q.id" class="space-y-3 border-t border-brand-border p-4">
        <p v-if="q.passage" class="whitespace-pre-line rounded-xl bg-brand-bg p-3 text-body">{{ q.passage }}</p>
        <p v-if="q.audio" class="rounded-xl bg-brand-bg p-3 text-body">🎧 {{ q.audio }}</p>
        <div class="text-body">
          <p>
            <span class="text-brand-muted">你選：</span>
            <span class="text-red-600 line-through">{{ q.options[latest.get(q.id)!.chosen] }}</span>
          </p>
          <p>
            <span class="text-brand-muted">正解：</span>
            <span class="font-bold text-brand-green">{{ q.options[q.answer] }}</span>
          </p>
        </div>
        <p class="text-body text-brand-muted">{{ q.explanation }}</p>
        <NuxtLink
          v-if="q.note && getGrammarNote(q.note)"
          :to="`/notes/${q.note}`"
          class="inline-block text-body font-bold text-brand-accent underline"
        >
          📘 看筆記：{{ getGrammarNote(q.note)!.title }}
        </NuxtLink>
      </div>
    </article>
  </div>
</template>
