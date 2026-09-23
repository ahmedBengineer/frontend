"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { useParams } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"

export default function ViewCompanyAgentSettings() {
  const params = useParams()
  const companyId = params.id
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedInstruction, setExpandedInstruction] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true)
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
          fetchedAgents = fetchedAgents.filter((a) => String(a.company) === String(companyId))
        setAgents(fetchedAgents)
      } catch (err) {
        console.error("Failed to fetch agents", err)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) fetchAgents()
  }, [companyId])

  // Scroll to top when selectedAgent changes
  useLayoutEffect(() => {
    if (selectedAgent) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [selectedAgent])

  const filteredAgents = agents.filter((agent) =>
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-sm bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-slate-200/80 h-48 p-5 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-5 w-14 bg-slate-100 rounded-full" />
                </div>
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )

  if (!agents.length)
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <X className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No agents found for this company.</p>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
        <h1 className="text-2xl font-extralight text-slate-800 tracking-tight">Agent Settings</h1>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search agents by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
      </div>

      {/* Main Content */}
      <div className={`flex transition-all duration-300 ${selectedAgent ? "gap-6" : "flex-col"}`}>
        {/* LEFT: Agent List */}
        <div className={`transition-all duration-300 ${selectedAgent ? "w-full lg:w-1/2" : "w-full"}`}>
          <div
            className={`grid gap-6 ${
              selectedAgent ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-4"
            }`}
          >
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-2xl bg-white border border-slate-200/80 hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 ${
                  selectedAgent?.id === agent.id ? "ring-2 ring-indigo-500 shadow-lg" : ""
                }`}
                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              >
                <div className="p-5 flex flex-col items-start space-y-2">
                  <div className="flex justify-between items-center w-full">
                    <h3 className="text-base font-semibold text-slate-800 truncate max-w-[180px]">
                      {agent.name}
                    </h3>
                    <Badge
                      className={`text-xs font-medium border-0 rounded-full ${
                        agent.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-full">
                    {new Date(agent.created_at).toLocaleDateString()} • {agent.type}
                  </p>
                </div>
                <div className="px-5 pb-5 mt-auto">
                  <Button variant="outline" size="sm" className="w-full rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                    {selectedAgent?.id === agent.id ? "Hide Details" : "View Details"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Selected Agent Details */}
        {selectedAgent && (
          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg border border-slate-200/60 relative overflow-y-auto max-h-[85vh] animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setSelectedAgent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-light text-slate-800 tracking-tight">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">AI Agent Configuration and Voice Settings</p>
                </div>

                <div className="mt-2">
                  <Tabs defaultValue="voice" className="space-y-6 mt-2">
                    <TabsList className="grid grid-cols-3 w-full rounded-xl bg-slate-100 p-1">
                      <TabsTrigger value="voice" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Voice</TabsTrigger>
                      <TabsTrigger value="prompts" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Prompts</TabsTrigger>
                      <TabsTrigger value="other" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Other</TabsTrigger>
                    </TabsList>

                    {/* Voice Tab */}
                    <TabsContent value="voice" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-3 rounded-xl bg-slate-50">
                          <h4 className="text-xs font-medium text-slate-500 mb-1">Voice ID</h4>
                          <p className="text-sm text-slate-700 font-medium">{selectedAgent.voice_id || "N/A"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50">
                          <h4 className="text-xs font-medium text-slate-500 mb-1">Voice Status</h4>
                          <p className="text-sm text-slate-700 font-medium capitalize">{selectedAgent.voice_status}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          ["Voice Clarity", selectedAgent.voice_clarity],
                          ["Voice Stability", selectedAgent.voice_stability],
                          ["Voice Style", selectedAgent.voice_style],
                        ].map(([label, value]) => (
                          <div key={label} className="p-3 rounded-xl bg-slate-50">
                            <div className="flex justify-between mb-2">
                              <h4 className="text-xs font-medium text-slate-500">{label}</h4>
                              <span className="text-xs font-medium text-indigo-600">{value}%</span>
                            </div>
                            <Progress value={value as number} className="h-2" />
                          </div>
                        ))}

                        <div className="p-3 rounded-xl bg-slate-50">
                          <div className="flex justify-between mb-2">
                            <h4 className="text-xs font-medium text-slate-500">Voice Speed</h4>
                            <span className="text-xs font-medium text-indigo-600">{selectedAgent.voice_speed}x</span>
                          </div>
                          <Progress value={selectedAgent.voice_speed * 50} className="h-2" />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Prompts Tab */}
                    <TabsContent value="prompts" className="space-y-4 pt-4">
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-1.5">Welcome Phrase</h4>
                        <p className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700">
                          {selectedAgent.welcome_phrase || "No welcome phrase set."}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-1.5">Processing Phrases</h4>
                        <ul className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 space-y-1 list-disc list-inside">
                          {selectedAgent.processing_phrases?.length
                            ? selectedAgent.processing_phrases.map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))
                            : "No processing phrases set."}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-1.5">Goodbye Phrase</h4>
                        <p className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700">
                          {selectedAgent.goodbye_phrase || "No goodbye phrase set."}
                        </p>
                      </div>
                    </TabsContent>

                    {/* Other Tab */}
                    <TabsContent value="other" className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-slate-500">Instructions</h4>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                          {expandedInstruction
                            ? selectedAgent.instructions
                            : (selectedAgent.instructions?.slice(0, 150) || "") +
                              (selectedAgent.instructions?.length > 150 ? "..." : "")}
                        </p>
                        {selectedAgent.instructions?.length > 150 && (
                          <Button
                            variant="link"
                            className="text-indigo-600 px-0 text-xs"
                            onClick={() => setExpandedInstruction(!expandedInstruction)}
                          >
                            {expandedInstruction ? "See less" : "See more"}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-slate-50">
                          <h4 className="text-xs font-medium text-slate-500 mb-1">Speaker Boost</h4>
                          <p className="text-sm text-slate-700 font-medium">
                            {selectedAgent.speaker_boost ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50">
                          <h4 className="text-xs font-medium text-slate-500 mb-1">Remaining Minutes</h4>
                          <p className="text-sm text-slate-700 font-medium">{selectedAgent.remaining_minutes} min</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
