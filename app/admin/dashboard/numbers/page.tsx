"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Phone, Plus, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Building2 } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { parsePhoneNumberFromString } from "libphonenumber-js"

export default function CompaniesAssignPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12
  const [numberFilter, setNumberFilter] = useState<"all" | "assigned" | "none">("all")
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const { toast } = useToast()

  const [numbersDialogOpen, setNumbersDialogOpen] = useState(false)
  const [numbersToShow, setNumbersToShow] = useState<string[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [numberToDelete, setNumberToDelete] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    const token = Cookies.get("adminToken")
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, numberFilter])

  const filteredCompanies = companies
    .filter((c) => c.status !== "pending")
    .filter((c) => {
      if (numberFilter === "assigned") return (c.twilio_phone_numbers || []).length > 0
      if (numberFilter === "none") return (c.twilio_phone_numbers || []).length === 0
      return true
    })
    .filter((c) => {
      const term = searchTerm.toLowerCase()
      return (
        (c.name || "").toLowerCase().includes(term) ||
        (c.twilio_phone_numbers && c.twilio_phone_numbers.some((num: string) => num.toString().includes(term)))
      )
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return (a.name || "").localeCompare(b.name || "")
    })

  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE)
  const pagedCompanies = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleAssign = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      toast({ variant: "destructive", title: "Invalid number", description: "Please enter a valid phone number." })
      return
    }
    try {
      const token = Cookies.get("adminToken")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/public/company/twilio-phones/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token || ""}` },
        body: JSON.stringify({ company_email: selectedCompany?.email, phone_numbers: [`+${phoneNumber}`] }),
      })
      if (!res.ok) throw new Error("Request failed")
      toast({ title: "Success", description: "Phone number assigned successfully." })
      setAssignDialogOpen(false)
      setPhoneNumber("")
      await fetchCompanies()
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not assign number." })
    }
  }

  const confirmDeleteNumber = (num: string) => {
    setNumberToDelete(num)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteNumber = async () => {
    if (!numberToDelete) return
    try {
      const token = Cookies.get("adminToken")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/public/company/twilio-phones/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token || ""}` },
        body: JSON.stringify({ email: selectedCompany?.email, phone_number: numberToDelete }),
      })
      if (!res.ok) throw new Error("Delete failed")
      toast({ title: "Deleted", description: `Number removed successfully.` })
      setNumbersToShow((prev) => prev.filter((n) => n !== numberToDelete))
      setDeleteConfirmOpen(false)
      setNumberToDelete(null)
      await fetchCompanies()
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not delete number." })
    }
  }

  const getCountryFromPhone = (number: string) => {
    try {
      const parsed = parsePhoneNumberFromString("+" + number.replace(/^\+/, ""))
      return parsed ? parsed.country : null
    } catch { return null }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <h1 className="text-3xl font-extralight tracking-tight text-slate-900">Manage Numbers</h1>
                <p className="text-sm text-slate-500 font-light mt-1">Assign and manage phone numbers for companies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 h-9 text-sm bg-slate-50/50 border-slate-200 rounded-lg focus:bg-white focus:border-slate-300 transition-all"
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
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-400">{filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}</span>
            <div className="relative inline-flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg">
              {(["all", "assigned", "none"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setNumberFilter(f)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    numberFilter === f
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f === "all" ? "All" : f === "assigned" ? "Has Numbers" : "No Numbers"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200/80 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="w-16 h-5 rounded bg-slate-100" />
                </div>
                <div className="w-3/4 h-4 bg-slate-200 rounded mb-2" />
                <div className="w-1/2 h-3 bg-slate-100 rounded" />
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                  <div className="w-20 h-5 bg-slate-100 rounded" />
                  <div className="w-20 h-7 bg-slate-100 rounded-lg" />
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
            {pagedCompanies.map((company) => {
              const numbers: string[] = company.twilio_phone_numbers || []
              return (
                <div
                  key={company.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent group-hover:via-emerald-400/50 transition-all duration-500" />
                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
                      {(company.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      numbers.length > 0 ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-50"
                    }`}>
                      <Phone className="w-2.5 h-2.5" />
                      {numbers.length}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-slate-900 truncate mb-0.5">{company.name}</h3>
                  {company.industry && <p className="text-xs text-slate-500 truncate">{company.industry}</p>}

                  {/* Numbers preview - fixed height area */}
                  <div className="mt-3 min-h-[24px]">
                    {numbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {numbers.slice(0, 2).map((num: string, i: number) => (
                          <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded font-mono">
                            +{num.slice(0, 8)}...
                          </span>
                        ))}
                        {numbers.length > 2 && (
                          <span className="text-[10px] text-slate-400 py-0.5">+{numbers.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No numbers assigned</p>
                    )}
                  </div>

                  {/* Actions - pushed to bottom */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
                    {numbers.length > 0 && (
                      <button
                        onClick={() => { setSelectedCompany(company); setNumbersToShow(numbers); setNumbersDialogOpen(true) }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        View All
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedCompany(company); setAssignDialogOpen(true) }}
                      className={`${numbers.length > 0 ? "flex-1" : "w-full"} px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1`}
                    >
                      <Plus className="w-3 h-3" /> Assign
                    </button>
                  </div>
                </div>
              )
            })}
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

      {/* Assign Number Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
          <div className="relative bg-slate-900 px-8 pt-8 pb-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-xl font-medium text-white tracking-tight">Assign Number</DialogTitle>
                <DialogDescription className="text-sm text-slate-400">{selectedCompany?.name}</DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <div className="px-8 py-6">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</Label>
            <div className="mt-2">
              <PhoneInput
                country={"us"}
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                inputClass="!w-full !h-11 !text-sm !pl-12 !rounded-xl !border-slate-200"
                dropdownClass="text-sm"
                enableSearch
              />
            </div>
          </div>
          <div className="px-8 pb-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="flex-1 h-11 text-sm rounded-xl border-slate-200">Cancel</Button>
            <Button onClick={handleAssign} className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl shadow-lg shadow-slate-900/10">
              Assign Number
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Numbers Dialog */}
      <Dialog open={numbersDialogOpen} onOpenChange={setNumbersDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg font-medium text-slate-900">Phone Numbers</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">{selectedCompany?.name} - {numbersToShow.length} number{numbersToShow.length !== 1 ? "s" : ""} assigned</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-0">
            {numbersToShow.map((num, idx) => {
              const country = getCountryFromPhone(num)
              return (
                <div key={idx} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 font-mono truncate">+{num}</p>
                      {country && <p className="text-[10px] text-slate-400">{country}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => confirmDeleteNumber(num)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
            {numbersToShow.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No numbers assigned.</p>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setNumbersDialogOpen(false)} className="w-full rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900">Remove Number</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              Are you sure you want to remove <span className="font-mono font-medium text-slate-700">+{numberToDelete}</span> from {selectedCompany?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setNumberToDelete(null) }} className="flex-1 text-sm rounded-xl">Cancel</Button>
            <Button onClick={handleDeleteNumber} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-xl">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
