<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'

const { $supabase } = useNuxtApp()
const sb = $supabase as SupabaseClient | null
const session = useState<any>('sb-session')

const email = ref('')
const code = ref('')
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

// 主畫面 App 和 Safari 的登入狀態是分開的，點信裡的連結只會登入 Safari，
// 所以也讓她在 App 裡直接輸入信裡的驗證碼
async function verify() {
  if (!sb || !code.value) return
  busy.value = true
  err.value = null
  const { error } = await sb.auth.verifyOtp({ email: email.value.trim(), token: code.value.trim(), type: 'email' })
  busy.value = false
  if (error) err.value = '驗證碼不對或已過期，請再寄一次。'
  else await navigateTo('/')
}

function restart() {
  sent.value = false
  code.value = ''
  err.value = null
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
      <p class="mt-2 text-caption text-brand-muted">
        在專案根目錄建立 .env，填入 NUXT_PUBLIC_SUPABASE_URL 和 NUXT_PUBLIC_SUPABASE_ANON_KEY 後重開 dev server。詳見 README。
      </p>
    </div>

    <div v-else-if="session" class="rounded-2xl border border-brand-border bg-white p-4">
      <p class="text-body">已登入：<b>{{ session.user.email }}</b></p>
      <p class="mt-1 text-caption text-brand-muted">作答紀錄、筆記、單字卡進度會同步到雲端，手機和電腦都看得到。</p>
      <button
        type="button"
        class="mt-4 h-12 w-full rounded-xl border-2 border-brand-border bg-white text-body font-bold"
        @click="logout"
      >
        登出
      </button>
    </div>

    <form v-else-if="sent" class="rounded-2xl border border-brand-border bg-white p-4" @submit.prevent="verify">
      <p class="text-body">已寄到 <b>{{ email }}</b>。</p>
      <p class="mt-1 text-body text-brand-muted">把信裡的驗證碼輸入在這裡。用手機主畫面打開的話，請用驗證碼登入，不要點信裡的連結（連結會在 Safari 登入，不是這裡）。</p>
      <label class="mt-4 block">
        <span class="mb-1 block text-caption text-brand-muted">驗證碼</span>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]*"
          maxlength="10"
          required
          placeholder="123456"
          class="h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 text-h3 tracking-[0.3em] focus:border-brand-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        class="mt-4 h-12 w-full rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark disabled:opacity-50"
        :disabled="busy || !code.trim()"
      >
        {{ busy ? '登入中…' : '登入' }}
      </button>
      <button type="button" class="mt-3 w-full text-small text-brand-muted underline" @click="restart">沒收到？換個 email 或重寄</button>
      <p v-if="err" class="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-body text-red-700">{{ err }}</p>
    </form>

    <form v-else class="rounded-2xl border border-brand-border bg-white p-4" @submit.prevent="send">
      <p class="text-body text-brand-muted">
        輸入 email，會收到一封有驗證碼的信，輸入驗證碼就登入，不用密碼。這台裝置上的作答紀錄、筆記、單字卡進度，登入後會自動搬到雲端。
      </p>
      <label class="mt-4 block">
        <span class="mb-1 block text-caption text-brand-muted">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
          class="h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 focus:border-brand-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        class="mt-4 h-12 w-full rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark disabled:opacity-50"
        :disabled="busy"
      >
        {{ busy ? '寄送中…' : '寄送驗證碼' }}
      </button>
      <p v-if="err" class="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-body text-red-700">{{ err }}</p>
    </form>
  </div>
</template>
