"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { User, Mail, Phone, MapPin, Building, Save, AlertCircle, Check } from "lucide-react"
import { getToken, getUser } from "@/lib/auth"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    phone?: string
  }>({})
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Australia",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken()
        const user = getUser()
        const userId = user?.id

        if (!token || !userId) {
          console.warn("User token or ID not found.")
          return
        }

        const response = await fetch(`https://hungryblogs.com/api/GetUser/?id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile")
        }

        const details = data.details?.[0]
        if (details) {
          setProfileData({
            firstName: details.first_name || "",
            lastName: details.last_name || "",
            email: details.email || "",
            phone: details.phone_number || "",
            company: details.company || "",
            position: details.position || "",
            address: details.street || "",
            city: details.city || "",
            state: details.state || "",
            zipCode: details.zip_code || "",
            country: details.country || "",
          })
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setApiError("Failed to load profile data. Please refresh the page.")
      }
    }

    fetchProfile()
  }, [])

  // Check for duplicate email
  const checkEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return

    setIsCheckingEmail(true)
    setFieldErrors((prev) => ({ ...prev, email: undefined }))

    try {
      const token = getToken()
      const user = getUser()

      const response = await fetch(`https://hungryblogs.com/api/CheckEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email,
          exclude_user_id: user?.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors((prev) => ({ ...prev, email: "This email is already in use by another user" }))
        }
      }
    } catch (error) {
      console.error("Error checking email:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Check for duplicate phone number
  const checkPhoneNumber = async (phone: string) => {
    if (!phone) return

    setIsCheckingPhone(true)
    setFieldErrors((prev) => ({ ...prev, phone: undefined }))

    try {
      const token = getToken()
      const user = getUser()

      const response = await fetch(`https://hungryblogs.com/api/CheckPhoneNumber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: phone,
          exclude_user_id: user?.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors((prev) => ({ ...prev, phone: "This phone number is already in use by another user" }))
        }
      }
    } catch (error) {
      console.error("Error checking phone number:", error)
    } finally {
      setIsCheckingPhone(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (apiError) setApiError(null)
    if (successMessage) setSuccessMessage(null)

    // Debounced validation for email and phone
    if (name === "email") {
      setTimeout(() => checkEmail(value), 500)
    } else if (name === "phone") {
      setTimeout(() => checkPhoneNumber(value), 500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if there are any field errors
    if (fieldErrors.email || fieldErrors.phone) {
      setApiError("Please fix the errors above before saving.")
      return
    }

    setIsSaving(true)
    setApiError(null)
    setSuccessMessage(null)

    try {
      const token = getToken()
      const user = getUser()

      const payload = {
        id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone_number: profileData.phone,
        company: profileData.company,
        position: profileData.position,
        street: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zip_code: profileData.zipCode,
        country: profileData.country,
      }

      const response = await fetch("https://hungryblogs.com/api/UpdateUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle specific error messages
        if (errorData.message) {
          if (errorData.message.toLowerCase().includes("email already in use")) {
            setFieldErrors((prev) => ({ ...prev, email: "This email is already in use by another user" }))
            setApiError("Email address is already in use. Please use a different email.")
          } else if (
            errorData.message.toLowerCase().includes("phone") &&
            errorData.message.toLowerCase().includes("already")
          ) {
            setFieldErrors((prev) => ({ ...prev, phone: "This phone number is already in use by another user" }))
            setApiError("Phone number is already in use. Please use a different phone number.")
          } else {
            setApiError(errorData.message)
          }
        } else {
          setApiError(`Failed to update profile: ${response.status}`)
        }
        return
      }

      setSuccessMessage("Profile updated successfully!")
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Profile update error:", error)
      setApiError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false)
                setApiError(null)
                setSuccessMessage(null)
                setFieldErrors({})
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isCheckingEmail || isCheckingPhone || fieldErrors.email || fieldErrors.phone}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-md flex items-center text-green-700">
          <Check size={20} className="mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md flex items-center text-red-700">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold mb-4">
                  {profileData.firstName[0]}
                  {profileData.lastName[0]}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-black">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-gray-600">{profileData.email}</p>
              <p className="text-gray-600">{profileData.company}</p>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Personal Information</h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`pl-10 w-full border rounded-md py-2 px-3 ${
                        isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`pl-10 w-full border rounded-md py-2 px-3 ${
                        isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`pl-10 pr-10 w-full border rounded-md py-2 px-3 ${
                        isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                      } ${fieldErrors.email ? "border-red-500" : ""}`}
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`pl-10 pr-10 w-full border rounded-md py-2 px-3 ${
                        isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                      } ${fieldErrors.phone ? "border-red-500" : ""}`}
                    />
                    {isCheckingPhone && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.phone && <p className="mt-1 text-sm text-red-500">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={profileData.company}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`pl-10 w-full border rounded-md py-2 px-3 ${
                        isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-black mb-4 mt-8">Address Information</h2>

              <div className="mb-6 text-black">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`pl-10 w-full border rounded-md py-2 px-3 ${
                      isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 text-black md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profileData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md py-2 px-3 ${
                      isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={profileData.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md py-2 px-3 ${
                      isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={profileData.zipCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md py-2 px-3 ${
                      isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={profileData.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md py-2 px-3 ${
                      isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
