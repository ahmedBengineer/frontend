"use client"

import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const CRMS = [
  {
    name: "Toast",
    desc: "POS platform built for restaurants of every size.",
    logo: "/toast.webp",
  },
  {
    name: "Square",
    desc: "Simple and powerful POS system for small businesses.",
    logo: "/square-logo.png",
  },
  {
    name: "Lightspeed",
    desc: "Cloud-based POS for multi-location restaurants.",
    logo: "/light_speed.png",
  },
  {
    name: "Revel Systems",
    desc: "Enterprise-grade POS platform for restaurants.",
    logo: "https://cdn.worldvectorlogo.com/logos/revel.svg",
  },
]

export default function KitchenHubSuccessPage() {
  const params = useSearchParams()
  const connectionId = params.get("connection_id") 
  const token = params.get("token")
  const companyId = params.get("id")
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
    console.log({connectionId, token, companyId})
  const handleConnect = (crmName: string) => {
  if (!connectionId || !companyId) {
    toast({
      title: "Missing Parameters",
      description: "Connection ID or Company ID missing in URL.",
      variant: "destructive",
    })
    return
  }

  setLoading(crmName)

  try {
    // Append CRM name to URL
    // window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/kitchenhub/oauth/callback/${encodeURIComponent(
    //   connectionId
    // )}/${encodeURIComponent(companyId)}/${encodeURIComponent(crmName.toLowerCase())}`
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/kitchenhub/oauth/callback/${encodeURIComponent(connectionId)}/${encodeURIComponent(companyId)}`
  } catch (error) {
    console.error(error)
    toast({
      title: "Redirect Error",
      description: "Could not redirect to KitchenHub.",
      variant: "destructive",
    })
  } finally {
    setLoading(null)
  }
}


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 px-6 py-16">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight">
          You’re Connected to KitchenHub 🍽️
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
          Select your restaurant’s POS or CRM below to complete integration with SmartConvo.
        </p>
      </motion.div>

      {/* CRM Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl"
      >
        {CRMS.map((crm) => (
          <motion.div
            key={crm.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl h-full flex flex-col justify-between">
              <CardHeader className="flex flex-col items-center justify-center text-center space-y-4 pt-8">
                <div className="bg-gray-50 rounded-xl overflow-hidden w-28 h-28 flex items-center justify-center shadow-sm">
                  <img
                    src={crm.logo}
                    alt={crm.name}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/150x150?text=CRM")
                    }
                  />
                </div>

                <CardTitle className="text-lg font-semibold text-gray-900">
                  {crm.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col items-center justify-between text-center text-gray-500 text-sm space-y-6 p-6 flex-grow">
                <p className="leading-relaxed">{crm.desc}</p>
                <Button
                  onClick={() => handleConnect(crm.name)}
                  disabled={loading === crm.name}
                  className="w-full rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200"
                >
                  {loading === crm.name ? "Connecting..." : "Connect"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1 }}
        className="mt-16 text-sm text-gray-400"
      >
        Securely powered by{" "}
        <span className="font-medium text-gray-700">SmartConvo × KitchenHub</span>
      </motion.p>
    </div>
  )
}
