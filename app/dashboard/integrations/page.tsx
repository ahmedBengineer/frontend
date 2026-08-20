

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
import { Link2, CheckCircle2, XCircle, Loader2, MapPin, ChevronRight, Eye, EyeOff, Copy, Check, AlertTriangle, Zap } from "lucide-react"

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
}

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
  }

  const cfg = logos[integration.key]
  if (!cfg) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-all duration-200">
        <Link2 className="w-5 h-5 text-slate-600" />
      </div>
    )
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${cfg.bg} ${cfg.hover}`}>
      {cfg.icon}
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



  const { toast } = useToast()
  const router = useRouter()

  const pathname = usePathname()
  const [hasTwilioPhones, setHasTwilioPhones] = useState<boolean | null>(null)


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
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/crm-integrations/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })


        if (!res.ok) throw new Error("Failed to fetch integrations")
        const data = await res.json()
      console.log("Fetched integrations:", data)


        const connectedKeys = data
          .filter((item: any) => item.status === "active")
          .map((item: any) => integrationKeyMap[item.crm_type.toLowerCase()] || item.crm_type.toLowerCase())


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

        // Fetch Shopify status
        let shopifyStatus = "Not Connected"
        try {
          const shopifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/shopify/status/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (shopifyRes.ok) {
            const shopifyData = await shopifyRes.json()
            if (shopifyData.connected === true) shopifyStatus = "Connected"
          }
        } catch { /* non-critical */ }

        // Fetch Zapier status
        let zapierStatus = "Not Connected"
        try {
          const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`, {
            headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
          })
          if (meRes.ok) {
            const meData = await meRes.json()
            const cid = typeof meData.company === "object" ? meData.company?.id : meData.company
            if (cid) {
              const zapierRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company/companies/${cid}/`, {
                headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
              })
              if (zapierRes.ok) {
                const zapierData = await zapierRes.json()
                if (zapierData.zapier_secret) zapierStatus = "Connected"
              }
            }
          }
        } catch { /* non-critical */ }

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
      }
    }


    fetchIntegrations()
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
      setIsShopifyModalOpen(true)
      return
    }

    if (integration.key === "zapier") {
      openZapierModal()
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
        `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/shopify/connect/?shop=${encodeURIComponent(shop)}`,
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

    const token = Cookies.get("Token") || ""
    const authHeaders = { "Content-Type": "application/json", Authorization: `Token ${token}` }

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
          const companyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company/companies/${cid}/`, { headers: authHeaders })
          if (companyRes.ok) {
            const companyData = await companyRes.json()
            if (companyData.zapier_secret) setZapierSecret(companyData.zapier_secret)
          }
        }
      }
    } catch { /* non-critical */ }
  }

  const handleZapierGenerateSecret = async () => {
    setZapierGenerating(true)
    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company/companies/generate_zapier_secret/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to generate secret.")
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
    const res = await fetch(`https://apii.pentagonai.co/api/integrations/kitchenhub/kitchenhub_integrations/${item.id}/`, {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-light tracking-wide">Loading integrations...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                Integrations
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Connect your external services and manage API integrations
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Link2 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{totalIntegrations}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Integrations</p>
            </div>

            <div className="group bg-white border border-green-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {totalIntegrations > 0 ? Math.round((connectedCount / totalIntegrations) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{connectedCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Connected</p>
            </div>

            <div className="group bg-white border border-orange-200 rounded-2xl p-6 hover:shadow-lg hover:border-orange-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300">
                  <XCircle className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
                  {totalIntegrations > 0 ? Math.round(((totalIntegrations - connectedCount) / totalIntegrations) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{totalIntegrations - connectedCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Not Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {hasTwilioPhones && (
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                <div className="col-span-4">Integration</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-5 text-right">Action</div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="relative px-8 py-6 hover:bg-slate-50/50 transition-all duration-200 group border-l-4 border-transparent hover:border-slate-300"
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
                          {integration.isZapier && (
                            <span className="text-xs text-slate-400 font-light">Trigger AI voice calls from any app</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-light border ${
                        integration.status === "Connected"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : integration.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : integration.isKitchenHub
                          ? "bg-slate-50 text-slate-600 border-slate-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>
                        {integration.status}
                      </span>
                    </div>

                    <div className="col-span-5 flex justify-end">
                      {integration.isWhatsApp ? (
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20bc59] text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-[#25D366]/20"
                          onClick={() => router.push("/dashboard/integrations/whatsapp")}
                        >
                          {integration.status === "Connected" ? "Manage" : "Connect"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : integration.isWhatsAppSelf ? (
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#128C7E] hover:bg-[#0e6b62] text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-[#128C7E]/20"
                          onClick={() => router.push("/dashboard/integrations/whatsappself")}
                        >
                          {integration.status === "Connected" ? "Manage" : "Connect"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : integration.isKitchenHub ? (
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm font-light flex items-center gap-2"
                          onClick={() => openKitchenHubModal()}
                        >
                          <MapPin className="w-4 h-4" />
                          Location
                        </button>
                      ) : integration.isHMS ? (
                        integration.status === "Connected" ? (
                          <button
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-light disabled:opacity-60"
                            onClick={handleHMSDisconnect}
                            disabled={hmsDisconnecting}
                          >
                            {hmsDisconnecting ? "Disconnecting..." : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-blue-600/20"
                            onClick={() => { setHmsApiKey(""); setIsHMSModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isShopify ? (
                        integration.status === "Connected" ? (
                          <button
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-light disabled:opacity-60"
                            onClick={handleShopifyDisconnect}
                            disabled={shopifyDisconnecting}
                          >
                            {shopifyDisconnecting ? "Disconnecting..." : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#96BF48] hover:bg-[#86ad3e] text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-[#96BF48]/20"
                            onClick={() => { setShopifyShop(""); setIsShopifyModalOpen(true) }}
                          >
                            Connect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.isZapier ? (
                        integration.status === "Connected" ? (
                          <button
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF4A00]/10 hover:bg-[#FF4A00]/20 text-[#FF4A00] rounded-xl transition-all duration-200 text-sm font-light"
                            onClick={() => openZapierModal()}
                          >
                            Reconnect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF4A00] hover:bg-[#e64400] text-white rounded-xl transition-all duration-200 text-sm font-light shadow-sm shadow-[#FF4A00]/20"
                            onClick={() => openZapierModal()}
                          >
                            Connect Zapier
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : integration.status === "Connected" ? (
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-light"
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


                              if (!deleteUrl) {
                                toast({ description: "No disconnect endpoint found.", variant: "destructive" })
                                return
                              }


                              const res = await fetch(deleteUrl, {
                                method: "DELETE",
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
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-light"
                          onClick={() => handleConnect(integration)}
                        >
                          {integration.status === "Not Connected" ? "Connect" : "Reconnect"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
          <div className="space-y-2 mt-2">
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
                      <code className="text-xs text-slate-700 font-mono break-all flex-1">https://apii.pentagonai.co/api/integrations/zapier/webhook/</code>
                      <button
                        onClick={() => copyToClipboard("https://apii.pentagonai.co/api/integrations/zapier/webhook/", "url")}
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
