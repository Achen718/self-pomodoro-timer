'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/hooks/useTimer/useTimer';
import useSound from 'use-sound';

export type PomodoroMode = 'work' | 'break';

export interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 50 * 60,
  breakDuration: 10 * 60,
};

export function usePomodoro(customSettings?: Partial<PomodoroSettings>) {
  const settings = { ...DEFAULT_SETTINGS, ...customSettings };
  const [mode, setMode] = useState<PomodoroMode>('work');

  const [playWorkComplete] = useSound('/sounds/arise.mp3');
  const [playBreakComplete] = useSound('/sounds/atomic.mp3');

  // Initialize timer hook
  const {
    formattedMinutes,
    formattedSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    stopTimer,
    isCompleted,
  } = useTimer(0);

  // Compute current max time based on mode
  const currentMaxTime =
    mode === 'work' ? settings.workDuration : settings.breakDuration;

  // Calculate remaining time
  const timeRemaining =
    currentMaxTime -
    (isCompleted
      ? currentMaxTime
      : parseInt(formattedMinutes) * 60 + parseInt(formattedSeconds));
  const remainingMinutes = Math.floor(timeRemaining / 60);
  const remainingSeconds = timeRemaining % 60;
  const formattedRemainingMinutes = String(remainingMinutes).padStart(2, '0');
  const formattedRemainingSeconds = String(remainingSeconds).padStart(2, '0');

  // Handle the transition from work to break mode
  useEffect(() => {
    if (isCompleted && mode === 'work') {
      // Work period completed, switch to break
      playWorkComplete(); // Play sound

      setMode('break');
      stopTimer(); // Reset timer
      startTimer(); // Auto-start break
    }
  }, [isCompleted, mode, startTimer, stopTimer, playWorkComplete]);

  // Handle the completion of break mode
  useEffect(() => {
    // Check if we've reached the break duration
    const isBreakCompleted =
      mode === 'break' &&
      parseInt(formattedMinutes) * 60 + parseInt(formattedSeconds) >=
        settings.breakDuration;

    if (isBreakCompleted) {
      playBreakComplete();

      setMode('work');
      stopTimer(); // Reset timer
      // Don't auto-start the next work session
    }
  }, [
    formattedMinutes,
    formattedSeconds,
    mode,
    settings.breakDuration,
    stopTimer,
    playBreakComplete,
  ]);

  // Reset both timer/mode
  const resetPomodoro = useCallback(
    (mode: PomodoroMode = 'work') => {
      if (mode !== 'work' && mode !== 'break') {
        console.warn(`Invalid mode: ${mode}, defaulting to 'work'`);
        mode = 'work';
      }
      setMode(mode);
      stopTimer();
    },
    [stopTimer]
  );

  return {
    // Timer properties
    formattedMinutes,
    formattedSeconds,
    isRunning,

    // For countdown display
    formattedRemainingMinutes,
    formattedRemainingSeconds,

    // Pomodoro specific properties
    mode,
    isWorkMode: mode === 'work',
    isBreakMode: mode === 'break',

    // Actions
    startPomodoro: startTimer,
    pausePomodoro: pauseTimer,
    stopPomodoro: stopTimer,
    resetPomodoro,

    // Status
    isCompleted,
  };
}
