"use client"

import { ProtectedRoute } from "@/components/protected-route"

function AdminProfileContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <p className="text-gray-600 mb-8">Manage your profile information.</p>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Profile content will go here...</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminProfilePage() {
  return (
    <ProtectedRoute>
      <AdminProfileContent />
    </ProtectedRoute>
  )
}
