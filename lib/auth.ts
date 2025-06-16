// Base API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://hungryblogs.com/api"

// Token storage with expiration
export const setToken = (token: string, rememberMe = false) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
    const expirationTime = rememberMe
      ? Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
      : Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    localStorage.setItem("token_expiration", expirationTime.toString())
    localStorage.setItem("remember_me", rememberMe.toString())
  }
}

// Check if token is expired
export const isTokenExpired = () => {
  if (typeof window !== "undefined") {
    const expiration = localStorage.getItem("token_expiration")
    if (!expiration) return true
    return Date.now() > Number.parseInt(expiration)
  }
  return true
}

// Get auth token
export const getToken = () => {
  if (typeof window !== "undefined") {
    if (isTokenExpired()) {
      removeToken()
      return null
    }
    return localStorage.getItem("auth_token")
  }
  return null
}

// Remove auth token
export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("token_expiration")
    localStorage.removeItem("remember_me")
    localStorage.removeItem("user")
    localStorage.removeItem("user_id")
  }
}

// User management
export const setUser = (user: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
  return null
}

export const removeUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export const isAuthenticated = () => {
  if (typeof window !== "undefined") {
    const token = getToken()
    return !!token && !isTokenExpired()
  }
  return false
}

export const getRememberMe = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("remember_me") === "true"
  }
  return false
}

export const getTokenExpirationInfo = () => {
  if (typeof window !== "undefined") {
    const expiration = localStorage.getItem("token_expiration")
    const rememberMe = getRememberMe()

    if (expiration) {
      const expirationDate = new Date(Number.parseInt(expiration))
      const timeLeft = Number.parseInt(expiration) - Date.now()

      return {
        expirationDate,
        timeLeft,
        rememberMe,
        isExpired: timeLeft <= 0,
      }
    }
  }
  return null
}

export const loginUser = async (email: string, password: string, rememberMe = false) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Login failed")
    }

    if (data.token) {
      setToken(data.token, rememberMe)
    }

    if (data.user) {
      setUser(data.user)
      localStorage.setItem("user_id", JSON.stringify(data.user.id))
    }

    return data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred during login"
    throw new Error(errorMessage)
  }
}
