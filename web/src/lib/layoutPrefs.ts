const MAIN_KEY = 'precision-curator-nav-main-collapsed'
const EXPLORER_KEY = 'precision-curator-nav-explorer-collapsed'
const EMBED_THEME_KEY = 'precision-curator-embed-theme'
const DENSITY_KEY = 'precision-curator-feed-density'
const FEED_TOP_CHROME_KEY = 'precision-curator-feed-top-chrome'

export type EmbedTheme = 'light' | 'dark'
export type FeedDensity = 'comfy' | 'compact'
export type FeedTopChrome = 'full' | 'hidden'

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

export function readEmbedTheme(): EmbedTheme {
  try {
    const v = sessionStorage.getItem(EMBED_THEME_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function writeEmbedTheme(theme: EmbedTheme): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(EMBED_THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function readFeedDensity(): FeedDensity {
  try {
    const v = sessionStorage.getItem(DENSITY_KEY)
    return v === 'compact' ? 'compact' : 'comfy'
  } catch {
    return 'comfy'
  }
}

export function writeFeedDensity(d: FeedDensity): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(DENSITY_KEY, d)
  } catch {
    /* ignore */
  }
}

export function readFeedTopChrome(): FeedTopChrome {
  try {
    const v = sessionStorage.getItem(FEED_TOP_CHROME_KEY)
    return v === 'hidden' ? 'hidden' : 'full'
  } catch {
    return 'full'
  }
}

export function writeFeedTopChrome(mode: FeedTopChrome): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(FEED_TOP_CHROME_KEY, mode)
  } catch {
    /* ignore */
  }
}
