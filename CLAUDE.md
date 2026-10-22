# TCF Prep — 專案說明（給 Claude）

Emily 個人用的 TCF Canada 法文練習網站。目標：每天打開就練，不用想要去哪裡做題。

## 背景（為什麼做這個）
- Emily 想移民加拿大，要考 **TCF Canada**，目標是四項都達到 **NCLC 7（約 B2）**，走 Express Entry 法語類別
- 目前程度約 **A2**（Duolingo French 分數 48），口說寫作比聽讀弱
- 她說自己**很懶、要有壓力才會動**：任何需要多一步思考或多點幾下的流程，她都會直接關掉。設計時以「打開就能做、不用選、不用找」為最高原則
- 每天上班空檔用，主要在 Mac 和 iPhone 上，介面用繁體中文，題目是法文

## 技術與慣例
- Nuxt 3 SPA（`ssr: false`）+ Tailwind（`@nuxtjs/tailwindcss`）+ Supabase
- **視覺沿用她的 emily_gm 專案**（`../emily_gm`）：`brand-*` 色票、8 級字級（caption/small/body/body-lg/h3/h2/h1/display）、Poppins + Huninn 字體。文字大小只從 `tailwind.config.ts` 的字級挑，不打任意數值
- 卡片：`rounded-2xl border border-brand-border bg-white p-4 shadow-sm`；主按鈕：`h-12 rounded-xl bg-brand-orange text-body font-bold text-white active:bg-brand-orange-dark`
- 資料層在 `composables/useStore.ts`：登入 Supabase 存雲端，沒登入存 localStorage，第一次登入自動搬上雲端
- 出題邏輯在 `composables/useBank.ts`；聽力用瀏覽器 TTS（`composables/useSpeech.ts`）
- DB schema：`supabase/migrations/0001_init.sql`（attempts、mock_scores，都有 RLS）。改 schema 請新增 migration 檔，不要改舊的
- 套件管理目前是 npm（package-lock.json）

## 題庫規則
- 題目放 `data/questions/{grammar,reading,listening}.json`，格式見 README「新增題目」
- **只放原創題**。TCF 官方題、市售題庫、網路上的「回憶真題」都有版權或來源不明，不要複製進來
- 每題 4 個選項、要有中文解析（說明為什麼對、其他為什麼錯）；`id` 上線後不能改
- 聽力 `audio` 的數字和時間寫成法文單字，TTS 念起來比較自然
- 正確答案位置不用平均分配，畫面上會隨機排序
- 加完題跑 `npm run check:questions`

## 官方參考資料
- TCF Canada 格式：聽力 39 題 / 35 分、閱讀 39 題 / 60 分、寫作 3 題 / 60 分、口說 3 題 / 12 分
- NCLC 7 門檻（IRCC 對照表）：聽力 458、閱讀 453（滿分 699）；寫作、口說 10/20
- 免費官方等級練習：TV5MONDE（apprendre.tv5monde.com/tcf），題目由主辦單位 France Éducation international 設計，有不計時練習（S'entraîner，首頁往下的 Série d'entraînement，每份 40 題，網址 `/fr/tcf/test-dentrainement-au-tcf?tcf_lot_id=<編號>`）和計時模擬考（Tester en condition réelle，`/fr/tcf/simulation-du-tcf`，80 題 / 90 分鐘，不能暫停）

## 待辦（依優先順序）
1. **題庫擴充（A1、A2 優先）**：Emily 目前約 A1～A2，第一次做 A2/B1 文法題幾乎都不會（2026-10-22）。A1 目前 27 文法 / 6 閱讀 / 6 聽力，先補 A1、A2，B2 之後再說。新題盡量加 `note` 連到 data/notes.json 的筆記
2. 文法筆記補 B1 主題（subjonctif、conditionnel、dont、plus-que-parfait、gérondif），B1 題目已經有了但還沒有對應筆記
3. TV5MONDE 模擬考做完後的分數畫面還沒看過，請她截圖，再調整「記錄分數」的欄位
4. 計時模擬考模式（照 TCF 題數與時間）＋估算 NCLC 等級
5. 寫作練習：送出短文給 AI 批改
6. PWA：加到 iPhone 主畫面

## 學習資料
- Emily 之前的筆記：Google 試算表「b2」（https://docs.google.com/spreadsheets/d/18Ra1Z48M_ghV59rerccDi379UEDH5h_jYwOhWHCVPDo），內建文法筆記和單字卡就是從這裡整理的。她後來改手寫，現在可以在網站「筆記」頁自己寫
- 型別檢查：`npx nuxt typecheck`

## 現況
- 第一版已完成，本機 `npm run dev` 可以跑，有一個 initial commit，remote 是 `github.com/Emilyyen2222/tcf-prep`
- Supabase 專案 `tcf-prep` 已建立，`.env` 和 migration 可能還沒設定，先問她。migration 有兩個：0001（作答、模擬考）、0002（筆記、單字卡）
