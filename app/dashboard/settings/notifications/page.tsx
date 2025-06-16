"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, Save } from "lucide-react"
import { useNotificationSettings } from "@/contexts/NotificationContext"
import type { PushNotificationSettings } from "@/contexts/NotificationContext"

export default function NotificationSettings() {
  const { settings: contextSettings, updateSettings, isLoading } = useNotificationSettings()
  const [settings, setSettings] = useState(contextSettings)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Sync local settings with context settings when they change
  useEffect(() => {
    console.log("Context settings updated:", contextSettings)
    setSettings(contextSettings)
  }, [contextSettings])

  const handlePushToggle = (setting: keyof PushNotificationSettings) => {
    console.log(
      `Toggling ${setting} from ${settings.pushNotifications[setting]} to ${!settings.pushNotifications[setting]}`,
    )

    setSettings((prev) => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [setting]: !prev.pushNotifications[setting],
      },
    }))
    setSaveSuccess(false)
    setSaveError("")
  }

  const handleSave = async () => {
    console.log("Saving settings:", settings)
    setSaveSuccess(false)
    setSaveError("")

    try {
      const success = await updateSettings(settings)
      console.log("Save result:", success)

      if (success) {
        setSaveSuccess(true)
        console.log("Settings saved successfully")
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } else {
        setSaveError("Failed to save notification preferences. Please try again.")
        console.error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveError("An error occurred while saving. Please try again.")
    }
  }

  // Check if there are changes to enable/disable save button
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(contextSettings)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-black">Notification Preferences</h2>
          <p className="text-gray-600">Manage how you receive notifications</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
            hasChanges && !isLoading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
          <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
          <span>Your notification preferences have been saved successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <div className="text-sm space-y-1">
            <div>Context Settings: {JSON.stringify(contextSettings)}</div>
            <div>Local Settings: {JSON.stringify(settings)}</div>
            <div>Has Changes: {hasChanges.toString()}</div>
            <div>Is Loading: {isLoading.toString()}</div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Push Notifications */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-md text-purple-700">
              <Bell size={20} />
            </div>
            <h3 className="text-lg font-medium text-black">Push Notifications</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.pushNotifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-500">{getNotificationDescription("push", key)}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={value}
                    onChange={() => handlePushToggle(key as keyof PushNotificationSettings)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get notification descriptions
function getNotificationDescription(type: string, key: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    push: {
      newShipment: "Receive push notifications for new shipments",
    },
  }

  return descriptions[type]?.[key] || "Notification preference"
}
