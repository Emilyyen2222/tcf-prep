import type { Config } from 'tailwindcss'

/**
 * 色票、字級、字體沿用 emily_gm / SugarTopia 的同一套設計語言，
 * hex 值直接搬過來不重新調色，讓幾個 side project 視覺上是一家人。
 */
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F9A726', // 主色：按鈕、強調色
          'orange-dark': '#E89615', // 按鈕 hover / active
          gold: '#FCDC94', // 米金色，漸層與淺色強調
          brown: '#3A2513', // 主要文字顏色
          'brown-light': '#6F5B49', // 次要／說明文字
          'brown-hover': '#5A3B22', // 深色按鈕 hover
          cream: '#FFF8EF', // 頁面淺色背景
          border: '#EAD7BD', // 淺色邊框
          panel: '#F1E3C8', // 面板邊框
          hover: '#FEF6E4', // 選取／hover 底色
          avatar: '#FCE3A8',
          green: '#5A8F29', // 正向指標（答對、達標）
        },
      },
      // 8 級字級，與 emily_gm 一致：文字大小一律從這裡挑
      fontSize: {
        caption: ['12px', { lineHeight: '1.5', letterSpacing: '0.04em' }],
        small: ['13px', { lineHeight: '1.5' }],
        body: ['15px', { lineHeight: '1.7' }],
        'body-lg': ['17px', { lineHeight: '1.65' }],
        h3: ['20px', { lineHeight: '1.35' }],
        h2: ['26px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h1: ['36px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        display: ['clamp(26px, 3vw, 28px)', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
      },
      fontFamily: {
        sans: ['Poppins', 'Huninn', 'sans-serif'],
      },
    },
  },
}
