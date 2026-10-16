# aw-kit/panel 規格（草案，2026-10-15）

> **狀態：v0.3.0 已抽取（2026-10-15，未發 tag）；inknock 尚未改引用（遷移 step 2）。** 本檔是 QuickView／slide-over 面板跨專案的**唯一真相**；
> `aw-cc_workflow/skills/admin-ui-conventions` §3 只留原則並指向這裡。
> 來源實作：inknock `src/shared/ui/panel/`（2026-10-15 全站上線，26 檔面板）。
> 定案紀錄：inknock `DECISIONS.md` 2026-10-14／10-15 QuickView 各列、2026-10-15「aw-kit/panel 抽取範圍」grilling。

---

## 1. 範圍

| 層 | 內容 | 由誰提供 |
|---|---|---|
| 行為核心 | 疊層狀態、`openPanel`、註冊表、上一頁關最上層、離開守門、`isPanelOnlyNavigation` | aw-kit |
| 版面骨架 | 定位與滑動、寬度規則、頭部兩列、44×44 點擊區、提示列／固定底部列位置 | aw-kit（改了會違反規範的東西） |
| 預設外觀 | 顏色、字級、圓角、陰影、間距——以 CSS 變數 `--aw-panel-*` 給中性預設 | aw-kit 給預設，專案覆寫 |
| 面板內容 | 各專案的資料元件 | 專案 |

判準：**改了會破壞規範的歸 aw-kit 骨架；只是品牌外觀的走 CSS 變數。**

形狀照 `aw-kit/notify`：JS／JSX 原始碼＋手寫 `index.d.ts`，**以 vite 建置、`dist/` 進版控**（JSX 需編譯；2026-10-15 更正：grilling Q10 曾誤述為無建置），子路徑 `aw-kit/panel`、`aw-kit/panel/style.css`。另加一支型別檔編譯測試（`tsc --noEmit` 編譯照 `.d.ts` 呼叫 API 的範例），防手寫型別與實作脫節。

**路由以 adapter 注入，aw-kit 不 import 任何 router**：`<PanelStackProvider router={{ useLocation, useNavigate, useNavigationType }}>`。理由：inknock 用 react-router-dom v6、inflorify 用 react-router v7，直接 import 等於替使用端選版本、錯了靜默。`useBlocker` 留在專案的頁面守門（aw-kit 只輸出 `isPanelOnlyNavigation` 供其排除）。

---

## 2. 行為規格

### 2.1 疊層
- 單一入口 `openPanel(type, seed)`＋註冊表（type → 內容元件）＋一個 `PanelHost` 渲染。頁面不得自掛 slide-over。
- 堆疊是純 UI 狀態，不碰資料源；內容元件以 seed 的身分（id）自行重查，seed 只做樂觀初繪。
- **每層一片獨立面板蓋在上一層上，下層保留掛載**（不卸載）。返回時分頁、捲動、輸入自然還在。
  ⚠️ 不做「單殼換內容」（inknock 2026-10-14 試過、10-15 翻案）。
- 下層 `inert`＋`aria-hidden`，只有最上層帶 `aria-modal`；開層焦點移入、關層還原到下層原焦點。
- 最大深度 `MAX_DEPTH`（inknock 為 8）；z-index 第 d 層遮罩 `base+2d`、面板 `base+2d+1`。

### 2.2 關閉
- Esc、點遮罩（手機為左側縫隙）、瀏覽器上一頁、頂列 ✕、頂列「‹ 來源名」**全部只關最上層**。沒有「全部關閉」。
- Esc 排除輸入法組字中（`isComposing || keyCode === 229`）。
- 上一頁：開層時推一筆瀏覽紀錄（`state.awPanel = 深度`），**不改網址**；既有第一層網址參數（如 `?tx=`）由 `useUrlPanel` 維持。
- 換頁（PUSH）自動關閉所有層；面板內「編輯→整頁跳轉」離開前存堆疊快照、返回時原樣重開。

### 2.3 寬度
- 第一層完整寬度（桌機預設 `min(560px, (100vw − 側欄寬) × 0.52)`，頁面可傳入）。
- **第二層起固定縮 7%**（不逐層加深）；桌機下限 360px。
- **手機**：基準寬＝螢幕寬減左側 **40px** 縫隙（點縫隙關最上層），第二層起同樣縮 7%、**不設下限**。手機一律如此，頁面傳入寬度被覆蓋。
- 寬度規則只寫在 `SlideOver` 一處。

### 2.4 頭部結構（由上而下）
1. **頂端細列**（高 20px）：左「‹ 來源名」（第二層起才有，點了＝關當層）、右小 ✕；點擊區 44×44 視覺小；**不放任何動作**。
2. **標題列**：標題獨佔、靠左；其後可接**單號、狀態標籤**（屬「這筆是什麼」）。
   - 狀態標籤**可以是可點的**（點了跳選單直接改狀態，不能選的灰掉並寫原因）——這不算「動作」，留在標題後。元件見 §5。
3. 細列與標題、標題與分隔線各 4px。

### 2.5 動作分流（不放標題列）
1. **提示列**：資料有待處理時才出現；一句說明＋主要按鈕（例：「3 項等到貨」＋登記到貨）。
2. **內容區按鈕列**：針對某區段的動作。
3. **固定底部列**（選用）：表單型面板的儲存／取消。
- 危險動作（刪除）放內容最底部、低調呈現（文字連結），並經確認對話框。

### 2.6 離開守門
表單型內容有未存變更時，**任何會讓它消失的操作都要先問**：✕、遮罩／縫隙、Esc、上一頁、在其上疊新層、換頁。

---

## 3. 三條教訓（每條必附「舊寫法會紅」測試）

| # | 教訓 | 失敗形狀 | 必附測試（自 inknock 搬） |
|---|---|---|---|
| L1 | **路由攔截（`useBlocker`）必須排除面板自身的移動**：同 pathname＋search、只有 `state.awPanel` 不同者放行；殼關閉後呼叫頁面 `onClosed` 的導航以 `withPanelNavigationAllowed` 包住 | 頁面有未存變更時，開／關面板誤跳「離開前確認」；殼的 `navigate(-n)` 被攔 | `tests/panel/panel-round2.test.jsx` A 組與 7/8：拿掉 awPanel 比較或 allowDepth 須紅（已實證） |
| L2 | **守門每層可登記多支**（`usePanelCloseGuard` 回傳各自解除函式），依登記順序逐支問、第一支回 false 即停 | 一層一支時，子分頁的守門覆蓋掉主表單的，未存內容靜默丟失 | `tests/panel/panel-multi-guard.test.jsx`：改成單支須紅（已實證） |
| L3 | **下層保留掛載**才保得住未存狀態 | 單殼換內容會卸載下層，返回後輸入、分頁、捲動全丟，且不報錯 | `tests/panel/panel-stacked-layers.test.jsx`：疊兩層返回後同一節點、分頁與輸入仍在；改成卸載須紅 |

另：多條關閉路徑（Esc、遮罩、內容 closeAll／back）共用**單一 transitioning 鎖**，async 守門未決前第二條路徑不得放行（inflorify 4-B Codex 第 3 輪）。

---

## 4. 外觀：CSS 變數

預設值取 `aw-cc_workflow/templates/design-system-baseline.md` 中性系統，缺項以 inknock 現值補。專案在根層覆寫一次即可。

| 變數 | 預設 | 用途 |
|---|---|---|
| `--aw-panel-bg` | `#ffffff`（card） | 面板表面 |
| `--aw-panel-scrim` | `rgba(0,0,0,0.3)` | 遮罩 |
| `--aw-panel-shadow` | `-8px 0 32px rgba(20,24,28,.10)` | 面板陰影 |
| `--aw-panel-rule` | `#e3e3e3` | 標題下分隔線 |
| `--aw-panel-ink` | `#1a1a1a` | 標題 |
| `--aw-panel-ink-subtle` | `#616161` | ✕、單號、meta |
| `--aw-panel-back-color` | `#4a4a4a` | 「‹ 來源名」 |
| `--aw-panel-focus` | `#303030` | 焦點框（`.aw-panel-hit:focus-visible` 的 outline 顏色；專案可把它指到自己的焦點環變數，例 `var(--focus-ring-color)`） |
| `--aw-panel-hit` | `44px` | 頂列兩顆按鈕的點擊區（高、右 ✕ 的寬、負 margin 偏移皆以 calc() 引用此變數） |
| `--aw-panel-notice-bg` | `#f0f0f0`（sunken） | 提示列底 |
| `--aw-panel-title-size` | `20px` | 標題字級 |
| `--aw-panel-radius` | `0` | 面板左緣圓角 |
| `--aw-panel-pad` | `24px` | 外緣（桌機） |
| `--aw-panel-pad-mobile` | `16px` | 外緣（手機） |
| `--aw-panel-motion` | `220ms` | 滑動時長（須帶單位：`ms` 或 `s`；解析不了退 220ms） |
| `--aw-panel-easing` | `cubic-bezier(0.32, 0.72, 0, 1)` | 滑動曲線 |
| `--aw-panel-offset-bottom` | `0px` | 底部讓位（如 SP 檢視提示列） |
| `--aw-panel-meta-size` | `13px` | 標題後 meta 與「‹ 來源名」字級（v0.3.0 抽取時補） |
| `--aw-panel-meta-color` | `var(--aw-panel-ink-subtle)` | meta 文字色；inknock 的 meta 比 ✕ 淡一階，需要分開時覆寫（v0.3.0 補） |
| `--aw-panel-title-line-height` | `1.35` | 標題行高（v0.3.0 補） |
| `--aw-panel-body-size` | `15px` | 內容區內建文字（如「未註冊的面板型別」）字級（v0.3.0 補） |
| `--aw-panel-danger` | `#b42318` | 內建錯誤文字色（v0.3.0 補） |
| `--aw-panel-space-sm` | `8px` | meta 左距、「‹ 來源名」內距（v0.3.0 補） |
| `--aw-panel-space-lg` | `16px` | 頭部上內距（v0.3.0 補） |

骨架常數（不開放覆寫）：頂列高 20px、細列／標題間距 4px。點擊區預設 44px，可用 `--aw-panel-hit` 覆寫。
`--aw-panel-focus` 套用在頭部兩顆按鈕的 `:focus-visible`（class `aw-panel-hit`）；`--aw-panel-notice-bg` 目前殼內無元件使用（提示列屬專案內容），僅保留預設值供專案引用。

Provider props（非 CSS）：`router`（必填）、`zBase`（預設 160）、`mobileQuery`（預設 `(max-width: 767px)`）、`onMaxDepth`。

**有品牌主色時建議換掉的只有這幾項**：`--aw-panel-back-color`、`--aw-panel-focus`、`--aw-panel-notice-bg`（主色淺底）、以及固定底部列的主要按鈕（按鈕本身由專案提供）。其餘維持中性——換了容易與專案自己的代幣分岔。

---

## 5. 元件成長流程

1. 專案做出新元件，先在該專案內使用。
2. **已在一個專案正式站跑過**、且屬面板規範內的模式 → 連同規格條目與測試提進 aw-kit，升 minor 版號。
3. 該專案改引用 aw-kit 版、刪自己那份。
4. 其他專案升版即可用。**升版只新增，不改既有元件行為**（改行為＝major，須逐專案驗）。

候選清單：

| 元件 | 來源 | 狀態 |
|---|---|---|
| `StatusMenuBadge`（可點狀態標籤） | inflorify `src/shared/ui/StatusMenuBadge.tsx` | ⏳ 待 inflorify 上 prod 後提入；規格位置已在 §2.4 |

---

## 6. 遷移計畫

| 步 | 內容 | 驗證 |
|---|---|---|
| 0 | inknock 建 baseline：現有面板測試全綠＋主要面板截圖（桌機／iPad／手機，各 1–2 層） | 九綠 |
| 1 | 抽 `aw-kit/panel`（TS→JS＋`.d.ts`，**只搬不改**），搬 §3 測試到 aw-kit，加型別編譯測試；發 tag | aw-kit 測試全綠；§3 每條變異須紅 |
| 2 | inknock 改引用 `aw-kit/panel`，CSS 變數指向 `theme.ts` 代幣，刪 `src/shared/ui/panel/` 對應檔 | 九綠＋截圖與 step 0 逐張比對**零差異** |
| 3 | （另開段落）inflorify 改引用：手機改左留 40px（原全螢幕）、頭部改兩列結構（原標題列帶 actions＋文字「關閉」）、動作改分流、`StatusMenuBadge` 留在標題後 | inflorify 閘門全綠＋實機 |
| 4 | admin-ui-conventions §3 確認只剩原則＋連結 | — |
