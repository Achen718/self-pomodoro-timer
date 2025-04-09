'use client';
import { useState, useRef, useEffect } from 'react';

// Define constant for 50 minutes in seconds
const MAX_TIME = 50 * 60;

export interface TimerState {
  time: number;
  isRunning: boolean;
}

export function useTimer(initialTime: number = 0) {
  const [timer, setTimer] = useState<TimerState>({
    time: initialTime,
    isRunning: false,
  });
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    if (!timer.isRunning) {
      setTimer((prev) => ({ ...prev, isRunning: true }));
      intervalRef.current = window.setInterval(() => {
        setTimer((prev) => {
          const nextTime = prev.time + 1;

          // Check if we've reached the 50-minute mark
          if (nextTime >= MAX_TIME) {
            // Auto-stop the timer
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return { time: MAX_TIME, isRunning: false };
          }

          return { ...prev, time: nextTime };
        });
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (timer.isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTimer((prev) => ({ ...prev, isRunning: false }));
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimer({ time: 0, isRunning: false });
  };

  // Clear interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const rawMinutes = Math.floor(timer.time / 60);
  const rawSeconds = timer.time % 60;

  // Format time -- 00:00
  const formattedMinutes = String(rawMinutes).padStart(2, '0');
  const formattedSeconds = String(rawSeconds).padStart(2, '0');

  return {
    formattedMinutes,
    formattedSeconds,
    isRunning: timer.isRunning,
    startTimer,
    pauseTimer,
    stopTimer,
    // Additional property to indicate if timer has reached max time
    isCompleted: timer.time >= MAX_TIME,
  };
}
