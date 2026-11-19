import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../cn"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/badge.tsx；ADR 0001〈外觀定案〉D8）
//   2026-11-15 Badge 改走 class，**外觀與換之前逐像素相同**（比較頁以 getComputedStyle 逐屬性比對）：
//   - 形狀：rounded-4xl（膠囊）→ rounded-sm 6px 方角（D8／DESIGN.md The Badge-Is-Not-A-Pill Rule）
//   - 固定高 h-5 拿掉，改 padding 撐高（md 3px 9px／sm 2px 7px，行高 1.4 由 text-meta／text-caption 帶出）；
//     字重：狀態與分級 semibold（600）；屬性標記（marker／attribute）medium（500），與 Chip 同一族同字重
//     （2026-11-15 使用者定案「標籤字重要統一」；換之前 Badge 屬性 600、Chip 500 只差字重）；邊框一律 1px（solid 族用 transparent 框，與 outline 族同高）
//   - variant 換成 inknock 的色調（顏色意義見 DESIGN.md §Badge：狀態四色調＋客戶分級＋屬性標記），
//     上游的 default／secondary／destructive／outline／ghost／link 不用
//   - 加 badgeDotVariants（狀態色點 5px；屬性標記不帶色點，由包裝層的窮舉表 DOT 決定不畫）
//   - 拿掉 overflow-hidden、transition-all、focus／aria-invalid 樣式（Badge 不可聚焦、不是表單元素）；
//     拿掉 w-fit、shrink-0：放在 grid 格內會改變伸展、在 flex 列內會改變收縮，與換之前不同
const badgeVariants = cva(
  "group/badge inline-flex items-center gap-1 rounded-sm border whitespace-nowrap",
  {
    variants: {
      tone: {
        // 狀態四色調（badge-tone.ts BadgeTone）
        neutral: "border-line-control bg-surface font-semibold text-ink-muted",
        warning: "border-transparent bg-amber-bg font-semibold text-amber-ink",
        danger: "border-transparent bg-danger-bg font-semibold text-danger-ink",
        done: "border-transparent bg-neutral-sunken font-semibold text-ink-faint",
        // 客戶分級（冷 → 中 → 暖；常客＝warning）
        "tier-new": "border-transparent bg-secondary-50 font-semibold text-secondary-700",
        "tier-returning": "border-transparent bg-accent-50 font-semibold text-accent-700",
        // 屬性標記（有框無底、不帶色點）：字重 500，與 Chip 同一族（2026-11-15 使用者定案）
        marker: "border-marker-border bg-surface font-medium text-marker-ink",
        attribute: "border-line-control bg-surface font-medium text-ink-muted",
      },
      size: {
        md: "px-[9px] py-[3px] text-meta",
        sm: "px-[7px] py-[2px] text-caption",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
)

const badgeDotVariants = cva("size-[5px] shrink-0 rounded-full", {
  variants: {
    tone: {
      neutral: "bg-ink-faint",
      warning: "bg-amber-dark",
      danger: "bg-danger-dark",
      done: "bg-ink-faint",
      "tier-new": "bg-secondary-600",
      "tier-returning": "bg-accent-600",
      // marker／attribute 不帶色點：畫不畫由包裝層的窮舉表 DOT 決定，這裡不列
    },
  },
  defaultVariants: { tone: "neutral" },
})

function Badge({
  className,
  tone = "neutral",
  size = "md",
  render,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode
  }) {
  if (render) {
    const renderProps = {
      "data-slot": "badge",
      "data-tone": tone,
      className: cn(badgeVariants({ tone, size }), className),
      ...props,
    }

    return render(renderProps)
  }

  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(badgeVariants({ tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, badgeDotVariants }
