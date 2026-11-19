// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/checkbox.tsx；ADR 0001〈外觀定案〉）
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   - 勾選底色 bg-primary（深墨）→ bg-brand（選取色＝品牌色，ADR〈第一階段必做〉①；2026-11-13 對照圖「品牌色勾選」）
//   - 底色加 bg-background（白）：放在凹陷灰底上不透出灰底（同 Input）
//   - 停用 opacity-50 → opacity-45（DESIGN.md disabledOpacity，與 Switch 同值）；加 cursor-pointer
//   - 抽出 checkboxBoxClassName／checkboxIconClassName：包裝層（src/shared/ui/checkbox.tsx）渲染原生
//     <input type="checkbox">（appearance-none 畫框）＋疊在上面的圖示時共用（同 Button 做法）。原生用 :checked／:indeterminate，
//     React Aria 版用 data-selected／data-indeterminate，兩套選擇器都留著
//   尺寸 16、圓角 4px、框色 input、focus ring 照上游
export const checkboxBoxClassName =
  "peer relative flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[4px] border border-input bg-background transition-colors outline-none group-has-disabled/field:opacity-45 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-brand data-focus-visible:border-ring data-focus-visible:ring-2 data-focus-visible:ring-ring data-invalid:border-destructive data-invalid:ring-3 data-invalid:data-focus-visible:ring-2 data-invalid:data-focus-visible:ring-ring data-invalid:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-checked:border-brand data-checked:bg-brand data-checked:text-brand-foreground group-has-[:focus-visible]/field-label:data-checked:border-brand data-selected:border-brand data-selected:bg-brand data-selected:text-brand-foreground data-invalid:data-selected:border-brand checked:border-brand checked:bg-brand indeterminate:border-brand indeterminate:bg-brand"

// 圖示疊在原生框上（包裝層用）：與框同格、不吃點擊；勾選時白色。
// relative 不可拿掉：框（input）本身是 relative，定位元素會畫在一般元素之上——圖示不是定位元素就被框蓋住（2026-11-15 比較頁實測：勾選只剩綠色方塊）
export const checkboxIconClassName =
  "pointer-events-none relative col-start-1 row-start-1 size-3.5 text-brand-foreground opacity-0"
