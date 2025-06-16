"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Lock, CheckCircle, AlertCircle, KeyRound } from "lucide-react"
import Link from "next/link"
import { EquityLogo } from "@/components/Logo"
import { API_URL } from "@/lib/auth"

export default function VerifyResetCode() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<{
    code?: string
    password?: string
    password_confirmation?: string
  }>({})

  useEffect(() => {
    // Get email from URL parameters
    const emailParam = searchParams.get("email")

    if (!emailParam) {
      setError("Invalid reset link. Please request a new reset code.")
      return
    }

    setEmail(emailParam)
  }, [searchParams])

  const validateForm = () => {
    const errors: {
      code?: string
      password?: string
      password_confirmation?: string
    } = {}

    if (!code || code.length < 4) {
      errors.code = "Please enter a valid reset code"
    }

    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }

    if (password !== passwordConfirmation) {
      errors.password_confirmation = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/VerifyResetCode?email=${encodeURIComponent(email)}&token=${encodeURIComponent(code)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        if (data.errors) {
          setValidationErrors(data.errors)
        } else {
          setError(data.message || "Failed to reset password. Please check your code and try again.")
        }
      }
    } catch (error) {
      console.error("Verify reset code error:", error)
      setError("An error occurred while resetting your password. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/SendResetCode?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setError("")
        // Show success message temporarily
        setError("New reset code sent to your email!")
        setTimeout(() => setError(""), 3000)
      } else {
        setError(data.message || "Failed to resend code. Please try again.")
      }
    } catch (error) {
      console.error("Resend code error:", error)
      setError("An error occurred while resending the code.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft size={16} />
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <EquityLogo width={200} height={48} />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Verify Reset Code</h1>
          <p className="text-gray-600 mt-2">
            Enter the reset code sent to <strong>{email}</strong> and your new password.
          </p>
        </div>

        {error && (
          <div
            className={`p-4 rounded-md mb-6 flex items-start ${
              error.includes("sent to your email") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Reset Code
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`pl-10 block w-full px-3 py-2 border ${
                  validationErrors.code ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter reset code"
              />
            </div>
            {validationErrors.code && <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 block w-full px-3 py-2 border ${
                  validationErrors.password ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your new password"
              />
            </div>
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
          </div>

          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                type="password"
                id="passwordConfirmation"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={`pl-10 block w-full px-3 py-2 border ${
                  validationErrors.password_confirmation ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Confirm your new password"
              />
            </div>
            {validationErrors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password_confirmation}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                Resetting Password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            Didn&apos;t receive the code? Resend
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
