import * as React from "react"
import { cn } from "../cn"
import { ChevronDownIcon } from "lucide-react"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-13/native-select.tsx）——同 primitives/input.tsx：
//   rounded-md（sm 也是，上游 sm 用 rounded-[min(var(--radius-md),10px)]）、高度 --control-h-md／sm、bg-background、
//   停用凹陷底＋lineStrong 框＋淡字（上游是整組 opacity-50）、錯誤色 danger-base、錯誤＋聚焦外圈改品牌色、text-foreground（同 input）、placeholder ink-faint、抽出 nativeSelectClassName、
//   拿掉 disabled:pointer-events-none（同 input／Button：停用時 title 提示與禁止游標要出現，2026-11-15）
// 抽出 class 串：包裝層渲染原生 <select> 時共用（同 inputClassName）
const nativeSelectClassName =
  "h-(--control-h-md) w-full min-w-0 appearance-none rounded-md border border-input bg-background text-foreground py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-ink-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-line-strong disabled:bg-surface-sunken disabled:text-ink-faint aria-invalid:border-danger-base aria-invalid:ring-3 aria-invalid:ring-danger-base/20 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring data-[size=sm]:h-(--control-h-sm) data-[size=sm]:py-0.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({
  className,
  size = "default",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      {/* audit-ok: bareControl — 這就是共用下拉的底層元素（shadcn native-select 原樣結構） */}
      <select
        data-slot="native-select"
        data-size={size}
        className={nativeSelectClassName}
        {...props}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none group-has-[select:disabled]/native-select:text-ink-faint" aria-hidden="true" data-slot="native-select-icon" />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, nativeSelectClassName }
