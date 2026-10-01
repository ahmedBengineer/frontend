"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar, Users, CreditCard, Globe, Mail, Phone, MapPin, Building, Trash2, Save, Lock } from "lucide-react"

export default function EditCompanyProfile() {
  const { id: companyId } = useParams()
  const router = useRouter()

  const [companyData, setCompanyData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchCompany = async () => {
      const token = Cookies.get("adminToken")
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token || ""}`
          }
        })
        const data = await res.json()
        setCompanyData(data)
        console.log(data)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch company", err)
        setLoading(false)
      }
    }

    fetchCompany()
  }, [companyId])

  const handleStatusChange = (status: string) => {
    setCompanyData((prev: any) => ({ ...prev, status }))
  }

  const handleSave = async () => {
    const token = Cookies.get("adminToken")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token || ""}`
        },
        body: JSON.stringify({ status: companyData.status, password: companyData.password })
      })
      alert("Company updated successfully!")
    } catch (err) {
      console.error("Failed to update company", err)
    }
  }

  const handleDelete = async () => {
    const token = Cookies.get("adminToken")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token || ""}`
        }
      })
      alert("Company deleted successfully!")
      router.push("/admin/dashboard/companies")
    } catch (err) {
      console.error("Failed to delete company", err)
    }
  }

  if (loading || !companyData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl space-y-6 px-6">
          {/* Skeleton header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="w-48 h-6 bg-slate-200 rounded animate-pulse" />
              <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse">
              <div className="space-y-4">
                <div className="w-40 h-5 bg-slate-200 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="w-20 h-3 bg-slate-100 rounded" />
                      <div className="w-full h-5 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
                <div className="w-full h-16 bg-slate-100 rounded-xl" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse">
              <div className="space-y-4">
                <div className="w-28 h-5 bg-slate-200 rounded" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="w-20 h-4 bg-slate-100 rounded" />
                    <div className="w-16 h-4 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-semibold shadow-lg">
          {(companyData.name || "C").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extralight tracking-tight text-slate-900">{companyData.name}</h1>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
              companyData.status === "active" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-100"
            }`}>
              <span className={`w-1 h-1 rounded-full ${companyData.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
              {companyData.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{companyData.industry} {companyData.company_size ? `· ${companyData.company_size} employees` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Company Information</h3>
            <p className="text-xs text-slate-400 mt-0.5">Contact details and basic info</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Building className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Name</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-8">{companyData.name || "—"}</p>
              </div>

              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Mail className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Email</span>
                </div>
                <p className="text-sm text-slate-700 pl-8">{companyData.email || "—"}</p>
              </div>

              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Phone className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Phone</span>
                </div>
                <p className="text-sm text-slate-700 pl-8">{companyData.phone || "—"}</p>
              </div>

              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Globe className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Website</span>
                </div>
                {companyData.website ? (
                  <a href={companyData.website} className="text-sm text-slate-700 pl-8 hover:text-slate-900 underline underline-offset-2 decoration-slate-300" target="_blank" rel="noopener noreferrer">
                    {companyData.website}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 pl-8">—</p>
                )}
              </div>

              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Building className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Industry</span>
                </div>
                <p className="text-sm text-slate-700 pl-8">{companyData.industry || "—"}</p>
              </div>

              <div className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Lock className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Password</span>
                </div>
                <Input
                  type="password"
                  value={companyData.password || ""}
                  onChange={(e) => setCompanyData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl border-slate-200 py-2.5 px-3 text-sm focus-visible:ring-slate-900/20 transition-colors pl-8"
                />
              </div>
            </div>

            {/* Address */}
            {companyData.address && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Address</span>
                </div>
                <p className="text-sm text-slate-700 pl-8">{companyData.address}</p>
              </div>
            )}

            {/* Description */}
            {companyData.description && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">{companyData.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Stats & Actions */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Status & Plan</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <Select value={companyData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[110px] h-8 rounded-lg border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Plan</span>
                <Badge className="text-[10px] font-medium bg-slate-100 text-slate-700 border-0 rounded-md">{companyData.plan || "Free"}</Badge>
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Metrics</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Joined</p>
                  <p className="text-xs font-medium text-slate-800">{new Date(companyData.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Users</p>
                  <p className="text-xs font-medium text-slate-800">{companyData.users?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Last Login</p>
                  <p className="text-xs font-medium text-slate-800">{companyData.last_login ? new Date(companyData.last_login).toLocaleDateString() : "Never"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Usage</p>
                  <p className="text-xs font-medium text-slate-800">1250 API calls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleSave}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl shadow-md"
            >
              <Save className="w-3.5 h-3.5 mr-2" /> Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full h-10 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-sm rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Company
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900">Delete Company</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              This will permanently delete <span className="font-medium text-slate-700">{companyData.name}</span> and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 text-sm rounded-xl">Cancel</Button>
            <Button
              onClick={() => { setDeleteDialogOpen(false); handleDelete() }}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-xl"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
