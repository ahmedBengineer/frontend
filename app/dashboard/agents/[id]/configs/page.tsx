"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { FormSectionsSkeleton } from "@/components/page-skeletons"

export default function AgentConfigReadOnlyPage() {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split("/")
  const agentId = segments[3]

  const [loading, setLoading] = useState(true)
  const [agentName, setAgentName] = useState("")
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)

        const token = Cookies.get("Token") || ""

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch agents")
        }

        const data = await res.json()
        const agent = data.find((a: any) => String(a.id) === String(agentId))

        if (!agent) {
          console.warn("No agent found for id:", agentId)
          setAgentName("Unknown Agent")
          setConfig(null)
          return
        }

        setAgentName(agent.name || "")
        setConfig(agent.agent_config || {})
      } catch (err) {
        console.error("Failed to load config", err)
        setConfig(null)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [agentId])

  const formatKey = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const renderField = (key: string, value: any) => {
    if (typeof value === "string" || typeof value === "number" || value === null) {
      return (
        <div className="group flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200">
          <Label className="font-medium text-slate-700 text-sm">{formatKey(key)}</Label>
          <span className="text-sm text-slate-500 font-light">{value ?? "—"}</span>
        </div>
      )
    }

    if (typeof value === "boolean") {
      return (
        <div className="group flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200">
          <Label className="font-medium text-slate-700 text-sm">{formatKey(key)}</Label>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${value ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
            {value ? "True" : "False"}
          </span>
        </div>
      )
    }

    if (typeof value === "object") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(value).map(([subKey, subVal]) => (
            <div key={subKey}>{renderField(subKey, subVal)}</div>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-16 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Agent Configuration</p>
                <h1 className="text-4xl font-extralight text-slate-900 tracking-tight">{agentName || "Loading..."}</h1>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900 border-slate-200">
              ← Back
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        {loading ? (
          <FormSectionsSkeleton sections={3} />
        ) : !config ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-slate-300">⚙️</span>
            </div>
            <p className="text-slate-400 font-light">No configuration available for this agent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-3">
              {Object.entries(config).map(([sectionKey, value]) => (
                <AccordionItem
                  key={sectionKey}
                  value={sectionKey}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all duration-200 data-[state=open]:border-slate-300 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/50 transition-all duration-200 [&[data-state=open]]:bg-slate-50">
                    <span className="text-sm font-medium text-slate-900 capitalize">{sectionKey.replace(/_/g, " ")}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-5 border-t border-slate-100 bg-slate-50/30">
                    <div className="space-y-3">
                      {typeof value === "object" && value !== null ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(value).map(([subKey, subVal]) => (
                            <div key={subKey}>{renderField(subKey, subVal)}</div>
                          ))}
                        </div>
                      ) : (
                        renderField(sectionKey, value)
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  )
}
