'use client';

import { useTimer } from '@/hooks/useTimer/useTimer';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';

const Timer = () => {
  const {
    formattedMinutes,
    formattedSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    stopTimer,
  } = useTimer();

  return (
    <div>
      <TimerDisplay minutes={formattedMinutes} seconds={formattedSeconds} />
      <TimerControls
        isRunning={isRunning}
        onStart={startTimer}
        onPause={pauseTimer}
        onStop={stopTimer}
      />
    </div>
  );
};

export default Timer;
