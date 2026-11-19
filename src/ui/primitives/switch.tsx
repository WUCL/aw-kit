// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/switch.tsx；ADR 0001〈外觀定案〉）
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   - 尺寸 default 32×18.4 → 44×26、圓鈕 16 → 24（同上游：圓鈕＝內高）（D3：shadcn 預設在 iPad 上太小；可點範圍另由 after 補到 44 高）
//   - 「關」底色 bg-input（深灰 #8A8A8A）→ bg-line（D3：顏色照 inknock）；「開」bg-primary（深墨）→ bg-brand（選取色＝品牌色，ADR〈第一階段必做〉①）
//   - 圓鈕加陰影 shadow-knob（DESIGN.md shadow.knob 產生）：「關」底色 line 很淡（#EEEEEC），白圓鈕不加陰影幾乎看不見
//   - 移動距離 calc(100%-2px)（上游 16 鈕在 32 寬）→ 18px（24 鈕在 44 寬、1px 框）
//   - 停用 opacity-50 → opacity-45（DESIGN.md disabledOpacity，現行開關同值）
//   - 加 cursor-pointer（現行開關是手指）
//   - after 可點範圍：上游 -inset-x-3 -inset-y-2 → 只往上下補到 44 高（同 Button「只往上下擴」，避免蓋到同列相鄰控制項）
//   - 抽出 switchClassName／switchThumbClassName：包裝層（src/shared/ui/switch.tsx）渲染原生 <button role="switch"> 時共用（同 Button 做法）
//   sm 尺寸、focus ring、動畫照上游
export const switchClassName =
  "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all outline-none not-data-selected:bg-line group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:inset-x-0 after:inset-y-[min(0px,calc((100%_-_44px)/2))] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring aria-invalid:ring-destructive/20 data-focus-visible:border-ring data-focus-visible:ring-2 data-focus-visible:ring-ring data-invalid:border-destructive data-invalid:ring-3 data-invalid:data-focus-visible:ring-2 data-invalid:data-focus-visible:ring-ring data-invalid:ring-destructive/20 data-[size=default]:h-[26px] data-[size=default]:w-[44px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:not-data-selected:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-checked:bg-brand data-unchecked:bg-line dark:data-unchecked:bg-input/80 data-selected:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-45 disabled:cursor-not-allowed disabled:opacity-45"

export const switchThumbClassName =
  "pointer-events-none block rounded-full bg-background shadow-knob ring-0 transition-transform group-data-[size=default]/switch:size-6 group-data-[size=default]/switch:not-data-selected:translate-x-0 group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:not-data-selected:translate-x-0 dark:not-data-selected:bg-foreground group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground group-data-[size=default]/switch:data-selected:translate-x-[18px] group-data-[size=sm]/switch:data-selected:translate-x-[calc(100%-2px)] dark:data-selected:bg-primary-foreground"
