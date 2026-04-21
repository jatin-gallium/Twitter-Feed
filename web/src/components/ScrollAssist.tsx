import { useCallback, useEffect, useRef, type RefObject } from 'react'

type Props = {
  /** Ref to the scrollable feed column (`section` with overflow-y-auto). Same ref object avoids a stale null on first paint. */
  scrollContainerRef: RefObject<HTMLElement | null>
  /** Optional class on the wrapper; do not use `fixed` here — parent should be sticky in the scroll container. */
  className?: string
}

const STEP = 16

/**
 * Hold-to-scroll controls. Must live **inside** the scrollable overflow ancestor
 * (e.g. under a sticky wrapper), not `position: fixed` inside the same scroller
 * — otherwise the buttons scroll away and `fixed` is relative to the wrong box.
 */
export function ScrollAssist({ scrollContainerRef, className = '' }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endListenerRef = useRef<(() => void) | null>(null)

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
    window.removeEventListener('pointerup', fn, true)
    window.removeEventListener('pointercancel', fn, true)
    window.removeEventListener('touchend', fn, true)
    window.removeEventListener('touchcancel', fn, true)
    window.removeEventListener('blur', fn)
    endListenerRef.current = null
  }, [])

  const beginScroll = useCallback(
    (dir: -1 | 1) => {
      clearScroll()
      const tick = () => {
        const el = scrollContainerRef.current
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        if (max <= 0) return
        const next = el.scrollTop + dir * STEP
        el.scrollTop = Math.max(0, Math.min(max, next))
      }
      tick()
      intervalRef.current = setInterval(tick, 16)
    },
    [clearScroll, scrollContainerRef],
  )

  const startHold = useCallback(
    (dir: -1 | 1) => {
      removeEndListeners()
      clearScroll()

      const end = () => {
        removeEndListeners()
        clearScroll()
      }
      endListenerRef.current = end
      window.addEventListener('mouseup', end, true)
      window.addEventListener('pointerup', end, true)
      window.addEventListener('pointercancel', end, true)
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

  const btnClass =
    'h-10 w-10 rounded-full bg-primary text-on-primary shadow-md flex items-center justify-center select-none shrink-0 hover:opacity-95 active:scale-95'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        className={btnClass}
        title="Hold to scroll up"
        aria-label="Hold to scroll feed up"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startHold(-1)
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          startHold(-1)
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
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startHold(1)
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          startHold(1)
        }}
      >
        <span className="material-symbols-outlined text-xl pointer-events-none">
          expand_more
        </span>
      </button>
    </div>
  )
}
