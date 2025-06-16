"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  loginUser,
  isAuthenticated,
  getToken,
  removeToken,
  removeUser,
  getRememberMe,
  getTokenExpirationInfo,
  getUser as getUserFromStorage,
} from "@/lib/auth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning"

interface User {
  id: number
  email: string
  name?: string
  user_role?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<boolean>
  tokenInfo: unknown
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  login: async () => {},
  logout: async () => false,
  tokenInfo: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Changed back to true
  const [mounted, setMounted] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simplified auth check with faster loading
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined" || !mounted) return

      setLoading(true) // Always start with loading

      try {
        // Quick check for token first
        if (!isAuthenticated()) {
          setUserState(null)
          setLoading(false)
          return
        }

        await refreshUser()
      } catch (err) {
        console.error("Auth check error:", err)
        setUserState(null)
      } finally {
        setLoading(false) // Always stop loading
      }
    }

    if (mounted) {
      checkAuth()
    }
  }, [mounted]) // Removed pathname dependency to prevent double loading

  // Update token info whenever user state changes
  useEffect(() => {
    if (user) {
      const info = getTokenExpirationInfo()
      setTokenInfo(info)
    } else {
      setTokenInfo(null)
    }
  }, [user])

  const logout = async (): Promise<boolean> => {
    try {
      const token = getToken()

      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
        } catch (error) {
          console.warn("Logout API call failed, but continuing with local cleanup")
        }
      }

      removeToken()
      removeUser()
      setUserState(null)
      setTokenInfo(null)
      router.push("/login")
      return true
    } catch (error) {
      console.error("Logout failed:", error)
      return false
    }
  }

  const handleSessionTimeout = async () => {
    await logout()
  }

  // Get session timeout duration based on remember me
  const getSessionTimeout = () => {
    const rememberMe = getRememberMe()

    if (rememberMe) {
      // For remember me, use a very long timeout (effectively disable active session timeout)
      return 14 * 24 * 60 // 14 days in minutes
    } else {
      // For regular sessions, use 2 hours
      return 2 * 60 // 2 hours in minutes
    }
  }

  const { showWarning, timeLeft, dismissWarning } = useSessionTimeout({
    timeoutInMinutes: getSessionTimeout(),
    warningInSeconds: 30,
    onTimeout: handleSessionTimeout,
    isAuthenticated: !!user,
  })

  const refreshUser = async () => {
    try {
      if (typeof window === "undefined") return

      const token = getToken()
      if (!token) {
        setUserState(null)
        return
      }

      // First try to get user from localStorage (faster)
      const storedUser = getUserFromStorage()
      if (storedUser) {
        setUserState(storedUser)
        return // Exit early if we have stored user
      }

      // Only fetch from API if no stored user
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const storedUserId = localStorage.getItem("user_id")
      const userId = storedUserId ? JSON.parse(storedUserId) : null

      if (!userId || !API_URL) {
        setUserState(null)
        return
      }

      const response = await fetch(`${API_URL}/GetUser/?id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const data = await response.json()
      const userData = data.details?.[0] || null
      setUserState(userData)
    } catch (err) {
      console.error("Failed to refresh user data:", err)
      setUserState(null)
    }
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    try {
      console.log("Starting login process...")
      const data = await loginUser(email, password, rememberMe)
      console.log("Login successful, setting user state:", data.user)

      setUserState(data.user)

      const info = getTokenExpirationInfo()
      setTokenInfo(info)

      // Add a small delay to ensure state is updated
      setTimeout(() => {
        if (data.user?.user_role === "admin") {
          console.log("Redirecting to admin dashboard")
          router.push("/admin")
        } else {
          console.log("Redirecting to user dashboard")
          router.push("/dashboard")
        }
      }, 100)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  if (!mounted) return null

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, login, logout, tokenInfo }}>
      {children}
      {showWarning && <SessionTimeoutWarning timeLeft={timeLeft} onContinue={dismissWarning} />}
    </AuthContext.Provider>
  )
}
