import { useCallback, useEffect, useRef } from 'react'

type Props = {
  /** Scrollable feed panel; keep in sync when ref attaches. */
  scrollEl: HTMLElement | null
}

/** Pixels per tick at ~60fps feel */
const STEP = 9

export function ScrollAssist({ scrollEl }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    scrollElRef.current = scrollEl
  }, [scrollEl])

  const clearScroll = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const beginScroll = useCallback(
    (dir: -1 | 1) => {
      clearScroll()
      intervalRef.current = setInterval(() => {
        const el = scrollElRef.current
        if (!el) return
        el.scrollTop += dir * STEP
      }, 16)
    },
    [clearScroll],
  )

  useEffect(() => {
    return () => clearScroll()
  }, [clearScroll])

  useEffect(() => {
    const onWinUp = () => clearScroll()
    window.addEventListener('mouseup', onWinUp)
    window.addEventListener('touchend', onWinUp)
    window.addEventListener('blur', onWinUp)
    return () => {
      window.removeEventListener('mouseup', onWinUp)
      window.removeEventListener('touchend', onWinUp)
      window.removeEventListener('blur', onWinUp)
    }
  }, [clearScroll])

  return (
    <div className="fixed right-3 bottom-20 z-[100] flex flex-col gap-2 md:right-5 md:bottom-8 pointer-events-auto">
      <button
        type="button"
        className="h-12 w-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25 flex items-center justify-center select-none touch-none active:scale-95 transition-transform"
        title="Hold to scroll up"
        aria-label="Hold to scroll feed up"
        onPointerDown={(e) => {
          e.preventDefault()
          if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
            e.currentTarget.setPointerCapture(e.pointerId)
          }
          beginScroll(-1)
        }}
        onPointerUp={clearScroll}
        onPointerCancel={clearScroll}
        onLostPointerCapture={clearScroll}
      >
        <span className="material-symbols-outlined text-2xl pointer-events-none">
          expand_less
        </span>
      </button>
      <button
        type="button"
        className="h-12 w-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25 flex items-center justify-center select-none touch-none active:scale-95 transition-transform"
        title="Hold to scroll down"
        aria-label="Hold to scroll feed down"
        onPointerDown={(e) => {
          e.preventDefault()
          if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
            e.currentTarget.setPointerCapture(e.pointerId)
          }
          beginScroll(1)
        }}
        onPointerUp={clearScroll}
        onPointerCancel={clearScroll}
        onLostPointerCapture={clearScroll}
      >
        <span className="material-symbols-outlined text-2xl pointer-events-none">
          expand_more
        </span>
      </button>
    </div>
  )
}
