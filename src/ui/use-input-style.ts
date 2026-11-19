// 2026-11-19 自 inknock `src/shared/ui/use-input-style.ts` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useTheme } from './theme-context'
import type { Theme } from './theme'

/** ⚠️ hook，不是靜態物件——顏色代幣要跟著品牌主題變，元件內用 `const inputStyle = useInputStyle()`。 */
export function useInputStyle(): React.CSSProperties {
  const T = useTheme()
  return {
    // ⚠️ 框線是 `lineControl`(#8A8A8A) 不是 `line`(#EEEEEC)——DESIGN.md §「表單框／可互動控制項」
    // 明訂表單框與 Polaris 的 border-tertiary 一致。2026-08-27 加深 `lineControl` 那次，
    // 各元件逐一改過（全庫 109 處直接用 T.lineControl），**唯獨這個共用 hook 沒跟上**，
    // 於是全站每一個 input／select 都停在淡線上。2026-09-21 使用者在新增商品表單發現。
    // 左右內距 10＝Input／NumberInput 的 px-2.5（原 11，與換新後的欄位差 1px，同格切換時文字會跳；2026-11-15 數字欄 review）
    width: '100%', border: `1px solid ${T.lineControl}`, borderRadius: T.radius.md, padding: '0 10px',
    fontFamily: T.font, fontSize: T.fontSize.body, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box',
    // 高度與 Input／Select 同一套（md，桌機與手機相同）。原本 padding 10＋minHeight 44，桌機比共用 Input 高一階（2026-09-30 收斂）。
    // 用 minHeight 不用 height：多行文字框（備註）要能隨內容長高。
    minHeight: T.controlH.md,
  }
}

/**
 * 停用欄位的長相（2026-10-08，mockup 109 a1）：凹陷灰底＋淡框＋淡字。
 * 原本 Input／Select／Textarea 停用時與可編輯的完全同一個樣子，畫面說「不能編輯」、框卻看起來能打字。
 * 放在呼叫端 style **之後**套用：呼叫端寫死的白底不可蓋掉停用狀態。錯誤框（error）優先於淡框。
 * WebkitTextFillColor＋opacity：Safari 對 disabled 欄位另外疊一層淡化，不設會比其他瀏覽器更淡。
 */
export function disabledFieldStyle(T: Theme, error?: boolean): React.CSSProperties {
  return {
    // backgroundColor 不用 background 簡寫：Select 的下拉箭頭是 backgroundImage，簡寫會把它清掉
    backgroundColor: T.surfaceSunken,
    ...(error ? {} : { borderColor: T.lineStrong }),
    color: T.inkFaint,
    WebkitTextFillColor: T.inkFaint,
    opacity: 1,
    cursor: 'not-allowed',
  }
}
