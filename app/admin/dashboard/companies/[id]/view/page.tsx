"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ViewCompanyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/admin/dashboard/companies/${id}/view/profile`)
  }, [router, id])

  return <div>Redirecting...</div>
}
