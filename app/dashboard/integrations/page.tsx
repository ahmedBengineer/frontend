

// "use client"

// import { Button } from "@/components/ui/button"
// import React, { useState, useEffect } from "react"
// import Cookies from "js-cookie"
// //import { useLocation } from "react-router-dom"
// import { usePathname } from "next/navigation"

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"

// // 🔹 Mapping between backend integration_name and frontend keys
// const integrationKeyMap: Record<string, string> = {
//   "leadconnector (ghl) v2 - standard": "ghl-standard",
//   "leadconnector (ghl) v2 - whitelabel": "ghl-whitelabel",
//   hubspot: "hubspot",
//   google: "google",
//   "microsoft - delegated": "ms-delegated",
//   "microsoft - admin": "ms-admin",
//   salesforce: "salesforce",
//   accesse11: "accesse11",   // ✅ no space
//   clover: "clover",         // ✅ direct match
// }


// export default function IntegrationsPage() {
//   const [integrations, setIntegrations] = useState<any[]>([
//     { key: "ghl-standard", name: "Leadconnector (GHL) v2 - Standard", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "ghl-whitelabel", name: "Leadconnector (GHL) v2 - Whitelabel", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "hubspot", name: "Hubspot", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "google", name: "Google", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "ms-delegated", name: "Microsoft - Delegated", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "ms-admin", name: "Microsoft - Admin", status: "Not Connected", statusColor: "text-orange-600" },
//     { key: "salesforce", name: "Salesforce", status: "Not Connected", statusColor: "text-orange-600", hasDocumentation: true }, 
//     { key: "accesse11", name: "Accesse 11", status: "Not Connected", statusColor: "text-orange-600", apiUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/accesse11/connect/`, requiresCredentials: true },
//     { key: "clover", name: "Clover", status: "Not Connected", statusColor: "text-orange-600", apiUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/clover/connect/` },
//   ])

//   const [isAccesseModalOpen, setIsAccesseModalOpen] = useState(false)
//   const [username, setUsername] = useState("")
//   const [password, setPassword] = useState("")
//   const [currentIntegration, setCurrentIntegration] = useState<any>(null)

// const pathname = usePathname()

//   // 🔹 Fetch connected integrations whenever user navigates to this page
//   useEffect(() => {
//   const fetchIntegrations = async () => {
    
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${Cookies.get("Token") || ""}`,
//         },
//       })

//       if (!res.ok) throw new Error("Failed to fetch integrations")
//       const data = await res.json()

//       // Backend gives crm_type like "clover", "accesse11", etc.
//       const connectedKeys = data
//         .filter((item: any) => item.status === "active")
//         .map((item: any) => integrationKeyMap[item.crm_type.toLowerCase()] || item.crm_type.toLowerCase())

//       setIntegrations((prev) =>
//         prev.map((integration) => ({
//           ...integration,
//           status: connectedKeys.includes(integration.key) ? "Connected" : "Not Connected",
//           statusColor: connectedKeys.includes(integration.key) ? "text-green-600" : "text-orange-600",
//         }))
//       )
//     } catch (error) {
//       console.error("Error fetching integrations:", error)
//     }
//   }

//   fetchIntegrations()
// }, [pathname])


//   // 🔹 Handle connect button click
//   const handleConnect = async (integration: any) => {
//     if (integration.requiresCredentials) {
//       setCurrentIntegration(integration)
//       setIsAccesseModalOpen(true)
//       return
//     }

//     if (!integration.apiUrl) {
//       console.log(`No API for ${integration.name}`)
//       return
//     }

//     try {
//       const token = Cookies.get("Token") || ""
//       const res = await fetch(integration.apiUrl, {
//         method: "GET",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json",
//         },
//       })

//       const data = await res.json()
//       if (!res.ok) {
//         console.error("Failed to get connect URL", data)
//         return
//       }

//       if (data.url) {
//         window.location.href = data.url
//       } else {
//         console.error("No URL returned from backend")
//       }
//     } catch (error) {
//       console.error("Error connecting integration:", error)
//     }
//   }

//   // 🔹 Submit Accesse11 credentials
//   const handleAccesseSubmit = async () => {
//     if (!currentIntegration?.apiUrl) return

//     try {
//       const token = Cookies.get("Token") || ""
//       const res = await fetch(currentIntegration.apiUrl, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ username, password }),
//       })

//       const data = await res.json()
//       if (!res.ok) {
//         console.error("Failed to connect Accesse11", data)
//         return
//       }

//       console.log("Connected successfully", data)

//       // ✅ Update status in UI
//       setIntegrations((prev) =>
//         prev.map((integration) =>
//           integration.key === "accesse11"
//             ? { ...integration, status: "Connected", statusColor: "text-green-600" }
//             : integration
//         )
//       )
//     } catch (error) {
//       console.error("Error connecting Accesse11:", error)
//     } finally {
//       setIsAccesseModalOpen(false)
//       setUsername("")
//       setPassword("")
//     }
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold text-slate-800">Integrations</h1>
//       </div>

//       <div className="space-y-4">
//         <h2 className="text-xl font-medium text-slate-700">External Integrations</h2>

//         <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-slate-800 text-white">
//               <tr>
//                 <th className="text-left p-4 font-medium">Integration</th>
//                 <th className="text-left p-4 font-medium">Status</th>
//                 <th className="text-left p-4 font-medium">Action</th>
//               </tr>
//             </thead>
//                       <tbody className="divide-y divide-slate-200">
//   {integrations.map((integration, index) => (
//     <tr key={index} className="hover:bg-slate-50">
//       <td className="p-4">
//         <div className="flex items-center">
//           <span className="text-slate-800">{integration.name}</span>
//           {integration.hasDocumentation && (
//             <span className="ml-2 text-blue-600 text-sm">(Documentation)</span>
//           )}
//         </div>
//       </td>

//       <td className="p-4">
//         <span className={integration.statusColor}>{integration.status}</span>
//       </td>

//       <td className="p-4">
//         {integration.status === "Connected" ? (
//           <Button
//             className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
//             onClick={async () => {
//               try {
//                 const token = Cookies.get("Token") || ""
//                 let deleteUrl = ""

//                 if (integration.key === "clover") {
//                   deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/clover/`
//                 } else if (integration.key === "accesse11") {
//                   deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/accesse11/`
//                 }

//                 if (!deleteUrl) return

//                 const res = await fetch(deleteUrl, {
//                   method: "DELETE",
//                   headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Token ${token}`,
//                   },
//                 })

//                 if (!res.ok) throw new Error("Failed to disconnect")

//                 // ✅ Update status in UI
//                 setIntegrations((prev) =>
//                   prev.map((item) =>
//                     item.key === integration.key
//                       ? { ...item, status: "Not Connected", statusColor: "text-orange-600" }
//                       : item
//                   )
//                 )
//               } catch (error) {
//                 console.error("Error disconnecting integration:", error)
//               }
//             }}
//           >
//             Disconnect
//           </Button>
//         ) : (
//           <Button
//             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
//             onClick={() => handleConnect(integration)}
//           >
//             {integration.status === "Not Connected" ? "Connect" : "Reconnect"}
//           </Button>
//         )}
//       </td>
//     </tr>
//   ))}
// </tbody>

//           </table>
//         </div>
//       </div>

//       {/* Accesse11 Modal */}
//       <Dialog open={isAccesseModalOpen} onOpenChange={setIsAccesseModalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Connect Accesse11</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="username">Username</Label>
//               <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
//             </div>
//             <div>
//               <Label htmlFor="password">Password</Label>
//               <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
//             </div>
//           </div>

//           <DialogFooter>
//             <Button className="bg-slate-500 hover:bg-slate-600 text-white" onClick={() => setIsAccesseModalOpen(false)}>
//               Cancel
//             </Button>
//             <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAccesseSubmit}>
//               Connect
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }



"use client"

import React, { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link2, CheckCircle2, XCircle, Loader2, MapPin, ChevronRight, Eye, EyeOff, Copy, Check, AlertTriangle, Zap, RefreshCw, Clock } from "lucide-react"

const integrationKeyMap: Record<string, string> = {
  "leadconnector (ghl) v2 - standard": "ghl-standard",
  "leadconnector (ghl) v2 - whitelabel": "ghl-whitelabel",
  hubspot: "hubspot",
  google: "google",
  "microsoft - delegated": "ms-delegated",
  "microsoft - admin": "ms-admin",
  salesforce: "salesforce",
  accesse11: "accesse11",
  clover: "clover",
  hms: "hms",
  ginkoretail: "ginkoretail",
  gtech: "gtech",
}

const INTEGRATION_CHECK_KEYS = [
  "whatsapp",
  "whatsappself",
  "facebook",
  "salesforce",
  "accesse11",
  "clover",
  "kitchenhub",
  "hms",
  "shopify",
  "zapier",
  "postex",
  "ginkoretail",
  "gtech",
]

const CONNECT_BUTTON_STYLE = "inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-slate-900/20"
const DISCONNECT_BUTTON_STYLE = "inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60 disabled:cursor-not-allowed"
const RECONNECT_BUTTON_STYLE = "inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:text-amber-800 rounded-xl transition-all duration-200 text-sm font-light"
const LOCATION_BUTTON_STYLE = "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-blue-600/20"

function IntegrationLogo({ integration }: { integration: any }) {
  const logos: Record<string, { bg: string; hover: string; icon: React.ReactNode }> = {
    whatsapp: {
      bg: "bg-[#25D366]/10", hover: "group-hover:bg-[#25D366]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    whatsappself: {
      bg: "bg-[#128C7E]/10", hover: "group-hover:bg-[#128C7E]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#128C7E]">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    facebook: {
      bg: "bg-[#1877F2]/10", hover: "group-hover:bg-[#1877F2]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.791-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
        </svg>
      ),
    },
    salesforce: {
      bg: "bg-[#00A1E0]/10", hover: "group-hover:bg-[#00A1E0]/20",
      icon: (
        <svg viewBox="0 0 67 46" className="w-6 h-4 fill-[#00A1E0]">
          <path d="M27.9 4.5a14.4 14.4 0 0 1 10.2-4.2 14.4 14.4 0 0 1 12.9 8 17.3 17.3 0 0 1 7-1.5C65 6.8 71 12.9 71 20.4S65 34 57.9 34c-.8 0-1.5 0-2.2-.2a13.4 13.4 0 0 1-12 7.4 13.3 13.3 0 0 1-5.8-1.3 15.7 15.7 0 0 1-14.7 10.2A15.7 15.7 0 0 1 9 44.5a12.2 12.2 0 0 1-2.2.2C3 44.7 0 41.6 0 37.8a10.3 10.3 0 0 1 4.2-8.4 14.6 14.6 0 0 1-.1-1.5C4 21.8 10.4 16 18.1 16a14.5 14.5 0 0 1 9.8 3.8z" transform="scale(0.9)"/>
        </svg>
      ),
    },
    accesse11: {
      bg: "bg-violet-50", hover: "group-hover:bg-violet-100",
      icon: (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="16" cy="16" r="14" fill="#7C3AED" opacity="0.2"/>
          <text x="16" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7C3AED" fontFamily="monospace">A11</text>
        </svg>
      ),
    },
    clover: {
      bg: "bg-[#1DA462]/10", hover: "group-hover:bg-[#1DA462]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1DA462]">
          <path d="M12 2a4 4 0 0 0-3.464 6A4 4 0 0 0 2 12a4 4 0 0 0 6 3.464A4 4 0 0 0 12 22a4 4 0 0 0 3.464-6A4 4 0 0 0 22 12a4 4 0 0 0-6-3.464A4 4 0 0 0 12 2zm0 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm10 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm-5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
        </svg>
      ),
    },
    kitchenhub: {
      bg: "bg-orange-50", hover: "group-hover:bg-orange-100",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
          <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-3.5-2.94-5.98-8-5.98S0 11.49 0 14.99v1h16.03v-1z"/>
        </svg>
      ),
    },
    hms: {
      bg: "bg-blue-50", hover: "group-hover:bg-blue-100",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1z"/>
        </svg>
      ),
    },
    shopify: {
      bg: "bg-[#96BF48]/10", hover: "group-hover:bg-[#96BF48]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#96BF48]">
          <path d="M15.55 13.5c-.29-.09-.44-.23-.44-.43 0-.25.2-.42.57-.42.31 0 .57.11.78.28l.74-1.03c-.34-.3-.77-.45-1.31-.45-.87 0-1.38.53-1.38 1.21 0 .67.45 1.11 1.08 1.34.36.14.45.25.45.45 0 .27-.23.44-.62.44-.36 0-.69-.12-.97-.4l-.7 1.1c.38.35.91.53 1.52.53.97 0 1.53-.57 1.53-1.34 0-.69-.45-1.12-1.23-1.38zM9.86 11.31h1.71l-1.02-3.55-1.35 3.55h.66zm-2.84-4.6c.19 0 .46.03.67.22l1.17 1.42-.88 2.53c-.05.16-.2.26-.36.26-.06 0-.12-.02-.17-.05l-1.5-.98 1.07-3.4zm2.6 7.24l.8-2.55h-.48l-.54-1.76-1.2 3.91-.11.31c-.17.5-.56.74-1.06.74-.25 0-.47-.04-.63-.1.58.83 1.52 1.45 3.22 1.45.41 0 .79-.05 1.14-.14-.62-.34-1-.83-1.14-1.86zm.42-3.66l.72 2.01h2.8c-.11-.6-.71-2.01-.71-2.01h-2.81zm6.03-.46h1.53l-1.42-1.22-.11.1c.36.3.56.74.56 1.12h.44zm-4.04-.83l-.9 2.44h3.04l-1.05-2.61c-.14.1-.3.17-.52.17h-.57zM23 11.79l-1.44.1s-1.02-1.84-1.66-3.02c-.08-.15-.02-.28.09-.4.46-.52.85-1.29.93-1.86 0-.04.01-.07.01-.11 0-.51-.36-.74-.8-.63-.13.04-.26.1-.39.19-.32.21-.68.55-.97.93-.06.08-.15.12-.24.11a.87.87 0 01-.5-.18.88.88 0 01-.28-.67l.01-.11c0-.19.03-.46-.14-.61-.16-.14-.39-.08-.55-.01-.4.16-.78.41-1.08.72-.06.06-.15.09-.24.07-.09-.01-.16-.07-.2-.15l-.32-.65c-.19-.36-.48-.57-.87-.57h-1.24l-.25-.56c-.16-.36-.5-.57-.91-.57h-1.79l-.27-.76c-.12-.33-.43-.54-.78-.54H8.37l-.9-.13C7.27.79 6.86.64 6.52.64L3.98.27a.56.56 0 00-.53.32L2.4 2.64 1.1 3.52c-.17.11-.27.3-.27.51v.17l.08.27 1.29 4.35-2.38-.7a.85.85 0 00-.65.13.83.83 0 00-.33.56L.34 14.3a.86.86 0 00.55.96 14.68 14.68 0 005.5 1.14c3.2 0 5.64-.95 7.1-2.8 1.3-1.66 1.89-3.79 1.6-5.77l.22-.15.38.72c.55 1.05 1.5 2.88 2.02 3.79.16.28.47.44.8.44.13 0 .26-.02.38-.07.1-.04.19-.09.28-.16.63-.51 1.47-1.61 2.02-2.3.15-.2.16-.47.02-.69z"/>
        </svg>
      ),
    },
    zapier: {
      bg: "bg-[#FF4A00]/10", hover: "group-hover:bg-[#FF4A00]/20",
      icon: <Zap className="w-5 h-5 text-[#FF4A00]" />,
    },
    postex: {
      bg: "bg-[#E31E24]/10", hover: "group-hover:bg-[#E31E24]/20",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E31E24]">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
        </svg>
      ),
    },
    ginkoretail: {
      bg: "bg-emerald-50", hover: "group-hover:bg-emerald-100",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-1v-.5c-1.71 0-3.37.54-4.8 1.52l.57 2.19c.66-.52 1.56-.83 2.56-.83 1.35 0 2.5.77 2.98 1.93l-.94 1.19c-.44-.6-1.16-.99-1.98-.99-.92 0-1.73.59-2.02 1.42h2v6.6h-2l.02.37c-.18.2-.36.4-.54.61-.37.4-.75.8-1.13 1.21-.23.25-.46.5-.69.75-.34.36-.68.72-1.01 1.09-.5.55-1 1.1-1.5 1.64v.37h12v-1c0-1.1-.9-2-2-2v-1.93c0 4.08-3.05 7.44-7 7.93z"/>
        </svg>
      ),
    },
    gtech: {
      bg: "bg-blue-50", hover: "group-hover:bg-blue-100",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600">
          <path d="M19.4 12.9c-.5-.4-1.1-.7-1.7-.8V7c0-.6-.4-1-1-1h-3c-.6 0-1 .4-1 1v5.1c-.6.1-1.2.4-1.7.8-.5.4-.9.9-1.1 1.5l-2.3 4.9c-.2.5-.1 1.1.3 1.5.4.4 1 .5 1.5.3l4.9-2.3c.6-.3 1.1-.7 1.5-1.1.4-.4.7-.9.8-1.5l2.3-4.9c.2-.5.1-1.1-.3-1.5-.4-.4-1-.5-1.5-.3l-4.9 2.3zm-6.9 5.4c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-2c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"/>
        </svg>
      ),
    },
  }

  const cfg = logos[integration.key]
  if (!cfg) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-slate-100 ring-1 ring-black/5 group-hover:bg-slate-200 flex items-center justify-center transition-all duration-200">
        <Link2 className="w-5 h-5 text-slate-600" />
      </div>
    )
  }
  return (
    <div className={`w-11 h-11 rounded-2xl ring-1 ring-black/5 flex items-center justify-center transition-all duration-200 ${cfg.bg} ${cfg.hover}`}>
      {cfg.icon}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="col-span-3">
          <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="col-span-5 flex justify-end">
          <div className="h-9 w-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function IntegrationsListSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/70 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50/80 to-white px-8 py-5 border-b border-slate-100">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
          <div className="col-span-4">Integration</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-5 text-right">Action</div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}

function IntegrationsPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50" />
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-20 w-1 bg-slate-100 rounded-full" />
            <div className="space-y-3">
              <div className="h-9 w-52 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-80 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-8 w-14 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-12">
        <IntegrationsListSkeleton />
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([
    // { key: "ghl-standard", name: "Leadconnector (GHL) v2 - Standard", status: "Not Connected", statusColor: "text-orange-600" },
    // { key: "ghl-whitelabel", name: "Leadconnector (GHL) v2 - Whitelabel", status: "Not Connected", statusColor: "text-orange-600" },
    // { key: "hubspot", name: "Hubspot", status: "Not Connected", statusColor: "text-orange-600" },
    // { key: "google", name: "Google", status: "Not Connected", statusColor: "text-orange-600" },
    // { key: "ms-delegated", name: "Microsoft - Delegated", status: "Not Connected", statusColor: "text-orange-600" },
    { key: "whatsapp", name: "WhatsApp Business", status: "Not Connected", statusColor: "text-orange-600", isWhatsApp: true },
    { key: "whatsappself", name: "WhatsApp Self", status: "Not Connected", statusColor: "text-orange-600", isWhatsAppSelf: true },
    { key: "facebook", name: "Facebook", status: "Not Connected", statusColor: "text-orange-600" },
    { 
    key: "salesforce", 
    name: "Salesforce", 
    status: "Not Connected", 
    statusColor: "text-orange-600",
    hasDocumentation: true,
    apiUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/salesforce/connect/`,
  },
    { key: "accesse11", name: "Accesse 11", status: "Not Connected", statusColor: "text-orange-600", apiUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/accesse11/connect/`, requiresCredentials: true },
    { key: "clover", name: "Clover", status: "Not Connected", statusColor: "text-orange-600", apiUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/clover/connect/` },
    {
      key: "kitchenhub",
      name: "KitchenHub",
      status: "-------",
      statusColor: "text-grey-600",
      isKitchenHub: true
    },
    {
      key: "hms",
      name: "HMS",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isHMS: true,
    },
    {
      key: "shopify",
      name: "Shopify",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isShopify: true,
    },
    {
      key: "zapier",
      name: "Zapier",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isZapier: true,
    },
    {
      key: "postex",
      name: "PostEx",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isPostEx: true,
    },
    {
      key: "ginkoretail",
      name: "Ginko Retail (Monark)",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isGinkoRetail: true,
    },
    {
      key: "gtech",
      name: "Gtech",
      status: "Not Connected",
      statusColor: "text-orange-600",
      isGtech: true,
    },
  ])


  const [isAccesseModalOpen, setIsAccesseModalOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [currentIntegration, setCurrentIntegration] = useState<any>(null)
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)


  const [isKitchenHubModalOpen, setIsKitchenHubModalOpen] = useState(false)
  const [kitchenHubItems, setKitchenHubItems] = useState<any[]>([])
  const [loadingKitchenHub, setLoadingKitchenHub] = useState(false)

  const [isHMSModalOpen, setIsHMSModalOpen] = useState(false)
  const [hmsApiKey, setHmsApiKey] = useState("")
  const [hmsConnecting, setHmsConnecting] = useState(false)
  const [hmsDisconnecting, setHmsDisconnecting] = useState(false)

  const [isShopifyModalOpen, setIsShopifyModalOpen] = useState(false)
  const [shopifyShop, setShopifyShop] = useState("")
  const [shopifyApp, setShopifyApp] = useState("public")
  const [shopifyConnectedApp, setShopifyConnectedApp] = useState<string | null>(null)
  const [shopifyConnecting, setShopifyConnecting] = useState(false)
  const [shopifyDisconnecting, setShopifyDisconnecting] = useState(false)

  const [isZapierModalOpen, setIsZapierModalOpen] = useState(false)
  const [zapierSecret, setZapierSecret] = useState("")
  const [zapierSecretVisible, setZapierSecretVisible] = useState(false)
  const [zapierGenerating, setZapierGenerating] = useState(false)
  const [zapierCompanyId, setZapierCompanyId] = useState<number | null>(null)
  const [zapierAgents, setZapierAgents] = useState<any[]>([])
  const [zapierAgentsLoading, setZapierAgentsLoading] = useState(false)
  const [zapierCopiedField, setZapierCopiedField] = useState<string | null>(null)
  const [zapierVerified, setZapierVerified] = useState(false)
  const [zapierLastEvent, setZapierLastEvent] = useState<any>(null)

  const [isPostExModalOpen, setIsPostExModalOpen] = useState(false)
  const [postexToken, setPostexToken] = useState("")
  const [postexStoreCode, setPostexStoreCode] = useState("01")
  const [postexCity, setPostexCity] = useState("Lahore")
  const [postexConnecting, setPostexConnecting] = useState(false)
  const [postexDisconnecting, setPostexDisconnecting] = useState(false)

  const [isGinkoRetailModalOpen, setIsGinkoRetailModalOpen] = useState(false)
  const [ginkoretailApiToken, setGinkoRetailApiToken] = useState("")
  const [ginkoretailBaseUrl, setGinkoRetailBaseUrl] = useState("https://monark-be.ginkgoretail.net")
  const [ginkoretailConnecting, setGinkoRetailConnecting] = useState(false)
  const [ginkoretailDisconnecting, setGinkoRetailDisconnecting] = useState(false)

  const [isGtechModalOpen, setIsGtechModalOpen] = useState(false)
  const [gtechApiToken, setGtechApiToken] = useState("")
  const [gtechBaseUrl, setGtechBaseUrl] = useState("https://monark.gtech-api.com")
  const [gtechConnecting, setGtechConnecting] = useState(false)
  const [gtechDisconnecting, setGtechDisconnecting] = useState(false)



  const { toast } = useToast()
  const router = useRouter()

  const pathname = usePathname()
  const [hasTwilioPhones, setHasTwilioPhones] = useState<boolean | null>(null)
  const [integrationsLoading, setIntegrationsLoading] = useState(true)
  const [checkingStatuses, setCheckingStatuses] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "not_connected">("all")


  // 🔹 Check if Twilio phone numbers exist
  useEffect(() => {
    const checkTwilioPhones = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })
        
        const data = await res.json()
        if (Array.isArray(data.twilio_phone_numbers) && data.twilio_phone_numbers.length > 0) {
          setHasTwilioPhones(true)
        } else {
          setHasTwilioPhones(false)
          toast({ description: "No Twilio phones found. Please assign one first.", variant: "destructive" })
        }
      } catch (error) {
        console.error("Error checking Twilio phones:", error)
        toast({ description: "Error checking Twilio phones.", variant: "destructive" })
        setHasTwilioPhones(false)
      }
    }


    checkTwilioPhones()
  }, [])


  // 🔹 Fetch connected integrations whenever user navigates to this page
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIntegrationsLoading(true)
        setCheckingStatuses(
          INTEGRATION_CHECK_KEYS.reduce((acc, key) => { acc[key] = true; return acc }, {} as Record<string, boolean>)
        )
        setCheckingStatuses((prev) => ({ ...prev, kitchenhub: false }))

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })


        if (!res.ok) throw new Error("Failed to fetch integrations")
        const data = await res.json()
      console.log("Fetched integrations:", data)


        const list = Array.isArray(data) ? data : data?.results ?? []
        const connectedKeys = list
          .filter((item: any) => item.status === "active")
          .map((item: any) => integrationKeyMap[item.crm_type.toLowerCase()] || item.crm_type.toLowerCase())

        setCheckingStatuses((prev) => ({
          ...prev,
          clover: false,
          accesse11: false,
          salesforce: false,
          facebook: false,
        }))

        // Fetch WhatsApp status separately
        let waStatus = "Not Connected"
        try {
          const waRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/whatsapp/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (waRes.ok) {
            const waData = await waRes.json()
            if (waData.status === "connected") waStatus = "Connected"
            else if (waData.status === "pending") waStatus = "Pending"
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, whatsapp: false }))

        // Fetch WhatsApp Self (Baileys) status
        let waSelfStatus = "Not Connected"
        try {
          const waSelfRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/whatsapp-baileys/instances/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (waSelfRes.ok) {
            const waSelfData = await waSelfRes.json()
            if (Array.isArray(waSelfData) && waSelfData.some((i: any) => i.status === "connected")) {
              waSelfStatus = "Connected"
            } else if (Array.isArray(waSelfData) && waSelfData.length > 0) {
              waSelfStatus = "Pending"
            }
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, whatsappself: false }))

        // Fetch HMS status
        let hmsStatus = "Not Connected"
        try {
          const hmsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/hms/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (hmsRes.ok) {
            const hmsData = await hmsRes.json()
            if (hmsData.connected === true) hmsStatus = "Connected"
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, hms: false }))

        // Fetch Shopify status
        let shopifyStatus = "Not Connected"
        try {
          const shopifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/shopify/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (shopifyRes.ok) {
            const shopifyData = await shopifyRes.json()
            if (shopifyData.connected === true) {
              shopifyStatus = "Connected"
              setShopifyConnectedApp(shopifyData.app_key || "public")
            } else {
              setShopifyConnectedApp(null)
            }
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, shopify: false }))

        // Fetch Zapier status (webhook secret configured + whether a lead webhook has been received)
        let zapierStatus = "Not Connected"
        try {
          const zapierRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/zapier/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (zapierRes.ok) {
            const zapierStatusData = await zapierRes.json()
            // The backend reports the secret as configured whether it's the per-company
            // `zapier_secret` or the global `ZAPIER_SECRET` env var, so the card reflects
            // setup correctly even before the first call is verified.
            if (zapierStatusData.secret_configured === true) zapierStatus = "Connected"
            setZapierVerified(zapierStatusData.connected === true)
            setZapierLastEvent(zapierStatusData.last_event)
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, zapier: false }))

        // Fetch PostEx status
        let postexStatus = "Not Connected"
        try {
          const postexRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/postex/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (postexRes.ok) {
            const postexData = await postexRes.json()
            if (postexData.connected === true) postexStatus = "Connected"
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, postex: false }))

        // Fetch GinkoRetail status
        let ginkoretailStatus = "Not Connected"
        try {
          const ginkoretailRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/ginkoretail/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (ginkoretailRes.ok) {
            const ginkoretailData = await ginkoretailRes.json()
            if (ginkoretailData.connected === true) ginkoretailStatus = "Connected"
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, ginkoretail: false }))

        // Fetch Gtech status
        let gtechStatus = "Not Connected"
        try {
          const gtechRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/gtech/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (gtechRes.ok) {
            const gtechData = await gtechRes.json()
            if (gtechData.connected === true) gtechStatus = "Connected"
          }
        } catch { /* non-critical */ }
        setCheckingStatuses((prev) => ({ ...prev, gtech: false }))

        setIntegrations((prev) =>
  prev.map((integration) => {
    if (integration.key === "kitchenhub") {
      return { ...integration, status: "----------------", statusColor: "text-grey-600" }
    }
    if (integration.key === "whatsapp") {
      return {
        ...integration,
        status: waStatus,
        statusColor: waStatus === "Connected" ? "text-green-600" : waStatus === "Pending" ? "text-amber-600" : "text-orange-600",
      }
    }
    if (integration.key === "whatsappself") {
      return {
        ...integration,
        status: waSelfStatus,
        statusColor: waSelfStatus === "Connected" ? "text-green-600" : waSelfStatus === "Pending" ? "text-amber-600" : "text-orange-600",
      }
    }
    if (integration.key === "hms") {
      return {
        ...integration,
        status: hmsStatus,
        statusColor: hmsStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    if (integration.key === "shopify") {
      return {
        ...integration,
        status: shopifyStatus,
        statusColor: shopifyStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    if (integration.key === "zapier") {
      return {
        ...integration,
        status: zapierStatus,
        statusColor: zapierStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    if (integration.key === "postex") {
      return {
        ...integration,
        status: postexStatus,
        statusColor: postexStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    if (integration.key === "ginkoretail") {
      return {
        ...integration,
        status: ginkoretailStatus,
        statusColor: ginkoretailStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    if (integration.key === "gtech") {
      return {
        ...integration,
        status: gtechStatus,
        statusColor: gtechStatus === "Connected" ? "text-green-600" : "text-orange-600",
      }
    }
    return {
      ...integration,
      status: connectedKeys.includes(integration.key) ? "Connected" : "Not Connected",
      statusColor: connectedKeys.includes(integration.key) ? "text-green-600" : "text-orange-600",
    }
  })
)


      } catch (error) {
        console.error("Error fetching integrations:", error)
        toast({ description: "Failed to fetch integrations.", variant: "destructive" })
        setCheckingStatuses(INTEGRATION_CHECK_KEYS.reduce((acc, key) => { acc[key] = false; return acc }, {} as Record<string, boolean>))
      } finally {
        setIntegrationsLoading(false)
      }
    }


    fetchIntegrations()

    const releaseTimer = setTimeout(() => setIntegrationsLoading(false), 7000)
    return () => clearTimeout(releaseTimer)
  }, [pathname])


  // 🔹 Handle connect button click
  const handleConnect = async (integration: any) => {

    if (integration.key === "whatsapp") {
      router.push("/dashboard/integrations/whatsapp")
      return
    }

    if (integration.key === "whatsappself") {
      router.push("/dashboard/integrations/whatsappself")
      return
    }

    if (integration.key === "salesforce") {
    try {
      const token = Cookies.get("Token") || ""


      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/salesforce/connect/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      )


      if (!resp.ok) {
        throw new Error("Failed to get Salesforce auth URL")
      }


      const data = await resp.json()
      
      if (data.auth_url) {
        window.location.href = data.auth_url
      } else {
        toast({
          description: "Failed to get Salesforce auth URL.",
          variant: "destructive",
        })
      }
      return
    } catch (error) {
      console.error("Salesforce connection error:", error)
      toast({
        description: "Failed to connect Salesforce.",
        variant: "destructive",
      })
      return
    }
  }



    if (integration.key === "hms") {
      setHmsApiKey("")
      setIsHMSModalOpen(true)
      return
    }

    if (integration.key === "shopify") {
      setShopifyShop("")
      setShopifyApp("public")
      setIsShopifyModalOpen(true)
      return
    }

    if (integration.key === "zapier") {
      openZapierModal()
      return
    }

    if (integration.key === "postex") {
      setPostexToken("")
      setPostexStoreCode("01")
      setPostexCity("Lahore")
      setIsPostExModalOpen(true)
      return
    }

    if (integration.key === "ginkoretail") {
      setGinkoRetailApiToken("")
      setGinkoRetailBaseUrl("https://monark-be.ginkgoretail.net")
      setIsGinkoRetailModalOpen(true)
      return
    }

    if (integration.key === "gtech") {
      setGtechApiToken("")
      setGtechBaseUrl("https://monark.gtech-api.com")
      setIsGtechModalOpen(true)
      return
    }

    if (integration.key === "facebook") {
      setIsFacebookModalOpen(true)
      fetchAgentsForFacebook()
      return
    }




    if (integration.requiresCredentials) {
      setCurrentIntegration(integration)
      setIsAccesseModalOpen(true)
      return
    }


    if (!integration.apiUrl) {
      toast({ description: `No API configured for ${integration.name}.`, variant: "destructive" })
      return
    }


    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(integration.apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })


      const data = await res.json()
      if (!res.ok) {
        toast({ description: `Failed to connect ${integration.name}.`, variant: "destructive" })
        return
      }


      if (data.url) {
        window.location.href = data.url
      } else {
        toast({ description: "No URL returned from backend.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error connecting integration:", error)
      toast({ description: `Error connecting ${integration.name}.`, variant: "destructive" })
    }
  }


  const handleHMSConnect = async () => {
    if (!hmsApiKey.trim()) {
      toast({ description: "Please enter your HMS API key.", variant: "destructive" })
      return
    }
    setHmsConnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/hms/connect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({ api_key: hmsApiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Failed to connect HMS.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "hms" ? { ...i, status: "Connected", statusColor: "text-green-600" } : i)
      )
      toast({ description: "HMS connected successfully!" })
      setIsHMSModalOpen(false)
      setHmsApiKey("")
    } catch (err: any) {
      toast({ description: err.message || "Error connecting HMS.", variant: "destructive" })
    } finally {
      setHmsConnecting(false)
    }
  }

  const handleHMSDisconnect = async () => {
    setHmsDisconnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/hms/disconnect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error("Failed to disconnect HMS.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "hms" ? { ...i, status: "Not Connected", statusColor: "text-orange-600" } : i)
      )
      toast({ description: "HMS disconnected." })
    } catch (err: any) {
      toast({ description: err.message || "Error disconnecting HMS.", variant: "destructive" })
    } finally {
      setHmsDisconnecting(false)
    }
  }

  const handlePostExConnect = async () => {
    if (!postexToken.trim()) {
      toast({ description: "Please enter your PostEx API token.", variant: "destructive" })
      return
    }
    setPostexConnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/postex/connect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          token: postexToken.trim(),
          default_store_code: postexStoreCode.trim() || "01",
          default_city: postexCity.trim() || "Lahore",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Failed to connect PostEx.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "postex" ? { ...i, status: "Connected", statusColor: "text-green-600" } : i)
      )
      toast({ description: "PostEx connected successfully!" })
      setIsPostExModalOpen(false)
      setPostexToken("")
    } catch (err: any) {
      toast({ description: err.message || "Error connecting PostEx.", variant: "destructive" })
    } finally {
      setPostexConnecting(false)
    }
  }

  const handlePostExDisconnect = async () => {
    setPostexDisconnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/postex/disconnect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error("Failed to disconnect PostEx.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "postex" ? { ...i, status: "Not Connected", statusColor: "text-orange-600" } : i)
      )
      toast({ description: "PostEx disconnected." })
    } catch (err: any) {
      toast({ description: err.message || "Error disconnecting PostEx.", variant: "destructive" })
    } finally {
      setPostexDisconnecting(false)
    }
  }

  const handleGinkoRetailConnect = async () => {
    if (!ginkoretailApiToken.trim()) {
      toast({ description: "Please enter your Ginko Retail API token.", variant: "destructive" })
      return
    }
    setGinkoRetailConnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/ginkoretail/connect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          api_token: ginkoretailApiToken.trim(),
          base_url: ginkoretailBaseUrl.trim() || "https://monark-be.ginkgoretail.net",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Failed to connect Ginko Retail.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "ginkoretail" ? { ...i, status: "Connected", statusColor: "text-green-600" } : i)
      )
      toast({ description: "Ginko Retail connected successfully!" })
      setIsGinkoRetailModalOpen(false)
      setGinkoRetailApiToken("")
    } catch (err: any) {
      toast({ description: err.message || "Error connecting Ginko Retail.", variant: "destructive" })
    } finally {
      setGinkoRetailConnecting(false)
    }
  }

  const handleGinkoRetailDisconnect = async () => {
    setGinkoRetailDisconnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/ginkoretail/disconnect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error("Failed to disconnect Ginko Retail.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "ginkoretail" ? { ...i, status: "Not Connected", statusColor: "text-orange-600" } : i)
      )
      toast({ description: "Ginko Retail disconnected." })
    } catch (err: any) {
      toast({ description: err.message || "Error disconnecting Ginko Retail.", variant: "destructive" })
    } finally {
      setGinkoRetailDisconnecting(false)
    }
  }

  const handleGtechConnect = async () => {
    if (!gtechApiToken.trim()) {
      toast({ description: "Please enter your Gtech API token.", variant: "destructive" })
      return
    }
    setGtechConnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/gtech/connect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          api_token: gtechApiToken.trim(),
          base_url: gtechBaseUrl.trim() || "https://monark.gtech-api.com",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Failed to connect Gtech.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "gtech" ? { ...i, status: "Connected", statusColor: "text-green-600" } : i)
      )
      toast({ description: "Gtech connected successfully!" })
      setIsGtechModalOpen(false)
      setGtechApiToken("")
    } catch (err: any) {
      toast({ description: err.message || "Error connecting Gtech.", variant: "destructive" })
    } finally {
      setGtechConnecting(false)
    }
  }

  const handleGtechDisconnect = async () => {
    setGtechDisconnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/gtech/disconnect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error("Failed to disconnect Gtech.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "gtech" ? { ...i, status: "Not Connected", statusColor: "text-orange-600" } : i)
      )
      toast({ description: "Gtech disconnected." })
    } catch (err: any) {
      toast({ description: err.message || "Error disconnecting Gtech.", variant: "destructive" })
    } finally {
      setGtechDisconnecting(false)
    }
  }

  const handleShopifyConnect = async () => {
    const shop = shopifyShop.trim()
    if (!shop) {
      toast({ description: "Please enter your store name.", variant: "destructive" })
      return
    }
    setShopifyConnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/shopify/connect/?shop=${encodeURIComponent(shop)}&app=${encodeURIComponent(shopifyApp)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Failed to connect Shopify.")
      if (!data.auth_url) throw new Error("No auth URL returned from backend.")
      window.location.href = data.auth_url
    } catch (err: any) {
      toast({ description: err.message || "Error connecting Shopify.", variant: "destructive" })
      setShopifyConnecting(false)
    }
  }

  const handleShopifyDisconnect = async () => {
    setShopifyDisconnecting(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/shopify/disconnect/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error("Failed to disconnect Shopify.")
      setIntegrations((prev) =>
        prev.map((i) => i.key === "shopify" ? { ...i, status: "Not Connected", statusColor: "text-orange-600" } : i)
      )
      toast({ description: "Shopify disconnected." })
    } catch (err: any) {
      toast({ description: err.message || "Error disconnecting Shopify.", variant: "destructive" })
    } finally {
      setShopifyDisconnecting(false)
    }
  }

  const openZapierModal = async () => {
    setIsZapierModalOpen(true)
    setZapierSecret("")
    setZapierSecretVisible(false)
    setZapierCompanyId(null)
    setZapierVerified(false)
    setZapierLastEvent(null)

    const token = Cookies.get("Token") || ""
    const authHeaders = { "Content-Type": "application/json", Authorization: `Token ${token}` }

    // Refresh connection/verification status from the backend.
    try {
      const zapRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/zapier/status/`, { headers: authHeaders })
      if (zapRes.ok) {
        const zapStatus = await zapRes.json()
        setZapierVerified(zapStatus.connected === true)
        setZapierLastEvent(zapStatus.last_event)
      }
    } catch { /* non-critical */ }

    try {
      setZapierAgentsLoading(true)
      const agentsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/`, { headers: authHeaders })
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setZapierAgents(Array.isArray(agentsData) ? agentsData : [])
      }
    } catch { /* non-critical */ } finally {
      setZapierAgentsLoading(false)
    }

    try {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`, { headers: authHeaders })
      if (meRes.ok) {
        const meData = await meRes.json()
        const cid = typeof meData.company === "object" ? meData.company?.id : meData.company
        if (cid) {
          setZapierCompanyId(cid)
          try {
            const companyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${cid}/`, { headers: authHeaders })
            if (companyRes.ok) {
              const companyData = await companyRes.json()
              if (companyData.zapier_secret) setZapierSecret(companyData.zapier_secret)
            }
          } catch { /* endpoint may not exist yet */ }
        }
      }
    } catch { /* non-critical */ }
  }

  const handleZapierGenerateSecret = async () => {
    setZapierGenerating(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/generate_zapier_secret/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      if (res.status === 404) {
        toast({ description: "This feature is not available yet. Please contact support.", variant: "destructive" })
        return
      }
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { /* non-JSON response */ }
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to generate secret.")
      setZapierSecret(data.zapier_secret)
      setIntegrations((prev) =>
        prev.map((i) => i.key === "zapier" ? { ...i, status: "Connected", statusColor: "text-green-600" } : i)
      )
      toast({ description: "Zapier secret generated!" })
    } catch (err: any) {
      toast({ description: err.message || "Error generating secret.", variant: "destructive" })
    } finally {
      setZapierGenerating(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setZapierCopiedField(field)
    toast({ description: "Copied to clipboard!" })
    setTimeout(() => setZapierCopiedField(null), 2000)
  }

  const openKitchenHubModal = async () => {
  try {
    setLoadingKitchenHub(true)
    const token = Cookies.get("Token") || ""


    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/kitchenhub/kitchenhub_integrations/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`
      }
    })


    const data = await res.json()


    if (!Array.isArray(data)) {
      toast({ description: "Invalid response.", variant: "destructive" })
      return
    }


    setKitchenHubItems(data)
    setIsKitchenHubModalOpen(true)
  } catch (error) {
    toast({ description: "Failed to fetch KitchenHub details.", variant: "destructive" })
  } finally {
    setLoadingKitchenHub(false)
  }
}



const updateKitchenHubField = (id: number, field: string, value: any) => {
  setKitchenHubItems(prev =>
    prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
  )
}


const saveKitchenHubItem = async (item: any) => {
  try {
    const token = Cookies.get("Token") || ""
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/kitchenhub/kitchenhub_integrations/${item.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`
      },
      body: JSON.stringify({
        location: item.location,
        provider_store_id: item.provider_store_id,
        provider: item.provider,
        status: item.status
      })
    })


    if (!res.ok) throw new Error()


    toast({ description: "KitchenHub updated successfully!" })
  } catch (err) {
    toast({ description: "Failed to update KitchenHub.", variant: "destructive" })
  }
}



  // 🔹 Submit Accesse11 credentials
const handleAccesseSubmit = async () => {
  if (!currentIntegration?.apiUrl) return


  try {
    const token = Cookies.get("Token") || ""
    const res = await fetch(currentIntegration.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })


    const data = await res.json()
    console.log("Accesse11 connection response:", data)


    // 🔹 Prevent marking as connected if backend returns login failure
    if (data?.error?.includes("AccessE11 login failed")) {
      toast({ description: "Invalid Accesse11 credentials. Please try again.", variant: "destructive" })
      return
    }


    if (!res.ok) {
      console.log("Error status code")
      toast({ description: "Failed to connect Accesse11.", variant: "destructive" })
      return
    }


    // ✅ Only update if no error
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.key === "accesse11"
          ? { ...integration, status: "Connected", statusColor: "text-green-600" }
          : integration
      )
    )
    toast({ description: "Accesse11 connected successfully!" })
  } catch (error) {
    console.error("Error connecting Accesse11:", error)
    toast({ description: "Error connecting Accesse11.", variant: "destructive" })
  } finally {
    setIsAccesseModalOpen(false)
    setUsername("")
    setPassword("")
  }
}



const fetchAgentsForFacebook = async () => {
  try {
    setLoadingAgents(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${Cookies.get("Token") || ""}`,
      },
    })
    const data = await res.json()
    setAgents(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("Error fetching agents:", error)
    toast({ description: "Failed to fetch agents", variant: "destructive" })
  } finally {
    setLoadingAgents(false)
  }
}



const handleFacebookConnect = async (agentId: number) => {
  try {
    const token = Cookies.get("Token") || ""
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/facebook/connect/?agent_id=${agentId}`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    )


    const data = await res.json()


    if (!res.ok) throw new Error(data.detail || "Failed to connect Facebook")


    // ✅ If an auth URL exists, redirect the user
    if (data.auth_url) {
      console.log(data.auth_url)
      window.location.href = data.auth_url
      return
    }


    // (Fallback toast if the API didn't return an auth URL)
    toast({ description: `Facebook connected for Agent ${agentId}!` })
    setIsFacebookModalOpen(false)
  } catch (error: any) {
    console.error(error)
    toast({
      description: error.message || "Error connecting Facebook",
      variant: "destructive",
    })
  }
}

  const connectedCount = integrations.filter(i => i.status === "Connected").length
  const totalIntegrations = integrations.filter(i => !i.isKitchenHub).length

  if (hasTwilioPhones === null) {
    return <IntegrationsPageSkeleton />
  }


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.12),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(148,163,184,0.10),transparent_40%)]"></div>
        <div
          className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(rgba(100,116,139,0.35)_1px,transparent_1px)] bg-[length:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_0%,transparent_65%)]"
        ></div>

        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-transparent rounded-full"></div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-light mb-3">Manage connections</p>
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                Integrations
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Connect your external services and manage API integrations
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
            <div className="group bg-white/70 backdrop-blur border border-slate-200/70 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Link2 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">All</span>
              </div>
              <p className="text-4xl font-extralight text-slate-900 mb-1 tabular-nums">
                {integrationsLoading ? <span className="inline-block h-9 w-12 bg-slate-100 rounded animate-pulse align-middle" /> : totalIntegrations}
              </p>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-light">Total Integrations</p>
            </div>

            <div className="group bg-white/70 backdrop-blur border border-slate-200/70 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-green-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                {integrationsLoading ? (
                  <div className="h-6 w-12 bg-slate-100 rounded-full animate-pulse" />
                ) : (
                <div className="text-xs text-green-700 font-medium bg-green-50 border border-green-100 px-2.5 py-1 rounded-full tabular-nums">
                  {totalIntegrations > 0 ? Math.round((connectedCount / totalIntegrations) * 100) : 0}%
                </div>
                )}
              </div>
              <p className="text-4xl font-extralight text-slate-900 mb-1 tabular-nums">
                {integrationsLoading ? <span className="inline-block h-9 w-12 bg-slate-100 rounded animate-pulse align-middle" /> : connectedCount}
              </p>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-light">Connected</p>
            </div>

            <div className="group bg-white/70 backdrop-blur border border-slate-200/70 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-orange-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300">
                  <XCircle className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors duration-300" />
                </div>
                {integrationsLoading ? (
                  <div className="h-6 w-12 bg-slate-100 rounded-full animate-pulse" />
                ) : (
                <div className="text-xs text-orange-700 font-medium bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full tabular-nums">
                  {totalIntegrations > 0 ? Math.round(((totalIntegrations - connectedCount) / totalIntegrations) * 100) : 0}%
                </div>
                )}
              </div>
              <p className="text-4xl font-extralight text-slate-900 mb-1 tabular-nums">
                {integrationsLoading ? <span className="inline-block h-9 w-12 bg-slate-100 rounded animate-pulse align-middle" /> : totalIntegrations - connectedCount}
              </p>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-light">Not Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {hasTwilioPhones && (
        <div className="max-w-7xl mx-auto px-8 py-12">
          {integrationsLoading ? (
            <IntegrationsListSkeleton />
          ) : (
          <>
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-light">
              {statusFilter === "all"
                ? `${integrations.length} integrations`
                : `${[...integrations].filter((i) => statusFilter === "connected" ? i.status === "Connected" : i.status !== "Connected").length} ${statusFilter === "connected" ? "connected" : "not connected"}`}
            </p>
            <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200/70 rounded-2xl shadow-sm">
              {(["all", "connected", "not_connected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-light transition-all duration-200 ${
                    statusFilter === f
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {f === "all" ? "All" : f === "connected" ? "Connected" : "Not Connected"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/70 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50/80 to-white px-8 py-5 border-b border-slate-100">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                <div className="col-span-4">Integration</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-5 text-right">Action</div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {[...integrations]
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter((i) =>
                  statusFilter === "all"
                    ? true
                    : statusFilter === "connected"
                    ? i.status === "Connected"
                    : i.status !== "Connected"
                )
                .map((integration, index) => (
                <div
                  key={index}
                  className="relative px-8 py-6 hover:bg-slate-50/70 transition-all duration-200 group border-l-4 border-transparent hover:border-slate-300"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <IntegrationLogo integration={integration} />
                        <div>
                          <p className="text-sm font-light text-slate-900">{integration.name}</p>
                          {integration.hasDocumentation && (
                            <span className="text-xs text-blue-600 font-light">Documentation</span>
                          )}
                          {integration.isWhatsApp && (
                            <span className="text-xs text-slate-400 font-light">Meta Embedded Signup</span>
                          )}
                          {integration.isWhatsAppSelf && (
                            <span className="text-xs text-slate-400 font-light">QR Code Scan</span>
                          )}
                          {integration.isHMS && (
                            <span className="text-xs text-slate-400 font-light">Hospital Management System</span>
                          )}
                          {integration.isShopify && (
                            <span className="text-xs text-slate-400 font-light">E-commerce Store</span>
                          )}
                          {integration.isShopify && shopifyConnectedApp === "custom" && (
                            <span className="text-xs text-[#8a3ffc] font-light">Custom app (smartconvo-custom)</span>
                          )}
                          {integration.isZapier && (
                            <span className="text-xs text-slate-400 font-light">Trigger AI voice calls from any app</span>
                          )}
                          {integration.isPostEx && (
                            <span className="text-xs text-slate-400 font-light">COD / Returns / Shipping</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      {checkingStatuses[integration.key] ? (
                        <span className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-xs font-medium shadow-sm shadow-slate-500/10 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Checking
                        </span>
                      ) : integration.status === "Connected" ? (
                        <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-medium shadow-sm shadow-emerald-500/15 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200/80 text-emerald-700">
                          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 shadow-sm shadow-emerald-500/40">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                          <span className="tracking-wide">Connected</span>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                        </span>
                      ) : integration.status === "Pending" ? (
                        <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-medium shadow-sm shadow-amber-500/15 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/80 text-amber-700">
                          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 shadow-sm shadow-amber-500/40">
                            <Clock className="w-3 h-3 text-white" strokeWidth={2.5} />
                          </span>
                          <span className="tracking-wide">Pending</span>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                          </span>
                        </span>
                      ) : integration.isKitchenHub ? (
                        <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-medium shadow-sm shadow-sky-500/10 bg-gradient-to-r from-sky-50 via-blue-50 to-sky-50 border border-sky-200/80 text-sky-700">
                          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm shadow-sky-500/40">
                            <MapPin className="w-3 h-3 text-white" strokeWidth={2.5} />
                          </span>
                          <span className="tracking-wide">Active</span>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-medium shadow-sm shadow-slate-500/5 bg-gradient-to-r from-slate-50 to-white border border-dashed border-slate-300 text-slate-500">
                          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          </span>
                          <span className="tracking-wide">Not Connected</span>
                        </span>
                      )}
                    </div>

                    <div className="col-span-5 flex justify-end">
                      {checkingStatuses[integration.key] ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-sm font-light cursor-wait"
                          title="Checking connection status"
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Checking status...
                        </button>
                      ) : integration.isWhatsApp ? (
                        <button
                          className={CONNECT_BUTTON_STYLE}
                          onClick={() => router.push("/dashboard/integrations/whatsapp")}
                        >
                          {integration.status === "Connected" ? "Manage" : "Connect"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : integration.isWhatsAppSelf ? (
                        <button
                          className={CONNECT_BUTTON_STYLE}
                          onClick={() => router.push("/dashboard/integrations/whatsappself")}
                        >
                          {integration.status === "Connected" ? "Manage" : "Connect"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : integration.isKitchenHub ? (
                        <button
                          className={LOCATION_BUTTON_STYLE}
                          onClick={() => openKitchenHubModal()}
                        >
                          <MapPin className="w-4 h-4" />
                          Location
                        </button>
                      ) : integration.isHMS ? (
                        integration.status === "Connected" ? (
                          <button
                            className={DISCONNECT_BUTTON_STYLE}
                            onClick={handleHMSDisconnect}
                            disabled={hmsDisconnecting}
                          >
                            {hmsDisconnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</> : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => { setHmsApiKey(""); setIsHMSModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isShopify ? (
                        integration.status === "Connected" ? (
                          <button
                            className={DISCONNECT_BUTTON_STYLE}
                            onClick={handleShopifyDisconnect}
                            disabled={shopifyDisconnecting}
                          >
                            {shopifyDisconnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</> : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => { setShopifyShop(""); setShopifyApp("public"); setShopifyConnectedApp(null); setIsShopifyModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isZapier ? (
                        integration.status === "Connected" ? (
                          <button
                            className={RECONNECT_BUTTON_STYLE}
                            onClick={() => openZapierModal()}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reconnect
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => openZapierModal()}
                          >
                            Connect Zapier
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isGinkoRetail ? (
                        integration.status === "Connected" ? (
                          <button
                            className={DISCONNECT_BUTTON_STYLE}
                            onClick={handleGinkoRetailDisconnect}
                            disabled={ginkoretailDisconnecting}
                          >
                            {ginkoretailDisconnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</> : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => { setGinkoRetailApiToken(""); setGinkoRetailBaseUrl("https://monark-be.ginkgoretail.net"); setIsGinkoRetailModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isGtech ? (
                        integration.status === "Connected" ? (
                          <button
                            className={DISCONNECT_BUTTON_STYLE}
                            onClick={handleGtechDisconnect}
                            disabled={gtechDisconnecting}
                          >
                            {gtechDisconnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</> : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => { setGtechApiToken(""); setGtechBaseUrl("https://monark.gtech-api.com"); setIsGtechModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isPostEx ? (
                        integration.status === "Connected" ? (
                          <button
                            className={DISCONNECT_BUTTON_STYLE}
                            onClick={handlePostExDisconnect}
                            disabled={postexDisconnecting}
                          >
                            {postexDisconnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</> : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => { setPostexToken(""); setPostexStoreCode("01"); setPostexCity("Lahore"); setIsPostExModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.status === "Connected" ? (
                        <button
                          className={DISCONNECT_BUTTON_STYLE}
                          onClick={async () => {
                            try {
                              const token = Cookies.get("Token") || ""
                              let deleteUrl = ""


                              if (integration.key === "clover") {
                                deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/clover/`
                              } else if (integration.key === "accesse11") {
                                deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/accesse11/`
                              }
                              else if (integration.key === "salesforce") {
                            deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/salesforce/disconnect/`
                          }
                              else if (integration.key === "ginkoretail") {
                            deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/ginkoretail/disconnect/`
                          }
                              else if (integration.key === "gtech") {
                            deleteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/gtech/disconnect/`
                          }


                              if (!deleteUrl) {
                                toast({ description: "No disconnect endpoint found.", variant: "destructive" })
                                return
                              }

                              // Use POST for ginkoretail and gtech, DELETE for others
                              const disconnectMethod = (integration.key === "ginkoretail" || integration.key === "gtech") ? "POST" : "DELETE"

                              const res = await fetch(deleteUrl, {
                                method: disconnectMethod,
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Token ${token}`,
                                },
                              })


                              if (!res.ok) throw new Error("Failed to disconnect")


                              setIntegrations((prev) =>
                                prev.map((item) =>
                                  item.key === integration.key
                                    ? { ...item, status: "Not Connected", statusColor: "text-orange-600" }
                                    : item
                                )
                              )
                              toast({ description: `${integration.name} disconnected successfully.` })
                            } catch (error) {
                              console.error("Error disconnecting integration:", error)
                              toast({ description: `Error disconnecting ${integration.name}.`, variant: "destructive" })
                            }
                          }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        integration.status === "Not Connected" ? (
                          <button
                            className={CONNECT_BUTTON_STYLE}
                            onClick={() => handleConnect(integration)}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            className={RECONNECT_BUTTON_STYLE}
                            onClick={() => handleConnect(integration)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reconnect
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {[...integrations].filter((i) =>
              statusFilter === "all"
                ? true
                : statusFilter === "connected"
                ? i.status === "Connected"
                : i.status !== "Connected"
            ).length === 0 && (
              <div className="px-8 py-14 text-center">
                <p className="text-sm text-slate-400 font-light">
                  No {statusFilter === "connected" ? "connected" : "not connected"} integrations found.
                </p>
              </div>
            )}
          </div>
          </>
          )}

          <div className="mt-16 flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* KitchenHub Modal */}
      <Dialog open={isKitchenHubModalOpen} onOpenChange={setIsKitchenHubModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">KitchenHub Integrations</DialogTitle>
          </DialogHeader>


          {loadingKitchenHub ? (
            <div className="py-10 text-center text-slate-500 font-light">Loading...</div>
          ) : (
            <div className="space-y-6 overflow-y-auto pr-2 max-h-[calc(85vh-200px)]">
              {kitchenHubItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 p-6 rounded-2xl bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <h3 className="font-light text-lg mb-4 text-slate-700">
                    Location #{item.id}
                  </h3>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                    {/* Editable Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-light text-slate-700">Location</Label>
                      <Input
                        value={item.location}
                        onChange={(e) =>
                          updateKitchenHubField(item.id, "location", e.target.value)
                        }
                        placeholder="Enter location"
                        className="rounded-xl border-slate-200"
                      />
                    </div>


                    {/* Read-only Provider */}
                    <div className="space-y-2">
                      <Label className="text-sm font-light text-slate-700">Provider</Label>
                      <Input value={item.provider} disabled className="rounded-xl border-slate-200 bg-slate-100" />
                    </div>


                    {/* Read-only Provider Store ID */}
                    <div className="space-y-2">
                      <Label className="text-sm font-light text-slate-700">Provider Store ID</Label>
                      <Input value={item.provider_store_id} disabled className="rounded-xl border-slate-200 bg-slate-100" />
                    </div>


                    {/* Read-only Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-light text-slate-700">Status</Label>
                      <Input value={item.status} disabled className="rounded-xl border-slate-200 bg-slate-100" />
                    </div>


                  </div>


                  <button
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-light"
                    onClick={() => saveKitchenHubItem(item)}
                  >
                    Save Changes
                  </button>
                </div>
              ))}
            </div>
          )}


          <DialogFooter>
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsKitchenHubModalOpen(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Facebook Agent Selection Modal */}
      <Dialog open={isFacebookModalOpen} onOpenChange={setIsFacebookModalOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Select Agent to Connect Facebook</DialogTitle>
          </DialogHeader>


          {loadingAgents ? (
            <div className="flex items-center justify-center py-10 text-slate-500 font-light">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center text-slate-500 italic py-10 font-light">No agents found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 bg-white"
                >
                  <h3 className="font-light text-lg text-slate-800 mb-2">{agent.name}</h3>
                  <p className="text-sm text-slate-500 font-light mb-4">
                    {agent.persona || "No persona"}
                  </p>
                  <button
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 text-sm font-light"
                    onClick={() => handleFacebookConnect(agent.id)}
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}


          <DialogFooter>
            <button
              className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsFacebookModalOpen(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* HMS Modal */}
      <Dialog open={isHMSModalOpen} onOpenChange={setIsHMSModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Connect HMS</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 font-light">
            Enter your HMS API key. You can find it in the HMS admin panel under
            <span className="font-medium text-slate-700"> OAuth Apps</span>.
          </p>
          <div className="space-y-2 mt-2">
            <Label htmlFor="hms-api-key" className="text-sm font-light text-slate-700">API Key</Label>
            <Input
              id="hms-api-key"
              value={hmsApiKey}
              onChange={(e) => setHmsApiKey(e.target.value)}
              placeholder="hcrm_access_..."
              className="rounded-xl border-slate-200 font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleHMSConnect()}
            />
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsHMSModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
              onClick={handleHMSConnect}
              disabled={hmsConnecting}
            >
              {hmsConnecting ? "Connecting..." : "Connect"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PostEx Modal */}
      <Dialog open={isPostExModalOpen} onOpenChange={setIsPostExModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Connect PostEx</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 font-light">
            Enter your PostEx partner API token (base64-encoded). You can find it in your PostEx merchant dashboard under
            <span className="font-medium text-slate-700"> API Settings</span>.
          </p>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="postex-token" className="text-sm font-light text-slate-700">API Token</Label>
              <Input
                id="postex-token"
                value={postexToken}
                onChange={(e) => setPostexToken(e.target.value)}
                placeholder="Base64-encoded token..."
                className="rounded-xl border-slate-200 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handlePostExConnect()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="postex-store" className="text-sm font-light text-slate-700">Store Code</Label>
                <Input
                  id="postex-store"
                  value={postexStoreCode}
                  onChange={(e) => setPostexStoreCode(e.target.value)}
                  placeholder="01"
                  className="rounded-xl border-slate-200 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postex-city" className="text-sm font-light text-slate-700">Default City</Label>
                <Input
                  id="postex-city"
                  value={postexCity}
                  onChange={(e) => setPostexCity(e.target.value)}
                  placeholder="Lahore"
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsPostExModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#E31E24] hover:bg-[#c41a1f] text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
              onClick={handlePostExConnect}
              disabled={postexConnecting}
            >
              {postexConnecting ? "Connecting..." : "Connect"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GinkoRetail (Monark) Modal */}
      <Dialog open={isGinkoRetailModalOpen} onOpenChange={setIsGinkoRetailModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-1v-.5c-1.71 0-3.37.54-4.8 1.52l.57 2.19c.66-.52 1.56-.83 2.56-.83 1.35 0 2.5.77 2.98 1.93l-.94 1.19c-.44-.6-1.16-.99-1.98-.99-.92 0-1.73.59-2.02 1.42h2v6.6h-2l.02.37c-.18.2-.36.4-.54.61-.37.4-.75.8-1.13 1.21-.23.25-.46.5-.69.75-.34.36-.68.72-1.01 1.09-.5.55-1 1.1-1.5 1.64v.37h12v-1c0-1.1-.9-2-2-2v-1.93c0 4.08-3.05 7.44-7 7.93z"/>
                </svg>
              </div>
              Connect Ginko Retail (Monark)
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 font-light">
            Enter your Ginko Retail API token and base URL. The base URL defaults to the Monark environment.
          </p>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ginkoretail-base-url" className="text-sm font-light text-slate-700">Base URL</Label>
              <Input
                id="ginkoretail-base-url"
                value={ginkoretailBaseUrl}
                onChange={(e) => setGinkoRetailBaseUrl(e.target.value)}
                placeholder="https://monark-be.ginkgoretail.net"
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ginkoretail-token" className="text-sm font-light text-slate-700">API Token</Label>
              <Input
                id="ginkoretail-token"
                type="password"
                value={ginkoretailApiToken}
                onChange={(e) => setGinkoRetailApiToken(e.target.value)}
                placeholder="Your API token..."
                className="rounded-xl border-slate-200 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleGinkoRetailConnect()}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsGinkoRetailModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
              onClick={handleGinkoRetailConnect}
              disabled={ginkoretailConnecting}
            >
              {ginkoretailConnecting ? "Connecting..." : "Connect"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gtech Modal */}
      <Dialog open={isGtechModalOpen} onOpenChange={setIsGtechModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600">
                  <path d="M19.4 12.9c-.5-.4-1.1-.7-1.7-.8V7c0-.6-.4-1-1-1h-3c-.6 0-1 .4-1 1v5.1c-.6.1-1.2.4-1.7.8-.5.4-.9.9-1.1 1.5l-2.3 4.9c-.2.5-.1 1.1.3 1.5.4.4 1 .5 1.5.3l4.9-2.3c.6-.3 1.1-.7 1.5-1.1.4-.4.7-.9.8-1.5l2.3-4.9c.2-.5.1-1.1-.3-1.5-.4-.4-1-.5-1.5-.3l-4.9 2.3zm-6.9 5.4c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-2c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"/>
                </svg>
              </div>
              Connect Gtech
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 font-light">
            Enter your Gtech API token and base URL. The base URL defaults to the Monark environment.
          </p>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gtech-base-url" className="text-sm font-light text-slate-700">Base URL</Label>
              <Input
                id="gtech-base-url"
                value={gtechBaseUrl}
                onChange={(e) => setGtechBaseUrl(e.target.value)}
                placeholder="https://monark.gtech-api.com"
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gtech-token" className="text-sm font-light text-slate-700">API Token</Label>
              <Input
                id="gtech-token"
                type="password"
                value={gtechApiToken}
                onChange={(e) => setGtechApiToken(e.target.value)}
                placeholder="Your API token..."
                className="rounded-xl border-slate-200 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleGtechConnect()}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsGtechModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
              onClick={handleGtechConnect}
              disabled={gtechConnecting}
            >
              {gtechConnecting ? "Connecting..." : "Connect"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shopify Modal */}
      <Dialog open={isShopifyModalOpen} onOpenChange={setIsShopifyModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Connect Shopify</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 font-light">
            Enter your store name (the subdomain of your store URL). We&apos;ll open Shopify
            to approve the connection — read-only access to your store data.
          </p>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="shopify-app" className="text-sm font-light text-slate-700">Shopify App</Label>
              <select
                id="shopify-app"
                value={shopifyApp}
                onChange={(e) => setShopifyApp(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-light focus:outline-none focus:ring-2 focus:ring-[#96BF48]/40"
              >
                <option value="public">Standard app (smartconvo)</option>
                <option value="custom">Custom app (smartconvo-custom)</option>
              </select>
            </div>
            <Label htmlFor="shopify-shop" className="text-sm font-light text-slate-700">Store Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="shopify-shop"
                value={shopifyShop}
                onChange={(e) => setShopifyShop(e.target.value)}
                placeholder="mybrand"
                className="rounded-xl border-slate-200 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleShopifyConnect()}
              />
              <span className="text-sm text-slate-400 font-mono whitespace-nowrap">.myshopify.com</span>
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsShopifyModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#96BF48] hover:bg-[#86ad3e] text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
              onClick={handleShopifyConnect}
              disabled={shopifyConnecting}
            >
              {shopifyConnecting ? "Redirecting..." : "Connect Store"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zapier Modal */}
      <Dialog open={isZapierModalOpen} onOpenChange={setIsZapierModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF4A00]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#FF4A00]" />
              </div>
              Connect Zapier
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 mt-4">
            {/* Connection status */}
            <div className={`flex items-start gap-2 rounded-xl px-4 py-3 ${zapierVerified ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              {zapierVerified ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-light leading-relaxed">
                {zapierVerified ? (
                  <span className="text-green-700">
                    <strong className="font-medium">Connected</strong> — SmartConvo is receiving Zapier lead webhooks
                    {zapierLastEvent?.created_at ? `(last received ${new Date(zapierLastEvent.created_at).toLocaleString()})` : ""}.
                  </span>
                ) : zapierSecret ? (
                  <span className="text-amber-700">
                    <strong className="font-medium">Secret configured</strong>, but no lead webhook received yet. In your Zap, add a
                    <strong>Webhooks by Zapier &rarr; Webhook</strong> <em>action</em> (not the Catch&nbsp;Hook trigger) pointed at the URL below,
                    then click <strong>Test</strong> to POST a lead. The card flips to <strong>Connected</strong> once a call is received.
                  </span>
                ) : (
                  <span className="text-orange-700">
                    <strong className="font-medium">Not connected yet.</strong> Generate a secret below, then follow the setup steps.
                  </span>
                )}
              </div>
            </div>

            {/* Section A: Zapier Secret */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Your Zapier Secret</h3>
              <p className="text-xs text-slate-500 font-light">This secret authenticates your Zapier webhooks. Keep it confidential.</p>
              {zapierSecret ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm text-slate-700 overflow-hidden">
                      {zapierSecretVisible ? zapierSecret : "\u2022".repeat(32)}
                    </div>
                    <button
                      onClick={() => setZapierSecretVisible(!zapierSecretVisible)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-all"
                      title={zapierSecretVisible ? "Hide" : "Show"}
                    >
                      {zapierSecretVisible ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(zapierSecret, "secret")}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-all"
                      title="Copy"
                    >
                      {zapierCopiedField === "secret" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={handleZapierGenerateSecret}
                      disabled={zapierGenerating}
                      className="text-xs text-[#FF4A00] hover:text-[#e64400] font-light underline underline-offset-2 disabled:opacity-60"
                    >
                      {zapierGenerating ? "Generating..." : "Rotate secret"}
                    </button>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-light">This invalidates existing Zaps using the old secret.</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleZapierGenerateSecret}
                  disabled={zapierGenerating}
                  className="px-4 py-2 bg-[#FF4A00] hover:bg-[#e64400] text-white rounded-xl transition-all duration-200 text-sm font-light disabled:opacity-60"
                >
                  {zapierGenerating ? "Generating..." : "Generate Secret"}
                </button>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Section B: Your Agents */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Your Agents</h3>
              <p className="text-xs text-slate-500 font-light">Copy an Agent ID below and paste it into your Zap as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">agent_id</code>.</p>
              {zapierAgentsLoading ? (
                <div className="flex items-center gap-2 py-4 text-slate-500 text-sm font-light">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading agents...
                </div>
              ) : zapierAgents.length === 0 ? (
                <p className="text-sm text-slate-400 italic font-light py-4">No agents found. Create an agent first.</p>
              ) : (
                <div className="space-y-2">
                  {zapierAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-100/50 transition-all">
                      <div className="min-w-0">
                        <p className="text-sm font-light text-slate-900 truncate">{agent.name}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {agent.id}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(String(agent.id), `agent-${agent.id}`)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 ml-3 transition-all"
                        title="Copy Agent ID"
                      >
                        {zapierCopiedField === `agent-${agent.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Section C: Setup Steps */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Zapier Setup Steps</h3>
              <ol className="space-y-4 text-sm text-slate-600 font-light">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">1</span>
                  <span className="pt-0.5">In Zapier, create a new Zap. Set the <strong className="font-medium text-slate-800">Trigger</strong> to any app (e.g., New Lead in Google Sheets / Forms).</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">2</span>
                  <span className="pt-0.5">Set the <strong className="font-medium text-slate-800">Action</strong> to <strong className="font-medium text-slate-800">Webhooks by Zapier &rarr; POST</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">3</span>
                  <div className="space-y-2 pt-0.5">
                    <span className="block">Set the URL to:</span>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <code className="text-xs text-slate-700 font-mono break-all flex-1">{`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/zapier/webhook/`}</code>
                      <button
                        onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/zapier/webhook/`, "url")}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-all"
                      >
                        {zapierCopiedField === "url" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">4</span>
                  <div className="space-y-2 pt-0.5">
                    <span className="block">Add a header:</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <code className="text-xs text-slate-700 font-mono">
                        X-Zapier-Secret: <span className="text-[#FF4A00]">{zapierSecret ? (zapierSecretVisible ? zapierSecret : "••••••••") : "<your secret from above>"}</span>
                      </code>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">5</span>
                  <div className="space-y-2 pt-0.5">
                    <span className="block">Set the JSON Body:</span>
                    <div className="bg-slate-900 rounded-xl px-4 py-3 overflow-x-auto">
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre">{`{
  "company_id": ${zapierCompanyId || "<your numeric company id>"},
  "agent_id": "<agent id from above>",
  "lead_phone": "<lead phone>",
  "lead_name": "<lead name, optional>"
}`}</pre>
                    </div>
                    <p className="text-xs text-slate-400 font-light mt-1">Optional: add <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{`"call_time"`}</code> (ISO 8601) to schedule the call instead of calling immediately.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light"
              onClick={() => setIsZapierModalOpen(false)}
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accesse11 Modal */}
      <Dialog open={isAccesseModalOpen} onOpenChange={setIsAccesseModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Connect Accesse11</DialogTitle>
          </DialogHeader>


          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-light text-slate-700">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-light text-slate-700">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="rounded-xl border-slate-200" />
            </div>
          </div>


          <DialogFooter className="flex gap-2">
            <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-light" onClick={() => setIsAccesseModalOpen(false)}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 text-sm font-light" onClick={handleAccesseSubmit}>
              Connect
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






// "use client"

// import { Button } from "@/components/ui/button"
// import React from "react"
// import Cookies from "js-cookie"

// const integrations = [
//   {
//     name: "Leadconnector (GHL) v2 - Standard",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Leadconnector (GHL) v2 - Whitelabel",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Hubspot",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Google",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Microsoft - Delegated",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Microsoft - Admin",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//   },
//   {
//     name: "Salesforce",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//     hasDocumentation: true,
//   },
//   {
//     name: "Accesse 11",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//     apiUrl: "https://apii.pentagonai.co/api/integrations/accesse11/connect/",
//   },
//   {
//     name: "Clover",
//     status: "Not Connected",
//     statusColor: "text-orange-600",
//     apiUrl: "https://apii.pentagonai.co/api/integrations/clover/connect/",
//   },
// ]

// export default function IntegrationsPage() {
//   const handleConnect = async (integration: any) => {
//     if (!integration.apiUrl) {
//       console.log(`No API for ${integration.name}`)
//       return
//     }

//     try {
//       const token = Cookies.get("Token") || ""

//       const res = await fetch(integration.apiUrl, {
//         method: "GET",
//         headers: {
//           "Authorization": `Token ${token}`,
//           "Content-Type": "application/json",
//         },
//       })

//       if (!res.ok) {
//         const errorData = await res.json()
//         console.error("Failed to get connect URL", errorData)
//         return
//       }

//       const data = await res.json()
//       if (data.url) {
//         window.location.href = data.url
//       } else {
//         console.error("No URL returned from backend")
//       }
//     } catch (error) {
//       console.error("Error connecting integration:", error)
//     }
//   }
//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold text-slate-800">Integrations</h1>
//       </div>

//       {/* External Integrations Section */}
//       <div className="space-y-4">
//         <h2 className="text-xl font-medium text-slate-700">External Integrations</h2>

//         {/* Integrations Table */}
//         <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-slate-800 text-white">
//               <tr>
//                 <th className="text-left p-4 font-medium">Integration</th>
//                 <th className="text-left p-4 font-medium">Status</th>
//                 <th className="text-left p-4 font-medium">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200">
//               {integrations.map((integration, index) => (
//                 <tr key={index} className="hover:bg-slate-50">
//                   <td className="p-4">
//                     <div className="flex items-center">
//                       <span className="text-slate-800">{integration.name}</span>
//                       {integration.hasDocumentation && (
//                         <span className="ml-2 text-blue-600 text-sm">(Documentation)</span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-4">
//                     <span className={integration.statusColor}>{integration.status}</span>
//                   </td>
//                   <td className="p-4">
//                     <Button
//                       className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
//                       onClick={() => handleConnect(integration)}
//                     >
//                       CONNECT
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   )
// }
