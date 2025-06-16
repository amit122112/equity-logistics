"use client"

import { useState, useEffect } from "react"
import { Package, RefreshCw, AlertTriangle, Search, Info } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { getToken } from "@/lib/auth"

// Define types for the carrier data
interface CarrierRate {
  carreir_rate_id: number
  transport_id: number
  carrier_id: number
  rate: number
  delivery_address: number
  pickup_address: number
  minimum: number
  basic: number
  kilo: number
  carrier_name: string
  transport_name: string
  pickupaddress: string
  deliveryaddress: string
}

interface ApiResponse {
  Details: CarrierRate[]
}

export default function RatesManagement() {
  const { user } = useAuth()
  const [selectedCarrier, setSelectedCarrier] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [carrierRates, setCarrierRates] = useState<CarrierRate[]>([])
  const [filteredRates, setFilteredRates] = useState<CarrierRate[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const itemsPerPage = 10

  // Fetch carrier data
  const fetchCarrierData = async (carrierId: number) => {
    setLoading(true)
    setError(null)
    setDebugInfo("")

    try {
      console.log(`Fetching data for carrier ${carrierId}...`)
      const token = getToken()

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const apiUrl = `https://www.hungryblogs.com/api/GetCarrier?carrier_id=${carrierId}&transport_id=1`
      console.log(`API URL: ${apiUrl}`)

      setDebugInfo((prev) => prev + `\nFetching from: ${apiUrl}`)

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      setDebugInfo((prev) => prev + `\nResponse status: ${res.status}`)

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`API Error: ${res.status}`, errorText)
        setDebugInfo((prev) => prev + `\nError response: ${errorText}`)
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log("API Response:", data)
      setDebugInfo((prev) => prev + `\nResponse data: ${JSON.stringify(data).substring(0, 200)}...`)

      // Handle both array formats the API might return
      let ratesData: CarrierRate[] = []

      if (data.Details && Array.isArray(data.Details)) {
        ratesData = data.Details
      } else if (Array.isArray(data)) {
        ratesData = data
      } else {
        console.warn("Unexpected API response format:", data)
        setDebugInfo((prev) => prev + `\nUnexpected data format: ${typeof data}`)
        ratesData = []
      }

      console.log(`Loaded ${ratesData.length} rates for carrier ${carrierId}`)
      setDebugInfo((prev) => prev + `\nLoaded ${ratesData.length} rates`)

      setCarrierRates(ratesData)
      setFilteredRates(ratesData)
      setCurrentPage(1) // Reset to first page when changing carriers
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("Failed to fetch carrier data:", errorMessage)
      setError(errorMessage || "Failed to fetch carrier data")
      setCarrierRates([])
      setFilteredRates([])
      setDebugInfo((prev) => prev + `\nError: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)

    if (!term.trim()) {
      setFilteredRates(carrierRates)
      return
    }

    const filtered = carrierRates.filter(
      (rate) =>
        rate.pickupaddress?.toLowerCase().includes(term.toLowerCase()) ||
        rate.deliveryaddress?.toLowerCase().includes(term.toLowerCase()) ||
        rate.carrier_name?.toLowerCase().includes(term.toLowerCase()) ||
        rate.minimum?.toString().includes(term) ||
        rate.basic?.toString().includes(term) ||
        rate.kilo?.toString().includes(term),
    )

    setFilteredRates(filtered)
  }

  // Initial data fetch
  useEffect(() => {
    const token = getToken()
    if (token) {
      fetchCarrierData(selectedCarrier)
    } else {
      setError("Authentication token not found. Please log in again.")
    }
  }, [selectedCarrier])

  // Handle carrier change
  const handleCarrierChange = (carrierId: number) => {
    setSelectedCarrier(carrierId)
    setSearchTerm("") // Clear search when changing carriers
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchCarrierData(selectedCarrier)
    setSearchTerm("")
  }

  // Calculate pagination
  const totalItems = filteredRates.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredRates.slice(startIndex, endIndex)

  // Get carrier name from data
  const carrierName =
    carrierRates.length > 0 && carrierRates[0].carrier_name
      ? carrierRates[0].carrier_name
      : `Carrier ${selectedCarrier}`

  // Mock data for testing when API fails
  const useMockData = () => {
    const mockData: CarrierRate[] = Array.from({ length: 20 }, (_, i) => ({
      carreir_rate_id: i + 1,
      transport_id: 1,
      carrier_id: selectedCarrier,
      rate: 1,
      delivery_address: i + 100,
      pickup_address: i + 200,
      minimum: 50 + i * 5,
      basic: 100 + i * 10,
      kilo: 2 + i * 0.5,
      carrier_name: `Carrier ${selectedCarrier}`,
      transport_name: "Road Transport",
      pickupaddress: `City ${i + 1}`,
      deliveryaddress: `City ${i + 10}`,
    }))

    setCarrierRates(mockData)
    setFilteredRates(mockData)
    setLoading(false)
    setError(null)
  }

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-black font-bold">Rates Management</h1>
        <div className="flex gap-2">
          <button
            onClick={useMockData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <Info size={16} />
            Use Test Data
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Carrier Selection */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg shadow border transform transition-all duration-300 cursor-pointer ${
              selectedCarrier === 1
                ? "bg-blue-50 border-blue-300 scale-105"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
            onClick={() => handleCarrierChange(1)}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${selectedCarrier === 1 ? "bg-blue-100" : "bg-gray-100"}`}>
                <Package className={selectedCarrier === 1 ? "text-blue-600" : "text-gray-600"} size={24} />
              </div>
              <div>
                <h3 className="font-medium text-black">Carrier 1</h3>
                <p className="text-sm text-gray-500">Road Transport</p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg shadow border transform transition-all duration-300 cursor-pointer ${
              selectedCarrier === 2
                ? "bg-green-50 border-green-300 scale-105"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
            onClick={() => handleCarrierChange(2)}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${selectedCarrier === 2 ? "bg-green-100" : "bg-gray-100"}`}>
                <Package className={selectedCarrier === 2 ? "text-green-600" : "text-gray-600"} size={24} />
              </div>
              <div>
                <h3 className="font-medium text-black">Carrier 2</h3>
                <p className="text-sm text-gray-500">Road Transport</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Info Banner */}
      

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading carrier rates...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a moment as the data is quite large</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-red-800">Error loading rates</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                The API endpoint may be temporarily unavailable. Please try again later or use the &quot;Use Test
                Data&quot; button to see sample data.
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={handleRefresh} className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Try Again
                </button>
                <button onClick={useMockData} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Use Test Data
                </button>
              </div>

              {/* Debug Info */}
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <p className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{debugInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Data Table */}
      {!loading && !error && (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by pickup/delivery address, carrier name, or rates..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-700">
                {carrierName} - Road Transport Rates
                {searchTerm && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({filteredRates.length} of {carrierRates.length} rates)
                  </span>
                )}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      S.No
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pickup Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Delivery Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Minimum ($)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Basic Rate ($)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Per Kilo ($)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((rate, index) => (
                      <tr key={rate.carreir_rate_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.pickupaddress}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.deliveryaddress}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${rate.minimum.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rate.basic.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rate.kilo.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.rate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? "No rates found matching your search" : "No rates available for this carrier"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">{endIndex}</span> of{" "}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>

                      {/* Page numbers - show max 5 pages */}
                      {(() => {
                        const maxVisiblePages = 5
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1)
                        }

                        return [...Array(endPage - startPage + 1)].map((_, i) => {
                          const pageNum = startPage + i
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })
                      })()}

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 mb-4">
            <p>
              Total rates loaded: <span className="font-medium">{carrierRates.length}</span> | Last updated:{" "}
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
