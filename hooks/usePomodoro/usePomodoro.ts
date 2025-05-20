'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTimer } from '@/hooks/useTimer/useTimer'
import useSound from 'use-sound'

export type PomodoroMode = 'work' | 'break'

export interface PomodoroSettings {
  workDuration: number
  breakDuration: number
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 50 * 60,
  breakDuration: 10 * 60,
}

export function usePomodoro(customSettings?: Partial<PomodoroSettings>) {
  const settings = { ...DEFAULT_SETTINGS, ...customSettings }
  const [mode, setMode] = useState<PomodoroMode>('work')

  const currentTimerDuration =
    mode === 'work' ? settings.workDuration : settings.breakDuration

  const [needsToAutoStartBreak, setNeedsToAutoStartBreak] = useState(false)

  const [playWorkComplete] = useSound('/sounds/arise.mp3')
  const [playBreakComplete] = useSound('/sounds/atomic.mp3')

  const {
    formattedMinutes,
    formattedSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    stopTimer,
    isCompleted,
  } = useTimer(currentTimerDuration)

  useEffect(() => {
    if (isCompleted && mode === 'work') {
      playWorkComplete()
      stopTimer()
      setMode('break')
      setNeedsToAutoStartBreak(true)
    }
  }, [isCompleted, mode, playWorkComplete, stopTimer])

  useEffect(() => {
    if (needsToAutoStartBreak && mode === 'break' && !isRunning) {
      startTimer()
      setNeedsToAutoStartBreak(false)
    }
  }, [needsToAutoStartBreak, mode, isRunning, startTimer])

  useEffect(() => {
    if (isCompleted && mode === 'break') {
      playBreakComplete()
      stopTimer()
      setMode('work')
    }
  }, [isCompleted, mode, playBreakComplete, stopTimer])

  const resetPomodoro = useCallback(
    (newMode: PomodoroMode = 'work') => {
      let validMode = newMode
      if (newMode !== 'work' && newMode !== 'break') {
        console.warn(`Invalid mode: ${newMode}, defaulting to 'work'`)
        validMode = 'work'
      }
      setMode(validMode)
      stopTimer()
      setNeedsToAutoStartBreak(false)
    },
    [stopTimer]
  )

  return {
    formattedMinutes,
    formattedSeconds,
    isRunning,

    mode,
    isWorkMode: mode === 'work',
    isBreakMode: mode === 'break',

    startPomodoro: startTimer,
    pausePomodoro: pauseTimer,
    stopPomodoro: stopTimer,
    resetPomodoro,

    isCompleted,
  }
}
