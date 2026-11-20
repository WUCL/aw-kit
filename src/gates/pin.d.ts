// aw-kit/gates/pin 的型別（實作：pin.js）
export interface PinState { spec?: string; lockSpec?: string; lockVersion?: string; installedVersion?: string; linked?: boolean }
export function checkPin(pin: PinState & { repo?: string }): { problems: string[]; notes: string[] }
export function readPinState(root: string): PinState
