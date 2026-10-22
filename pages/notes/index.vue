<script setup lang="ts">
import type { Level } from '~/types'
import { GRAMMAR_NOTES } from '~/composables/useNotes'

const { notes } = useNotebook()
const query = ref('')

const match = (s: string) => s.toLowerCase().includes(query.value.trim().toLowerCase())
const mine = computed(() => notes.value.filter((n) => match(n.title) || match(n.body)))
const grouped = computed(() => {
  const out = new Map<Level, typeof GRAMMAR_NOTES>()
  for (const n of GRAMMAR_NOTES) {
    if (!match(n.title) && !match(n.body)) continue
    out.set(n.level, [...(out.get(n.level) ?? []), n])
  }
  return [...out.entries()]
})

const fmt = (iso: string) => new Date(iso).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })

useHead({ title: '筆記 · TCF Prep' })
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-baseline justify-between">
      <h1 class="text-h1 font-bold">筆記</h1>
      <NuxtLink to="/notes/edit" class="text-body font-bold text-brand-orange underline">＋ 寫筆記</NuxtLink>
    </header>

    <input
      v-model="query"
      type="text"
      placeholder="搜尋，例如 avoir、冠詞、過去式"
      class="h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 text-brand-brown outline-none focus:border-brand-orange"
    />

    <section>
      <h2 class="mb-2 text-h3 font-bold">我的筆記</h2>
      <div
        v-if="!notes.length"
        class="rounded-2xl border border-dashed border-brand-border bg-white p-5 text-center text-body text-brand-brown-light"
      >
        還沒有自己的筆記。上課、看 Podcast 學到的東西，可以按「＋ 寫筆記」記下來。
      </div>
      <p v-else-if="!mine.length" class="text-body text-brand-brown-light">沒有符合的筆記。</p>
      <div v-else class="space-y-2">
        <NuxtLink
          v-for="n in mine"
          :key="n.id"
          :to="`/notes/${n.id}`"
          class="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3"
        >
          <span class="text-body font-bold">{{ n.title }}</span>
          <span class="shrink-0 text-caption text-brand-brown-light">{{ fmt(n.updated_at) }}</span>
        </NuxtLink>
      </div>
    </section>

    <section v-for="[level, list] in grouped" :key="level">
      <h2 class="mb-2 text-h3 font-bold">文法筆記 · {{ level }}</h2>
      <div class="space-y-2">
        <NuxtLink
          v-for="n in list"
          :key="n.id"
          :to="`/notes/${n.id}`"
          class="flex min-h-12 items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3"
        >
          <span class="text-body font-bold">{{ n.title }}</span>
          <ChevronIcon class="text-brand-orange" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
