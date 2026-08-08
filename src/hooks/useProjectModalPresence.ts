import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type ProjectModalPhase = 'open' | 'closing'

export const PROJECT_MODAL_EXIT_FALLBACK_MS = 220

export function useProjectModalPresence<T>(currentValue: T | null) {
  const [retainedValue, setRetainedValue] = useState<T | null>(currentValue)
  const [phase, setPhase] = useState<ProjectModalPhase>('open')
  const [previousValue, setPreviousValue] = useState<T | null>(currentValue)
  const currentValueRef = useRef(currentValue)

  if (currentValue !== previousValue) {
    setPreviousValue(currentValue)

    if (currentValue !== null) {
      setRetainedValue(currentValue)
      setPhase('open')
    } else {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      if (reduceMotion) {
        setRetainedValue(null)
        setPhase('open')
      } else if (retainedValue !== null) {
        setPhase('closing')
      }
    }
  }

  useLayoutEffect(() => {
    currentValueRef.current = currentValue
  }, [currentValue])

  const completeExit = useCallback(() => {
    if (currentValueRef.current !== null) {
      return
    }

    setRetainedValue(null)
    setPhase('open')
  }, [])

  useEffect(() => {
    if (phase !== 'closing' || currentValue !== null) {
      return
    }

    const fallbackTimer = window.setTimeout(completeExit, PROJECT_MODAL_EXIT_FALLBACK_MS)
    return () => window.clearTimeout(fallbackTimer)
  }, [completeExit, currentValue, phase])

  return {
    displayedValue: currentValue ?? retainedValue,
    phase,
    completeExit,
  }
}
