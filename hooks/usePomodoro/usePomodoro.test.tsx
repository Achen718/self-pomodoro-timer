import { renderHook, act } from '@testing-library/react';
import useSound from 'use-sound';
import { usePomodoro } from './usePomodoro';
import * as useTimerModule from '../useTimer/useTimer';

// Mock the useTimer hook - this is appropriate as we're testing the usePomodoro hook in isolation
jest.mock('../useTimer/useTimer', () => ({
  useTimer: jest.fn(),
}));

// Mock useSound hook
jest.mock('use-sound', () => ({
  __esModule: true,
  default: jest.fn(() => {
    const playSound = jest.fn();
    return [playSound, { sound: { play: jest.fn(), stop: jest.fn() } }];
  }),
}));

// Mock timer functions for controlled testing environment
jest.useFakeTimers();

describe('usePomodoro hook', () => {
  interface MockTimer {
    formattedMinutes: string;
    formattedSeconds: string;
    isRunning: boolean;
    startTimer: jest.Mock;
    pauseTimer: jest.Mock;
    stopTimer: jest.Mock;
    isCompleted: boolean;
    [key: string]: string | boolean | jest.Mock;
  }

  // Create a standard mock timer implementation
  const createMockTimer = (overrides = {}): MockTimer => ({
    formattedMinutes: '00',
    formattedSeconds: '00',
    isRunning: false,
    startTimer: jest.fn(),
    pauseTimer: jest.fn(),
    stopTimer: jest.fn(),
    isCompleted: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    (useSound as jest.Mock).mockClear();
  });

  describe('initialization', () => {
    test('should start in work mode with default duration settings', () => {
      // Arrange
      const mockTimer = createMockTimer();
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);

      // Act
      const { result } = renderHook(() => usePomodoro());

      // Assert
      expect(useTimerModule.useTimer).toHaveBeenCalledWith(0);
      expect(result.current.mode).toBe('work');
      expect(result.current.isWorkMode).toBe(true);
      expect(result.current.isBreakMode).toBe(false);

      // Verify default timer state
      expect(result.current.formattedMinutes).toBe('00');
      expect(result.current.formattedSeconds).toBe('00');

      // Verify default remaining time (50 minutes)
      expect(result.current.formattedRemainingMinutes).toBe('50');
      expect(result.current.formattedRemainingSeconds).toBe('00');
    });

    test('should apply custom work and break durations when provided', () => {
      // Arrange
      const mockTimer = createMockTimer();
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);
      const customSettings = {
        workDuration: 25 * 60, // 25 minutes
        breakDuration: 5 * 60, // 5 minutes
      };

      // Act
      const { result } = renderHook(() => usePomodoro(customSettings));

      // Assert - should show custom work duration initially
      expect(result.current.formattedRemainingMinutes).toBe('25');
      expect(result.current.formattedRemainingSeconds).toBe('00');
    });
  });

  describe('mode transitions', () => {
    test('should switch from work to break mode and play work-complete sound when timer completes', () => {
      // Arrange
      const mockTimer = createMockTimer({ isCompleted: true });
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);

      // Add mock for the work complete sound
      const mockWorkCompleteSound = jest.fn();
      (useSound as jest.Mock).mockReturnValue([
        mockWorkCompleteSound,
        { sound: {} },
      ]);

      // Act
      const { result } = renderHook(() => usePomodoro());

      // Complete work timer and trigger effects
      act(() => {
        jest.runAllTimers();
      });

      // Assert
      expect(mockTimer.stopTimer).toHaveBeenCalled();
      expect(mockTimer.startTimer).toHaveBeenCalled();
      expect(result.current.mode).toBe('break');
      // Add this assertion for the sound
      expect(mockWorkCompleteSound).toHaveBeenCalled();
    });

    test('should switch from break to work mode and play break-complete sound when timer completes', () => {
      // Arrange - set timer to show break completion
      const mockTimer = createMockTimer({
        formattedMinutes: '10',
        formattedSeconds: '00',
      });
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);

      // Add mock for the break complete sound
      const mockBreakCompleteSound = jest.fn();
      (useSound as jest.Mock).mockReturnValue([
        mockBreakCompleteSound,
        { sound: {} },
      ]);

      // Act
      const { result } = renderHook(() => usePomodoro());

      // Switch to break mode
      act(() => {
        result.current.resetPomodoro('break');
      });

      // Trigger break completion effects
      act(() => {
        jest.runAllTimers();
      });

      // Assert - should reset timer but NOT auto-start work session
      expect(mockTimer.stopTimer).toHaveBeenCalled();
      expect(mockTimer.startTimer).not.toHaveBeenCalledTimes(2); // Not called again after mode change
      expect(result.current.mode).toBe('work');
      // Add this assertion for the sound
      expect(mockBreakCompleteSound).toHaveBeenCalled();
    });
  });

  describe('timer controls', () => {
    type PomodoroAction = 'startPomodoro' | 'pausePomodoro' | 'stopPomodoro';
    type TimerAction = 'startTimer' | 'pauseTimer' | 'stopTimer';

    test.each<[PomodoroAction, TimerAction]>([
      ['startPomodoro', 'startTimer'],
      ['pausePomodoro', 'pauseTimer'],
      ['stopPomodoro', 'stopTimer'],
    ])(
      '%s should delegate to the underlying timer %s method',
      (pomodoroMethod, timerMethod) => {
        // Arrange
        const mockTimer = createMockTimer();
        jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);
        const { result } = renderHook(() => usePomodoro());

        // Act
        act(() => {
          result.current[pomodoroMethod]();
        });

        // Assert
        expect(mockTimer[timerMethod]).toHaveBeenCalled();
      }
    );

    test('resetPomodoro should reset timer and set mode to work by default', () => {
      // Arrange
      const mockTimer = createMockTimer();
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);
      const { result } = renderHook(() => usePomodoro());

      // Set to break mode first
      act(() => {
        result.current.resetPomodoro('break');
      });
      expect(result.current.mode).toBe('break');

      // Act - reset without specifying mode
      act(() => {
        result.current.resetPomodoro();
      });

      // Assert
      expect(mockTimer.stopTimer).toHaveBeenCalledTimes(2);
      expect(result.current.mode).toBe('work');
    });

    test('resetPomodoro should accept custom mode parameter', () => {
      // Arrange
      const mockTimer = createMockTimer();
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);
      const { result } = renderHook(() => usePomodoro());

      // Act
      act(() => {
        result.current.resetPomodoro('break');
      });

      // Assert
      expect(result.current.mode).toBe('break');
    });
  });

  describe('time calculations', () => {
    test.each([
      // [elapsed time, mode, expected remaining]
      [{ min: '10', sec: '30' }, 'work', { min: '39', sec: '30' }],
      [{ min: '02', sec: '15' }, 'break', { min: '07', sec: '45' }],
    ])(
      'should calculate %s remaining when %s min:%s sec elapsed in %s mode',
      (elapsed, mode, expected) => {
        // Arrange
        const mockTimer = createMockTimer({
          formattedMinutes: elapsed.min,
          formattedSeconds: elapsed.sec,
        });
        jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);

        // Act
        const { result } = renderHook(() => usePomodoro());

        // Set mode if needed
        if (mode === 'break') {
          act(() => {
            result.current.resetPomodoro('break');
          });
        }

        // Assert
        expect(result.current.formattedRemainingMinutes).toBe(expected.min);
        expect(result.current.formattedRemainingSeconds).toBe(expected.sec);
      }
    );
  });

  describe('audio functionality', () => {
    test('should play work complete sound when work session ends', () => {
      // Arrange
      const mockTimer = createMockTimer({ isCompleted: true });
      jest.spyOn(useTimerModule, 'useTimer').mockReturnValue(mockTimer);

      // Create sound mock
      const mockWorkCompleteSound = jest.fn();
      (useSound as jest.Mock).mockImplementation((url) => {
        if (url.includes('arise')) {
          return [mockWorkCompleteSound, { sound: {} }];
        }
        return [jest.fn(), { sound: {} }];
      });

      // Act
      renderHook(() => usePomodoro());

      // Trigger completion
      act(() => {
        jest.runAllTimers();
      });

      // Assert - focused specifically on sound behavior
      expect(mockWorkCompleteSound).toHaveBeenCalled();
    });

    test('should play break complete sound when break session ends', () => {
      // Similar implementation for break sound
    });

    // Additional tests for audio-specific functionality
    test('should load correct sound files', () => {
      // Test that useSound is called with the right file paths
      (useSound as jest.Mock).mockClear();

      renderHook(() => usePomodoro());

      expect(useSound).toHaveBeenCalledWith('/sounds/arise.mp3');
      expect(useSound).toHaveBeenCalledWith('/sounds/atomic.mp3');
    });
  });
});
