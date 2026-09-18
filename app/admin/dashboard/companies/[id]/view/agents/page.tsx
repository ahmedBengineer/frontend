"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function ViewCompanyAgents() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const companyId = params.id

  const [agents, setAgents] = useState<any[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true)
      try {
        const token = Cookies.get("adminToken")
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token || ""}`,
          },
        })

        const data = await res.json()
        let fetchedAgents: any[] = []
        if (Array.isArray(data)) fetchedAgents = data
        else if (Array.isArray(data.results)) fetchedAgents = data.results

        if (companyId)
          fetchedAgents = fetchedAgents.filter(
            (a) => String(a.company) === String(companyId)
          )

        setAgents(fetchedAgents)
      } catch (err) {
        console.error("Failed to fetch agents", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load agents. Please try again.",
        })
      } finally {
        setLoadingAgents(false)
      }
    }

    if (companyId) fetchAgents()
  }, [companyId, toast])

  const filteredAgents = agents.filter((agent) =>
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage)
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
        <div>
          <h2 className="text-xl md:text-2xl font-extralight text-slate-800 tracking-tight">
            Agents for Company #{companyId}
          </h2>
          <p className="text-sm text-slate-500 font-light mt-1">
            View all AI agents assigned to this company.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search agents by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
        />
      </div>

      {/* Agents Loader / Grid */}
      {loadingAgents ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 bg-slate-200 rounded" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
              </div>
              <div className="flex gap-2 mt-6">
                <div className="h-8 flex-1 bg-slate-100 rounded-xl" />
                <div className="h-8 flex-1 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedAgents.map((agent) => (
            <div
              key={agent.id}
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col"
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Created:{" "}
                      {new Date(agent.created_at).toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs font-medium border-0 rounded-full ${
                      agent.primary ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {agent.primary ? "Primary" : "Secondary"}
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                  {agent.instructions || "No instructions provided."}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-medium transition-all min-w-0"
                    onClick={() => setSelectedAgent({ ...agent, view: "tools" })}
                  >
                    <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">View Tools</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-slate-200 hover:bg-violet-50 hover:border-violet-300 text-violet-700 font-medium transition-all min-w-0"
                    onClick={() => setSelectedAgent({ ...agent, view: "numbers" })}
                  >
                    <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">View Numbers</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No agents found for this company.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loadingAgents && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-slate-600 px-3">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Dialog: Tools + Numbers - Cinematic Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-5xl rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.3)] max-h-[85vh] overflow-hidden p-0">

          {/* TOOLS VIEW */}
          {selectedAgent?.view === "tools" && (
            <div className="flex flex-col h-full">
              {/* Header with dramatic gradient overlay */}
              <div className="relative px-8 pt-8 pb-6 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative">
                  <DialogTitle className="text-3xl font-light tracking-tight text-white mb-2">
                    {selectedAgent?.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm font-light tracking-wide uppercase">
                    Assigned Tools & Capabilities
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {!selectedAgent?.custom_features?.length ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Eye className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-light">No tools assigned to this agent</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAgent.custom_features.map((tool: any, index: number) => (
                      <div
                        key={tool.id}
                        className="group relative"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-slate-300/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Card className="relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100 line-clamp-2 flex-1">
                                {tool.name || "Unnamed Tool"}
                              </CardTitle>
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full whitespace-nowrap">
                                ACTIVE
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {tool.description || "No description available."}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAgent(null)}
                  className="w-full sm:w-auto hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* NUMBERS VIEW */}
          {selectedAgent?.view === "numbers" && (
            <div className="flex flex-col h-full">
              {/* Header with dramatic gradient overlay */}
              <div className="relative px-8 pt-8 pb-6 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative">
                  <DialogTitle className="text-3xl font-light tracking-tight text-white mb-2">
                    {selectedAgent?.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm font-light tracking-wide uppercase">
                    Connected Phone Numbers
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {!selectedAgent?.twilio_phone_numbers?.length ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Eye className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-light">No numbers assigned</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedAgent.twilio_phone_numbers.map((num: string, index: number) => (
                      <div
                        key={num}
                        className="group relative"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-slate-300/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Card className="relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 p-5">
                          <p className="text-lg font-mono font-medium text-slate-900 dark:text-slate-100 tracking-wide">
                            {num}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                            Twilio Number
                          </p>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAgent(null)}
                  className="w-full sm:w-auto hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}
