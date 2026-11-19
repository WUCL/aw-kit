// 2026-11-19 自 inknock `src/shared/ui/prompt-dialog.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { useTheme } from './theme-context'
import { Input } from './input'
import { FormField } from './form-field'
import { isSubmitEnter } from './submit-enter'

// 跳窗版「填一段文字再確定」——useConfirm() 只能回傳 boolean，帶不回文字，
// 故另立一支（2026-08-18 領料單「駁回原因」改跳窗，需求就是這個）。
export interface PromptOptions {
  title: string
  description?: ReactNode
  /** 必填（預設）會自動在標籤後畫紅星，文字裡不要再寫「 *」 */
  label?: string
  placeholder?: string
  required?: boolean          // 預設 true：空白不給送出
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

type Resolver = (value: string | null) => void   // null＝取消

interface PromptContextValue {
  prompt: (opts: PromptOptions) => Promise<string | null>
}

const PromptContext = createContext<PromptContextValue | null>(null)

export function usePrompt() {
  const ctx = useContext(PromptContext)
  if (!ctx) throw new Error('usePrompt 必須在 PromptDialogProvider 下使用')
  return ctx.prompt
}

export function PromptDialogProvider({ children }: { children: ReactNode }) {
  const T = useTheme()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PromptOptions | null>(null)
  const [value, setValue] = useState('')
  const resolverRef = useRef<Resolver | null>(null)

  const prompt = useCallback((opts: PromptOptions) => {
    setOptions(opts)
    setValue('')
    setOpen(true)
    return new Promise<string | null>(resolve => {
      resolverRef.current = resolve
    })
  }, [])

  function resolve(v: string | null) {
    resolverRef.current?.(v)
    resolverRef.current = null
    setOpen(false)
  }

  const required = options?.required !== false
  const canSubmit = !required || value.trim().length > 0

  function submit() {
    if (!canSubmit) return
    resolve(value.trim())
  }

  return (
    <PromptContext.Provider value={{ prompt }}>
      {children}
      <Modal
        open={open && !!options}
        onClose={() => resolve(null)}
        title={options?.title ?? ''}
        width={420}
        zIndex={T.z.dialog}
        footer={
          <div style={{ display: 'flex', gap: T.gap.inline, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => resolve(null)}>
              {options?.cancelText ?? '取消'}
            </Button>
            <Button
              variant={options?.variant === 'danger' ? 'danger' : 'primary'}
              disabled={!canSubmit}
              onClick={submit}
            >
              {options?.confirmText ?? '確定'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap.stack }}>
          {options?.description && (
            <div style={{ fontSize: T.fontSize.body, lineHeight: T.lineHeight.prose, color: T.inkMuted }}>
              {options.description}
            </div>
          )}
          {/* 標籤走全站統一的 FormField；必填由 required 自動畫紅星，呼叫端不要在 label 文字裡手寫「 *」（2026-11-16 第 13 批） */}
          <FormField label={options?.label} required={required} htmlFor="prompt-dialog-input">
            {/* 外觀與聚焦外圈走共用 Input（2026-11-14）；autoFocus／onKeyDown 由 Input 原樣轉傳 */}
            <Input
              id="prompt-dialog-input"
              autoFocus
              value={value}
              placeholder={options?.placeholder}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (isSubmitEnter(e) && canSubmit) submit() }}
            />
          </FormField>
        </div>
      </Modal>
    </PromptContext.Provider>
  )
}
