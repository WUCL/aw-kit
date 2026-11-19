// 2026-11-19 自 inknock `src/shared/ui/data-table.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react'
import { isRowActivateKey } from './submit-enter'
import { useTheme } from './theme-context'
import { useIsMobile } from './breakpoints'

/**
 * 全站表格的單一實作。規範見 DESIGN.md「Table」章節。
 *
 * 為什麼要有這支：2026-08-20 盤點發現全站 9 個表格各自手寫 <th>/<td> 樣式，
 * 於是在欄寬策略、內文字級（14 vs 規範的 16）、列高（8px / 15px / 16px）上各自漂移。
 * 根因是「每個頁面都照隔壁那頁抄」——收斂成一支元件才不會再分岔。
 *
 * 三個刻意的設計決定：
 * 1. `table-layout: fixed` 是預設且不可關。auto layout 會讓欄寬隨當頁內容變動，
 *    使用者翻頁時整排欄位會跳。要固定欄寬就必須配 colgroup，兩者綁在一起。
 * 2. `align` 同時套用到 th 與 td。只對其中一邊靠右，標題與數字會分屬兩側，比不靠右更難讀。
 * 3. 數值欄自動帶 `tabular-nums`，讓位數對齊——這是靠右對齊真正的目的。
 */

export type ColumnAlign = 'left' | 'right' | 'center'

/**
 * 金額欄的統一寬度。**任何顯示「$ 金額」的欄位都用這個，不要自己挑數字。**
 *
 * 🔴 為什麼是常數而不是各表自己填（2026-08-28）：
 *    盤點時三張表各自手挑 88 / 110 / 112，其中訂單紀錄的 88 **在 prod 上截斷了
 *    322 筆訂單**（約 10%）——`$17,500` 顯示成 `$17,5…`。
 *    那個 88 是我用「$ 8.4 ＋ 5 位數字 41.3 ＋ 逗號 3.9 ＋ padding 32」推算的，
 *    **每位數估太窄 6.5px**。這是「顯示點分散」的典型後果：同一個決定做三次，
 *    錯一次就沒人發現。
 *
 * 📏 104 是**量出來的，不是算出來的**（Chrome，Plus Jakarta Sans 已載入，
 *    700 / 15px / tabular-nums，即表格金額欄的實際渲染條件）：
 *      $9,999     51.07
 *      $17,500    60.07   ← 舊的 88px 內容區只有 56，就差在這
 *      $99,999    60.07   （tabular 等寬，故與上同）
 *      $999,999   69.07
 *      $1,000,000 83.42
 *    104 − 32(cell padding) = **72px 內容區**，覆蓋到六位數（$999,999）還餘 2.9px。
 *    prod 實測最大金額 $34,000、六位數 0 筆，六位數已是 30 倍餘裕。
 *
 * ⚠️ 若日後真的出現七位數（$1,000,000 需 83.42 + 32 = 116），**要改這個常數**，
 *    不要在某一張表上另外加寬——那正是這個常數要消滅的行為。
 *
 * 2026-09-11：104 → **120**。使用者在訂單紀錄頁覺得金額欄「再寬一點點」；依上一條規則
 *    改常數而非單表加寬，順便把七位數（116）也一併涵蓋。88px 內容區。
 */
export const AMOUNT_COL_WIDTH = 120

/**
 * 日期欄的統一寬度與樣式。**任何顯示 `YYYY/MM/DD` 的欄位都用這組。**
 *
 * 🔴 起因（2026-08-28，批次 6b）：字級由 14 升到 15 後，領料頁的申請日
 *    **被切掉 2–4px**——`2026/08/19` 需 118、`2026/07/24` 需 120，欄寬只有 116。
 *    ⚠️ 注意「不同日期需要的寬度不一樣」本身就是缺陷的訊號：
 *       代表這欄**沒有 `tabular-nums`**，數字寬度隨字元而變，逐列還會左右跳動。
 *       DataTable 只在 `align: 'right'` 時自動開 tabular，而日期欄是靠左的。
 *
 * 📏 量測（15px / 400，暴力掃過 2026 年全部 12×28 個日期取最寬，不是只試一兩個）：
 *      非 tabular  最寬 91.68（`2026/04/04`）→ 需 91.68 + 32 內距 = 123.68
 *      tabular     最寬 84.88（`2026/01/01`）→ 需 84.88 + 32 內距 = 116.88
 *    補上 tabular 之後 **120 就夠**，而且每一列等寬、不再跳動。
 */
// ⚠️ `DATE_COL_WIDTH = 120` 已於 2026-09-16 刪除：它的兩個呼叫端（領料／採購列表的日期欄）
//    在同日的「欄寬改百分比」那次就不再使用它，卻沒把常數一起收掉——是我自己留下的孤兒
//    （C3 執行者盤點時抓到）。上面的量測值**刻意保留**：它是 `DATE_CELL` 為什麼存在的理由。
export const DATE_CELL: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

export type Column<R> = {
  /** React key，同時作為欄位識別 */
  key: string
  /** 表頭文字。空字串用於箭頭／操作欄 */
  label: ReactNode
  /**
   * 欄寬。數字視為 px；`'auto'`（預設）讓該欄吃掉剩餘空間。
   * ⚠️ 一張表至少要留一欄 auto，否則欄寬總和與容器不符時 fixed layout 會按比例縮放，
   * 等於失去固定欄寬的意義。
   */
  width?: number | string
  /** 對齊。`'right'` 會一併開啟 tabular-nums（數值欄用） */
  align?: ColumnAlign
  /**
   * 過長內容是否截斷加省略號。預設 true。
   * 內容會換行的欄位（chips、多行地址、含 Badge 的組合欄）必須設 false，
   * 否則 overflow:hidden 會把第二行切掉。
   */
  truncate?: boolean
  /** 該欄所有儲存格的額外樣式 */
  cellStyle?: CSSProperties
  /** 僅 autoLayout：該欄最寬 px（內容不足時可更窄，過長省略號；多出的寬度由其他欄分攤） */
  maxWidth?: number
  /** 僅 autoLayout：搭配 maxWidth＝容器放不下時欄最窄縮到這裡；用於 width:'fit' 欄＝欄至少這麼寬（含 padding），不依內容寬縮到更窄；（含 padding），再不夠才橫捲 */
  /** 數字＝px；字串可用 em／ch／calc（隨字級走，不寫死 px 去估字寬） */
  minWidth?: number | string
  render: (row: R, index: number) => ReactNode
}

export type DataTableProps<R> = {
  rows: R[]
  columns: Column<R>[]
  keyOf: (row: R, index: number) => string
  onRowClick?: (row: R, index: number) => void
  /** 逐列覆寫樣式（例：作廢單降透明度） */
  rowStyle?: (row: R, index: number) => CSSProperties | undefined
  /** 無資料時顯示。給字串會套用標準空狀態版面 */
  empty?: ReactNode
  /**
   * 桌機最小寬度。低於此值時容器橫向捲動，而不是把欄位壓爛。
   * 預設 720。欄位多的表格（採購單）要調大。
   */
  minWidth?: number
  /** 套在橫向捲動容器上。⚠️ 表格會超出視窗時**不要**傳 `hide-scrollbar`——捲軸是「右邊還有欄位」唯一的線索（2026-09-11） */
  scrollerClassName?: string
  /**
   * 是否自己畫容器（邊框 ＋ 圓角 ＋ 下緣線）。預設 true。
   * 放進 `<TableShell>` 時傳 false——邊界由 shell 持有，兩邊都畫就是雙層框。
   */
  chrome?: boolean
  /**
   * 窄螢幕（`<768`）的列內容。給了就自動啟用 condensed 模式：
   * `<table>` 換成 `<ul>`，每列是 `<li>` ＋ 上緣髮絲線，**沒有卡片外框**。
   *
   * ⚠️ 這是對標 Polaris `IndexTable` 的 condensed 模式（`Row.tsx:191`
   * `RowWrapper = condensed ? 'li' : 'tr'`）。Shopify 在窄螢幕不是改用卡片，
   * 而是換一種列的排法——容器語言與桌機相同。
   *
   * ⚠️ 刻意**不從 `columns` 自動產生**。六個頁面在手機上的重點各不相同
   * （訂單看金額、客戶看到訪次數、庫存看剩餘量），自動產生會得到六份一樣
   * 呆板的列。層級由 `CondensedRow` 的三行結構保證，內容由頁面決定。
   *
   * 不給則窄螢幕仍渲染表格（橫向捲動）。
   */
  renderCondensed?: (row: R, index: number) => ReactNode
  /**
   * 緊湊行高：儲存格上下內距 16 → 4（左右維持 16）。給「項目多、一屏想看完」的清單（記帳分類 15 項）用；
   * 字級與控制項高度不變（控制項高度走 T.controlH，不因密度縮小）。預設 false＝密度 B。
   */
  dense?: boolean
  /**
   * 選用：儲存格（桌機）與列（窄螢幕）上下內距 px。**只在傳入時生效**，不傳＝行為不變（dense／預設 16）。
   * 傳入時優先於 dense。左右內距不變。（2026-10-23 費用列表 mockup 113：7）
   */
  rowPadY?: number
  /**
   * 選用：依相鄰列的 key 分組。key 與前一列不同（或是第一列）時，在該列前面插一列分組列（render 的內容）。
   * 只看「相鄰」——呼叫端的列要已按分組鍵排序。分頁時每頁第一列必有分組列。
   * 桌機是一個 colSpan 全欄的 <tr>、窄螢幕是一個 <li>，由本元件包好，呼叫端只給內容。
   */
  groupBy?: { keyOf: (row: R) => string; render: (row: R) => ReactNode }
  /**
   * 置頂列 — 渲染在表頭之下、第一筆資料之上，且**不計入分頁**。
   *
   * 用於「彙總型的一筆」：客戶頁的散客列就是這種——它是一筆資料，
   * 不是篩選器。⚠️ 原本放在工具列與表頭之間，讀起來像篩選器的一部分，
   * 而且打斷了「工具列 → 表頭 → 資料」的閱讀順序。
   *
   * 桌機收到一個 `<tr>`（呼叫端只需給 `<td colSpan>` 的內容），
   * 窄螢幕收到一個 `<li>`。兩邊由本元件包好，呼叫端只給內容。
   */
  leadingRow?: ReactNode
  /**
   * 內容自適應版面（預設 false＝fixed）。給了就改 `table-layout: auto`：
   * `width: 'fit'` 的欄不換行（nowrap，不截斷）、依內容寬並分攤剩餘寬；`maxWidth` 欄最寬到上限、過長才省略號；**沒有寬度也沒 maxWidth 的欄吃剩餘寬**。
   * 為什麼存在：欄內容寬度取決於實際字級與中文字寬，用估算 px 配欄寬會截斷（2026-10-22 費用列表：店別／發票被截、金額欄放不下狀態 tag）。
   * 代價是欄寬隨當頁內容變動——只給「內容長度可預期、欄少」的表；訂單等已量測過的表維持 fixed。
   */
  autoLayout?: boolean
}

export function DataTable<R>({
  rows,
  columns,
  keyOf,
  onRowClick,
  rowStyle,
  empty = '沒有資料',
  minWidth = 720,
  scrollerClassName,
  chrome = true,
  renderCondensed,
  dense = false,
  rowPadY,
  groupBy,
  leadingRow,
  autoLayout = false,
}: DataTableProps<R>) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const condensed = isMobile && !!renderCondensed

  const alignOf = (c: Column<R>): ColumnAlign => c.align ?? 'left'

  const isFit = (c: Column<R>) => autoLayout && c.width === 'fit'
  const truncStyle = (c: Column<R>): CSSProperties =>
    isFit(c)
      // fit 欄：nowrap（不換行不截斷），不再收縮成 1%——自然參與剩餘寬度的分配
      ? { whiteSpace: 'nowrap', minWidth: c.minWidth }
      : autoLayout && c.maxWidth !== undefined
        // 有上限的欄：寬度隨內容、最寬 maxWidth，過長省略號
        // width:0＝固定欄寬 0，欄寬只取內容最小寬（由 render 外層 div 的 max-width 封頂），多出的寬度才分給其他 auto 欄
        ? { width: c.maxWidth, minWidth: c.minWidth }
      : autoLayout && c.width === undefined && c.truncate !== false
        // auto layout 的彈性欄：max-width:0 讓內容不撐寬，欄寬由「剩餘空間」決定，過長才省略號
        ? { maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        : c.truncate === false
      ? {}
      : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  const frame: CSSProperties = chrome
    ? {
        background: T.surface,
        border: `1px solid ${T.lineStrong}`,
        borderRadius: T.radius.xl,
        boxShadow: T.shadow.card,
      }
    : {}

  if (condensed) {
    return (
      <div style={{ width: '100%', ...frame }}>
        {/* ⚠️ leadingRow 要畫在「有沒有 rows」之外——它不是資料列，
            是常駐的入口（例：客戶頁的「散客」列）。桌機版本來就這樣做，
            窄螢幕原本只在非空分支裡渲染，於是同一個元件在兩種寬度下行為不同
            （2026-08-27 code review 抓到；今天的唯一呼叫端剛好碰不到）。 */}
        {leadingRow && rows.length === 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li style={{ padding: `${T.spacing.md}px ${T.pad.inputX}px`, background: T.neutralSunken }}>
              {leadingRow}
            </li>
          </ul>
        )}
        {rows.length === 0 ? (
          <div style={{ padding: '60px 24px' }}>
            {typeof empty === 'string' ? (
              <div style={{ textAlign: 'center', color: T.inkFaint, fontSize: T.fontSize.body, fontFamily: T.font }}>
                {empty}
              </div>
            ) : (
              empty
            )}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {leadingRow && (
              <li style={{ padding: `${T.spacing.md}px ${T.pad.inputX}px`, background: T.neutralSunken }}>
                {leadingRow}
              </li>
            )}
            {rows.map((row, i) => (
              <Fragment key={keyOf(row, i)}>
              {groupBy && (i === 0 || groupBy.keyOf(rows[i - 1]!) !== groupBy.keyOf(row)) && (
                <li
                  data-testid="table-group-row"
                  style={{
                    borderTop: i === 0 && !leadingRow ? 'none' : `1px solid ${T.line}`,
                    padding: `${T.spacing.xs}px ${T.pad.inputX}px`,
                    background: T.neutralSunken, fontFamily: T.font, fontSize: T.fontSize.meta, fontWeight: T.fontWeight.semibold, color: T.inkMuted,
                  }}
                >
                  {groupBy.render(row)}
                </li>
              )}
              <li
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                // 可點的列要鍵盤也點得到（2026-10-08 code review：列表改「整列點擊開面板」後，桌機鍵盤使用者無從開啟）
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? e => {
                  if (isRowActivateKey(e)) { e.preventDefault(); onRowClick(row, i) }
                } : undefined}
                style={{
                  // 上緣髮絲線分列，首列不畫——與 Polaris .CondensedList 相同。
                  borderTop: i === 0 && !leadingRow && !groupBy ? 'none' : `1px solid ${T.line}`,
                  padding: rowPadY !== undefined ? `${rowPadY}px ${T.pad.inputX}px` : `${T.spacing.md}px ${T.pad.inputX}px`,
                  cursor: onRowClick ? 'pointer' : 'default',
                  fontFamily: T.font,
                  fontSize: T.fontSize.body,
                  color: T.ink,
                  ...(rowStyle?.(row, i) ?? {}),
                }}
              >
                {renderCondensed!(row, i)}
              </li>
              </Fragment>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    // 預設自己擁有容器：圓角 ＋ 框 ＋ 下緣線都掛在這一層。
    // 過去圓角會「消失」，是因為圓角掛在外層 <Card> 而捲動層在裡面，
    // 表格的直角把 Card 的圓角蓋掉。`overflow-x: auto` **本身就會裁切圓角**
    // （已實測），所以不需要另外加 `overflow: hidden`——那反而會殺掉橫向捲動。
    // ⚠️ 呼叫端不要再用 <Card> 包 DataTable，會變成雙層框。
    // 放進 <TableShell> 時傳 chrome={false}，由 shell 持有邊界（同理，
    // 兩邊都畫框就是雙層框）。
    <div
      className={scrollerClassName}
      style={{
        width: '100%',
        overflowX: 'auto',
        ...frame,
      }}
    >
      <table
        style={{
          width: '100%',
          minWidth,
          borderCollapse: 'collapse',
          // 不可改為 auto：見檔頭決定 1
          tableLayout: autoLayout ? 'auto' : 'fixed',
        }}
      >
        {!autoLayout && (
          <colgroup>
            {columns.map(c => (
              <col
                key={c.key}
                style={{ width: typeof c.width === 'number' ? `${c.width}px` : c.width }}
              />
            ))}
          </colgroup>
        )}

        <thead>
          <tr style={{ background: T.tableHeaderBg }}>
            {columns.map(c => (
              <th
                key={c.key}
                style={{
                  fontSize: T.fontSize.meta,
                  fontWeight: T.fontWeight.medium,
                  color: T.inkMuted,
                  // 與 td 用同一個 align：只靠右一邊會讓標題與數字分家
                  textAlign: alignOf(c),
                  padding: `${T.pad.inputY}px ${T.pad.inputX}px`,
                  lineHeight: T.lineHeight.body,
                  borderBottom: `1px solid ${T.line}`,
                  whiteSpace: 'nowrap',
                  fontFamily: T.font,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {leadingRow && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: `${T.pad.inputY}px ${T.pad.inputX}px`,
                  background: T.neutralSunken,
                  borderBottom: `1px solid ${T.line}`,
                }}
              >
                {leadingRow}
              </td>
            </tr>
          )}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {typeof empty === 'string' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '60px 24px',
                      gap: T.gap.inline,
                      fontSize: T.fontSize.body,
                      fontWeight: 600,
                      color: T.ink,
                      fontFamily: T.font,
                    }}
                  >
                    {empty}
                  </div>
                ) : (
                  empty
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <Fragment key={keyOf(row, i)}>
              {groupBy && (i === 0 || groupBy.keyOf(rows[i - 1]!) !== groupBy.keyOf(row)) && (
                <tr data-testid="table-group-row">
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: `${T.spacing.xs}px 16px`,
                      background: T.neutralSunken, borderBottom: `1px solid ${T.line}`,
                      fontFamily: T.font, fontSize: T.fontSize.meta, fontWeight: T.fontWeight.semibold, color: T.inkMuted,
                    }}
                  >
                    {groupBy.render(row)}
                  </td>
                </tr>
              )}
              <tr
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                // 可點的列要鍵盤也點得到（2026-10-08 code review：列表改「整列點擊開面板」後，桌機鍵盤使用者無從開啟）
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? e => {
                  if (isRowActivateKey(e)) { e.preventDefault(); onRowClick(row, i) }
                } : undefined}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                // React 的 onFocus 走 focusin、會冒泡，所以列內若有真實的可聚焦元素
                // （例如客戶列表第一格的 button），鍵盤 Tab 過去時整列一樣會 highlight。
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                style={{
                  borderBottom: i < rows.length - 1 ? `1px solid ${T.line}` : 'none',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: `background ${T.motion.fast} ease`,
                  background: 'transparent',
                  ...rowStyle?.(row, i),
                  // hover 疊一層在 rowStyle 的底色之上（2026-09-29）：已結束列的灰底（doneRowStyle）
                  // 原本會蓋掉 hover，可點的列摸上去沒有回饋。hoverSurface 是半透明，用 backgroundImage 疊加。
                  ...(onRowClick && hoverIdx === i
                    ? { backgroundImage: `linear-gradient(${T.interaction.hoverSurface}, ${T.interaction.hoverSurface})` }
                    : {}),
                }}
              >
                {columns.map(c => {
                  const align = alignOf(c)
                  return (
                    <td
                      key={c.key}
                      style={{
                        // 列高 48（2026-11-15，ADR 0001 D10）：上下 12＋內文一行 24（15px×1.6）；左右 16 不變。
                        // 原為上下 16（列高 56，2026-08-20 密度 B）。仍 ≥ 44 觸控目標
                        padding: rowPadY !== undefined ? `${rowPadY}px 16px` : dense ? '4px 16px' : '12px 16px',
                        fontSize: T.fontSize.body,
                        color: T.inkMuted,
                        fontFamily: T.font,
                        textAlign: align,
                        // 靠右＝數值欄，讓位數對齊才是靠右的目的
                        fontVariantNumeric: align === 'right' ? 'tabular-nums' : undefined,
                        verticalAlign: 'middle',
                        ...truncStyle(c),
                        ...c.cellStyle,
                      }}
                    >
                      {autoLayout && c.maxWidth !== undefined ? (
                        // 欄總寬（含左右 padding 各 16）≤ maxWidth；內容不足時更窄，過長省略號
                        <div style={{ contain: 'inline-size', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.render(row, i)}
                        </div>
                      ) : (
                        c.render(row, i)
                      )}
                    </td>
                  )
                })}
              </tr>
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
