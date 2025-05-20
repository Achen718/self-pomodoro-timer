import { renderHook, act } from '@testing-library/react'
import { usePomodoro } from './usePomodoro'
import * as useTimerModule from '../useTimer/useTimer'
import useSound from 'use-sound'

jest.mock('../useTimer/useTimer', () => ({
  useTimer: jest.fn(),
}))

jest.mock('use-sound', () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe('usePomodoro hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(useTimerModule.useTimer).mockReturnValue({
      formattedMinutes: '00',
      formattedSeconds: '00',
      isRunning: false,
      startTimer: jest.fn(),
      pauseTimer: jest.fn(),
      stopTimer: jest.fn(),
      isCompleted: false,
    })

    jest.mocked(useSound).mockImplementation(() => [
      jest.fn(),
      {
        sound: null,
        stop: jest.fn(),
        pause: jest.fn(),
        duration: null,
      },
    ])
  })

  describe('initialization', () => {
    test('defaults to work mode', () => {
      const { result, unmount } = renderHook(() => usePomodoro())

      expect(result.current.mode).toBe('work')
      expect(result.current.isWorkMode).toBe(true)
      expect(result.current.isBreakMode).toBe(false)

      unmount()
    })

    test('uses default durations', () => {
      renderHook(() => usePomodoro())

      expect(useTimerModule.useTimer).toHaveBeenCalledWith(50 * 60)
    })

    test('accepts custom durations', () => {
      const customSettings = { workDuration: 25 * 60, breakDuration: 5 * 60 }
      renderHook(() => usePomodoro(customSettings))

      expect(useTimerModule.useTimer).toHaveBeenCalledWith(25 * 60)
    })
  })

  describe('timer controls', () => {
    test('startPomodoro delegates to startTimer', () => {
      const mockStartTimer = jest.fn()
      jest.mocked(useTimerModule.useTimer).mockReturnValueOnce({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: mockStartTimer,
        pauseTimer: jest.fn(),
        stopTimer: jest.fn(),
        isCompleted: false,
      })

      const { result, unmount } = renderHook(() => usePomodoro())

      act(() => {
        result.current.startPomodoro()
      })

      expect(mockStartTimer).toHaveBeenCalled()
      unmount()
    })

    test('pausePomodoro delegates to pauseTimer', () => {
      const mockPauseTimer = jest.fn()
      jest.mocked(useTimerModule.useTimer).mockReturnValueOnce({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: true,
        startTimer: jest.fn(),
        pauseTimer: mockPauseTimer,
        stopTimer: jest.fn(),
        isCompleted: false,
      })

      const { result, unmount } = renderHook(() => usePomodoro())

      act(() => {
        result.current.pausePomodoro()
      })

      expect(mockPauseTimer).toHaveBeenCalled()
      unmount()
    })

    test('resetPomodoro changes mode and stops timer', () => {
      const mockStopTimer = jest.fn()
      jest.mocked(useTimerModule.useTimer).mockReturnValue({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        stopTimer: mockStopTimer,
        isCompleted: false,
      })

      const { result, unmount } = renderHook(() => usePomodoro())

      act(() => {
        result.current.resetPomodoro('break')
      })

      expect(result.current.mode).toBe('break')
      expect(mockStopTimer).toHaveBeenCalled()
      unmount()
    })
  })

  describe('mode transitions', () => {
    test('work completion triggers break mode with sound', () => {
      const mockPlayWorkSound = jest.fn()
      const mockStopTimer = jest.fn()

      jest.mocked(useSound).mockImplementation((soundFile) => {
        if (typeof soundFile === 'string' && soundFile.includes('arise')) {
          return [
            mockPlayWorkSound,
            {
              sound: null,
              stop: jest.fn(),
              pause: jest.fn(),
              duration: null,
            },
          ]
        }
        return [
          jest.fn(),
          {
            sound: null,
            stop: jest.fn(),
            pause: jest.fn(),
            duration: null,
          },
        ]
      })

      jest.mocked(useTimerModule.useTimer).mockReturnValueOnce({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        stopTimer: mockStopTimer,
        isCompleted: true,
      })

      const { result, unmount } = renderHook(() => usePomodoro())

      act(() => {})

      expect(result.current.mode).toBe('break')
      expect(mockPlayWorkSound).toHaveBeenCalled()
      expect(mockStopTimer).toHaveBeenCalled()
      unmount()
    })

    test('break completion triggers work mode with sound', () => {
      const mockPlayBreakSound = jest.fn()
      const mockStopTimer = jest.fn()

      jest.mocked(useSound).mockImplementation((soundFile) => {
        if (typeof soundFile === 'string' && soundFile.includes('atomic')) {
          return [
            mockPlayBreakSound,
            {
              sound: null,
              stop: jest.fn(),
              pause: jest.fn(),
              duration: null,
            },
          ]
        }
        return [
          jest.fn(),
          {
            sound: null,
            stop: jest.fn(),
            pause: jest.fn(),
            duration: null,
          },
        ]
      })

      const { result, rerender, unmount } = renderHook(() => usePomodoro())

      act(() => {
        result.current.resetPomodoro('break')
      })

      jest.mocked(useTimerModule.useTimer).mockReturnValueOnce({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        stopTimer: mockStopTimer,
        isCompleted: true,
      })

      rerender()

      act(() => {})

      expect(result.current.mode).toBe('work')
      expect(mockPlayBreakSound).toHaveBeenCalled()
      expect(mockStopTimer).toHaveBeenCalled()
      unmount()
    })

    test('break mode auto-starts after work completes', () => {
      const mockStartTimerForBreakSession = jest.fn()
      const mockStopTimerForWorkSession = jest.fn()

      const workTimerCompletedMock = {
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        stopTimer: mockStopTimerForWorkSession,
        isCompleted: true,
      }

      const breakTimerToAutoStartMock = {
        formattedMinutes: '05',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: mockStartTimerForBreakSession,
        pauseTimer: jest.fn(),
        stopTimer: jest.fn(),
        isCompleted: false,
      }

      jest
        .mocked(useTimerModule.useTimer)
        .mockReturnValueOnce(workTimerCompletedMock)
        .mockReturnValueOnce(breakTimerToAutoStartMock)

      const { result, rerender, unmount } = renderHook(() => usePomodoro())

      act(() => {
        rerender()
      })

      expect(result.current.mode).toBe('break')
      expect(mockStopTimerForWorkSession).toHaveBeenCalled()
      expect(mockStartTimerForBreakSession).toHaveBeenCalled()

      unmount()
    })

    test('work mode does NOT auto-start after break completes', () => {
      const mockStartTimer = jest.fn()

      const { result, rerender, unmount } = renderHook(() => usePomodoro())

      act(() => {
        result.current.resetPomodoro('break')
      })

      jest.mocked(useTimerModule.useTimer).mockReturnValueOnce({
        formattedMinutes: '00',
        formattedSeconds: '00',
        isRunning: false,
        startTimer: mockStartTimer,
        pauseTimer: jest.fn(),
        stopTimer: jest.fn(),
        isCompleted: true,
      })

      rerender()

      expect(result.current.mode).toBe('work')
      expect(mockStartTimer).not.toHaveBeenCalled()

      unmount()
    })
  })
})
