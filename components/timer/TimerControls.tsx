import { Button } from '@/components/ui/button';

type TimerControlsProps = {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
};

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onStop,
}: TimerControlsProps) => (
  <div className='timer-controls'>
    {!isRunning ? (
      <Button onClick={onStart} variant='outline' size='sm'>
        Start
      </Button>
    ) : (
      <Button onClick={onPause} variant='outline' size='sm'>
        Pause
      </Button>
    )}
    <Button onClick={onStop} variant='outline' size='sm'>
      Reset
    </Button>
  </div>
);
