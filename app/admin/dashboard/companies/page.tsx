"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Eye } from "lucide-react"
import { CompaniesPageSkeleton } from "@/components/page-skeletons"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [filterCategory, setFilterCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12
  const router = useRouter()

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      const token = Cookies.get("adminToken")
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token || ""}`
          },
        })
        const data = await res.json()
        console.log(data)
        if (Array.isArray(data)) {
          setCompanies(data)
        } else if (Array.isArray(data.results)) {
          // paginated response (DRF style)
          setCompanies(data.results)
        } else {
          console.error("Invalid companies response format", data)
        }
      } catch (err) {
        console.error("Failed to fetch companies", err)
      } finally {
      setLoading(false)
    }

    }
    fetchCompanies()
  }, [])

  const handleViewCompany = (companyId: number) => {
    router.push(`/admin/dashboard/companies/${companyId}/view/profile`)
  }

  const handleEditCompany = (companyId: number) => {
    router.push(`/admin/dashboard/companies/${companyId}/edit/profile`)
  }

  const handleApproveCompany = async (companyId: number) => {
    const token = Cookies.get("adminToken")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token || ""}`
        },
        body: JSON.stringify({ status: "active" }),
      })
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: "active" } : c))
      )
    } catch (err) {
      console.error("Approval failed", err)
    }
  }

  const handleRejectCompany = async (companyId: number) => {
    const token = Cookies.get("adminToken")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token || ""}`
        },
      })
      setCompanies((prev) => prev.filter((c) => c.id !== companyId))
    } catch (err) {
      console.error("Rejection failed", err)
    }
  }

  const filteredCompanies = Array.isArray(companies)
    ? companies
        .filter(
          (company) =>
            company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterCategory === "all" || company.category === filterCategory)
        )
        .sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name)
            case "dateAdded":
              return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
            case "users":
              return b.users - a.users
            default:
              return 0
          }
        })
    : []
  
  const categories = [
    "all",
    ...Array.from(new Set(companies.map((c) => c.category).filter(Boolean)))
  ]

  const activeOrinactive = filteredCompanies.filter((c) => c.status === "active" || c.status === "inactive")
  const pending = filteredCompanies.filter((c) => c.status === "pending")
  const totalActivePages = Math.ceil(activeOrinactive.length / PAGE_SIZE)
  const pagedActiveOrInactive = activeOrinactive.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const renderCompanyCard = (company: any) => (
    <div key={company.id} className="group relative bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
          {(company.name || "C").charAt(0).toUpperCase()}
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
          company.status === "active"
            ? "text-emerald-700 bg-emerald-50"
            : company.status === "pending"
            ? "text-amber-700 bg-amber-50"
            : "text-slate-600 bg-slate-50"
        }`}>
          <span className={`w-1 h-1 rounded-full ${
            company.status === "active" ? "bg-emerald-500" : company.status === "pending" ? "bg-amber-500" : "bg-slate-400"
          }`} />
          {company.status}
        </span>
      </div>

      {/* Name + Category */}
      <h3 className="text-sm font-semibold text-slate-900 truncate mb-0.5">{company.name}</h3>
      {company.category && <p className="text-xs text-slate-500 truncate">{company.category}</p>}

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
        <span>{company.users?.length || 0} users</span>
        <span>{new Date(company.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
          onClick={() => handleViewCompany(company.id)}
        >
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
        {company.status === "pending" ? (
          <>
            <Button
              size="sm"
              className="flex-1 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs shadow-none"
              onClick={() => handleApproveCompany(company.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 rounded-lg bg-rose-500 text-white hover:bg-rose-600 text-xs shadow-none"
              onClick={() => handleRejectCompany(company.id)}
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1 h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs shadow-none"
            onClick={() => handleEditCompany(company.id)}
          >
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
        )}
      </div>
    </div>
  )

if (loading) {
  return <CompaniesPageSkeleton />
}

  return (
    <div className="space-y-6 p-4 md:p-6">
      
      {/* Header */}
      <div className="sticky top-2 md:top-4 z-40">
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-xl md:rounded-2xl opacity-60 blur-[2px] animate-[gradient_3s_ease_infinite] bg-[length:200%_100%]" />
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10" />
            <div className="relative px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-light text-slate-800 tracking-tight">Companies</h1>
                  <p className="text-xs md:text-sm text-slate-500 font-light">Manage all registered companies on your platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="pl-10 rounded-xl border-slate-200 bg-white h-11 focus:border-indigo-400 focus:ring-indigo-400/20"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-48 rounded-xl border-slate-200 bg-white h-11">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="dateAdded">Sort by Date Added</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-48 rounded-xl border-slate-200 bg-white h-11">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {categories.map((category, idx) => (
              <SelectItem key={`${category}-${idx}`} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active & Inactive Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {pagedActiveOrInactive.map(renderCompanyCard)}
      </div>

      {/* Pagination for active/inactive */}
      {totalActivePages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalActivePages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalActivePages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
              acc.push(p)
              return acc
            }, [])
            .map((p, idx) =>
              p === "…" ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    currentPage === p
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalActivePages, p + 1))}
            disabled={currentPage === totalActivePages}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Pending Companies Section */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Pending Companies</h2>
            <Badge className="bg-amber-100 text-amber-700 border-0 rounded-full text-xs">{pending.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {pending.map(renderCompanyCard)}
          </div>
        </div>
      )}

      {filteredCompanies.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No companies found matching your criteria.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
