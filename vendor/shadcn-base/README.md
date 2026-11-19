# shadcn 上游原樣（基準版）

2026-11-19 自 inknock `vendor/shadcn-base/` 搬入（inknock ADR 0002 C 批）；方法見 inknock `docs/research/2026-11-12-ui-library/06-shadcn-deep-dive.md` SOP 第 1 條。
**本目錄提交後不手改**：它是三方合併（`git merge-file 自家版 基準版 上游新版`）的「基準版」。
不在 `package.json` 的 `files` 裡——只供合併用，不隨套件安裝。

| 路徑 | 來源 | 取得日 | 用途 |
|---|---|---|---|
| `aria-nova-4.23.0-2026-11-13/button.tsx` | `npx shadcn@4.23.0 view button`（style `aria-nova`）的 `files[0].content`，逐位元組 | 2026-11-13 | `src/ui/primitives/button.tsx` 的基準版 |
| `aria-nova-4.23.0-2026-11-13/{input,textarea,native-select}.tsx` | 暫存目錄 `npx shadcn@4.23.0 add input textarea native-select -y`（style `aria-nova`，圖示已展開為 lucide），逐位元組 | 2026-11-13 | `src/ui/primitives/` 同名檔的基準版 |
| `aria-nova-4.23.0-2026-11-15/{switch,checkbox,tabs}.tsx` | 暫存目錄 `npx shadcn@4.23.0 add switch checkbox tabs -y`（style `aria-nova`，圖示已展開為 lucide），逐位元組 | 2026-11-15 | `src/ui/primitives/` 同名檔的基準版 |
| `aria-nova-4.23.0-2026-11-15/{badge,card}.tsx` | 暫存目錄 `npx shadcn@4.23.0 add badge card -y`（style `aria-nova`），逐位元組 | 2026-11-15 | `src/ui/primitives/` 同名檔的基準版 |
| `aria-nova-4.23.0-2026-11-15/{dialog,alert-dialog}.tsx` | 暫存目錄 `npx shadcn@4.23.0 add dialog alert-dialog -y`（style `aria-nova`），逐位元組 | 2026-11-15 | `src/ui/primitives/dialog.tsx` 的基準版（只借 class，見該檔開頭） |
| `aria-nova-4.23.0-2026-11-15/{skeleton,alert,empty}.tsx` | 暫存目錄 `npx shadcn@4.23.0 add skeleton alert empty -y`（style `aria-nova`），逐位元組 | 2026-11-15 | `src/ui/primitives/{skeleton,alert,empty}.tsx` 的基準版（只借結構與命名，值沿用 inknock，見各檔開頭） |
| `aria-nova-4.23.0-2026-11-15/dropdown-menu.tsx` | 暫存目錄 `npx shadcn@4.23.0 add dropdown-menu -y`（style `aria-nova`），逐位元組 | 2026-11-15 | `src/ui/primitives/dropdown-menu.tsx` 的基準版（只借 class，見該檔開頭） |

元件的上游原樣由各元件批次以暫存目錄 `npx shadcn@4.23.0 add … -y` 取得後放入。
升級 `shadcn` 時：新版另開一個目錄，不覆蓋舊的；合併完、確認沒有元件還在用舊基準再刪。
自家版與上游的差異：各 `src/ui/primitives/*.tsx` 檔頭的「inknock: 自家改動」清單（2026-11-19 起多一條：拿掉 react-aria-components 元件）。
