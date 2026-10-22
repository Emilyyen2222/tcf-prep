<script setup lang="ts">
const route = useRoute()
const { notes, saveNote } = useNotebook()

const id = computed(() => (route.query.id as string | undefined) || undefined)
const title = ref('')
const body = ref('')
const preview = ref(false)
const saving = ref(false)

// 編輯舊筆記：資料載入後填進表單（重新整理頁面時資料會晚一點到）
const filled = ref(false)
watchEffect(() => {
  if (filled.value || !id.value) return
  const n = notes.value.find((x) => x.id === id.value)
  if (n) {
    title.value = n.title
    body.value = n.body
    filled.value = true
  }
})

async function save() {
  if (!title.value.trim()) return
  saving.value = true
  const saved = await saveNote({ id: id.value, title: title.value.trim(), body: body.value })
  saving.value = false
  navigateTo(`/notes/${saved}`, { replace: true })
}

const placeholder = `直接打字就可以，也可以用這些格式：

## 標題
- 清單項目
> 提醒、重點
| 人稱 | 變位 |
| je | suis |
**粗體**`

useHead({ title: () => `${id.value ? '編輯' : '寫'}筆記 · TCF Prep` })
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <div class="flex items-center justify-between">
      <NuxtLink :to="id ? `/notes/${id}` : '/notes'" class="text-body text-brand-brown-light">取消</NuxtLink>
      <button
        type="submit"
        class="h-10 rounded-xl bg-brand-orange px-5 text-body font-bold text-white transition active:bg-brand-orange-dark disabled:opacity-50"
        :disabled="!title.trim() || saving"
      >
        儲存
      </button>
    </div>

    <input
      v-model="title"
      type="text"
      required
      placeholder="標題，例如 Unit 14：se 動詞的過去式"
      class="h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 font-bold text-brand-brown outline-none focus:border-brand-orange"
    />

    <div class="flex gap-1 rounded-xl border border-brand-border bg-white p-1">
      <button
        v-for="[v, label] in [[false, '編輯'], [true, '預覽']] as const"
        :key="label"
        type="button"
        class="flex-1 rounded-lg py-2 text-body font-medium"
        :class="preview === v ? 'bg-brand-orange text-white' : 'text-brand-brown-light'"
        @click="preview = v"
      >
        {{ label }}
      </button>
    </div>

    <textarea
      v-if="!preview"
      v-model="body"
      rows="16"
      :placeholder="placeholder"
      class="w-full rounded-xl border-2 border-brand-border bg-white p-3 text-brand-brown outline-none focus:border-brand-orange"
    />
    <div v-else class="min-h-48 rounded-xl border border-brand-border bg-white p-4">
      <NoteBody v-if="body.trim()" :body="body" />
      <p v-else class="text-body text-brand-brown-light">還沒有內容。</p>
    </div>
  </form>
</template>
