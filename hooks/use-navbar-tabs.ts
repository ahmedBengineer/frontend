import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"

export interface NavbarTab {
  name: string
  display_name: string
  url_path: string
}

export function useNavbarTabs() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [tabs, setTabs] = useState<NavbarTab[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get("Token") || ""
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

    if (!baseUrl || !token) {
      setLoading(false)
      return
    }

    fetch(`${baseUrl}/api/company/visible-tabs/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch visible tabs")
        }
        return res.json()
      })
      .then((data) => {
        setTabs(data.tabs || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching visible tabs:", err)
        setLoading(false)
      })
  }, [user?.type, user?.email, pathname, token])

  return { tabs, loading }
}