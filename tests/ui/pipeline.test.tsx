// A 批：證明 aw-kit 的測試環境能直接跑 .tsx、用 React 19 的寫法（ref 當一般 prop）。
// 之後各批搬進來的元件測試都走同一條路；這支只鎖住「管線本身」。
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { createRef, version, type Ref } from 'react'

function Probe({ ref, label }: { ref?: Ref<HTMLButtonElement>; label: string }) {
  return <button ref={ref} type="button">{label}</button>
}

describe('aw-kit/ui 測試管線', () => {
  it('跑的是 React 19', () => {
    expect(Number(version.split('.')[0])).toBe(19)
  })

  it('.tsx 元件可渲染，ref 以一般 prop 傳入（React 19）', () => {
    const ref = createRef<HTMLButtonElement>()
    const { getByRole } = render(<Probe ref={ref} label="確定" />)
    expect(getByRole('button').textContent).toBe('確定')
    expect(ref.current).toBe(getByRole('button'))
  })
})
