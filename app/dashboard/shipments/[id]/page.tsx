"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/auth"
import { ArrowLeft, Package, Truck, Calendar, DollarSign, User, MapPin } from "lucide-react"

// Define types based on the API response
interface ShipmentItem {
  details_id: number
  weight: number
  length: number
  width: number
  height: number
  shipment_id: number
  updated_at: string
  created_at: string
}

interface Shipment {
  shipment_id: number
  address_id: number
  shipment_address_id: number
  transport_id: number
  carrier_id: number
  price: number
  updated_at: string
  created_at: string
  user_id: number
  status: string
  carrier_name: string
  transport_name: string
  user_name: string
  pick_up_address: number
  delivery_address: number
  details: ShipmentItem[]
}

interface ApiResponse {
  details: Shipment[]
}

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShipmentDetails = async () => {
      try {
        setError(null)

        const token = getToken()
        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/GetShipment?shipment_id=${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Error fetching shipment: ${response.status}`)
        }

        const data: ApiResponse = await response.json()

        if (!data.details || data.details.length === 0) {
          throw new Error("No shipment found")
        }

        setShipment(data.details[0])
      } catch (err) {
        console.error("Error fetching shipment details:", err)
        setError(err instanceof Error ? err.message : "Failed to load shipment details")
      }
    }

    fetchShipmentDetails()
  }, [params.id, router])

  // Calculate total weight and volume
  const calculateTotals = () => {
    if (!shipment || !shipment.details) return { totalWeight: 0, totalVolume: 0 }

    let totalWeight = 0
    let totalVolume = 0

    shipment.details.forEach((item) => {
      totalWeight += item.weight
      const volume = item.length * item.width * item.height
      totalVolume += volume
    })

    return {
      totalWeight,
      totalVolume: Number.parseFloat(totalVolume.toFixed(3)),
    }
  }

  const { totalWeight, totalVolume } = calculateTotals()

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">No shipment found with ID: {params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center mb-2 sm:mb-0">
          <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Shipment #{shipment.shipment_id}</h1>
          <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
            {shipment.status}
          </span>
        </div>

        <div className="text-sm text-gray-500">Created: {formatDate(shipment.created_at)}</div>
      </div>

      {/* Shipment details card */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Shipment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start">
              <Truck className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Carrier</p>
                <p className="font-medium">{shipment.carrier_name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Package className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Transport Type</p>
                <p className="font-medium">{shipment.transport_name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">${shipment.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{shipment.user_name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(shipment.updated_at)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address IDs</p>
                <p className="font-medium">
                  Address: {shipment.address_id}, Shipment Address: {shipment.shipment_address_id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Shipment Items</h2>
            <div className="text-sm">
              <span className="font-medium">Total:</span> {shipment.details.length} items, {totalWeight} kg,{" "}
              {totalVolume} m³
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item #
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensions (m)
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume (m³)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipment.details.map((item, index) => {
                  const volume = (item.length * item.width * item.height).toFixed(3)
                  return (
                    <tr key={item.details_id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.weight}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.length} × {item.width} × {item.height}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{volume}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{totalWeight} kg</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{totalVolume} m³</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
