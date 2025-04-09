type TimerDisplayProps = {
  minutes: string;
  seconds: string;
};

export const TimerDisplay = ({ minutes, seconds }: TimerDisplayProps) => (
  <div className='timer-display__time'>
    {minutes}:{seconds}
  </div>
);
