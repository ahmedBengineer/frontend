// "use client"

// import type React from "react"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Cookies from "js-cookie"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription } from "@/components/ui/alert"


// export default function AdminLogin() {
//   const [credentials, setCredentials] = useState({ username: "", password: "" })
//   const [error, setError] = useState("")
//   const [loading, setLoading] = useState(false)
//   const router = useRouter()

//   const handleLogin = async (e: React.FormEvent) => {
//   e.preventDefault()
//   setLoading(true)
//   setError("")

//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email: credentials.username,
//         password: credentials.password
//       }),
//     })
    
//     const data = await response.json()
//     alert("Login response: " + JSON.stringify(data))
//     if (!response.ok) {
//       throw new Error(data?.message || "Invalid credentials")
//     }

//     if (data.token && data.user_type === "superuser") {
//       Cookies.set("adminToken", data.token, { expires: 7 })
//       const token = Cookies.get("adminToken")
//       localStorage.setItem("adminAuth", "true")
//       if (data.token) {
//       localStorage.setItem("user", JSON.stringify({
//         token: data.token,
//         email: credentials.username,
//         role: "admin",
//       }))
//       }
//       router.push("/admin/dashboard")
//     } else {
//       setError("Admin not verified or invalid type")
//     }
//   } catch (err: any) {
//     console.error("Login error:", err)
//     setError(err.message || "Login failed")
//   } finally {
//     setLoading(false)
//   }
// }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl font-bold">Smart Convo Admin</CardTitle>
//           <CardDescription>Sign in to access the admin dashboard</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleLogin} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="username">Username</Label>
//               <Input
//                 id="username"
//                 type="text"
//                 value={credentials.username}
//                 onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={credentials.password}
//                 onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
//                 required
//               />
//             </div>
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "Signing in..." : "Sign In"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data?.message || "Invalid credentials")

      if (data.token && data.user_type === "superuser") {
        Cookies.set("adminToken", data.token, { expires: 7 })
        localStorage.setItem("adminAuth", "true")
        localStorage.setItem("user", JSON.stringify({
          token: data.token,
          email: credentials.username,
          role: "admin",
        }))
        router.push("/admin/dashboard")
      } else {
        setError("Admin not verified or invalid type")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/agent-bg.jpg')" }}
      ></div>

      {/* Overlay to slightly darken background for readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Foreground content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl rounded-2xl border-0 bg-white/90 backdrop-blur-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-light text-slate-800">Admin Login</CardTitle>
            <CardDescription className="text-slate-500">
              Secure access to the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div className="space-y-1">
                <Label htmlFor="username">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="username"
                    type="email"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({ ...credentials, username: e.target.value })
                    }
                    className="pl-10"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full py-2 text-lg font-semibold bg-slate-800 hover:bg-slate-700 transition rounded-xl"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

