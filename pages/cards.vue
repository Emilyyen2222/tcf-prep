<script setup lang="ts">
import type { Card } from '~/types'
import { MAX_BOX, allCards, buildCardSession, cardTags, dueCards, newCards, nextProgress } from '~/composables/useCards'

const { cards: userCards, progress, setProgress, removeCard } = useNotebook()
const { supported, speak } = useSpeech()

const tag = ref<string | null>(null)
const reverse = ref(false)
const tags = computed(() => cardTags(userCards.value))
const pool = computed(() => allCards(userCards.value).filter((c) => !tag.value || c.tag === tag.value))
const dueCount = computed(() => dueCards(pool.value, progress.value).length)
const newCount = computed(() => newCards(pool.value, progress.value).length)
const masteredCount = computed(() => pool.value.filter((c) => (progress.value[c.id]?.box ?? 0) >= MAX_BOX - 1).length)

// 複習中
const queue = ref<Card[]>([])
const index = ref(0)
const flipped = ref(false)
const knewCount = ref(0)
const missCount = ref(0)
const inSession = computed(() => queue.value.length > 0)
const current = computed(() => queue.value[index.value])
const finished = computed(() => inSession.value && index.value >= queue.value.length)

function start() {
  queue.value = buildCardSession(pool.value, progress.value)
  index.value = 0
  flipped.value = false
  knewCount.value = 0
  missCount.value = 0
  if (!reverse.value) sayCurrent()
}

function stopSession() {
  queue.value = []
}

function sayCurrent() {
  if (current.value && supported) speak(current.value.fr.replace(/\(.*?\)/g, ''))
}

function flip() {
  flipped.value = true
  if (reverse.value) sayCurrent()
}

async function answer(knew: boolean) {
  const card = current.value
  if (knew) knewCount.value++
  else {
    missCount.value++
    queue.value = [...queue.value, card] // 不會的這輪最後再出一次
  }
  await setProgress(nextProgress(card.id, progress.value[card.id], knew))
  index.value++
  flipped.value = false
  if (!reverse.value) sayCurrent()
}

const showAdd = ref(false)
const showMine = ref(false)

async function remove(c: Card) {
  if (confirm(`確定要刪除「${c.fr}」嗎？`)) await removeCard(c.id)
}

useHead({ title: '單字卡 · TCF Prep' })
</script>

<template>
  <!-- 複習中 -->
  <div v-if="inSession" class="space-y-4">
    <div class="flex items-center gap-3">
      <button type="button" class="grid h-9 w-9 place-items-center rounded-full text-h3 text-brand-brown-light" aria-label="結束複習" @click="stopSession">✕</button>
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-brand-panel">
        <div class="h-full rounded-full bg-brand-orange transition-all" :style="{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }" />
      </div>
      <span class="text-caption text-brand-brown-light">{{ Math.min(index + 1, queue.length) }} / {{ queue.length }}</span>
    </div>

    <div v-if="finished" class="space-y-4 rounded-2xl border border-brand-border bg-white p-6 text-center shadow-sm">
      <p class="text-h2 font-bold">這輪完成了！</p>
      <p class="text-body text-brand-brown-light">會 {{ knewCount }} 次 · 不會 {{ missCount }} 次</p>
      <p class="text-body text-brand-brown-light">答「會」的卡會隔幾天再出現，越熟隔越久。</p>
      <button
        v-if="newCount"
        type="button"
        class="h-12 w-full rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark"
        @click="start"
      >
        再學 {{ Math.min(newCount, 10) }} 張新卡
      </button>
      <button type="button" class="h-12 w-full rounded-xl border-2 border-brand-border bg-white text-body font-bold" @click="stopSession">回單字卡</button>
    </div>

    <template v-else-if="current">
      <button
        type="button"
        class="flex min-h-72 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-brand-border bg-white p-6 text-center shadow-sm"
        @click="flipped ? null : flip()"
      >
        <span class="rounded-full bg-brand-hover px-3 py-0.5 text-caption font-bold text-brand-orange">{{ current.tag }}</span>
        <p v-if="!reverse || flipped" class="text-h2 font-bold" lang="fr">{{ current.fr }}</p>
        <p v-if="reverse || flipped" :class="reverse && !flipped ? 'text-h2 font-bold' : 'text-h3 text-brand-brown'">{{ current.zh }}</p>
        <p v-if="flipped && current.note" class="text-body text-brand-brown-light">{{ current.note }}</p>
        <p v-if="!flipped" class="mt-4 text-caption text-brand-brown-light">想一下，再點卡片看答案</p>
      </button>

      <button
        v-if="supported && (!reverse || flipped)"
        type="button"
        class="mx-auto flex h-10 items-center gap-2 rounded-full border-2 border-brand-border bg-white px-4 text-small font-bold"
        @click="sayCurrent"
      >
        🔊 再聽一次
      </button>

      <div v-if="flipped" class="grid grid-cols-2 gap-3">
        <button type="button" class="h-14 rounded-xl border-2 border-red-200 bg-red-50 text-body-lg font-bold text-red-700" @click="answer(false)">
          不會
        </button>
        <button type="button" class="h-14 rounded-xl border-2 border-green-200 bg-green-50 text-body-lg font-bold text-brand-green" @click="answer(true)">
          會
        </button>
      </div>
      <button
        v-else
        type="button"
        class="h-14 w-full rounded-xl bg-brand-brown text-body-lg font-bold text-white transition active:bg-brand-brown-hover"
        @click="flip"
      >
        看答案
      </button>
    </template>
  </div>

  <!-- 首頁 -->
  <div v-else class="space-y-5">
    <h1 class="text-h1 font-bold">單字卡</h1>

    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        v-for="t in [null, ...tags]"
        :key="t ?? 'all'"
        type="button"
        class="h-9 shrink-0 rounded-full border-2 px-4 text-small font-bold"
        :class="tag === t ? 'border-brand-orange bg-brand-orange text-white' : 'border-brand-border bg-white text-brand-brown-light'"
        @click="tag = t"
      >
        {{ t ?? '全部' }}
      </button>
    </div>

    <section class="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <p class="text-h2 font-bold text-brand-orange">{{ dueCount }}</p>
          <p class="text-caption text-brand-brown-light">要複習</p>
        </div>
        <div>
          <p class="text-h2 font-bold">{{ newCount }}</p>
          <p class="text-caption text-brand-brown-light">還沒學</p>
        </div>
        <div>
          <p class="text-h2 font-bold text-brand-green">{{ masteredCount }}</p>
          <p class="text-caption text-brand-brown-light">很熟了</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-4 h-12 w-full rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark disabled:opacity-50"
        :disabled="!dueCount && !newCount"
        @click="start"
      >
        {{ dueCount || newCount ? `開始（${dueCount + Math.min(newCount, 10)} 張）` : '今天都複習完了 🎉' }}
      </button>
      <label class="mt-3 flex items-center gap-2 text-body text-brand-brown-light">
        <input v-model="reverse" type="checkbox" class="h-5 w-5 accent-brand-orange" />
        看中文想法文（比較難）
      </label>
    </section>

    <section class="rounded-2xl border border-brand-border bg-white p-4">
      <button type="button" class="flex w-full items-center justify-between text-left" :aria-expanded="showAdd" @click="showAdd = !showAdd">
        <span class="text-h3 font-bold">＋ 新增單字</span>
        <span class="text-brand-brown-light">{{ showAdd ? '−' : '+' }}</span>
      </button>
      <AddCardForm v-if="showAdd" class="mt-3" />
    </section>

    <section v-if="userCards.length" class="rounded-2xl border border-brand-border bg-white p-4">
      <button type="button" class="flex w-full items-center justify-between text-left" :aria-expanded="showMine" @click="showMine = !showMine">
        <span class="text-h3 font-bold">我加的單字（{{ userCards.length }}）</span>
        <span class="text-brand-brown-light">{{ showMine ? '−' : '+' }}</span>
      </button>
      <ul v-if="showMine" class="mt-3 divide-y divide-brand-border">
        <li v-for="c in userCards" :key="c.id" class="flex items-start justify-between gap-3 py-2.5">
          <div>
            <p class="text-body font-bold" lang="fr">{{ c.fr }}</p>
            <p class="text-small text-brand-brown-light">{{ c.zh }}<template v-if="c.note"> · {{ c.note }}</template></p>
          </div>
          <button type="button" class="shrink-0 text-small text-red-600 underline" @click="remove(c)">刪除</button>
        </li>
      </ul>
    </section>
  </div>
</template>
