<script setup lang="ts">
import type { Question } from '~/types'
import { SKILL_LABEL } from '~/types'

const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ answered: [chosen: number, correct: boolean] }>()

const { supported, speaking, speak, stop } = useSpeech()

// 選項每次隨機排序，避免記位置；回報的 index 仍是題庫裡的原始 index
const order = ref<number[]>([])
const chosen = ref<number | null>(null)
const plays = ref(0)
const slow = ref(false)

function reset() {
  const idx = props.question.options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  order.value = idx
  chosen.value = null
  plays.value = 0
  stop()
}
watch(() => props.question.id, reset, { immediate: true })

const answered = computed(() => chosen.value !== null)
const isCorrect = computed(() => chosen.value === props.question.answer)

function play() {
  if (!props.question.audio) return
  plays.value++
  speak(props.question.audio, slow.value ? 0.7 : 0.9)
}

function pick(i: number) {
  if (answered.value) return
  chosen.value = i
  stop()
  emit('answered', i, i === props.question.answer)
}

function optClass(i: number) {
  if (!answered.value) return 'border-brand-border bg-white active:bg-brand-hover'
  if (i === props.question.answer) return 'border-brand-green bg-green-50'
  if (i === chosen.value) return 'border-red-300 bg-red-50'
  return 'border-brand-border bg-white opacity-50'
}
function letterClass(i: number) {
  if (answered.value && i === props.question.answer) return 'bg-brand-green text-white'
  if (answered.value && i === chosen.value) return 'bg-red-500 text-white'
  return 'bg-brand-hover text-brand-orange'
}
const letters = ['A', 'B', 'C', 'D', 'E']
</script>

<template>
  <article class="space-y-4 rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-full bg-brand-hover px-3 py-0.5 text-caption font-bold text-brand-orange">
        {{ SKILL_LABEL[question.skill] }}
      </span>
      <span class="rounded-full border border-brand-border px-3 py-0.5 text-caption font-bold text-brand-brown-light">
        {{ question.level }}
      </span>
      <span class="text-caption text-brand-brown-light">{{ question.topic }}</span>
    </div>

    <div
      v-if="question.passage"
      class="whitespace-pre-line rounded-xl border-2 border-brand-gold bg-brand-cream p-4 text-body-lg"
    >
      {{ question.passage }}
    </div>

    <div v-if="question.audio" class="rounded-xl border-2 border-brand-gold bg-brand-cream p-4">
      <template v-if="supported">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="h-12 flex-1 rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark"
            @click="speaking ? stop() : play()"
          >
            {{ speaking ? '■ 停止' : plays ? '↻ 再聽一次' : '▶ 播放音檔' }}
          </button>
          <button
            type="button"
            class="h-12 rounded-xl border-2 px-4 text-body font-medium transition"
            :class="slow ? 'border-brand-orange bg-brand-orange text-white' : 'border-brand-border bg-white text-brand-brown-light'"
            @click="slow = !slow"
          >
            慢速
          </button>
        </div>
        <p class="mt-2 text-caption text-brand-brown-light">已播放 {{ plays }} 次 · 正式考試每段只放一次</p>
      </template>
      <p v-else class="text-body text-brand-brown-light">這個瀏覽器不支援語音朗讀，請改用 Safari 或 Chrome。</p>
    </div>

    <p class="text-body-lg font-bold">{{ question.prompt }}</p>

    <div class="space-y-2">
      <button
        v-for="(oi, pos) in order"
        :key="oi"
        type="button"
        class="flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-body transition"
        :class="optClass(oi)"
        :disabled="answered"
        @click="pick(oi)"
      >
        <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-small font-bold" :class="letterClass(oi)">
          {{ letters[pos] }}
        </span>
        <span>{{ question.options[oi] }}</span>
      </button>
    </div>

    <div
      v-if="answered"
      class="rounded-xl border-2 p-4"
      :class="isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
    >
      <p class="text-body font-bold" :class="isCorrect ? 'text-brand-green' : 'text-red-700'">
        {{ isCorrect ? '答對了！' : '答錯了，已收進錯題本' }}
      </p>
      <p class="mt-1 text-body text-brand-brown">{{ question.explanation }}</p>
      <div v-if="question.audio" class="mt-3 border-t border-brand-border pt-3">
        <p class="text-caption font-bold text-brand-brown-light">聽力文字稿</p>
        <p class="mt-1 text-body text-brand-brown">{{ question.audio }}</p>
      </div>
    </div>
  </article>
</template>
