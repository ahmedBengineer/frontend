
// "use client"

// import { useEffect, useState } from "react"
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import { Input } from "@/components/ui/input"
// import Cookies from "js-cookie"
// import { useToast } from "@/hooks/use-toast"

// export default function PersonalSettings() {
//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [qrCode, setQrCode] = useState<string | null>(null)
//   const [code, setCode] = useState("")
//   const [verifying, setVerifying] = useState(false)
//   const [initializing, setInitializing] = useState(true)

//   const { toast } = useToast()
//   const token = Cookies.get("Token") || ""
//   // Fetch initial 2FA status
//   useEffect(() => {
//     const fetch2FAStatus = async () => {
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/status/`, {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         })
//         const data = await response.json()
//         console.log(data)
//         setTwoFactorEnabled(data.is_2fa_enabled || false)
//       } catch (err) {
//         toast({ title: "Error", description: "Could not fetch 2FA status", variant: "destructive" })
//       } finally {
//         setInitializing(false)
//       }
//     }

//     fetch2FAStatus()
//   }, [token, toast])

//   // Handle toggle switch
//   const handle2FAToggle = async () => {
//     const newValue = !twoFactorEnabled
//     setTwoFactorEnabled(newValue)

//     if (newValue) {
//       // Enabling 2FA
//       setLoading(true)
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/setup/`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         })

//         const data = await response.json()

//         if (!response.ok) {
//           throw new Error(data?.message || "Failed to set up 2FA")
//         }

//         setQrCode(data.qr_code_base64)
//         toast({ title: "QR Code Ready", description: "Scan the code with your Authenticator App." })
//       } catch (err: any) {
//         toast({ title: "Error", description: err.message, variant: "destructive" })
//         setTwoFactorEnabled(false)
//       } finally {
//         setLoading(false)
//       }
//     } else {
//       // Disabling 2FA
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/disable/`, {
//           method: "DELETE",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         })

//         const data = await response.json()

//         if (!response.ok) {
//           throw new Error(data?.message || "Failed to disable 2FA")
//         }

//         toast({ title: "2FA Disabled", description: "Two-Factor Authentication is now off." })
//       } catch (err: any) {
//         toast({ title: "Error", description: err.message, variant: "destructive" })
//         setTwoFactorEnabled(true)
//       }

//       setQrCode(null)
//       setCode("")
//     }
//   }

//   // Handle 6-digit code verification
//   const handleVerifyCode = async () => {
//     if (!code || code.length !== 6) {
//       toast({ title: "Invalid Code", description: "Please enter a valid 6-digit code.", variant: "destructive" })
//       return
//     }

//     setVerifying(true)

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/verify/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${token}`,
//         },
//         body: JSON.stringify({ token: code }),
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(data?.message || "Invalid code")
//       }

//       toast({ title: "2FA Verified", description: "Two-Factor Authentication is now enabled." })
//       setQrCode(null)
//       setCode("")
//       setTwoFactorEnabled(true)
//     } catch (err: any) {
//       toast({ title: "Verification Failed", description: err.message, variant: "destructive" })
//     } finally {
//       setVerifying(false)
//     }
//   }

//   if (initializing) {
//     return <p className="text-center py-10">Loading Settings...</p>
//   }

//   return (
//     <div className="max-w-2xl mx-auto py-10">
//       <Card>
//         <CardHeader>
//           <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
//           <CardDescription>
//             Secure your account with an extra layer of protection.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="flex items-center justify-between">
//             <Label htmlFor="2fa">Enable 2FA</Label>
//             <Switch
//               id="2fa"
//               checked={twoFactorEnabled}
//               onCheckedChange={handle2FAToggle}
//               disabled={loading || verifying}
//             />
//           </div>

//           {loading && <p>Loading QR Code...</p>}

//           {qrCode && (
//             <div className="text-center">
//               <p className="mb-2">Scan this QR code with your Authenticator App:</p>
//               <img
//                 src={`data:image/png;base64,${qrCode}`}
//                 alt="2FA QR Code"
//                 className="mx-auto border p-2 rounded shadow-md"
//               />

//               <div className="mt-6 space-y-4">
//                 <Label htmlFor="code">Enter 6-digit code</Label>
//                 <Input
//                   id="code"
//                   type="text"
//                   maxLength={6}
//                   value={code}
//                   onChange={(e) => setCode(e.target.value)}
//                   placeholder="123456"
//                   className="text-center tracking-widest"
//                 />
//                 <Button onClick={handleVerifyCode} disabled={verifying}>
//                   {verifying ? "Verifying..." : "Verify Code"}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }







"use client"


import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Building2, Mail, Edit3, Save, MapPin, Palette, PlayCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useTutorial } from "@/components/tutorial/TutorialProvider"


function MapUnavailable() {
  return (
    <div className="h-[380px] rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 flex items-center justify-center px-6 text-center">
      <p className="text-sm text-violet-700 font-light">Map preview could not be loaded.</p>
    </div>
  )
}


const PersonalSettingsMap = dynamic(
  () =>
    import("@/components/PersonalSettingsMap").catch(() => ({
      default: MapUnavailable,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[380px] rounded-2xl bg-violet-50/60 animate-pulse" />,
  }
)


// Full list of country codes
const COUNTRY_CODES = [
  { code: "+1", name: "United States / Canada" },
  { code: "+44", name: "United Kingdom" },
  { code: "+92", name: "Pakistan" },
  { code: "+91", name: "India" },
  { code: "+81", name: "Japan" },
  { code: "+61", name: "Australia" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
  { code: "+39", name: "Italy" },
  { code: "+86", name: "China" },
  { code: "+34", name: "Spain" },
  { code: "+7", name: "Russia" },
  { code: "+55", name: "Brazil" },
  { code: "+27", name: "South Africa" },
  { code: "+82", name: "South Korea" },
  { code: "+31", name: "Netherlands" },
  { code: "+90", name: "Turkey" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+971", name: "UAE" },
  { code: "+20", name: "Egypt" },
  // ... full world list would continue here
]


interface Company {
  [key: string]: any
}


const NON_EDITABLE_FIELDS = [
  "id",
  "plan",
  "status",
  "created_at",
  "updated_at",
  "users",
  "last_login",
  "twilio_phone_numbers",
  "tutorial_setup",
  "user_company",
  "permissions",
  "groups",
]

const SMTP_FIELDS = [
  "MAIL_DRIVER",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USERNAME",
  "MAIL_PASSWORD",
  "MAIL_ENCRYPTION",
  "MAIL_FROM_ADDRESS",
  "MAIL_FROM_NAME",
  "mail_config",
]

function isScalarFieldValue(value: unknown): value is string | number | boolean {
  const valueType = typeof value
  return value == null || valueType === "string" || valueType === "number" || valueType === "boolean"
}

function formatFieldValue(value: unknown): string {
  if (value == null || value === "") return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return ""
    if (value.every((item) => typeof item === "string" || typeof item === "number")) {
      return value.join(", ")
    }
    try {
      return JSON.stringify(value)
    } catch {
      return ""
    }
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return ""
    }
  }
  return String(value)
}

function formatFieldLabel(field: string): string {
  return field.replace(/_/g, " ")
}

function normalizeCompanyData(data: unknown): Company | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null

  const record: Company = { ...(data as Company) }

  if (record.mail_config && typeof record.mail_config === "string") {
    try {
      record.mail_config = JSON.parse(record.mail_config)
    } catch {
      // Keep the raw string if the backend sent invalid JSON.
    }
  }

  return record
}

function getCompanyProfileEntries(company: Company): [string, unknown][] {
  return Object.entries(company).filter(
    ([field, value]) =>
      !NON_EDITABLE_FIELDS.includes(field) &&
      !SMTP_FIELDS.includes(field) &&
      isScalarFieldValue(value)
  )
}

function getSmtpEntries(company: Company): [string, unknown][] {
  const entries: [string, unknown][] = []
  const seen = new Set<string>()

  for (const field of SMTP_FIELDS) {
    if (field === "mail_config") continue
    const value = company[field]
    if (isScalarFieldValue(value) && value !== "") {
      entries.push([field, value])
      seen.add(field)
    }
  }

  const mailConfig = company.mail_config
  if (mailConfig && typeof mailConfig === "object" && !Array.isArray(mailConfig)) {
    for (const [key, value] of Object.entries(mailConfig as Record<string, unknown>)) {
      if (!seen.has(key) && isScalarFieldValue(value) && value !== "") {
        entries.push([key, value])
        seen.add(key)
      }
    }
  } else if (typeof mailConfig === "string" && mailConfig.trim()) {
    if (!seen.has("mail_config")) {
      entries.push(["mail_config", mailConfig])
    }
  }

  return entries
}


export default function PersonalSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [initializing, setInitializing] = useState(true)


  const [company, setCompany] = useState<Company | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState("")
  const [countryCode, setCountryCode] = useState("+1")


  const { toast } = useToast()
  const token = Cookies.get("Token") || ""
  const { startTutorial } = useTutorial()
  const { logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)


  const INDUSTRY_OPTIONS = ["Technology", "Finance", "Healthcare", "Education", "Retail", "municipal services", "Restaurant","Other"]
  const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"]


  const router = useRouter()
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL


  // Fetch 2FA + Company data
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/status/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        )
        const data = await response.json()
        setTwoFactorEnabled(data.is_2fa_enabled || false)
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch 2FA status",
          variant: "destructive",
        })
      } finally {
        setInitializing(false)
      }
    }


    const fetchCompanyData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        )
        const data = await res.json()
        const normalized = normalizeCompanyData(data)
        if (!normalized) {
          throw new Error("Invalid company profile response")
        }
        setCompany(normalized)
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch company data",
          variant: "destructive",
        })
      }
    }


    fetch2FAStatus()
    fetchCompanyData()
  }, [token, toast])


  // Save edited field with validation
  const handleSaveField = async (field: string) => {
    if (!company) return


    // Validation rules
    if (field === "company_since" && !/^\d+$/.test(tempValue)) {
      toast({ title: "Invalid Input", description: "Company Since must be a number.", variant: "destructive" })
      return
    }
    if (field === "website" && !/^www\.[a-zA-Z0-9-]+\.[a-z]{2,}$/.test(tempValue)) {
      toast({ title: "Invalid Website", description: "Website must be in format www.xyz.com", variant: "destructive" })
      return
    }
    if (field === "phone_number") {
      if (!/^\d{6,15}$/.test(tempValue)) {
        toast({ title: "Invalid Phone", description: "Phone number must be 6–15 digits.", variant: "destructive" })
        return
      }
    }


    try {
      const updated = { ...company, [field]: field === "phone_number" ? `${countryCode}${tempValue}` : tempValue }
      setCompany(updated)


      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ [field]: updated[field] }),
        }
      )


      if (!res.ok) throw new Error("Failed to update company")


      toast({
        title: "Updated",
        description: `${field.replace("_", " ")} updated successfully.`,
      })
      setEditingField(null)

      if (field === "industry") {
        setLoggingOut(true)
        setTimeout(() => logout(), 2000)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }


  // Toggle 2FA
  const handle2FAToggle = async () => {
    const newValue = !twoFactorEnabled
    setTwoFactorEnabled(newValue)


    if (newValue) {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/setup/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data?.message || "Failed to set up 2FA")
        setQrCode(data.qr_code_base64)
        toast({
          title: "QR Code Ready",
          description: "Scan the code with your Authenticator App.",
        })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setTwoFactorEnabled(false)
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/disable/`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data?.message || "Failed to disable 2FA")
        toast({ title: "2FA Disabled", description: "Two-Factor Authentication is now off." })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setTwoFactorEnabled(true)
      }
      setQrCode(null)
      setCode("")
    }
  }


  // Verify 2FA
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      })
      return
    }
    setVerifying(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/verify/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ token: code }),
        }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || "Invalid code")
      toast({ title: "2FA Verified", description: "Two-Factor Authentication is now enabled." })
      setQrCode(null)
      setCode("")
      setTwoFactorEnabled(true)
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" })
    } finally {
      setVerifying(false)
    }
  }


  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-light tracking-wide">Loading Settings...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Logging out overlay */}
      {loggingOut && (
        <div className="fixed inset-0 z-[10300] flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
          <p className="text-sm font-light text-slate-700 tracking-wide">Logging out…</p>
        </div>
      )}

      {/* Hero Section - Colorless */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-5xl mx-auto px-8 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
              <div>
                <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                  Settings
                </h1>
                <p className="text-lg text-slate-500 font-light tracking-wide">
                  Manage your account security and company information
                </p>
              </div>
            </div>
            <Button
              onClick={() => startTutorial("welcome")}
              variant="outline"
              className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <PlayCircle className="w-4 h-4" />
              Watch Tutorial
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
        {/* 2FA Section - Indigo accent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-6 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-light text-indigo-900">Two-Factor Authentication</h2>
                  <p className="text-sm text-indigo-600 font-light mt-0.5">
                    Secure your account with an extra layer of protection
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <Label htmlFor="2fa" className="text-slate-900 font-light">Enable 2FA</Label>
                <Switch
                  id="2fa"
                  checked={twoFactorEnabled}
                  onCheckedChange={handle2FAToggle}
                  disabled={loading || verifying}
                />
              </div>

              {loading && (
                <div className="text-center py-4">
                  <p className="text-indigo-600 font-light animate-pulse">Loading QR Code...</p>
                </div>
              )}

              {qrCode && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100"
                >
                  <p className="text-slate-900 font-light">Scan this QR code with your Authenticator App</p>
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="2FA QR Code"
                      className="border-4 border-white shadow-2xl rounded-2xl"
                    />
                  </div>
                  <div className="mt-8 space-y-4 max-w-sm mx-auto">
                    <Label htmlFor="code" className="text-slate-700 font-light">Enter 6-digit code</Label>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      className="text-center tracking-widest text-2xl font-light bg-white border-indigo-200 rounded-xl h-14 focus:ring-2 focus:ring-indigo-400"
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={verifying}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-light transition-all duration-200"
                    >
                      {verifying ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Company Data Section - Blue accent */}
        {company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-white px-8 py-6 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light text-blue-900">Company Information</h2>
                    <p className="text-sm text-blue-600 font-light mt-0.5">
                      Manage and update your company details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCompanyProfileEntries(company).map(([field, value]) => (
                      <div
                        key={field}
                        className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium text-blue-900 capitalize">
                            {formatFieldLabel(field)}
                          </p>
                          {editingField === field ? (
                            <Button
                              size="sm"
                              onClick={() => handleSaveField(field)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 h-8 font-light flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingField(field)
                                setTempValue(formatFieldValue(value))
                              }}
                              className="text-blue-700 hover:bg-blue-100 rounded-lg px-3 h-8 font-light flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </Button>
                          )}
                        </div>

                        {editingField === field ? (
                          field === "industry" ? (
                            <select
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-full border border-blue-200 rounded-xl bg-white p-2.5 font-light text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                              {INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field === "company_size" ? (
                            <select
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-full border border-blue-200 rounded-xl bg-white p-2.5 font-light text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                              {SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field === "phone_number" ? (
                            <div className="space-y-2">
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-full border border-blue-200 rounded-xl bg-white p-2.5 font-light text-sm"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                                ))}
                              </select>
                              <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                placeholder="Phone number"
                                className="bg-white border-blue-200 rounded-xl font-light text-sm"
                              />
                            </div>
                          ) : (
                            <Input
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="bg-white border-blue-200 rounded-xl font-light text-sm"
                            />
                          )
                        ) : (
                          <p className="text-slate-900 font-light text-sm">{formatFieldValue(value) || "—"}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3D Map — Violet accent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-white px-8 py-6 border-b border-violet-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-violet-600" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-light text-violet-900">3D map preview</h2>
                  <p className="text-sm text-violet-600 font-light mt-0.5">
                    Mapbox Standard style · tilt & rotate (Ctrl/right-drag). Set{" "}
                    <code className="text-xs bg-violet-100/80 px-1 py-0.5 rounded font-mono text-violet-800">
                      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                    </code>{" "}
                    in{" "}
                    <code className="text-xs bg-violet-100/80 px-1 py-0.5 rounded font-mono text-violet-800">
                      .env.local
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <PersonalSettingsMap />
            </div>
          </div>
        </motion.div>

        {/* SMTP Section - Emerald accent */}
        {company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-white px-8 py-6 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light text-emerald-900">SMTP Configuration</h2>
                    <p className="text-sm text-emerald-600 font-light mt-0.5">
                      Email delivery settings for your workspace
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getSmtpEntries(company).map(([field, value]) => (
                      <div
                        key={field}
                        className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium text-emerald-900 capitalize">
                            {formatFieldLabel(field)}
                          </p>
                          {editingField === field ? (
                            <Button
                              size="sm"
                              onClick={() => handleSaveField(field)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 h-8 font-light flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingField(field)
                                setTempValue(formatFieldValue(value))
                              }}
                              className="text-emerald-700 hover:bg-emerald-100 rounded-lg px-3 h-8 font-light flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </Button>
                          )}
                        </div>

                        {editingField === field ? (
                          <Input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="bg-white border-emerald-200 rounded-xl font-light text-sm"
                          />
                        ) : (
                          <p className="text-slate-900 font-light text-sm break-all">{formatFieldValue(value) || "—"}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-light text-slate-900">Appearance</h2>
                  <p className="text-sm text-slate-500 font-light mt-0.5">
                    Customize the look and feel of your dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <ThemeToggle />
            </div>
          </div>
        </motion.div>

        {/* dots */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
