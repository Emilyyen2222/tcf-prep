<script setup lang="ts">
import { getGrammarNote } from '~/composables/useNotes'

const route = useRoute()
const id = computed(() => route.params.id as string)
const { notes, removeNote } = useNotebook()

const grammar = computed(() => getGrammarNote(id.value))
const mine = computed(() => notes.value.find((n) => n.id === id.value))
const title = computed(() => grammar.value?.title ?? mine.value?.title ?? '筆記')

async function remove() {
  if (!mine.value || !confirm(`確定要刪除「${mine.value.title}」嗎？`)) return
  await removeNote(mine.value.id)
  navigateTo('/notes')
}

useHead({ title: () => `${title.value} · TCF Prep` })
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/notes" class="inline-flex min-h-10 items-center gap-1 text-body text-brand-brown-light">
      <ChevronIcon left />
      所有筆記
    </NuxtLink>

    <article v-if="grammar" class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <span class="rounded-full border border-brand-border px-3 py-0.5 text-caption font-bold text-brand-brown-light">
        {{ grammar.level }}
      </span>
      <h1 class="mt-2 text-h2 font-bold">{{ grammar.title }}</h1>
      <NoteBody class="mt-3" :body="grammar.body" />
    </article>

    <article v-else-if="mine" class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <h1 class="text-h2 font-bold">{{ mine.title }}</h1>
        <NuxtLink :to="`/notes/edit?id=${mine.id}`" class="shrink-0 text-body font-bold text-brand-orange underline">編輯</NuxtLink>
      </div>
      <NoteBody class="mt-3" :body="mine.body" />
      <button type="button" class="mt-6 text-small text-red-600 underline" @click="remove">刪除這篇筆記</button>
    </article>

    <div v-else class="rounded-2xl border border-brand-border bg-white p-8 text-center text-body text-brand-brown-light">
      找不到這篇筆記。
    </div>
  </div>
</template>
