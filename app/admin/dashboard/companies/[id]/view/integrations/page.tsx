// "use client"

// import { useEffect, useState } from "react"
// import { useParams } from "next/navigation"
// import Cookies from "js-cookie"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { CheckCircle } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"

// const integrationKeyMap: Record<string, string> = {
//   "leadconnector (ghl) v2 - standard": "GHL Standard",
//   "leadconnector (ghl) v2 - whitelabel": "GHL Whitelabel",
//   hubspot: "HubSpot",
//   google: "Google",
//   "microsoft - delegated": "Microsoft (Delegated)",
//   "microsoft - admin": "Microsoft (Admin)",
//   salesforce: "Salesforce",
//   accesse11: "Accesse11",
//   clover: "Clover",
// }

// interface Integration {
//   key: string
//   name: string
//   type: string
//   status: string
//   lastSync?: string | null
// }

// export default function ViewCompanyIntegrations() {
//   const { id } = useParams()
//   const [integrations, setIntegrations] = useState<Integration[]>([])
//   const [loading, setLoading] = useState(true)
//   const { toast } = useToast()

//   useEffect(() => {
//     const fetchIntegrations = async () => {
//       try {
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Token ${Cookies.get("adminToken") || ""}`,
//             },
//           }
//         )

//         if (!res.ok) throw new Error("Failed to fetch integrations")
//         const data = await res.json()

//         // ✅ Filter only connected integrations
//         const connected = data
//           .filter((item: any) => item.status === "active")
//           .map((item: any) => ({
//             key: item.crm_type,
//             name:
//               integrationKeyMap[item.crm_type.toLowerCase()] ||
//               item.crm_type.toUpperCase(),
//             type: item.crm_type.includes("microsoft")
//               ? "Email/Calendar"
//               : item.crm_type.includes("leadconnector")
//               ? "Communication"
//               : "CRM",
//             status: "Connected",
//             lastSync: item.last_sync || null,
//           }))

//         setIntegrations(connected)
//       } catch (error) {
//         console.error("Integration fetch error:", error)
//         toast({
//           description: "Failed to load integrations.",
//           variant: "destructive",
//         })
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchIntegrations()
//   }, [id])

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-64 text-slate-500">
//         Loading connected integrations...
//       </div>
//     )

//   if (integrations.length === 0)
//     return (
//       <div className="p-10 text-center text-slate-500 border rounded-xl bg-slate-50">
//         No active integrations found.
//       </div>
//     )

//   return (
//     <div className="space-y-6 animate-fadeIn">
//       {/* Header */}
//       <div>
//         <h2 className="text-2xl font-bold text-slate-800">Connected Integrations</h2>
//         <p className="text-slate-600 mt-1">
//           These are the integrations currently connected to this company.
//         </p>
//       </div>

//       {/* Summary Card */}
//       <Card className="shadow-sm border-slate-200">
//         <CardContent className="p-5 flex justify-between items-center">
//           <div>
//             <div className="text-2xl font-bold text-green-600">
//               {integrations.length}
//             </div>
//             <div className="text-sm text-slate-600">Active Connections</div>
//           </div>
//           <CheckCircle className="h-8 w-8 text-green-600" />
//         </CardContent>
//       </Card>

//       {/* Table */}
//       <Card className="border border-slate-200 shadow-sm">
//         <CardHeader>
//           <CardTitle>Integration Details</CardTitle>
//           <CardDescription>Live connected services</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Service</TableHead>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Last Sync</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {integrations.map((integration, index) => (
//                 <TableRow key={index}>
//                   <TableCell className="font-medium text-slate-800">
//                     {integration.name}
//                   </TableCell>
//                   <TableCell>{integration.type}</TableCell>
//                   <TableCell>
//                     <Badge variant="default">Connected</Badge>
//                   </TableCell>
//                   <TableCell>
//                     {integration.lastSync ? (
//                       <span className="text-sm text-slate-700">
//                         {integration.lastSync}
//                       </span>
//                     ) : (
//                       <span className="text-sm text-slate-400">Never</span>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Cookies from "js-cookie"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// 🔹 Integration display name mapping
const integrationDisplayNames: Record<string, string> = {
  square: "Square",
  clover: "Clover",
  accesse11: "Accesse11",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  google: "Google",
  "leadconnector (ghl) v2 - standard": "GHL Standard",
  "leadconnector (ghl) v2 - whitelabel": "GHL Whitelabel",
  "microsoft - delegated": "Microsoft (Delegated)",
  "microsoft - admin": "Microsoft (Admin)",
}

// 🔹 API call from Code B
async function fetchCompanyIntegrations(companyId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/connected-status/?company_id=${companyId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("adminToken") || ""}`,
        },
      }
    )

    if (!res.ok) throw new Error("Failed to fetch integration status")
    const data = await res.json()
  console.log(data)
    return data
  } catch (err) {
    console.error(err)
    return null
  }
}

export default function ViewCompanyIntegrations() {
  const { id } = useParams()
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return

    const loadIntegrations = async () => {
      setLoading(true)
      const data = await fetchCompanyIntegrations(id as string)

      if (!data) {
        toast({
          description: "Failed to load integrations.",
          variant: "destructive",
        })
      } else {
        setIntegrationStatus(data.integrations || data) // handle both formats
      }

      setLoading(false)
    }

    loadIntegrations()
  }, [id])

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse">
        Loading integration data...
      </div>
    )

  if (!integrationStatus)
    return (
      <div className="p-10 text-center text-slate-500 border rounded-xl bg-slate-50">
        Unable to fetch integration data.
      </div>
    )

  const connectedCount = Object.values(integrationStatus).filter(Boolean).length
  const totalCount = Object.keys(integrationStatus).length

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-800 tracking-tight">
          Connected Integrations
        </h2>
        <p className="text-slate-600 mt-1">
          Overview of all CRMs linked with this company’s account.
        </p>
      </div>

      {/* Summary Stats */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition">
        <CardContent className="flex justify-between items-center p-6">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {connectedCount}
            </div>
            <div className="text-sm text-slate-600">
              Active {connectedCount === 1 ? "Connection" : "Connections"} out of {totalCount}
            </div>
          </div>
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(integrationStatus).map(([key, isConnected]) => {
          const displayName =
            integrationDisplayNames[key.toLowerCase()] || key.toUpperCase()

          return (
            <Card
              key={key}
              className={`transition border ${
                isConnected
                  ? "border-green-200 hover:border-green-400 hover:shadow-lg"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {displayName}
                </CardTitle>
                {isConnected ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-slate-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={isConnected ? "default" : "outline"}>
                    {isConnected ? "Connected" : "Not Connected"}
                  </Badge>
                  <span
                    className={`text-sm ${
                      isConnected ? "text-green-600" : "text-slate-500"
                    }`}
                  >
                    {isConnected ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
