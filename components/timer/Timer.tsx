'use client';

import { Button } from '@/components/ui/button';
import { useTimer } from '@/hooks/useTimer';

const Timer = () => {
  const {
    formattedMinutes,
    formattedSeconds,
    startTimer,
    pauseTimer,
    stopTimer,
  } = useTimer();

  return (
    <div>
      Timer component:
      <div className='timer-display'>
        <div className='timer-display__time'>
          {formattedMinutes}:{formattedSeconds}
        </div>
        <Button
          onClick={startTimer}
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
          onClick={pauseTimer}
        >
          Pause
        </Button>
        <Button
          className='timer-display__button'
          variant='outline'
          size='sm'
          onClick={stopTimer}
        >
          Stop
        </Button>
      </div>
    </div>
  );
};

export default Timer;
