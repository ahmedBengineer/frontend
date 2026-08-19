// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Cookies from "js-cookie"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Eye, EyeOff, MessageSquare, Building, User } from "lucide-react"
// import { useAuth } from "@/components/auth-provider"
// import { cn } from "@/lib/utils"

// export default function LoginPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [loginType, setLoginType] = useState<"company" | "user">("company") // Default to company login
//   const router = useRouter()
//   const { login } = useAuth()

//   useEffect(() => {
//     // Set initial login type from localStorage if available
//     const storedLoginType = localStorage.getItem("loginType")
//     if (storedLoginType === "user" || storedLoginType === "company") {
//       setLoginType(storedLoginType)
//     }
//   }, [])

//   const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault()
//   setIsLoading(true)

//   try {

//     const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email,
//         password,
//       }),
//     })
    
//     const data = await response.json()
//     console.log("Login response:", data)
//     if (!response.ok) {
//       throw new Error(data?.message || "Login failed")
//     }

//     // Check if user is verified
//     console.log(data.token, "User type:", data.last_login, "Login type:", data.user_type)
    
//     if (data.token && data.user_type === "company_user" && !data.previous_last_login) {
//       localStorage.setItem("user", JSON.stringify(data))
//       Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
//       router.push("/first-time-setup")
     
//     }

//     else if (data.token && data.user_type === loginType || (data.user_type === "company_user" && loginType === "user")) {
//       // Store login type in localStorage
//       localStorage.setItem("loginType", loginType)
//       Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
//       const token = Cookies.get("Token")

//       // Simulate login 
//       login({ email, name: data.name || "John Doe", type: loginType })
      

//       router.push("/dashboard")
//     } else {
//       alert("User not verified or login type mismatch")
//     }
//   } catch (err: any) {
//     console.error("Login error:", err)
//     alert(err.message)
//   } finally {
//     setIsLoading(false)
//   }
// }


//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
//       <Card className="w-full max-w-md shadow-xl border-0">
//         <CardHeader className="space-y-4 text-center">
//           <div className="flex items-center justify-center space-x-2">
//             <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold text-slate-800">Smart Convo</span>
//           </div>
//           <div>
//             <CardTitle className="text-2xl text-slate-800">Welcome back</CardTitle>
//             <CardDescription className="text-slate-600">Sign in to your account to continue</CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex justify-center gap-4 mb-6">
//             <Button
//               variant={loginType === "company" ? "default" : "outline"}
//               onClick={() => setLoginType("company")}
//               className={cn(
//                 "flex-1 h-11",
//                 loginType === "company"
//                   ? "bg-teal-600 hover:bg-teal-700 text-white"
//                   : "border-teal-600 text-teal-600 hover:bg-teal-50",
//               )}
//             >
//               <Building className="mr-2 h-4 w-4" /> Login as Company
//             </Button>
//             <Button
//               variant={loginType === "user" ? "default" : "outline"}
//               onClick={() => setLoginType("user")}
//               className={cn(
//                 "flex-1 h-11",
//                 loginType === "user"
//                   ? "bg-teal-600 hover:bg-teal-700 text-white"
//                   : "border-teal-600 text-teal-600 hover:bg-teal-50",
//               )}
//             >
//               <User className="mr-2 h-4 w-4" /> Login as User
//             </Button>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-slate-700">
//                 {loginType === "company" ? "Company Email" : "User Email"}
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder={loginType === "company" ? "Enter your company email" : "Enter your user email"}
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="h-11"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password" className="text-slate-700">
//                 Password
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="h-11 pr-10"
//                 />
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-4 w-4 text-slate-500" />
//                   ) : (
//                     <Eye className="h-4 w-4 text-slate-500" />
//                   )}
//                 </Button>
//               </div>
//             </div>
//             <div className="flex items-center justify-between">
//               <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
//                 Forgot password?
//               </Link>
//               <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-700">
//                 Admin Login
//               </Link>
//             </div>
//             <Button type="submit" className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white" disabled={isLoading}>
//               {isLoading ? "Signing in..." : "Sign in"}
//             </Button>
//           </form>
//           <div className="mt-6 text-center">
//             <p className="text-sm text-slate-600">
//               {"Don't have an account? "}
//               <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Cookies from "js-cookie"
import { Eye, EyeOff, Building, User, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<"company" | "user">("company")
  const [require2FA, setRequire2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")
  const [verifying2FA, setVerifying2FA] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)


  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const storedLoginType = localStorage.getItem("loginType")
    if (storedLoginType === "user" || storedLoginType === "company") {
      setLoginType(storedLoginType)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    try {
     
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.two_fa_required) {
        Cookies.set("TempToken", data.token, { expires: 0.04 })
        setRequire2FA(true)
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || "Login failed")
      }
      console.log("Login response:", data)
      // Only block when status is explicitly set to something other than "active" (e.g. inactive/suspended). null/undefined means allowed.
      if (data.user_type === "company" && data.status != null && data.status !== "active") {
        toast({
          title: "Login blocked",
          description: "Your company is not active. Please contact support.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (data.token && data.user_type === "company_user" && !data.previous_last_login) {
        localStorage.setItem("user", JSON.stringify(data))
        Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
        router.push("/first-time-setup")
      } else if (
        data.token &&
        (data.user_type === loginType || (data.user_type === "company_user" && loginType === "user"))
      ) {
        localStorage.setItem("category", data.industry)
        localStorage.setItem("loginType", loginType)
        Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
        login({ email, name: data.name || "John Doe", type: loginType })
        router.push("/dashboard")
      } else {
        toast({
          title: "Login error",
          description: "User not verified or login type mismatch",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Login error:", err)
      alert(err.message)
    } finally {
      if (!require2FA) {
    // only stop loading if login failed
        if (!Cookies.get("Token")) {
          setIsLoading(false)
        }
      }
    }
  }

  const handle2FAVerification = async () => {
    setVerifying2FA(true)
    const tempToken = Cookies.get("TempToken")

    if (!twoFACode || twoFACode.length !== 6 || !tempToken) {
      toast({ title: "Invalid code", description: "Please enter a valid 6-digit code", variant: "destructive" })
      setVerifying2FA(false)
      return
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          token: twoFACode,
        }),
      })

      const result = await response.json()
      console.log(result)

      if (!response.ok) {
        throw new Error(result?.message || "Invalid 2FA code")
      }

      toast({ title: "2FA Success", description: "You're now logged in." })

      Cookies.set("Token", tempToken, rememberMe ? { expires: 30 } : undefined)
      Cookies.remove("TempToken")

      if (result.token && result.user_type === "company_user" && !result.previous_last_login) {
        localStorage.setItem("user", JSON.stringify(result))
        Cookies.set("Token", result.token, rememberMe ? { expires: 30 } : undefined)
        router.push("/first-time-setup")
      } else if (
        result.token &&
        (result.user_type === loginType || (result.user_type === "company_user" && loginType === "user"))
      ) {
        localStorage.setItem("loginType", loginType)
        Cookies.set("Token", result.token, rememberMe ? { expires: 30 } : undefined)
        login({ email, name: result.name || "John Doe", type: loginType })
        router.push("/dashboard")
      } else {
        toast({
          title: "Login error",
          description: "User not verified or login type mismatch",
          variant: "destructive",
        })
      }

      // login({ email, name: result.name || "John Doe", type: loginType })
      // router.push("/dashboard")
    } catch (err: any) {
      toast({ title: "2FA Error", description: err.message, variant: "destructive" })
    } finally {
      setVerifying2FA(false)
    }
  }
  return (
    <main className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden bg-[#050f0a]">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url("/agent-bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050f0a] via-[#050f0a]/80 to-[#050f0a]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-400/[0.03] rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between p-14 w-[46%]">
          <div className="flex items-center gap-3">
            <Image src="/Logo.png" alt="SmartConvo" width={46} height={46} className="rounded-xl" />
            <span className="text-white font-semibold text-xl tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>SmartConvo</span>
          </div>

          <div>
            <p className="text-emerald-400/60 text-xs font-medium tracking-[0.2em] uppercase mb-6">Pentagon AI</p>
            <h1 className="text-[3.2rem] font-extralight text-white leading-[1.15] tracking-tight mb-6">
              AI Voice &amp;<br />
              <span className="text-emerald-400 font-light">Communication</span><br />
              Agents — built<br />
              to never miss a call.
            </h1>
            <p className="text-slate-500 font-light text-base leading-relaxed max-w-sm">
              Automate every customer conversation at scale.
              SmartConvo handles calls, books appointments, and
              keeps your team focused.
            </p>
            <div className="flex flex-col gap-3 mt-10">
              {[
                "24/7 AI voice agents, always on",
                "Instant appointment booking & follow-ups",
                "Seamless integration with your workflow",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                  <span className="text-slate-400 font-light text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-sm font-light">
            No account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Register your company →
            </Link>
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[420px]">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-10 lg:hidden">
              <Image src="/Logo.png" alt="SmartConvo" width={40} height={40} className="rounded-xl" />
              <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>SmartConvo</span>
            </div>

            {/* Glass card */}
            <div className="bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
              <div className="mb-8">
                <h2 className="text-[1.6rem] font-light text-white tracking-tight">Welcome back.</h2>
                <p className="text-slate-500 text-sm mt-1 font-light">Sign in to your workspace</p>
              </div>

              {/* Type toggle */}
              <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-2xl p-[3px] mb-7 gap-1">
                <button
                  type="button"
                  onClick={() => setLoginType("company")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 h-9 rounded-[14px] text-sm transition-all duration-200",
                    loginType === "company"
                      ? "bg-emerald-500 text-[#050f0a] font-medium shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Building className="w-3.5 h-3.5" /> Company
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType("user")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 h-9 rounded-[14px] text-sm transition-all duration-200",
                    loginType === "user"
                      ? "bg-emerald-500 text-[#050f0a] font-medium shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> User
                </button>
              </div>

              {!require2FA ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">
                      {loginType === "company" ? "Company Email" : "Email"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-slate-600 hover:text-emerald-400 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 pr-11 transition-colors"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRememberMe(v => !v)}
                    className="group flex items-center justify-between w-full cursor-pointer"
                  >
                    <span className={`text-xs font-light tracking-wide transition-colors duration-200 ${rememberMe ? "text-emerald-400" : "text-slate-500"}`}>
                      Remember me
                    </span>
                    <div className={`relative w-9 h-5 rounded-full transition-all duration-300 ${rememberMe ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-white/[0.05] border border-white/[0.08]"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${rememberMe ? "left-[18px] bg-emerald-400 shadow-emerald-400/30" : "left-0.5 bg-slate-600 group-hover:bg-slate-500"}`} />
                    </div>
                  </button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-[#050f0a] font-semibold rounded-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#050f0a]/40 border-t-[#050f0a] rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <p className="text-slate-400 text-sm font-light text-center">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">2FA Code</Label>
                    <Input
                      id="2fa"
                      type="text"
                      maxLength={6}
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                      placeholder="000000"
                      className="h-12 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl text-center tracking-[0.5em] text-lg font-light focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handle2FAVerification}
                    disabled={verifying2FA || twoFACode.length !== 6}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-[#050f0a] font-semibold rounded-xl transition-all duration-200"
                  >
                    {verifying2FA ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#050f0a]/40 border-t-[#050f0a] rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-sm text-slate-500 font-light">
                  No account yet?{" "}
                  <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    Create one →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}




// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Cookies from "js-cookie"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Eye, EyeOff, MessageSquare, Building, User } from "lucide-react"
// import { useAuth } from "@/components/auth-provider"
// import { cn } from "@/lib/utils"
// import { toast } from "@/components/ui/use-toast"

// export default function LoginPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [loginType, setLoginType] = useState<"company" | "user">("company")
//   const [show2FAModal, setShow2FAModal] = useState(false)
//   const [twoFACode, setTwoFACode] = useState("")
//   const [verifying2FA, setVerifying2FA] = useState(false)
//   const [token_placeholder, setTokenPlaceholder] = useState("")

//   const router = useRouter()
//   const { login } = useAuth()

//   useEffect(() => {
//     const storedLoginType = localStorage.getItem("loginType")
//     if (storedLoginType === "user" || storedLoginType === "company") {
//       setLoginType(storedLoginType)
//     }

//     const script = document.createElement("script")
//     script.src = ""
//     script.async = true
//     script.defer = true
//     document.body.appendChild(script)
//   }, [])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const token = ""

//     if (!token) {
//       alert("Please complete the check.")
//       return
//     }

//     setTokenPlaceholder(token)
//     Cookies.set("TokenPlaceholder", token, { expires: 0.04 })

//     setIsLoading(true)
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email,
//           password,
//           token: token,
//         }),
//       })

//       const data = await response.json()
     
//       // if (data.two_fa_required) {
//       //     Cookies.set("TempToken", data.token, { expires: 0.04 }) // temp 2FA token
//       //     setShow2FAModal(true)
//       //     return
//       //   }
//       console.log("Login response:", data)

//       if (!response.ok) {
//         throw new Error(data?.message || "Login failed")
//       }

      
//       if (data.token && data.user_type === "company_user" && !data.previous_last_login) {
//         localStorage.setItem("user", JSON.stringify(data))
//         Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
//         router.push("/first-time-setup")
//       } else if (
//         data.token &&
//         (data.user_type === loginType || (data.user_type === "company_user" && loginType === "user"))
//       ) {
//         localStorage.setItem("loginType", loginType)
//         Cookies.set("Token", data.token, rememberMe ? { expires: 30 } : undefined)
//         login({ email, name: data.name || "John Doe", type: loginType })
//         router.push("/dashboard")
//       } else {
//               toast({
//           title: "Login error",
//           description: "User not verified or login type mismatch",
//           variant: "destructive",
//         })
//       }
//     } catch (err: any) {
//       console.error("Login error:", err)
//       alert(err.message)
//     } finally {
//       setIsLoading(false)
//       // reset removed
//     }
//   }

  

// const handle2FAVerification = async () => {
//   setVerifying2FA(true)
//   const tempToken = Cookies.get("TempToken")

//   if (!twoFACode || twoFACode.length !== 6 || !tempToken) {
//     toast({ title: "Invalid code", description: "Please enter a valid 6-digit code", variant: "destructive" })
//     setVerifying2FA(false)
//     return
//   }

//   const token_placeholder = Cookies.get("TokenPlaceholder")
//   console.log("Token:", token_placeholder)
//   console.log("2FA Code:", twoFACode)
//   console.log(email)
//   console.log(password)
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email,
//           password,
//           token: token_placeholder,
//           token: twoFACode,
//         }),
//       })
   

//     const result = await response.json()
//     console.log("2FA response:", result)

//     if (!response.ok) {
//       throw new Error(result?.message || "Invalid 2FA code")
//     }

//     toast({ title: "2FA Success", description: "You're now logged in." })

//     Cookies.set("Token", tempToken, { expires: 7 })
//     Cookies.remove("TempToken")

//     login({ email, name: result.name || "John Doe", type: loginType })
//     router.push("/dashboard")
//   } catch (err: any) {
//     toast({ title: "2FA Error", description: err.message, variant: "destructive" })
//   } finally {
//     setVerifying2FA(false)
//   }
// }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
//       <Card className="w-full max-w-md shadow-xl border-0">
//         <CardHeader className="space-y-4 text-center">
//           <div className="flex items-center justify-center space-x-2">
//             <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold text-slate-800">Smart Convo</span>
//           </div>
//           <div>
//             <CardTitle className="text-2xl text-slate-800">Welcome back</CardTitle>
//             <CardDescription className="text-slate-600">Sign in to your account to continue</CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex justify-center gap-4 mb-6">
//             <Button
//               variant={loginType === "company" ? "default" : "outline"}
//               onClick={() => setLoginType("company")}
//               className={cn(
//                 "flex-1 h-11",
//                 loginType === "company"
//                   ? "bg-teal-600 hover:bg-teal-700 text-white"
//                   : "border-teal-600 text-teal-600 hover:bg-teal-50"
//               )}
//             >
//               <Building className="mr-2 h-4 w-4" /> Login as Company
//             </Button>
//             <Button
//               variant={loginType === "user" ? "default" : "outline"}
//               onClick={() => setLoginType("user")}
//               className={cn(
//                 "flex-1 h-11",
//                 loginType === "user"
//                   ? "bg-teal-600 hover:bg-teal-700 text-white"
//                   : "border-teal-600 text-teal-600 hover:bg-teal-50"
//               )}
//             >
//               <User className="mr-2 h-4 w-4" /> Login as User
//             </Button>
//           </div>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-slate-700">
//                 {loginType === "company" ? "Company Email" : "User Email"}
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder={loginType === "company" ? "Enter your company email" : "Enter your user email"}
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="h-11"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password" className="text-slate-700">
//                 Password
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="h-11 pr-10"
//                 />
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-4 w-4 text-slate-500" />
//                   ) : (
//                     <Eye className="h-4 w-4 text-slate-500" />
//                   )}
//                 </Button>
//               </div>
//             </div>

//             <div></div>

//             <div className="flex items-center justify-between">
//               <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
//                 Forgot password?
//               </Link>
//               <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-700">
//                 Admin Login
//               </Link>
//             </div>

//             <Button
//               type="submit"
//               className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
//               disabled={isLoading}
//             >
//               {isLoading ? "Signing in..." : "Sign in"}
//             </Button>
//           </form>
//           <div className="mt-6 text-center">
//             <p className="text-sm text-slate-600">
//               {"Don't have an account? "}
//               <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//       {show2FAModal && (
//   <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
//     <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm space-y-4">
//       <h2 className="text-lg font-semibold text-center">Two-Factor Authentication</h2>
//       <p className="text-sm text-gray-600 text-center">Enter the 6-digit code from your authenticator app</p>
//       <Input
//         type="text"
//         maxLength={6}
//         value={twoFACode}
//         onChange={(e) => setTwoFACode(e.target.value)}
//         className="text-center tracking-widest"
//         placeholder="123456"
//       />
//       <Button
//         onClick={handle2FAVerification}
//         disabled={verifying2FA || twoFACode.length !== 6}
//         className="w-full bg-teal-600 hover:bg-teal-700 text-white"
//       >
//         {verifying2FA ? "Verifying..." : "Verify"}
//       </Button>
//     </div>
//   </div>
// )}

//     </div>
//   )
// }
