"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Check, X, Loader2, Shield, Settings } from "lucide-react"

interface NavbarTab {
  name: string
  display_name: string
  url_path: string
  is_checked: boolean
}

export default function CompanyTabsPermissionsPage() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [tabs, setTabs] = useState<NavbarTab[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.is_company) {
      router.push("/admin/dashboard/companies")
      return
    }

    const token = Cookies.get("Token") || ""
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

    if (!baseUrl || !token) {
      setLoading(false)
      return
    }

    // Fetch current tab visibility settings for this company
    fetch(`${baseUrl}/api/company/visible-tabs/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch visible tabs")
        return res.json()
      })
      .then((data) => {
        const visibleTabNames = new Set(
          (data.tabs || []).map((tab: any) => tab.name)
        )

        // Fetch all available NavbarTab items from the backend
        fetch(`${baseUrl}/api/company/visible-tabs/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch all tabs")
            return res.json()
          })
          .then((data: any) => {
            const allTabs: NavbarTab[] = (data.tabs || []).map(
              (tab: any) => ({
                name: tab.name,
                display_name: tab.display_name,
                url_path: tab.url_path,
                is_checked: visibleTabNames.has(tab.name),
              })
            )
            setTabs(allTabs)
            setLoading(false)
          })
          .catch((err) => {
            console.error("Error fetching all tabs:", err)
            setLoading(false)
          })
      })
      .catch((err) => {
        console.error("Error fetching tab visibility:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setLoading(false)
      })
  }, [user?.is_company, pathname])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const tab_names = tabs
      .filter((tab) => tab.is_checked)
      .map((tab) => tab.name)

    try {
      const token = Cookies.get("Token") || ""
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/company/update-tab-visibility/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ tab_names }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to update tab visibility")
      }

      setTabs(
        tabs.map((tab) => ({
          ...tab,
          is_checked: tab_names.includes(tab.name),
        }))
      )

      // Refresh the visible tabs from the API
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/company/visible-tabs/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        const visibleTabNames = new Set(
          (data.tabs || []).map((tab: any) => tab.name)
        )
        setTabs(
          tabs.map((tab) => ({
            ...tab,
            is_checked: visibleTabNames.has(tab.name),
          }))
        )
      }

      toast({
        description: "Tab visibility updated successfully!",
        variant: "success",
      })
    } catch (err: any) {
      console.error("Error saving tab visibility:", err)
      setError(err.message || "Failed to update tab visibility")
      toast({
        description: err.message || "Failed to update tab visibility",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/admin/dashboard/companies")}>
            Back to Companies
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="w-5 h-5 mr-2" /> Tab Permissions for Company Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Company info */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Company: {user?.name || "Unknown"}</p>
              <p className="text-xs text-slate-400">
                Configure which tabs are visible to your company users in the sidebar
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {tabs.length} tabs total
            </p>
          </div>

          {/* Tabs checklist */}
          <div className="space-y-2">
            {tabs.map((tab) => (
              <div
                key={tab.name}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-700 font-light">{tab.display_name}</span>
                  <span className="text-xs text-slate-500">{tab.url_path}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tab.is_checked}
                    onChange={(e) =>
                      setTabs(
                        tabs.map((t) =>
                          t.name === tab.name
                            ? { ...t, is_checked: e.target.checked }
                            : t
                        )
                      )
                    }
                    className="rounded border-slate-400 focus:ring-slate-500"
                  />
                  <span className="text-xs text-slate-500">
                    {tab.is_checked ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200/50">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={() => router.push("/admin/dashboard/companies")}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}