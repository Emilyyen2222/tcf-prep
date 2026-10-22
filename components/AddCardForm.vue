<script setup lang="ts">
const emit = defineEmits<{ saved: [] }>()
const { addCard } = useNotebook()

const fr = ref('')
const zh = ref('')
const note = ref('')
const justSaved = ref('')

async function save() {
  if (!fr.value.trim() || !zh.value.trim()) return
  await addCard({ fr: fr.value.trim(), zh: zh.value.trim(), note: note.value.trim() || null })
  justSaved.value = fr.value.trim()
  fr.value = ''
  zh.value = ''
  note.value = ''
  emit('saved')
}

const inputClass =
  'h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 text-brand-ink outline-none focus:border-brand-accent'
</script>

<template>
  <form class="space-y-2" @submit.prevent="save">
    <input v-model="fr" type="text" required placeholder="法文，例如 la boulangerie" :class="inputClass" lang="fr" autocapitalize="off" />
    <input v-model="zh" type="text" required placeholder="中文意思" :class="inputClass" />
    <input v-model="note" type="text" placeholder="備註、例句（可不填）" :class="inputClass" />
    <div class="flex items-center gap-3">
      <button
        type="submit"
        class="h-12 rounded-xl bg-brand-primary px-6 text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark disabled:opacity-50"
        :disabled="!fr.trim() || !zh.trim()"
      >
        加入單字卡
      </button>
      <p v-if="justSaved" class="text-caption font-bold text-brand-green">已加入「{{ justSaved }}」</p>
    </div>
  </form>
</template>
