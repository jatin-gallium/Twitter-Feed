declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          element: HTMLElement,
          options?: { theme?: 'light' | 'dark'; align?: string },
        ) => Promise<unknown>
      }
    }
  }
}

let loadPromise: Promise<void> | null = null

export function ensureTwitterWidgets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.twttr?.widgets?.createTweet) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Twitter widgets script failed')),
        { once: true },
      )
      return
    }
    const s = document.createElement('script')
    s.src = 'https://platform.twitter.com/widgets.js'
    s.async = true
    s.charset = 'utf-8'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Twitter widgets script failed'))
    document.body.appendChild(s)
  })

  return loadPromise
}

export function statusIdFromUrl(url: string): string | null {
  const m = url.match(/status\/(\d+)/)
  return m?.[1] ?? null
}
