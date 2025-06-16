"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Calculator, Send, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import ItemRow from "./ItemRow"
import type { ShipmentFormData, ShipmentItem } from "@/app/types/shipment"

// Mock auth function since we don't have the real one
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token") || "mock-token"
  }
  return "mock-token"
}

// Mock toast notifications
const toast = {
  success: (message: string) => {
    console.log("Success:", message)
    alert(`Success: ${message}`)
  },
  error: (message: string) => {
    console.log("Error:", message)
    alert(`Error: ${message}`)
  },
}

// Define the carrier quote interface
interface CarrierQuote {
  transport_name: string
  price: number
  available: boolean
  errorMessage?: string
}

export default function ShipmentForm() {
  const router = useRouter()

  // Default empty item template
  const emptyItem: ShipmentItem = {
    description: "",
    category: "",
    quantity: "1",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
  }

  const [formData, setFormData] = useState<ShipmentFormData>({
    pickupAddress: "",
    deliveryAddress: "",
    shippingOption: "",
    specialInstructions: "",
    items: [{ ...emptyItem }],
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationDone, setCalculationDone] = useState(false)
  const [carrierQuotes, setCarrierQuotes] = useState<CarrierQuote[]>([])
  const [isRequestingQuote, setIsRequestingQuote] = useState(false)
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)
  const [quoteRequestSuccess, setQuoteRequestSuccess] = useState<string | null>(null)
  const token = getToken()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    setFormData({ ...formData, [name]: newValue })

    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const handleItemChange = (index: number, updatedItem: ShipmentItem) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = updatedItem
    setFormData({ ...formData, items: updatedItems })

    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }],
    })

    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = [...formData.items]
    updatedItems.splice(index, 1)
    setFormData({ ...formData, items: updatedItems })

    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const totalWeight = formData.items.reduce(
    (sum, item) => sum + (Number.parseFloat(item.weight) * Number.parseInt(item.quantity) || 0),
    0,
  )

  const totalQuantity = formData.items.reduce((sum, item) => sum + (Number.parseInt(item.quantity) || 0), 0)

  const isFormValid =
    formData.pickupAddress &&
    formData.deliveryAddress &&
    formData.shippingOption &&
    formData.items.length > 0 &&
    formData.items.every((item) => {
      const quantity = Number(item.quantity)
      const isValidQuantity =
        !isNaN(quantity) && Number.isInteger(quantity) && quantity >= 1 && !item.quantity.includes(".")

      return (
        item.description &&
        item.category &&
        isValidQuantity &&
        item.weight &&
        item.dimensions.length &&
        item.dimensions.width &&
        item.dimensions.height
      )
    })

  const handleCalculate = async () => {
    if (!isFormValid) return

    setIsCalculating(true)
    setCarrierQuotes([])

    try {
      const payload = {
        pick_up_address: formData.pickupAddress,
        delivery_address: formData.deliveryAddress,
        shipping_option: formData.shippingOption,
        shipments: formData.items.map((item) => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
        })),
      }

      const response = await fetch(`https://www.hungryblogs.com/api/GetQuote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()

      if (!response.ok) {
        if (responseText.includes("Sorry We Don't deliver to this address")) {
          const unavailableQuotes = ["TNT", "TGE"].map((carrier) => ({
            transport_name: carrier,
            price: 0,
            available: false,
            errorMessage: responseText.replace(/"/g, ""),
          }))

          setCarrierQuotes(unavailableQuotes)
          setCalculationDone(true)
          return
        }
        throw new Error(`Failed to fetch carrier quotes: ${response.status} - ${responseText}`)
      }

      if (responseText.includes("Sorry We Don't deliver to this address")) {
        const unavailableQuotes = ["TNT", "TGE"].map((carrier) => ({
          transport_name: carrier,
          price: 0,
          available: false,
          errorMessage: responseText.replace(/"/g, ""),
        }))

        setCarrierQuotes(unavailableQuotes)
        setCalculationDone(true)
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        throw new Error("Invalid response format from server")
      }

      if (!Array.isArray(data)) {
        console.error("Expected array response, got:", typeof data, data)
        throw new Error("Unexpected response format from server")
      }

      const allCarriers = ["TNT", "TGE"]
      const formattedQuotes = allCarriers.map((carrier) => {
        const match = data.find((q: any) => q.transport_name === carrier)
        return match ? { ...match, available: true } : { transport_name: carrier, price: 0, available: false }
      })

      setCarrierQuotes(formattedQuotes)
      setCalculationDone(true)
    } catch (err) {
      console.error("Calculation error:", err)
    } finally {
      setIsCalculating(false) // Ensure loading stops quickly
    }
  }

  const handleRequestQuote = async (carrierName: string) => {
    setIsRequestingQuote(true)
    setSelectedCarrier(carrierName)

    try {
      const quotePayload = {
        pick_up_address: formData.pickupAddress,
        delivery_address: formData.deliveryAddress,
        shipping_option: formData.shippingOption,
        transport_name: carrierName,
        price: carrierQuotes.find((c) => c.transport_name === carrierName)?.price.toString() || "0",
        shipments: formData.items.map((item) => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
        })),
      }

      const response = await fetch("https://www.hungryblogs.com/api/RequestQuote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quotePayload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to send quote request: ${response.status} - ${errText}`)
      }

      toast.success("Quote request sent successfully.")

      setQuoteRequestSuccess(
        `Quote request for ${carrierName} sent successfully! Our team will contact you soon with a detailed quote.`,
      )

      setTimeout(() => {
        setQuoteRequestSuccess(null)
      }, 5000)

      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to send quote request. Please try again or contact support.")
    } finally {
      setIsRequestingQuote(false)
      setSelectedCarrier(null)
    }
  }

  const clearForm = () => {
    setFormData({
      pickupAddress: "",
      deliveryAddress: "",
      shippingOption: "",
      specialInstructions: "",
      items: [{ ...emptyItem }],
    })
    setCalculationDone(false)
    setCarrierQuotes([])
  }

  const totalLength = formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.dimensions.length) || 0), 0)
  const totalWidth = formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.dimensions.width) || 0), 0)
  const totalHeight = formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.dimensions.height) || 0), 0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl">
      <h2 className="text-xl font-bold text-black mb-4">Shipment Details</h2>
      <p className="text-gray-600 mb-6">Enter pickup and delivery information and add your items.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block font-semibold text-black mb-2">Pickup Address</label>
          <input
            type="text"
            name="pickupAddress"
            value={formData.pickupAddress}
            onChange={handleChange}
            placeholder="Enter Pickup Address"
            className="border text-black border-gray-400 p-2 w-full rounded"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-black mb-2">Delivery Address</label>
          <input
            type="text"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
            placeholder="Enter Delivery Address"
            className="border text-black border-gray-400 p-2 w-full rounded"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-black mb-2">Shipping Option</label>
        <select
          name="shippingOption"
          value={formData.shippingOption}
          onChange={handleChange}
          className="border text-black border-gray-400 p-2 w-full rounded"
          required
        >
          <option value="">Select Shipping Method</option>
          <option value="air">Air Freight</option>
          <option value="sea">Sea Freight</option>
          <option value="road">Road Freight</option>
        </select>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        {formData.items.map((item, index) => (
          <ItemRow
            key={index}
            item={item}
            index={index}
            onChange={handleItemChange}
            onRemove={removeItem}
            isRemovable={formData.items.length > 1}
          />
        ))}

        {formData.items.length > 0 && (
          <div className="mt-6 p-4 border rounded-md bg-blue-50">
            <h3 className="font-semibold text-black mb-2">Shipment Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">Total Items:</p>
                <p className="font-medium text-black">{formData.items.length} different items</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Total Quantity:</p>
                <p className="font-medium text-black">{totalQuantity} pieces</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Total Weight:</p>
                <p className="font-medium text-black">{totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-black mb-2">Special Instructions (Optional)</label>
        <textarea
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleChange}
          placeholder="Any special handling instructions or notes"
          className="border text-black border-gray-400 p-2 w-full rounded h-24 resize-none"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={clearForm}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-2"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!isFormValid || isCalculating}
          className={`px-6 py-2 rounded flex items-center gap-2 transition duration-200 ${
            !isFormValid || isCalculating
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isCalculating ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Calculating...
            </>
          ) : (
            <>
              <Calculator size={16} />
              Calculate
            </>
          )}
        </button>
      </div>

      {calculationDone && carrierQuotes.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold text-black mb-4">Shipping Quotes</h2>

          <div className="bg-white p-6 rounded-lg border text-black border-gray-400 mb-6">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">Pick-up from {formData.pickupAddress}</p>
              <p className="text-lg font-semibold">Delivery to {formData.deliveryAddress}</p>
              <div className="border-t border-gray-300 my-4"></div>
              <p className="text-lg">
                Shipment details (Quantity: {totalQuantity}, Weight: {totalWeight.toFixed(2)} kg)
              </p>
              <p className="text-lg">
                Dimensions (Length: {totalLength.toFixed(2)} m, Width: {totalWidth.toFixed(2)} m, Height:{" "}
                {totalHeight.toFixed(2)} m)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {carrierQuotes.map((quote, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg ${
                  quote.available
                    ? "bg-gray-200 border text-black border-gray-400"
                    : "bg-red-50 border text-black border-red-300"
                }`}
              >
                <div className="flex items-center justify-center mb-4">
                  <h3 className="text-xl font-bold text-center">
                    {quote.transport_name}
                    {quote.transport_name === "TNT" && " - FedEx"}
                  </h3>
                </div>

                {quote.available ? (
                  <>
                    <div className="mb-6">
                      <p className="text-lg font-semibold mb-2">Total Cost: ${quote.price} + 24.3% Fuel Levy + GST</p>
                      <p className="text-sm text-gray-700">
                        Additional charges may apply please contact Equity Logistics for final quotation
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRequestQuote(quote.transport_name)}
                      disabled={isRequestingQuote}
                      className={`w-full py-2 px-4 rounded flex items-center justify-center gap-2 ${
                        isRequestingQuote && selectedCarrier === quote.transport_name
                          ? "bg-green-500 text-white cursor-wait"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {isRequestingQuote && selectedCarrier === quote.transport_name ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Request Quote
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32">
                    <Truck size={32} className="text-red-400 mb-2" />
                    <p className="text-lg font-medium text-red-600 text-center">
                      {quote.errorMessage || "Delivery Services not available"}
                    </p>
                    <button
                      type="button"
                      disabled
                      className="mt-4 w-full py-2 px-4 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                    >
                      Request Quote
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {quoteRequestSuccess && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 mb-1">Quote Request Sent!</h3>
                <p className="text-sm text-green-700">{quoteRequestSuccess}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteRequestSuccess(null)}
                className="flex-shrink-0 text-green-400 hover:text-green-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> These are estimated quotes based on the information provided. Final pricing may
              vary based on actual weight, dimensions, and other factors. Click "Request Quote" to receive an official
              quote from our team.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
