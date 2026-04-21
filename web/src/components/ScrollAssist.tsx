import { useCallback, useEffect, useRef } from 'react'

type Props = {
  scrollEl: HTMLElement | null
}

const STEP = 14

export function ScrollAssist({ scrollEl }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollElRef = useRef<HTMLElement | null>(null)
  const listeningRef = useRef(false)
  const endListenerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    scrollElRef.current = scrollEl
  }, [scrollEl])

  const clearScroll = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const removeEndListeners = useCallback(() => {
    const fn = endListenerRef.current
    if (!fn) return
    window.removeEventListener('mouseup', fn, true)
    window.removeEventListener('mouseleave', fn, true)
    window.removeEventListener('touchend', fn, true)
    window.removeEventListener('touchcancel', fn, true)
    window.removeEventListener('blur', fn)
    endListenerRef.current = null
    listeningRef.current = false
  }, [])

  const beginScroll = useCallback((dir: -1 | 1) => {
    clearScroll()
    const tick = () => {
      const el = scrollElRef.current
      if (!el) return
      const max = el.scrollHeight - el.clientHeight
      if (max <= 0) return
      const next = el.scrollTop + dir * STEP
      el.scrollTop = Math.max(0, Math.min(max, next))
    }
    tick()
    intervalRef.current = setInterval(tick, 16)
  }, [clearScroll])

  const startHold = useCallback(
    (dir: -1 | 1) => {
      removeEndListeners()
      clearScroll()

      const end = () => {
        removeEndListeners()
        clearScroll()
      }
      endListenerRef.current = end
      listeningRef.current = true
      window.addEventListener('mouseup', end, true)
      window.addEventListener('mouseleave', end, true)
      window.addEventListener('touchend', end, true)
      window.addEventListener('touchcancel', end, true)
      window.addEventListener('blur', end)

      beginScroll(dir)
    },
    [beginScroll, clearScroll, removeEndListeners],
  )

  useEffect(() => {
    return () => {
      removeEndListeners()
      clearScroll()
    }
  }, [removeEndListeners, clearScroll])

  return (
    <div className="fixed right-3 bottom-20 z-[200] flex flex-col gap-2 md:right-5 md:bottom-8 pointer-events-auto">
      <button
        type="button"
        className="h-12 w-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25 flex items-center justify-center select-none touch-none active:scale-95 transition-transform"
        title="Hold to scroll up"
        aria-label="Hold to scroll feed up"
        onMouseDown={(e) => {
          e.preventDefault()
          startHold(-1)
        }}
        onTouchStart={() => {
          startHold(-1)
        }}
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
        onMouseDown={(e) => {
          e.preventDefault()
          startHold(1)
        }}
        onTouchStart={() => {
          startHold(1)
        }}
      >
        <span className="material-symbols-outlined text-2xl pointer-events-none">
          expand_more
        </span>
      </button>
    </div>
  )
}
