"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EditCompanyRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/admin/dashboard/companies/${params.id}/edit/agents`)
  }, [router, params.id])

  return <div>Redirecting...</div>
}
