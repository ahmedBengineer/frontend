// "use client"

// import { useSearchParams, useRouter } from "next/navigation"
// import { useState } from "react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// export default function ResetPasswordConfirm() {
//   const searchParams = useSearchParams()
//   const token = searchParams.get("token")
//   const router = useRouter()

//   const [email, setEmail] = useState("")
//   const [newPassword, setNewPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [loading, setLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!token) {
//       alert("Missing token in URL")
//       return
//     }

//     if (newPassword !== confirmPassword) {
//       alert("Passwords do not match")
//       return
//     }

//     setLoading(true)

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/reset-password/complete/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           token,
//           email,
//           new_password: newPassword,
//           re_new_password: confirmPassword,
//         }),
//       })

//       const data = await res.json()
//       if (!res.ok) throw new Error(data?.message || "Reset failed")

//       alert("Password reset successful!")
//       router.push("/login")
//     } catch (err: any) {
//       alert(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
//       <Card className="w-full max-w-md shadow-xl border-0">
//         <CardHeader>
//           <CardTitle className="text-2xl">Reset Your Password</CardTitle>
//           <CardDescription>Enter a new password for your account.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="new-password">New Password</Label>
//               <Input
//                 id="new-password"
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="confirm-password">Confirm Password</Label>
//               <Input
//                 id="confirm-password"
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "Submitting..." : "Reset Password"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

import { Suspense } from "react"
import ResetPasswordForm from "./ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
