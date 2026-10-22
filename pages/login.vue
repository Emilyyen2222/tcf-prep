<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'

const { $supabase } = useNuxtApp()
const sb = $supabase as SupabaseClient | null
const session = useState<any>('sb-session')

const email = ref('')
const sent = ref(false)
const busy = ref(false)
const err = ref<string | null>(null)

async function send() {
  if (!sb || !email.value) return
  busy.value = true
  err.value = null
  const { error } = await sb.auth.signInWithOtp({
    email: email.value.trim(),
    options: { emailRedirectTo: window.location.origin },
  })
  busy.value = false
  if (error) err.value = error.message
  else sent.value = true
}

async function logout() {
  await sb?.auth.signOut()
  await navigateTo('/')
}

useHead({ title: '登入 · TCF Prep' })
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-h1 font-bold">帳號</h1>

    <div v-if="!sb" class="rounded-2xl border border-brand-border bg-white p-4">
      <p class="text-body">還沒有設定 Supabase，目前紀錄存在這個瀏覽器裡。</p>
      <p class="mt-2 text-caption text-brand-brown-light">
        在專案根目錄建立 .env，填入 NUXT_PUBLIC_SUPABASE_URL 和 NUXT_PUBLIC_SUPABASE_ANON_KEY 後重開 dev server。詳見 README。
      </p>
    </div>

    <div v-else-if="session" class="rounded-2xl border border-brand-border bg-white p-4">
      <p class="text-body">已登入：<b>{{ session.user.email }}</b></p>
      <p class="mt-1 text-caption text-brand-brown-light">作答紀錄會同步到雲端，手機和電腦都看得到。</p>
      <button
        type="button"
        class="mt-4 h-12 w-full rounded-xl border-2 border-brand-border bg-white text-body font-bold"
        @click="logout"
      >
        登出
      </button>
    </div>

    <form v-else class="rounded-2xl border border-brand-border bg-white p-4" @submit.prevent="send">
      <p class="text-body text-brand-brown-light">
        輸入 email，會收到一封登入連結信，點了就登入，不用密碼。這台瀏覽器已經做過的題目，登入後會自動搬到雲端。
      </p>
      <label class="mt-4 block">
        <span class="mb-1 block text-caption text-brand-brown-light">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
          class="h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 focus:border-brand-orange focus:outline-none"
        />
      </label>
      <button
        type="submit"
        class="mt-4 h-12 w-full rounded-xl bg-brand-orange text-body font-bold text-white transition active:bg-brand-orange-dark disabled:opacity-50"
        :disabled="busy || sent"
      >
        {{ sent ? '已寄出，請去信箱收信' : busy ? '寄送中…' : '寄送登入連結' }}
      </button>
      <p v-if="err" class="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-body text-red-700">{{ err }}</p>
    </form>
  </div>
</template>
