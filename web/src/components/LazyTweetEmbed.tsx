import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ensureTwitterWidgets,
  statusIdFromUrl,
} from '@/lib/twitterWidgets'
import { tweetPermalink } from '@/lib/format'

type Props = {
  url: string
  className?: string
  theme?: 'light' | 'dark'
}

export function LazyTweetEmbed({
  url,
  className = '',
  theme = 'light',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const permalink = tweetPermalink(url)
  const tweetId = useMemo(() => statusIdFromUrl(permalink), [permalink])
  const parseError = tweetId
    ? null
    : 'Could not read tweet id from URL.'
  const displayError = parseError ?? loadError

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
            break
          }
        }
      },
      { rootMargin: '400px 0px', threshold: 0.01 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !tweetId) return
    const host = rootRef.current
    if (!host) return

    let cancelled = false
    host.innerHTML = ''

    void (async () => {
      try {
        await ensureTwitterWidgets()
        if (cancelled || !host.isConnected) return
        const tw = window.twttr
        if (!tw?.widgets?.createTweet) {
          setLoadError('Twitter embed script did not load.')
          return
        }
        await tw.widgets.createTweet(tweetId, host, { theme })
        if (cancelled) return
        if (!host.querySelector('iframe')) {
          setLoadError('Tweet could not be embedded (private or deleted).')
        }
      } catch {
        if (!cancelled) setLoadError('Failed to load embed.')
      }
    })()

    return () => {
      cancelled = true
      host.innerHTML = ''
    }
  }, [visible, tweetId, theme])

  return (
    <div ref={rootRef} className={className}>
      {!visible ? (
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-6 text-center text-sm text-on-surface-variant">
          Scroll to load embed…
        </div>
      ) : displayError ? (
        <div className="rounded-lg border border-error-container/40 bg-error-container/10 px-4 py-4 text-sm text-on-surface">
          <p className="mb-2">{displayError}</p>
          <a
            className="text-primary font-medium underline underline-offset-2"
            href={permalink}
            target="_blank"
            rel="noreferrer"
          >
            Open on X
          </a>
        </div>
      ) : null}
    </div>
  )
}
