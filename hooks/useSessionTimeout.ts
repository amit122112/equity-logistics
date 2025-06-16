"use client"

import { useEffect, useState, useRef, useCallback } from "react"

type UseSessionTimeoutProps = {
  timeoutInMinutes: number
  warningInSeconds: number
  onTimeout: () => Promise<void> | void
  isAuthenticated: boolean
}

export const useSessionTimeout = ({
  timeoutInMinutes,
  warningInSeconds,
  onTimeout,
  isAuthenticated,
}: UseSessionTimeoutProps) => {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Convert minutes to milliseconds
  const timeoutInMs = timeoutInMinutes * 60 * 1000
  const warningInMs = warningInSeconds * 1000

  // Refs to store timers
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated)

  // Update ref without causing re-render
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  // Simplified timeout handler
  const handleTimeout = useCallback(async () => {
    if (isAuthenticatedRef.current) {
      setShowWarning(false)
      await onTimeout()
    }
  }, [onTimeout])

  // Optimized timer clearing
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Optimized reset function
  const resetTimeout = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    if (!isAuthenticatedRef.current) {
      clearAllTimers()
      setShowWarning(false)
      return
    }

    clearAllTimers()
    setShowWarning(false)

    const warningTime = timeoutInMs - warningInMs

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setTimeLeft(warningInSeconds)

      // Start countdown interval
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          if (newTime <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            handleTimeout()
            return 0
          }
          return newTime
        })
      }, 1000)
    }, warningTime)

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeoutInMs)
  }, [timeoutInMs, warningInMs, warningInSeconds, handleTimeout, clearAllTimers])

  // Simplified activity tracking
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers()
      setShowWarning(false)
      return
    }

    resetTimeout()

    // Throttled activity handler
    let activityThrottle: NodeJS.Timeout | null = null
    const events = ["mousedown", "keypress", "click"] // Reduced events for better performance

    const handleUserActivity = () => {
      if (activityThrottle) return

      activityThrottle = setTimeout(() => {
        resetTimeout()
        activityThrottle = null
      }, 1000) // Throttle to once per second
    }

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity)
      })
      clearAllTimers()
      if (activityThrottle) {
        clearTimeout(activityThrottle)
      }
    }
  }, [isAuthenticated, resetTimeout, clearAllTimers])

  const dismissWarning = useCallback(() => {
    setShowWarning(false)
    resetTimeout()
  }, [resetTimeout])

  return { showWarning, timeLeft, dismissWarning }
}

export default useSessionTimeout
