<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'

const { $supabase } = useNuxtApp()
const sb = $supabase as SupabaseClient | null
const session = useState<any>('sb-session')

// 用 email + 密碼登入，不用信件連結：iPhone 主畫面 App 和 Safari 的登入狀態是分開的，
// 點信裡的連結只會登入 Safari。而 Supabase 免費方案沒設 SMTP 不能改信件內容，也加不了驗證碼。
const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const busy = ref(false)
const err = ref<string | null>(null)
const info = ref<string | null>(null)

function messageFor(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Email 或密碼不對。'
  if (/email not confirmed/i.test(msg)) return '這個帳號還沒確認 email，請先去信箱點確認連結（在 Safari 打開沒關係），再回來登入。'
  if (/already registered/i.test(msg)) return '這個 email 已經有帳號了，請直接登入。'
  if (/at least 6/i.test(msg)) return '密碼至少要 6 個字。'
  if (/signups not allowed/i.test(msg)) return '目前不開放建立新帳號。'
  return msg
}

async function submit() {
  if (!sb) return
  busy.value = true
  err.value = null
  info.value = null
  const creds = { email: email.value.trim(), password: password.value }
  if (mode.value === 'login') {
    const { error } = await sb.auth.signInWithPassword(creds)
    busy.value = false
    if (error) err.value = messageFor(error.message)
    else await navigateTo('/')
    return
  }
  const { data, error } = await sb.auth.signUp(creds)
  busy.value = false
  if (error) err.value = messageFor(error.message)
  else if (data.session) await navigateTo('/')
  else {
    // Supabase 開著「確認 email」時，要先點信裡的確認連結
    info.value = '帳號建立好了。去信箱點確認連結（在 Safari 打開沒關係），再回到這裡登入。'
    mode.value = 'login'
  }
}

async function logout() {
  await sb?.auth.signOut()
  await navigateTo('/')
}

const inputClass = 'h-12 w-full rounded-xl border-2 border-brand-border bg-white px-3 focus:border-brand-accent focus:outline-none'

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

    <form v-else class="rounded-2xl border border-brand-border bg-white p-4" @submit.prevent="submit">
      <p class="text-body text-brand-muted">
        {{ mode === 'login' ? '用 email 和密碼登入。' : '第一次使用，建立一個帳號。' }}
        這台裝置上的作答紀錄、筆記、單字卡進度，登入後會自動搬到雲端。
      </p>
      <label class="mt-4 block">
        <span class="mb-1 block text-caption text-brand-muted">Email</span>
        <input v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" :class="inputClass" />
      </label>
      <label class="mt-3 block">
        <span class="mb-1 block text-caption text-brand-muted">密碼{{ mode === 'signup' ? '（至少 6 個字）' : '' }}</span>
        <input
          v-model="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          required
          minlength="6"
          :class="inputClass"
        />
      </label>
      <button
        type="submit"
        class="mt-4 h-12 w-full rounded-xl bg-brand-primary text-body font-bold text-brand-on-primary transition active:bg-brand-primary-dark disabled:opacity-50"
        :disabled="busy"
      >
        {{ busy ? '請稍等…' : mode === 'login' ? '登入' : '建立帳號' }}
      </button>
      <button
        type="button"
        class="mt-3 w-full text-small text-brand-muted underline"
        @click="mode = mode === 'login' ? 'signup' : 'login'; err = null; info = null"
      >
        {{ mode === 'login' ? '還沒有帳號？建立帳號' : '已經有帳號了？登入' }}
      </button>
      <p v-if="info" class="mt-3 rounded-xl border-2 border-green-200 bg-green-50 p-3 text-body text-brand-green">{{ info }}</p>
      <p v-if="err" class="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-body text-red-700">{{ err }}</p>
    </form>
  </div>
</template>
