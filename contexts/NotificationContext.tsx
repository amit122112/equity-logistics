"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Simplified notification settings structure
export type PushNotificationSettings = {
  newShipment: boolean
}

export type NotificationSettings = {
  pushNotifications: PushNotificationSettings
}

interface NotificationContextType {
  settings: NotificationSettings
  updateSettings: (newSettings: NotificationSettings) => Promise<boolean>
  isLoading: boolean
}

const defaultSettings: NotificationSettings = {
  pushNotifications: {
    newShipment: true,
  },
}

const NotificationContext = createContext<NotificationContextType>({
  settings: defaultSettings,
  updateSettings: async () => false,
  isLoading: false,
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      if (typeof window !== "undefined") {
        try {
          const savedSettings = localStorage.getItem("notification_settings")
          console.log("Loading settings from localStorage:", savedSettings)

          if (savedSettings) {
            const parsed = JSON.parse(savedSettings)
            const loadedSettings = {
              pushNotifications: {
                ...defaultSettings.pushNotifications,
                ...(parsed.pushNotifications || {}),
              },
            }
            console.log("Loaded settings:", loadedSettings)
            setSettings(loadedSettings)
          } else {
            console.log("No saved settings found, using defaults")
            setSettings(defaultSettings)
          }
        } catch (error) {
          console.error("Error loading notification settings:", error)
          setSettings(defaultSettings)
        }
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (newSettings: NotificationSettings): Promise<boolean> => {
    console.log("Updating settings:", newSettings)
    setIsLoading(true)

    try {
      // Save to localStorage
      if (typeof window !== "undefined") {
        const settingsString = JSON.stringify(newSettings)
        localStorage.setItem("notification_settings", settingsString)
        console.log("Saved to localStorage:", settingsString)
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSettings(newSettings)
      console.log("Settings updated successfully")
      return true
    } catch (error) {
      console.error("Error updating notification settings:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationSettings() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotificationSettings must be used within a NotificationProvider")
  }
  return context
}
