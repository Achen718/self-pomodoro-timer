import { renderHook, act } from '@testing-library/react';
import { useTimer } from '@/hooks/useTimer/useTimer';

// Mock timer functions
jest.useFakeTimers();

describe('useTimer', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.formattedMinutes).toBe('00');
    expect(result.current.formattedSeconds).toBe('00');
    expect(result.current.isRunning).toBe(false);
  });

  test('should initialize with custom initial time', () => {
    const initialTime = 65; // 1 minute and 5 seconds
    const { result } = renderHook(() => useTimer(initialTime));

    expect(result.current.formattedMinutes).toBe('01');
    expect(result.current.formattedSeconds).toBe('05');
  });

  test('should start the timer', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  test('should increment time when running', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(1000); // Advance by 1 second
    });

    expect(result.current.formattedSeconds).toBe('01');

    act(() => {
      jest.advanceTimersByTime(59000); // Advance by 59 more seconds
    });

    expect(result.current.formattedMinutes).toBe('01');
    expect(result.current.formattedSeconds).toBe('00');
  });

  test('should pause the timer', () => {
    const { result } = renderHook(() => useTimer());

    // start timer
    act(() => {
      result.current.startTimer();
    });

    // Advance time
    act(() => {
      jest.advanceTimersByTime(5000); // Advance by 5 seconds
    });

    // Pause the timer
    act(() => {
      result.current.pauseTimer();
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formattedSeconds).toBe('05');

    // Ensure time doesn't increment while paused
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.formattedSeconds).toBe('05');
  });

  test('should stop and reset the timer', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(10000); // Advance by 10 seconds
      result.current.stopTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.formattedMinutes).toBe('00');
    expect(result.current.formattedSeconds).toBe('00');
  });

  test('should not start multiple timers', () => {
    const { result } = renderHook(() => useTimer());

    // Start timer once
    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(5000); // Advance by 5 seconds
    });

    // Try starting again
    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(5000); // Advance by 5 more seconds
    });

    // Should be 10 seconds total (not running twice as fast)
    expect(result.current.formattedSeconds).toBe('10');
  });

  test('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { result, unmount } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('should format time with leading zeros', () => {
    const { result } = renderHook(() => useTimer(605)); // 10 minutes and 5 seconds

    expect(result.current.formattedMinutes).toBe('10');
    expect(result.current.formattedSeconds).toBe('05');
  });
});
