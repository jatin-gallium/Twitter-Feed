import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

type Props = {
  /** Feed body only — never scroll `documentElement` or the toolbar will move with the page. */
  scrollContainerRef: RefObject<HTMLElement | null>
  className?: string
}

const STEP = 48

/**
 * Hold-to-scroll: pointer capture keeps the gesture on the button; window-level
 * listeners stop scrolling when the pointer is released anywhere.
 */
export function ScrollAssist({ scrollContainerRef, className = '' }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endListenerRef = useRef<((native: Event) => void) | null>(null)
  const activePointerIdRef = useRef<number | null>(null)

  const clearScroll = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const removeEndListeners = useCallback(() => {
    const fn = endListenerRef.current
    if (!fn) return
    window.removeEventListener('pointerup', fn, true)
    window.removeEventListener('pointercancel', fn, true)
    window.removeEventListener('mouseup', fn, true)
    window.removeEventListener('touchend', fn, true)
    window.removeEventListener('touchcancel', fn, true)
    window.removeEventListener('blur', fn)
    endListenerRef.current = null
    activePointerIdRef.current = null
  }, [])

  const beginScroll = useCallback(
    (dir: -1 | 1) => {
      clearScroll()
      const tick = () => {
        const el = scrollContainerRef.current
        if (!el) {
          clearScroll()
          return
        }
        const max = el.scrollHeight - el.clientHeight
        if (max <= 0) {
          clearScroll()
          return
        }
        const next = el.scrollTop + dir * STEP
        el.scrollTop = Math.max(0, Math.min(max, next))
      }
      tick()
      const el = scrollContainerRef.current
      if (el && el.scrollHeight - el.clientHeight > 0) {
        intervalRef.current = setInterval(tick, 32)
      }
    },
    [clearScroll, scrollContainerRef],
  )

  const startHold = useCallback(
    (dir: -1 | 1, ev: ReactPointerEvent<HTMLButtonElement>) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return

      removeEndListeners()
      clearScroll()

      const pointerId = ev.pointerId
      activePointerIdRef.current = pointerId

      const end = (native?: Event) => {
        if (
          native &&
          'pointerId' in native &&
          activePointerIdRef.current != null
        ) {
          const pid = (native as PointerEvent).pointerId
          if (pid !== activePointerIdRef.current) return
        }
        removeEndListeners()
        clearScroll()
        try {
          ev.currentTarget.releasePointerCapture(pointerId)
        } catch {
          /* not captured */
        }
      }

      const onWindowEnd = (native: Event) => end(native)
      endListenerRef.current = onWindowEnd
      window.addEventListener('pointerup', onWindowEnd, true)
      window.addEventListener('pointercancel', onWindowEnd, true)
      window.addEventListener('mouseup', onWindowEnd, true)
      window.addEventListener('touchend', onWindowEnd, true)
      window.addEventListener('touchcancel', onWindowEnd, true)
      window.addEventListener('blur', onWindowEnd)

      try {
        ev.currentTarget.setPointerCapture(pointerId)
      } catch {
        /* touch / older browsers */
      }

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

  const btnClass =
    'h-11 w-11 rounded-full bg-primary text-on-primary shadow-md flex items-center justify-center select-none shrink-0 hover:opacity-95 active:scale-95 touch-manipulation'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        className={btnClass}
        title="Hold to scroll up"
        aria-label="Hold to scroll feed up"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startHold(-1, e)
        }}
      >
        <span className="material-symbols-outlined text-xl pointer-events-none">
          expand_less
        </span>
      </button>
      <button
        type="button"
        className={btnClass}
        title="Hold to scroll down"
        aria-label="Hold to scroll feed down"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startHold(1, e)
        }}
      >
        <span className="material-symbols-outlined text-xl pointer-events-none">
          expand_more
        </span>
      </button>
    </div>
  )
}
