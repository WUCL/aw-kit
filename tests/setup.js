// vitest 設定（2026-11-19 D3 批）：本套件 globals 關閉，Testing Library 不會自動在每個測試後清掉 DOM——在這裡統一做，
// 否則前一個測試的元素殘留，getByText 會找到多個（自 inknock 搬來的測試原本靠 inknock 的 globals: true）。
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())
