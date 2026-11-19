import * as React from "react"
import { cn } from "../cn"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/card.tsx；ADR 0001〈外觀定案〉D1）
//   2026-11-15 Card 改走 class，**外觀與換之前相同**（比較頁以 getComputedStyle 逐屬性比對）：
//   - 抽出 cardClassName（只含外觀）：包裝層（src/shared/ui/card.tsx）只借這一段。
//     上游根元素的版面 class（flex-col、gap、py、text-sm、overflow-hidden）是配 CardHeader／CardContent 用的，
//     包裝層的 Card 直接裝頁面內容，帶上會改掉 19 個呼叫端的版面（overflow-hidden 還會裁掉卡片內的下拉選單）
//   - 外框 ring-1 ring-foreground/10（淡環）→ border border-line-strong 1px 實線（D1：卡片外框用 lineStrong）
//   - 底色 bg-card → bg-surface（同值；用 DESIGN.md 名稱）；加 transition（hover 加深外框的過場，150ms ease）
//   - 上游 Card 本身＝cardClassName＋原本的版面 class（目前沒有呼叫端，留著與上游對照）
export const cardClassName =
  "rounded-xl border border-line-strong bg-surface transition-all duration-150 ease-[ease]"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        cardClassName,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
