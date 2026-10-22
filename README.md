# TCF Prep

個人用的 TCF Canada 法文練習網站。每天打開做 10 題，錯題自動收集，搭配 TV5MONDE 官方模擬考追蹤真實程度。

- **Nuxt 3**（SPA，`ssr: false`）+ **Tailwind CSS** + **Supabase**（登入、作答紀錄同步）
- 視覺是「草莓牛奶」配色：`brand-*` 色票照用途命名（primary、ink、muted…）、8 級字級、Fredoka + Huninn 字體，全部在 `tailwind.config.ts`
- 沒設定 Supabase 也能跑：紀錄會存在瀏覽器的 localStorage，登入後自動搬上雲端
- 題庫是依 TCF 題型自行撰寫的原創題，放在 `data/questions/*.json`

## 本機開發

```bash
npm install
cp .env.example .env   # 填入 Supabase 的 URL 和 anon / publishable key（不填也能跑）
npm run dev
```

## 設定 Supabase（一次就好）

1. Supabase Dashboard → **SQL Editor**，依序貼上 `supabase/migrations/` 裡的 `0001_init.sql`、`0002_notes_cards.sql` 執行
2. **Project Settings → API**，複製 Project URL 和 anon（或 publishable）key 到 `.env`
3. **Authentication → URL Configuration**
   - Site URL：正式網址（例如 `https://tcf-prep.vercel.app`）
   - Redirect URLs：加上 `http://localhost:3000` 和正式網址
4. 登入方式是 email magic link，預設就開著，不用另外設定

## 部署到 Vercel

匯入這個 repo，Framework 選 Nuxt，環境變數加上：

```
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
```

## 專案結構

```
pages/
  index.vue        首頁：今日練習、程度設定、單字卡入口、單項練習、TV5MONDE 入口
  cards.vue        單字卡（Leitner 間隔複習、自己加單字）
  notes/           文法筆記列表、單篇、自己寫筆記（edit.vue）
  practice.vue     作答流程（?mode=daily | wrong | skill&skill=grammar）
  wrong.vue        錯題本
  progress.vue     進度、正確率、模擬考分數紀錄
  login.vue        magic link 登入 / 登出
components/
  QuestionCard.vue 單題卡片（選項隨機排序、聽力 TTS、解析、看筆記、加單字）
  NoteBody.vue     顯示筆記內文
  AddCardForm.vue  新增單字表單
assets/css/main.css  Tailwind 入口
composables/
  useStore.ts      資料層：Supabase 或 localStorage
  useBank.ts       題庫、出題邏輯（依程度）、錯題、連續天數、統計
  useNotebook.ts   自己的筆記、單字、單字卡進度：Supabase 或 localStorage
  useCards.ts      單字卡複習排程
  useNotes.ts      內建文法筆記
  useLevel.ts      我的程度（存在這台裝置）
utils/renderNote.ts  筆記的簡易格式 → HTML
data/
  questions/       題庫
  notes.json       內建文法筆記
  vocab.json       內建單字
  useSpeech.ts     瀏覽器法語語音朗讀
data/questions/    題庫 JSON（grammar / reading / listening）
supabase/migrations/
```

## 新增題目

在 `data/questions/` 對應的檔案加一筆：

```json
{
  "id": "gr-b1-012",
  "skill": "grammar",
  "level": "B1",
  "topic": "subjonctif",
  "prompt": "Je veux que tu ___ là à huit heures.",
  "options": ["es", "sois", "seras", "étais"],
  "answer": 1,
  "explanation": "vouloir que 後面接虛擬式，être 的虛擬式是 sois。"
}
```

- `id` 上線後不要改（作答紀錄靠它對應）
- 閱讀題要有 `passage`，聽力題要有 `audio`（會用語音念出來，作答後顯示文字稿）
- `answer` 是正確選項的 index（0 起算）；畫面上選項會隨機排序，所以不用擔心答案位置
- 加完跑 `npm run check:questions` 檢查格式

## 出題原則

- 只放原創題。官方或市售題庫有版權，不要複製進來
- 聽力的數字、時間請寫成法文單字（`quatorze heures vingt`），語音念起來比較自然
- 每題都要有中文解析，說明為什麼對、其他選項為什麼錯

## 之後可以做

- 計時模擬考模式（CO 39 題 / 35 分鐘、CE 39 題 / 60 分鐘）與 NCLC 換算
- B2 題庫
- 寫作練習：送出作文，用 AI 批改
- PWA，加到手機主畫面
