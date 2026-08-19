"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Plus,
  X,
  Clipboard,
  Globe2,
  Search,
} from "lucide-react"

function jsonPretty(obj: any) {
  return JSON.stringify(obj, null, 2)
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-yellow-100 text-yellow-700",
    PATCH: "bg-purple-100 text-purple-700",
    DELETE: "bg-red-100 text-red-700",
  }
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-semibold ${
        colors[method] || "bg-slate-100 text-slate-700"
      }`}
    >
      {method}
    </span>
  )
}

export default function WorkflowsPage() {
  const { toast } = useToast()
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [viewTool, setViewTool] = useState<any>(null)
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [selectedTool, setSelectedTool] = useState<any>(null)
  const [methodFilter, setMethodFilter] = useState<string>("ALL")

  // Workflow form fields
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([])

  // Search logic
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState<"name" | "url">("name")

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`,
          {
            headers: {
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        if (!res.ok) throw new Error("Failed to fetch tools")
        const data = await res.json()
        setTools(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching tools:", error)
        toast({
          title: "Error",
          description: "Failed to load tools.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [])

  const handleCreateWorkflow = (tool: any) => {
    setSelectedTool(tool)
    setShowWorkflowDialog(true)
    setUrl(tool.url || "")
    setMethod(tool.method || "GET")
    setHeaders([])
  }

  const handleAddHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const handleRemoveHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index)
    setHeaders(newHeaders)
  }

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    const updated = [...headers]
    updated[index][field] = value
    setHeaders(updated)
  }

  const handleSubmitWorkflow = async () => {
    try {
      const payload = {
        tool_id: selectedTool.id,
        url,
        method,
        headers,
      }
      console.log("Workflow Payload:", payload)
      toast({
        title: "Workflow Created",
        description: "Workflow has been created successfully (mock).",
      })
      setShowWorkflowDialog(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create workflow.",
        variant: "destructive",
      })
    }
  }

  const filteredTools = tools
    .filter((tool) =>
      methodFilter === "ALL" ? true : tool.method?.toUpperCase() === methodFilter
    )
    .filter((tool) => {
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      if (searchMode === "name") return tool.name?.toLowerCase().includes(query)
      if (searchMode === "url") return tool.url?.toLowerCase().includes(query)
      return true
    })

  return (
    <div className="space-y-12 px-6 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Workflows
        </h2>
        <p className="text-slate-500">View tools and create workflows seamlessly</p>
      </div>

      {/* 🔍 Search Section */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={`Search by ${searchMode === "name" ? "Tool Name" : "URL"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-transparent bg-slate-900/80 text-white placeholder-gray-400 px-5 py-3 pl-12 shadow-[0_0_20px_rgba(59,130,246,0.5)] focus:shadow-[0_0_30px_rgba(99,102,241,0.7)] focus:outline-none transition-all duration-300"
          />
          <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSearchMode((prev) => (prev === "name" ? "url" : "name"))
          }
          className="flex items-center gap-2 bg-white/70 backdrop-blur-md hover:bg-white"
        >
          {searchMode === "name" ? (
            <>
              <Search className="w-4 h-4" /> Searching by Name
            </>
          ) : (
            <>
              <Globe2 className="w-4 h-4" /> Searching by URL
            </>
          )}
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-6 mt-2">
        {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
          <Button
            key={m}
            variant={methodFilter === m ? "default" : "outline"}
            size="sm"
            className={
              methodFilter === m
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-white text-gray-700 border hover:bg-gray-100"
            }
            onClick={() => setMethodFilter(m)}
          >
            {m}
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center text-slate-500 italic py-20">
          No tools found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {filteredTools.map((tool) => (
            <Card
              key={tool.id}
              className="rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200"
            >
              <CardHeader
                onClick={() => setExpanded(expanded === tool.id ? null : tool.id)}
                className="cursor-pointer"
              >
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-semibold truncate min-w-0">{tool.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <MethodBadge method={tool.method} />
                    {expanded === tool.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                  </div>
                </CardTitle>

                <CardDescription className="truncate text-slate-600">
                  {tool.description || "No description"}
                </CardDescription>
              </CardHeader>

              {expanded === tool.id && (
                <div className="px-6 pb-4">
                  <div className="border rounded-lg bg-slate-50 p-3">
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{tool.url}</span>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto">
                        {jsonPretty({
                          headers: tool.headers,
                          query: tool.query_template,
                          body: tool.body_template,
                          parameters: tool.parameters,
                          timeout: tool.timeout_ms,
                          speak_during_execution: tool.speak_during_execution,
                        })}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewTool(tool)}
                >
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCreateWorkflow(tool)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Create Workflow
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* View Tool Modal */}
      <Dialog open={!!viewTool} onOpenChange={() => setViewTool(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tool Preview: {viewTool?.name}</DialogTitle>
          </DialogHeader>
          {viewTool && (
            <div className="relative max-h-[70vh] overflow-y-auto">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                onClick={() => {
                  navigator.clipboard.writeText(jsonPretty(viewTool))
                  toast({
                    title: "Copied",
                    description: "Tool JSON copied to clipboard.",
                  })
                }}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                {jsonPretty(viewTool)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Workflow Modal */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Workflow for {selectedTool?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Headers</label>
                <Button size="sm" variant="outline" onClick={handleAddHeader}>
                  <Plus className="w-4 h-4 mr-1" /> Add Header
                </Button>
              </div>

              {headers.length === 0 ? (
                <p className="text-xs text-slate-500 mt-2">No headers added</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          handleHeaderChange(index, "key", e.target.value)
                        }
                        placeholder="Key"
                        className="flex-1 border rounded-md px-2 py-1"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          handleHeaderChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 border rounded-md px-2 py-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveHeader(index)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              onClick={handleSubmitWorkflow}
            >
              Create Workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
