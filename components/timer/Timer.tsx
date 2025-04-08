'use client';

import { useState, useRef } from 'react';
import { Button } from '../ui/button';

const defaultTimer = {
  time: 0,
  isRunning: false,
};

const Timer = () => {
  // set default display time
  const [displayTimer, setdisplayTimer] = useState(defaultTimer);
  // set interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // format time to display
  const seconds = String(displayTimer.time % 60).padStart(2, '0');
  const minutes = String(Math.floor(displayTimer.time / 60) % 60).padStart(
    2,
    '0'
  );

  // start timer
  const handleStartTimer = () => {
    // if timer running not running, start it
    if (!displayTimer.isRunning) {
      // set interval ID
      intervalRef.current = setInterval(() => {
        // update display time
        setdisplayTimer((prev) => {
          return { ...prev, time: prev.time + 1, isRunning: true };
        });
      }, 1000);
    }
  };

  const handlePauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setdisplayTimer((prev) => {
      return { ...prev, isRunning: false };
    });
  };

  const handleStopTimer = () => {
    if (!displayTimer.isRunning && !intervalRef.current) {
      setdisplayTimer((prev) => {
        return { ...prev, time: 0, isRunning: false };
      });
    }
  };

  return (
    <div>
      Timer component:
      <div className='timer-display'>
        <div className='timer-display__time'>
          {minutes}:{seconds}
        </div>
        <Button
          onClick={handleStartTimer}
          className='timer-display__button'
          variant='outline'
          size='sm'
        >
          Start
        </Button>
        <Button
          className='timer-display__button'
          variant='outline'
          size='sm'
          onClick={handlePauseTimer}
        >
          Pause
        </Button>
        <Button
          className='timer-display__button'
          variant='outline'
          size='sm'
          onClick={handleStopTimer}
        >
          Stop
        </Button>
      </div>
    </div>
  );
};

export default Timer;
