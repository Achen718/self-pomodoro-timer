import { renderHook, act } from '@testing-library/react'
import { useTimer } from '@/hooks/useTimer/useTimer'

jest.useFakeTimers()

interface RAFSpy extends jest.SpyInstance<number, [FrameRequestCallback]> {
  runLastCallback?: (time: number) => void
}

describe('useTimer hook', () => {
  let dateNowSpy: jest.SpyInstance<number, []>
  let requestAnimationFrameSpy: RAFSpy
  let cancelAnimationFrameSpy: jest.SpyInstance<void, [number]>
  let setTimeoutSpy: jest.SpyInstance
  let clearTimeoutSpy: jest.SpyInstance

  let rAFCallbacks: Map<number, FrameRequestCallback>
  let nextRAFId: number

  beforeEach(() => {
    jest.clearAllTimers()
    dateNowSpy = jest.spyOn(Date, 'now')

    rAFCallbacks = new Map()
    nextRAFId = 1

    requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        const id = nextRAFId++
        rAFCallbacks.set(id, cb)
        return id
      }) as RAFSpy

    requestAnimationFrameSpy.runLastCallback = (time: number) => {
      const lastId = Math.max(
        ...(rAFCallbacks.size ? [...rAFCallbacks.keys()] : [0])
      )
      const cb = rAFCallbacks.get(lastId)
      if (cb) cb(time)
    }

    cancelAnimationFrameSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id: number) => {
        rAFCallbacks.delete(id)
      })

    setTimeoutSpy = jest.spyOn(window, 'setTimeout')
    clearTimeoutSpy = jest.spyOn(window, 'clearTimeout')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    rAFCallbacks.clear()
  })

  describe('initialization', () => {
    it('should initialize with default duration 0, isRunning false, isCompleted true', () => {
      const { result } = renderHook(() => useTimer())
      expect(result.current.formattedMinutes).toBe('00')
      expect(result.current.formattedSeconds).toBe('00')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isCompleted).toBe(true)
    })

    it('should initialize with custom duration, isRunning false, isCompleted false', () => {
      const initialTimeSeconds = 65
      const { result } = renderHook(() => useTimer(initialTimeSeconds))
      expect(result.current.formattedMinutes).toBe('01')
      expect(result.current.formattedSeconds).toBe('05')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isCompleted).toBe(false)
    })
  })

  describe('timer operations', () => {
    it('startTimer should start the timer, set isRunning to true, and schedule rAF and setTimeout', () => {
      const { result } = renderHook(() => useTimer(10))
      act(() => {
        result.current.startTimer()
      })
      expect(result.current.isRunning).toBe(true)
      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    })

    it(' should reset startTimer to full duration if starting from 0 and previously completed', () => {
      const { result } = renderHook(() => useTimer(10))
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })
      act(() => {
        dateNowSpy.mockReturnValue(10000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.isCompleted).toBe(true)
      expect(result.current.formattedSeconds).toBe('00')

      act(() => {
        result.current.startTimer()
      })
      expect(result.current.isRunning).toBe(true)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.formattedSeconds).toBe('10')
    })

    it('should decrement time when running (via rAF)', () => {
      const { result } = renderHook(() => useTimer(5))
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })

      act(() => {
        dateNowSpy.mockReturnValue(1000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.formattedSeconds).toBe('04')
      expect(result.current.isRunning).toBe(true)

      act(() => {
        dateNowSpy.mockReturnValue(3000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.formattedSeconds).toBe('02')
    })

    it('pauseTimer should pause the timer, preserve time, and clear rAF/setTimeout', () => {
      const { result } = renderHook(() => useTimer(10))
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })
      act(() => {
        dateNowSpy.mockReturnValue(3000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.formattedSeconds).toBe('07')

      cancelAnimationFrameSpy.mockClear()
      clearTimeoutSpy.mockClear()

      act(() => {
        result.current.pauseTimer()
      })
      expect(result.current.isRunning).toBe(false)
      expect(result.current.formattedSeconds).toBe('07')

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
      expect(clearTimeoutSpy).toHaveBeenCalled()

      act(() => {
        dateNowSpy.mockReturnValue(5000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.formattedSeconds).toBe('07')
    })

    it('stopTimer should stop, reset the timer to initial duration, and clear rAF/setTimeout', () => {
      const { result } = renderHook(() => useTimer(10))
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })
      act(() => {
        dateNowSpy.mockReturnValue(3000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.formattedSeconds).toBe('07')

      cancelAnimationFrameSpy.mockClear()
      clearTimeoutSpy.mockClear()

      act(() => {
        result.current.stopTimer()
      })
      expect(result.current.isRunning).toBe(false)
      expect(result.current.formattedMinutes).toBe('00')
      expect(result.current.formattedSeconds).toBe('10')
      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('timer completion and isCompleted state', () => {
    it('should complete when time runs out (via rAF), setting isRunning false, isCompleted true', () => {
      const { result } = renderHook(() => useTimer(1))
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })
      act(() => {
        dateNowSpy.mockReturnValue(1000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isCompleted).toBe(true)
      expect(result.current.formattedSeconds).toBe('00')
    })

    it('should complete when time runs out (via setTimeout fallback), setting isRunning false, isCompleted true', () => {
      requestAnimationFrameSpy.mockImplementation(() => 0)
      const { result } = renderHook(() => useTimer(1))
      act(() => {
        result.current.startTimer()
      })
      act(() => {
        jest.runOnlyPendingTimers()
      })
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isCompleted).toBe(true)
      expect(result.current.formattedSeconds).toBe('00')
    })
  })

  describe('duration changes', () => {
    it('should reset currentTimeMs to new duration if duration changes while stopped (not paused)', () => {
      const { result, rerender } = renderHook(
        ({ duration }) => useTimer(duration),
        {
          initialProps: { duration: 10 },
        }
      )
      act(() => {
        result.current.startTimer()
        result.current.stopTimer()
      })
      expect(result.current.formattedSeconds).toBe('10')

      rerender({ duration: 20 })
      expect(result.current.formattedSeconds).toBe('20')
      expect(result.current.isRunning).toBe(false)
    })

    it('should NOT reset currentTimeMs if duration changes while paused', () => {
      const { result, rerender } = renderHook(
        ({ duration }) => useTimer(duration),
        {
          initialProps: { duration: 10 },
        }
      )
      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })
      act(() => {
        dateNowSpy.mockReturnValue(3000)
        if (requestAnimationFrameSpy.runLastCallback) {
          requestAnimationFrameSpy.runLastCallback(Date.now())
        }
      })
      act(() => {
        result.current.pauseTimer()
      })
      expect(result.current.formattedSeconds).toBe('07')

      rerender({ duration: 20 })
      expect(result.current.formattedSeconds).toBe('07')
    })
  })

  describe('timer behavior', () => {
    it('should not run multiple rAF loops if startTimer is called again while running', () => {
      const { result } = renderHook(() => useTimer(10))
      act(() => {
        result.current.startTimer()
      })
      const initialRAFCallCount = requestAnimationFrameSpy.mock.calls.length
      act(() => {
        result.current.startTimer()
      })
      expect(requestAnimationFrameSpy.mock.calls.length).toBe(
        initialRAFCallCount
      )
      expect(result.current.isRunning).toBe(true)
    })
  })

  describe('formatting and cleanup', () => {
    it('should format time with leading zeros', () => {
      const { result } = renderHook(() => useTimer(65))
      expect(result.current.formattedMinutes).toBe('01')
      expect(result.current.formattedSeconds).toBe('05')
    })

    it('should clean up animationFrame and timeout on unmount', () => {
      jest.clearAllMocks()

      const { result, unmount } = renderHook(() => useTimer(10))

      act(() => {
        dateNowSpy.mockReturnValue(0)
        result.current.startTimer()
      })

      expect(result.current.isRunning).toBe(true)
      expect(requestAnimationFrameSpy).toHaveBeenCalled()

      cancelAnimationFrameSpy.mockClear()
      clearTimeoutSpy.mockClear()

      unmount()

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})
