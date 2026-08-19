// "use client"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { useAuth } from "@/components/auth-provider"

// interface ProtectedRouteProps {
//   allowedRoles: ("admin" | "company" | "user")[]
//   children: React.ReactNode
// }

// export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
//   const { user, isAuthenticated } = useAuth()
//   const router = useRouter()

//   const userType = user?.type

//   useEffect(() => {
//     // Redirect if userType is undefined or not allowed
//     if (!isAuthenticated || !userType || !allowedRoles.includes(userType)) {
//       router.replace("/login")
//     }
//   }, [isAuthenticated, userType, allowedRoles, router])

//   if (!isAuthenticated || !userType || !allowedRoles.includes(userType)) {
//     return null
//   }

//   return <>{children}</>
// }
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedRouteProps {
  allowedRoles: ("admin" | "company" | "user")[]
  children: React.ReactNode
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const userType = user?.type

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return

    // Redirect if userType is undefined or not allowed
    if (!isAuthenticated || !userType || !allowedRoles.includes(userType)) {
      router.replace("/login")
    }
  }, [isAuthenticated, userType, allowedRoles, router, isLoading])

  // Show loading while validating auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or wrong role
  if (!isAuthenticated || !userType || !allowedRoles.includes(userType)) {
    return null
  }

  return <>{children}</>
}