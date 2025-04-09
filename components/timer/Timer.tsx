'use client';

import { usePomodoro } from '@/hooks/usePomodoro/usePomodoro';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';

const Timer = () => {
  const {
    formattedMinutes,
    formattedSeconds,
    isRunning,
    mode,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
  } = usePomodoro();

  return (
    <div>
      <div className='timer-mode'>
        {mode === 'work' ? 'Focus Time' : 'Break Time'}
      </div>
      <TimerDisplay minutes={formattedMinutes} seconds={formattedSeconds} />
      <TimerControls
        isRunning={isRunning}
        onStart={startPomodoro}
        onPause={pausePomodoro}
        onStop={resetPomodoro}
      />
    </div>
  );
};

export default Timer;
