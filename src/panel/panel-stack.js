// 純堆疊邏輯：無 React 依賴，供 Provider 與測試共用。移植自 mh1491 components/panel/panelStack.js。
export const MAX_DEPTH = 8

// module-state-ok: 面板 key 的遞增序號，不含任何資料，只是保證同一分頁內 key 不重複
let seq = 0
export function makeEntry(type, seed, meta = {}) {
  return { key: `panel_${++seq}`, type, seed, ownsHistory: true, openedAtKey: '', openedAtPath: '', openedAtUrl: '', ...meta }
}

export function atMaxDepth(stack) {
  return stack.length >= MAX_DEPTH
}

export function panelReducer(stack, action) {
  switch (action.type) {
    case 'open':
      if (atMaxDepth(stack)) return stack   // 呼叫端負責提示（reducer 內不能觸發 onMaxDepth）
      return [...stack, action.entry]
    case 'back':
      return stack.slice(0, -1)
    case 'closeAll':
      return []
    case 'closeTo':
      return stack.length > action.depth ? stack.slice(0, Math.max(0, action.depth)) : stack
    case 'restore':
      return action.stack
  }
}
