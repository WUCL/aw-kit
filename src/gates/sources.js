// ⚠️ 解析程式碼的閘門需要 typescript（class-gate、controls-gate、terms-gate）與 postcss（class-gate）；style-gate、sources、is-main 都不需要：package.json 標成選用 peer（ui／notify／panel 的消費端用不到），用閘門的專案要自己裝。
// 閘門共用的檔案清單與 ratchet 基線比對（2026-11-19，inknock ADR 0002 E 批：原本在 inknock 四支腳本各寫一份 walk、兩份基線比對）。
import { readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, sep } from 'node:path'

/**
 * dir 底下所有 .ts／.tsx（不含 *.test.*），回傳路徑（以 dir 的寫法為前綴）。
 * skip：要整個略過的路徑（與回傳值同一種寫法，例：join('src', 'liff')）。
 */
export function listSources(dir, { skip = [] } = {}) {
  const out = []
  const walk = d => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (skip.includes(p)) continue
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p)
    }
  }
  walk(dir)
  return out
}

/** 消費端安裝的 aw-kit/ui 原始碼目錄（經套件匯出解析：npm link 指到本機 aw-kit、正式安裝在 node_modules） */
export function awKitUiDir(fromUrl) {
  return dirname(createRequire(fromUrl).resolve('aw-kit/ui/theme'))
}

/**
 * [標籤, 實際路徑]：uiDir 底下所有 .ts／.tsx（不含測試），標籤＝prefix＋相對路徑（/ 分隔）。
 * 回報用固定標籤：npm link 與正式安裝的實際路徑不同，基線（檔案:規則）不能跟著變。
 * 連 primitives/button.tsx 都沒有＝目錄解析錯了，丟錯（閘門紅燈，不靜默少掃）。
 */
export function uiFiles(uiDir, prefix) {
  const out = listSources(uiDir).map(p => [prefix + relative(uiDir, p).split(sep).join('/'), p])
  if (!out.some(([label]) => label === `${prefix}primitives/button.tsx`)) throw new Error(`aw-kit/ui 目錄 ${uiDir} 裡沒有 primitives/button.tsx，路徑可能解析錯了`)
  return out
}

/**
 * ratchet：基線記錄既有、待清的 key（可重複＝多處）。只擋新增；清掉的要收縮基線。
 * @returns {{ fresh: any[], cleared: [string, number][] }} fresh＝基線外的新違規；cleared＝基線裡已清掉、該收縮的 [key, 筆數]
 */
export function ratchet(hits, key, baseline) {
  const budget = new Map()
  for (const k of baseline) budget.set(k, (budget.get(k) ?? 0) + 1)
  const fresh = []
  for (const h of hits) {
    const n = budget.get(key(h)) ?? 0
    if (n > 0) budget.set(key(h), n - 1)
    else fresh.push(h)
  }
  return { fresh, cleared: [...budget].filter(([, n]) => n > 0) }
}
