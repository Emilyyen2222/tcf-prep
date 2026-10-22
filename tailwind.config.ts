import type { Config } from 'tailwindcss'

/**
 * 「草莓牛奶」配色（2026-10 Emily 從配色提案裡選的）。
 * 顏色一律從這裡挑，名稱照用途取（primary、ink…），之後換配色只要改這裡的色碼。
 */
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F3A3B8', // 主要按鈕、選取中的分頁（淡草莓粉）
          'primary-dark': '#E88CA5', // 主要按鈕按下去
          'on-primary': '#5A1F33', // 主要按鈕上的字（淡粉底配白字太淡，改用深莓果色）
          accent: '#BF3F64', // 連結、強調文字、輸入框焦點（要在淺色底上讀得清楚，所以比 primary 深）
          ink: '#5A3540', // 主要文字、深色按鈕
          'ink-hover': '#482A33', // 深色按鈕按下去
          muted: '#7D5A64', // 次要／說明文字
          bg: '#FFF8F6', // 頁面背景（草莓牛奶的奶白）
          soft: '#FFEFF2', // 淺粉底：統計方塊、選取底色
          peach: '#FBDCCB', // 閱讀文章、聽力、筆記提醒框的邊框
          border: '#F3DCE2', // 淺色邊框
          panel: '#F8E4E9', // 進度條底、面板邊框
          green: '#2F7D55', // 正向指標（答對、達標）
        },
      },
      boxShadow: {
        // 卡片用淡粉色的柔和陰影，取代灰色陰影
        sm: '0 6px 18px rgba(232, 140, 165, 0.16)',
      },
      // 8 級字級：文字大小一律從這裡挑
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
        // 拉丁字母用圓圓的 Fredoka，中文用粉圓體 Huninn
        sans: ['Fredoka', 'Huninn', 'sans-serif'],
      },
    },
  },
}
