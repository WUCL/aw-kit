# aw-notify-kit

Zero-dependency toast + confirm-dialog emitter/host 套件（React 18），從 MH1491 生產環境的通知系統重構中抽出來、獨立成 npm 套件。

---

## 這個 repo 從哪裡來（重要 — 這是「移植」不是「原創」）

**原始設計、spec、plan、code review 全部發生在另一個獨立 repo：`mh1491`**（本機路徑：`~/Documents/GitHub/ucdi/mh1491`）。

- Spec：`mh1491/docs/superpowers/specs/2026-07-12-notify-kit-design.md`
- Plan：`mh1491/docs/superpowers/plans/2026-07-12-notify-kit.md`

若要追溯「為什麼這樣設計」「這個決策當初的討論」，去 mh1491 repo 看那兩份文件——**這裡不重複**。

**移植邏輯**：`toast.js` / `confirmDialog.js` / `ToastHost.jsx` / `ConfirmDialogHost.jsx` 都是從 MH1491 生產環境中已驗證過的機制搬過來的，不是從零設計。改動只在於：

- 拿掉 Tailwind 依賴 → 改用 `fbk-*` CSS class + CSS variable 主題
- 拿掉對 MH1491 專案內部 Button 元件的依賴 → 改用套件自帶的 `Button.jsx`
- 新增 React 18 Strict Mode 防重複掛載的 refcount guard
- 新增 `ConfirmDialogHost` 的焦點還原防呆

---

## 架構速覽

（使用方式看 README，這裡只講每個檔案負責什麼）

| 檔案 | 負責 |
|------|------|
| `src/toast.js` | module-level pub/sub emitter |
| `src/confirmDialog.js` | Promise-based confirm emitter（window.confirm-like） |
| `src/ToastHost.jsx` | React host，訂閱 toast emitter |
| `src/ConfirmDialogHost.jsx` | React host，訂閱 confirm emitter |
| `src/Button.jsx` | 套件自帶按鈕，不依賴消費端 |
| `src/styles.css` | 主要樣式來源（build 成 `dist/style.css`） |
| `src/injectStyles.js` | CSS 注入 fallback（次要路徑，給不能 import CSS 的消費端） |
| `src/index.js` | barrel export，公開 API 入口 |

---

## 重要規則 / gotcha（給未來的 Claude，避免重踩雷）

- **不可加 `"prepare"` script 到 package.json**：消費端用 `npm install github:...` 安裝時會跑 `prepare`，但消費端沒裝這個套件的 devDependencies（如 vite），會直接讓 install 失敗。改 build 流程時要記住這個限制。
- **`dist/` 是刻意 commit 進 git 的**（沒有 gitignore）：因為套件靠 `npm install github:...` 安裝，消費端不會跑 build，只會拉 `dist/` 靜態檔。每次改完 `src/` 後記得 `npm run build`，把新的 `dist/` 一起 commit，否則消費端裝到的是舊版程式碼。
- **`ToastHost` 和 `ConfirmDialogHost` 的 Strict Mode guard 用的是 refcount（不是布林旗標）**：早期版本用布林旗標，code review 抓到「兩個 host 卸載順序不同時會誤判」的 bug，改成 module-level 計數器（掛載無條件 +1、卸載無條件 -1）才修正。要改這個 guard 邏輯前，先理解為什麼不能用布林。
- **兩個 host 的「多重掛載」警告文字刻意寫得不一樣**：`ToastHost` 重複掛載 = 兩個都會收到事件、畫面重複顯示；`ConfirmDialogHost` 重複掛載 = 最後掛載的那個會贏，前面的悄悄失效。這是真實的機制差異（一個是 Set 多監聽者、一個是單一 handler 變數覆蓋），不是文字打錯，改文案前先理解機制。
- **`package-lock.json` 目前刻意留著 untracked**（不追蹤也不 gitignore）：因為消費端不會在這個 repo 裝依賴，只有真的要在本地開發這個套件時才需要它。未來要認真維護開發環境可重現性可以考慮補上。
- **`undoDelete` 之類綁定資料庫的邏輯刻意不進這個套件**：只給 `toast` / `confirm` 這兩個機制，任何跟特定後端（如 Supabase）耦合的邏輯留在消費端自己組（README 有 adapter 食譜範例）。

---

## 開發指令

```bash
npm install
npm test         # vitest run
npm run build    # 輸出 dist/aw-notify-kit.js + dist/style.css
```

---

## Remote

```
origin  https://github.com/WUCL/aw-notify-kit.git
```

---

## 目前狀態

2026-07-12：v0.1.0 完整實作完成（scaffold → port toast/confirmDialog emitter → Button → styles/injectStyles → ToastHost/ConfirmDialogHost with Strict Mode + focus-restore guard → barrel export + dist build → README → 2 輪 code review 修正含 refcount guard fix 與警告文案修正）。已 push 到 GitHub（`WUCL/aw-notify-kit`），尚未打 tag。
