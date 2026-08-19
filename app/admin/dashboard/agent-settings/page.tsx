"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import { Input } from "@/components/ui/input"
import { Search, Building2, ChevronLeft, ChevronRight, ArrowUpDown, Settings2 } from "lucide-react"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12
  const { toast } = useToast()
  const router = useRouter()

  const fetchCompanies = useCallback(async () => {
    const token = Cookies.get("adminToken")
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token || ""}`,
        },
      })
      const data = await res.json()
      if (Array.isArray(data)) setCompanies(data)
      else if (Array.isArray(data.results)) setCompanies(data.results)
    } catch (err) {
      console.error("Failed to fetch companies", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load companies",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy])

  const filteredCompanies = companies
    .filter((c) => c.status !== "pending")
    .filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return (a.name || "").localeCompare(b.name || "")
    })

  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE)
  const pagedCompanies = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <h1 className="text-3xl font-extralight tracking-tight text-slate-900">Agent Configuration</h1>
                <p className="text-sm text-slate-500 font-light mt-1">Select a company to configure its agents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-60 h-9 text-sm bg-slate-50/50 border-slate-200 rounded-lg focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>
              <button
                onClick={() => setSortBy(sortBy === "name" ? "date" : "name")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === "name" ? "A-Z" : "Newest"}
              </button>
            </div>
          </div>

          {/* Count */}
          <div className="mt-6 flex items-center gap-2">
            <span className="text-xs text-slate-400">{filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="w-8 h-8 rounded-lg bg-slate-100" />
                </div>
                <div className="w-3/4 h-4 bg-slate-200 rounded mt-4" />
                <div className="w-1/2 h-3 bg-slate-100 rounded mt-2" />
                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
                  <div className="w-12 h-3 bg-slate-100 rounded" />
                  <div className="w-10 h-3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : pagedCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">No companies found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pagedCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => router.push(`/admin/dashboard/agent-settings/agents?companyId=${company.id}`)}
                className="group relative cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
                    {(company.name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Name + Industry */}
                <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">{company.name}</h3>
                {company.industry && (
                  <p className="text-xs text-slate-500 truncate">{company.industry}</p>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    company.status === "active"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-600 bg-slate-50"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${company.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {company.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(company.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === currentPage
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
