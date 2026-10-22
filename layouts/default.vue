<script setup lang="ts">
const { mode, load, error } = useStore()
const { load: loadNotebook } = useNotebook()
const session = useState<any>('sb-session')
const { $supabase } = useNuxtApp()
const route = useRoute()

watch(
  () => session.value?.user?.id ?? null,
  () => {
    load()
    loadNotebook()
  },
  { immediate: true },
)

const tabs = [
  { to: '/', label: '首頁' },
  { to: '/cards', label: '單字' },
  { to: '/notes', label: '筆記' },
  { to: '/wrong', label: '錯題' },
  { to: '/progress', label: '進度' },
]
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
// 頁面可以設 focus-mode 暫時收起下方選單（例如單字卡複習中）
const focusMode = useState<boolean>('focus-mode', () => false)
const showTabs = computed(
  () => !focusMode.value && !route.path.startsWith('/practice') && !route.path.startsWith('/notes/edit'),
)
</script>

<template>
  <div class="min-h-screen bg-brand-bg text-brand-ink" :class="showTabs ? 'pb-28' : 'pb-10'">
    <header
      class="sticky top-0 z-10 border-b border-brand-border bg-brand-bg/95 backdrop-blur"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/favicon.svg" alt="" class="h-8 w-8" />
          <span class="text-h3 font-bold">TCF Prep</span>
        </NuxtLink>
        <template v-if="$supabase">
          <NuxtLink v-if="mode === 'cloud'" to="/login" class="text-caption font-bold text-brand-green">● 已同步</NuxtLink>
          <NuxtLink v-else to="/login" class="text-body font-medium text-brand-accent underline">登入同步</NuxtLink>
        </template>
        <span v-else class="text-caption font-bold text-brand-muted" title="尚未設定 Supabase，紀錄存在這個瀏覽器">
          ● 本機紀錄
        </span>
      </div>
    </header>

    <div v-if="error" class="mx-auto max-w-lg px-4 pt-4">
      <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-body text-red-700">資料同步出錯：{{ error }}</div>
    </div>

    <main class="mx-auto max-w-lg px-4 pt-6">
      <slot />
    </main>

    <nav
      v-if="showTabs"
      class="fixed inset-x-0 bottom-0 border-t border-brand-border bg-brand-bg/95 px-4 pt-3 backdrop-blur"
      style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
      aria-label="主選單"
    >
      <div class="mx-auto flex max-w-lg gap-1 rounded-2xl border border-brand-border bg-white p-1">
        <NuxtLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="flex-1 rounded-xl py-2.5 text-center text-body font-medium transition"
          :class="isActive(t.to) ? 'bg-brand-primary text-brand-on-primary' : 'text-brand-muted'"
        >
          {{ t.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
