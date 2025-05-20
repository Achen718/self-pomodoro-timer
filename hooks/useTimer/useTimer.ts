'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

export function useTimer(durationInSeconds: number = 0) {
  const initialDurationMsRef = useRef(durationInSeconds * 1000)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTimeMs, setCurrentTimeMs] = useState(
    initialDurationMsRef.current
  )

  const animationFrameIdRef = useRef<number | null>(null)
  const segmentSystemStartTimeRef = useRef<number | null>(null)
  const timeRemainingAtSegmentStartRef = useRef<number>(
    initialDurationMsRef.current
  )

  const justStoppedRef = useRef(false)
  const completionTimeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const internalClearCompletionTimeout = useCallback(() => {
    if (completionTimeoutIdRef.current) {
      clearTimeout(completionTimeoutIdRef.current)
      completionTimeoutIdRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (!isRunning || segmentSystemStartTimeRef.current === null) {
      return
    }

    const systemElapsedInSegment =
      Date.now() - segmentSystemStartTimeRef.current
    let newCurrentTimeMs =
      timeRemainingAtSegmentStartRef.current - systemElapsedInSegment

    if (newCurrentTimeMs <= 0) {
      newCurrentTimeMs = 0
      setCurrentTimeMs(0)
      setIsRunning(false)
      internalClearCompletionTimeout()
    } else {
      setCurrentTimeMs(newCurrentTimeMs)
      animationFrameIdRef.current = requestAnimationFrame(tick)
    }
  }, [
    isRunning,
    internalClearCompletionTimeout,
    setIsRunning,
    setCurrentTimeMs,
  ])

  useEffect(() => {
    const newInitialDurationMs = durationInSeconds * 1000
    const oldInitialDurationMs = initialDurationMsRef.current

    initialDurationMsRef.current = newInitialDurationMs

    if (!isRunning) {
      if (justStoppedRef.current) {
        setCurrentTimeMs(newInitialDurationMs)
        timeRemainingAtSegmentStartRef.current = newInitialDurationMs
        justStoppedRef.current = false
      } else {
        if (
          currentTimeMs === oldInitialDurationMs &&
          oldInitialDurationMs !== newInitialDurationMs
        ) {
          setCurrentTimeMs(newInitialDurationMs)
          timeRemainingAtSegmentStartRef.current = newInitialDurationMs
        }
      }
    }
  }, [durationInSeconds, isRunning, currentTimeMs])

  useEffect(() => {
    if (isRunning) {
      timeRemainingAtSegmentStartRef.current = currentTimeMs
      segmentSystemStartTimeRef.current = Date.now()
      animationFrameIdRef.current = requestAnimationFrame(tick)

      internalClearCompletionTimeout()
      if (currentTimeMs > 0) {
        completionTimeoutIdRef.current = setTimeout(() => {
          setCurrentTimeMs(0)
          setIsRunning(false)
        }, currentTimeMs)
      }
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      internalClearCompletionTimeout()
      segmentSystemStartTimeRef.current = null
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      internalClearCompletionTimeout()
    }
  }, [
    isRunning,
    tick,
    currentTimeMs,
    internalClearCompletionTimeout,
    setCurrentTimeMs,
    setIsRunning,
  ])

  const startTimer = useCallback(() => {
    if (!isRunning) {
      if (currentTimeMs <= 0) {
        setCurrentTimeMs(initialDurationMsRef.current)
      }
      justStoppedRef.current = false
      setIsRunning(true)
    }
  }, [isRunning, currentTimeMs, setIsRunning, setCurrentTimeMs])

  const pauseTimer = useCallback(() => {
    if (isRunning) {
      justStoppedRef.current = false
      setIsRunning(false)
    }
  }, [isRunning, setIsRunning])

  const stopTimer = useCallback(() => {
    setIsRunning(false)
    setCurrentTimeMs(initialDurationMsRef.current)
    justStoppedRef.current = true
    internalClearCompletionTimeout()
  }, [internalClearCompletionTimeout, setIsRunning, setCurrentTimeMs])

  const totalRemainingSeconds = Math.max(0, Math.floor(currentTimeMs / 1000))
  const rawMinutes = Math.floor(totalRemainingSeconds / 60)
  const rawSeconds = totalRemainingSeconds % 60

  const formattedMinutes = String(rawMinutes).padStart(2, '0')
  const formattedSeconds = String(rawSeconds).padStart(2, '0')

  const isCompleted = currentTimeMs <= 0 && !isRunning

  return {
    formattedMinutes,
    formattedSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    stopTimer,
    isCompleted,
  }
}
