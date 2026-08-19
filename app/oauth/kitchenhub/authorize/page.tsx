// "use client"

// import { useState, useEffect } from "react"
// import { useSearchParams, useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Cookies from "js-cookie"
// import { Eye, EyeOff, ShieldCheck } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import { useAuth } from "@/components/auth-provider"

// export default function KitchenHubAuthorizePage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [require2FA, setRequire2FA] = useState(false)
//   const [twoFACode, setTwoFACode] = useState("")
//   const [verifying2FA, setVerifying2FA] = useState(false)

//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const { toast } = useToast()
//   const { login } = useAuth()

//   // ✅ Only use connection_id from URL
//   const connectionId = searchParams.get("connection_id")

//   useEffect(() => {
//     const script = document.createElement("script")
//     script.src = ""
//     script.async = true
//     script.defer = true
//     document.body.appendChild(script)
//   }, [])

//   // ✅ Handle main login
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const token = ""

//     if (!token) {
//       toast({
//         title: "Check required",
//         description: "Please complete the check.",
//         variant: "destructive",
//       })
//       return
//     }

//     if (!connectionId) {
//       toast({
//         title: "Missing connection ID",
//         description: "Authorization link is invalid.",
//         variant: "destructive",
//       })
//       return
//     }

//     Cookies.set("TokenPlaceholder", token, { expires: 0.04 })
//     setIsLoading(true)

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email,
//           password,
//           token: token,
//           connection_id: connectionId,
//         }),
//       })

//       const data = await response.json()
//       console.log(data)

//       if (data.two_fa_required) {
//         Cookies.set("TempToken", data.token, { expires: 0.04 })
//         setRequire2FA(true)
//         return
//       }

//       if (!response.ok) {
//         throw new Error(data?.message || "Login failed")
//       }

//       // ✅ Successful login — redirect with connection_id
//       Cookies.set("Token", data.token, { expires: 7 })
//       login({ email, name: data.name || "Company User", type: "company" })
//       toast({ title: "Authorized", description: "Redirecting to KitchenHub..." })
//       router.push(`/oauth/kitchenhub/success?connection_id=${connectionId}&token=${data.token}&id=${data.id}`)

//     } catch (err: any) {
//       toast({ title: "Error", description: err.message, variant: "destructive" })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // ✅ Handle 2FA verification
//   const handle2FAVerification = async () => {
//     setVerifying2FA(true)
//     const tempToken = Cookies.get("TempToken")

//     if (!twoFACode || twoFACode.length !== 6 || !tempToken) {
//       toast({
//         title: "Invalid code",
//         description: "Enter a valid 6-digit 2FA code.",
//         variant: "destructive",
//       })
//       setVerifying2FA(false)
//       return
//     }

//     const token = ""
//     if (!token) {
//       toast({
//         title: "Check required",
//         description: "Please complete the check.",
//         variant: "destructive",
//       })
//       setVerifying2FA(false)
//       return
//     }

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email,
//           password,
//           token: token,
//           token: twoFACode,
//           connection_id: connectionId,
//         }),
//       })

//       const data = await response.json()
//       if (!response.ok) throw new Error(data?.message || "Invalid 2FA code")

//       Cookies.set("Token", data.token, { expires: 7 })
//       Cookies.remove("TempToken")
//       login({ email, name: data.name || "Company User", type: "company" })
//       toast({ title: "2FA Success", description: "Redirecting to KitchenHub..." })
//       router.push(`/oauth/kitchenhub/success?connection_id=${connectionId}&token=${data.token}&id=${data.id}`)
//     } catch (err: any) {
//       toast({ title: "2FA Error", description: err.message, variant: "destructive" })
//     } finally {
//       setVerifying2FA(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
//       <div
//         className="absolute inset-0 bg-cover bg-center opacity-70"
//         style={{ backgroundImage: 'url("/agent-bg.jpg")' }}
//       />

//       <div className="relative z-10 flex items-center justify-center h-screen px-8">
//         <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
//           <h2 className="text-2xl font-semibold text-center mb-4">Authorize KitchenHub Access</h2>
//           <p className="text-center text-gray-600 mb-6 text-sm">
//             Log in with your company credentials to continue.
//           </p>

//           {!require2FA ? (
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <Label htmlFor="email" className="text-gray-700 text-sm">
//                   Email
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="you@company.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="password" className="text-gray-700 text-sm">
//                   Password
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="••••••••"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="pr-10"
//                   />
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5" />
//                     ) : (
//                       <Eye className="h-5 w-5" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               <div></div>

//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl"
//               >
//                 {isLoading ? "Authorizing..." : "Authorize"}
//               </Button>
//             </form>
//           ) : (
//             <div className="space-y-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <ShieldCheck className="text-green-500 h-5 w-5" />
//                 <h3 className="font-semibold text-gray-800">
//                   Two-Factor Authentication
//                 </h3>
//               </div>
//               <Label htmlFor="2fa" className="text-gray-700 text-sm">
//                 Enter 6-digit code
//               </Label>
//               <Input
//                 id="2fa"
//                 type="text"
//                 maxLength={6}
//                 placeholder="000000"
//                 value={twoFACode}
//                 onChange={(e) => setTwoFACode(e.target.value)}
//                 className="text-center tracking-widest"
//               />

//               <Button
//                 type="button"
//                 onClick={handle2FAVerification}
//                 disabled={verifying2FA || twoFACode.length !== 6}
//                 className="w-full h-11 bg-black text-white rounded-xl"
//               >
//                 {verifying2FA ? "Verifying..." : "Verify Code"}
//               </Button>
//             </div>
//           )}

//           <div className="mt-6 text-center text-sm text-gray-600">
//             Not your account?{" "}
//             <Link href="/login" className="text-black font-medium hover:underline">
//               Switch user
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"

import { Suspense } from "react"
import AuthorizePageContent from "@/components/AuthorizePageContent"

export default function KitchenHubAuthorizePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AuthorizePageContent />
    </Suspense>
  )
}
