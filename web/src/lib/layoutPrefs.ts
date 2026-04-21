const MAIN_KEY = 'precision-curator-nav-main-collapsed'
const EXPLORER_KEY = 'precision-curator-nav-explorer-collapsed'

function readFlag(key: string): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* private mode */
  }
}

export function readMainNavCollapsed(): boolean {
  return readFlag(MAIN_KEY)
}

export function writeMainNavCollapsed(value: boolean): void {
  writeFlag(MAIN_KEY, value)
}

export function readExplorerNavCollapsed(): boolean {
  return readFlag(EXPLORER_KEY)
}

export function writeExplorerNavCollapsed(value: boolean): void {
  writeFlag(EXPLORER_KEY, value)
}
