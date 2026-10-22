// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  // 個人用練習站：純前端 SPA，部署到 Vercel 靜態即可
  ssr: false,

  modules: ['@nuxtjs/tailwindcss'],

  // 用 cssPath 指定入口，不要塞進 css: []，否則模組會再注入一份預設 Tailwind
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: 'TCF Prep',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#FFF8EF' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' },
        // Huninn（粉圓體）：中文字體，與 emily_gm / SugarTopia 同一套
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Huninn&display=swap' },
      ],
    },
  },
})
