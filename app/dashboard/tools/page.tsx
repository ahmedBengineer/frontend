// "use client"

// import { useState, useEffect } from "react"
// import Cookies from "js-cookie"
// import { Button } from "@/components/ui/button"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { useToast } from "@/hooks/use-toast"
// import {
//   Card,
//   CardHeader,
//   CardFooter,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card"
// import {
//   Eye,
//   Pencil,
//   Trash2,
//   Plus,
//   Loader2,
//   Globe,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react"
// import CustomToolsForm from "@/components/CustomToolsForm"
// import { Clipboard } from "lucide-react"

// function jsonPretty(obj: any) {
//   return JSON.stringify(obj, null, 2)
// }

// function MethodBadge({ method }: { method: string }) {
//   const colors: Record<string, string> = {
//     GET: "bg-green-100 text-green-700",
//     POST: "bg-blue-100 text-blue-700",
//     PUT: "bg-yellow-100 text-yellow-700",
//     PATCH: "bg-purple-100 text-purple-700",
//     DELETE: "bg-red-100 text-red-700",
//   }
//   return (
//     <span
//       className={`px-2 py-1 rounded-md text-xs font-semibold ${
//         colors[method] || "bg-slate-100 text-slate-700"
//       }`}
//     >
//       {method}
//     </span>
//   )
// }

// export default function ToolsPage() {
//   const { toast } = useToast()
//   const [showDialog, setShowDialog] = useState(false)
//   const [viewTool, setViewTool] = useState<any>(null)
//   const [editTool, setEditTool] = useState<any>(null)
//   const [tools, setTools] = useState<any[]>([])
//   const [loading, setLoading] = useState(false)
//   const [refreshKey, setRefreshKey] = useState(0)
//   const [expanded, setExpanded] = useState<string | null>(null)
//   const [methodFilter, setMethodFilter] = useState<string>("ALL")

//   // Fetch tools
//   useEffect(() => {
//     const fetchTools = async () => {
//       try {
//         setLoading(true)
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`,
//           {
//             headers: {
//               Authorization: `Token ${Cookies.get("Token") || ""}`,
//             },
//           }
//         )
//         if (!res.ok) throw new Error("Failed to fetch tools")
//         const data = await res.json()
//         setTools(Array.isArray(data) ? data : [])
//       } catch (error) {
//         console.error("Error fetching tools:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load tools.",
//           variant: "destructive",
//         })
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchTools()
//   }, [refreshKey])

//   // Confirm delete via toast
//   const confirmDelete = (id: string) => {
//     toast({
//       title: "Confirm Deletion",
//       description: "This action cannot be undone.",
//       variant: "destructive",
//       action: (
//         <Button
//           variant="destructive"
//           size="sm"
//           onClick={() => handleDelete(id)}
//         >
//           Delete
//         </Button>
//       ),
//     })
//   }

//   // Delete tool
//   const handleDelete = async (id: string) => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${id}/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//         }
//       )

//       if (!res.ok) throw new Error("Failed to delete tool")

//       toast({ title: "Deleted", description: "Tool removed successfully." })
//       setRefreshKey((prev) => prev + 1)
//     } catch (error) {
//       console.error("Delete error:", error)
//       toast({
//         title: "Error",
//         description: "Could not delete tool.",
//         variant: "destructive",
//       })
//     }
//   }

//   const handleSuccess = () => {
//     toast({
//       title: "Success",
//       description: editTool
//         ? "Tool updated successfully."
//         : "Tool created successfully.",
//     })
//     setShowDialog(false)
//     setEditTool(null)
//     setRefreshKey((prev) => prev + 1)
//   }

//   return (
//     <div className="space-y-12 px-6 py-8">
//       {/* Page Header */}
//       <div className="text-center space-y-2">
//         <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//           Tools
//         </h2>
//         <p className="text-slate-500">Manage, test, and configure your custom tools</p>
//       </div>

//       {/* Create Tool Button */}
//       <div className="flex justify-center">
//         <Button
//           size="lg"
//           className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
//           onClick={() => {
//             setEditTool(null)
//             setShowDialog(true)
//           }}
//         >
//           <Plus className="w-5 h-5" /> Create Tool
//         </Button>
//       </div>

//       {/* Filter Row */}
//       <div className="flex flex-wrap gap-2 justify-center mb-6">
//         {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
//           <Button
//             key={m}
//             variant={methodFilter === m ? "default" : "outline"}
//             size="sm"
//             className={
//               methodFilter === m
//                 ? "bg-black text-white hover:bg-gray-800"
//                 : "bg-white text-gray-700 border hover:bg-gray-100"
//             }
//             onClick={() => setMethodFilter(m)}
//           >
//             {m}
//           </Button>
//         ))}
//       </div>


//       {/* Tools Grid */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
//         </div>
//       ) : tools.length === 0 ? (
//         <div className="text-center text-slate-500 italic py-20">
//           No tools available. Create your first one!
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
//           {tools
//             .filter((tool) =>
//               methodFilter === "ALL" ? true : tool.method?.toUpperCase() === methodFilter
//             )
//             .map((tool) => (
//             <Card
//               key={tool.id}
//               className="rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200"
//             >
//               <CardHeader
//                 onClick={() => setExpanded(expanded === tool.id ? null : tool.id)}
//                 className="cursor-pointer"
//               >
//                 <CardTitle className="flex flex-wrap items-center justify-between gap-2">
//                   <span className="text-lg font-semibold truncate min-w-0">{tool.name}</span>
//                   <div className="flex items-center gap-2 flex-shrink-0">
//                     <MethodBadge method={tool.method} />
//                     {expanded === tool.id ? (
//                       <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
//                     ) : (
//                       <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
//                     )}
//                   </div>
//                 </CardTitle>

//                 <CardDescription className="truncate text-slate-600">
//                   {tool.description || "No description"}
//                 </CardDescription>
//               </CardHeader>

//               {/* Dropdown */}
//               {expanded === tool.id && (
//                 <div className="px-6 pb-4">
//                   <div className="border rounded-lg bg-slate-50 p-3">
//                     <div className="space-y-4 text-sm">
//                       <div className="flex items-center gap-2">
//                         <Globe className="w-4 h-4 text-slate-500" />
//                         <span className="truncate">{tool.url}</span>
//                       </div>
//                       <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto">
//                         {jsonPretty({
//                           headers: tool.headers,
//                           query: tool.query_template,
//                           body: tool.body_template,
//                           parameters: tool.parameters,
//                           timeout: tool.timeout_ms,
//                           speak_during_execution: tool.speak_during_execution,
//                         })}
//                       </pre>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <CardFooter className="flex flex-wrap gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1 min-w-[90px]"
//                   onClick={() => setViewTool(tool)}
//                 >
//                   <Eye className="w-4 h-4 mr-1" /> View
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   className="flex-1 min-w-[90px]"
//                   onClick={() => {
//                     setEditTool(tool)
//                     setShowDialog(true)
//                   }}
//                 >
//                   <Pencil className="w-4 h-4 mr-1" /> Edit
//                 </Button>
//                 <Button
//                   variant="destructive"
//                   size="sm"
//                   className="flex-1 min-w-[90px]"
//                   onClick={() => confirmDelete(tool.id)}
//                 >
//                   <Trash2 className="w-4 h-4 mr-1" /> Delete
//                 </Button>
//               </CardFooter>

//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Create / Edit Dialog */}
//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-4xl">
//           <DialogHeader>
//             <DialogTitle>
//               {editTool ? "Edit Tool" : "Create Custom Tool"}
//             </DialogTitle>
//           </DialogHeader>
//           <CustomToolsForm tool={editTool} onSuccess={handleSuccess} />
//         </DialogContent>
//       </Dialog>

      

// {/* View Dialog */}
// <Dialog open={!!viewTool} onOpenChange={() => setViewTool(null)}>
//   <DialogContent className="max-w-3xl">
//     <DialogHeader>
//       <DialogTitle>Tool Preview: {viewTool?.name}</DialogTitle>
//     </DialogHeader>

//     {viewTool && (
//       <div className="relative max-h-[70vh] overflow-y-auto">
//         {/* Copy Button (GitHub style, icon-only) */}
//         <Button
//           size="icon"
//           variant="ghost"
//           className="absolute top-2 right-2 z-10 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
//           onClick={() => {
//             navigator.clipboard.writeText(jsonPretty(viewTool))
//             toast({
//               title: "Copied",
//               description: "Tool JSON copied to clipboard.",
//             })
//           }}
//         >
//           <Clipboard className="h-4 w-4" />
//         </Button>

//         {/* Code Block */}
//         <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
//           {jsonPretty(viewTool)}
//         </pre>
//       </div>
//     )}
//   </DialogContent>
// </Dialog>



//     </div>
//   )
// }

"use client"


import React, { useState, useEffect } from "react"
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
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
  Search,
  Globe2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import CustomToolsForm from "@/components/CustomToolsForm"
import { Clipboard } from "lucide-react"
import { ListPageSkeleton } from "@/components/page-skeletons"


function jsonPretty(obj: any) {
  return JSON.stringify(obj, null, 2)
}

function normalizeToolShape(tool: any) {
  return {
    ...tool,
    request_parameters: tool?.request_parameters ?? tool?.parameters ?? {},
    response_parameters: tool?.response_parameters ?? {},
    response_payload: tool?.response_payload ?? {},
    auth_header_name: tool?.auth_header_name ?? "",
    auth_token: tool?.auth_token ?? "",
  }
}


function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-50 text-green-700 border border-green-200",
    POST: "bg-blue-50 text-blue-700 border border-blue-200",
    PUT: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    PATCH: "bg-purple-50 text-purple-700 border border-purple-200",
    DELETE: "bg-rose-50 text-rose-700 border border-rose-200",
  }
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-light ${
        colors[method] || "bg-slate-50 text-slate-700 border border-slate-200"
      }`}
    >
      {method}
    </span>
  )
}


export default function ToolsPage() {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [viewTool, setViewTool] = useState<any>(null)
  const [editTool, setEditTool] = useState<any>(null)
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [methodFilter, setMethodFilter] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const toolsPerPage = 9


  // 🔍 New states for cinematic search
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState<"name" | "url">("name")


  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("ALL")
  const [loadingAgents, setLoadingAgents] = useState(false)


  // Fetch tools
useEffect(() => {
  const fetchTools = async () => {
    try {
      setLoading(true)
      
      if (selectedAgentId !== "ALL") {
        // Fetch tools for specific agent (like in agents page)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${selectedAgentId}/`,
          {
            headers: {
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        if (!res.ok) throw new Error("Failed to fetch agent tools")
        const data = await res.json()
        console.log("Fetched agent tools:", data)
        
        // Extract custom_features from agent data
        const agentTools = Array.isArray(data.custom_features)
          ? data.custom_features.map(normalizeToolShape)
          : []
        setTools(agentTools)
      } else {
        // Fetch all tools
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
        console.log("Fetched all tools:", data)
        const mappedTools = Array.isArray(data) ? data.map(normalizeToolShape) : []
        setTools(mappedTools)
      }
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
}, [refreshKey, selectedAgentId])  // Add selectedAgentId to dependencies

const fetchToolDetails = async (id: string | number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${id}/`,
    {
      headers: {
        Authorization: `Token ${Cookies.get("Token") || ""}`,
      },
    }
  )
  if (!res.ok) throw new Error("Failed to fetch tool details")
  const rawTool = await res.json()
  return normalizeToolShape(rawTool)
}

useEffect(() => {
  const fetchAgents = async () => {
    try {
      setLoadingAgents(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`,
        {
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }
      )
      if (!res.ok) throw new Error("Failed to fetch agents")
      const data = await res.json()
      setAgents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching agents:", error)
    } finally {
      setLoadingAgents(false)
    }
  }


  fetchAgents()
}, [])


  // Confirm delete via toast
  const confirmDelete = (id: string) => {
    toast({
      title: "Confirm Deletion",
      description: "This action cannot be undone.",
      variant: "destructive",
      action: (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(id)}
        >
          Delete
        </Button>
      ),
    })
  }


  // Delete tool
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }
      )


      if (!res.ok) throw new Error("Failed to delete tool")


      toast({ title: "Deleted", description: "Tool removed successfully." })
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Could not delete tool.",
        variant: "destructive",
      })
    }
  }


  const handleSuccess = () => {
    toast({
      title: "Success",
      description: editTool
        ? "Tool updated successfully."
        : "Tool created successfully.",
    })
    setShowDialog(false)
    setEditTool(null)
    setRefreshKey((prev) => prev + 1)
  }


  // 🔍 Filter logic - only search and method filter now (agent filter is handled in fetch)
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

  const totalTools = tools.length
  const getCount = tools.filter(tool => tool.method === "GET").length
  const postCount = tools.filter(tool => tool.method === "POST").length
  const putCount = tools.filter(tool => tool.method === "PUT").length
  const deleteMethodCount = tools.filter(tool => tool.method === "DELETE").length

  const totalFilteredTools = filteredTools.length
  const indexOfLastTool = currentPage * toolsPerPage
  const indexOfFirstTool = indexOfLastTool - toolsPerPage
  const currentTools = filteredTools.slice(indexOfFirstTool, indexOfLastTool)
  const totalPages = Math.ceil(filteredTools.length / toolsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  if (loading) {
    return <ListPageSkeleton rows={8} />
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                Custom Tools
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Manage, test, and configure your custom API integrations
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Globe className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{totalTools}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Tools</p>
            </div>

            <div className="group bg-white border border-green-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                  <span className="text-sm font-medium text-green-600 group-hover:text-white transition-colors duration-300">GET</span>
                </div>
                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {totalTools > 0 ? Math.round((getCount / totalTools) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{getCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">GET Methods</p>
            </div>

            <div className="group bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                  <span className="text-sm font-medium text-blue-600 group-hover:text-white transition-colors duration-300">POST</span>
                </div>
                <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  {totalTools > 0 ? Math.round((postCount / totalTools) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{postCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">POST Methods</p>
            </div>

            <div className="group bg-white border border-rose-200 rounded-2xl p-6 hover:shadow-lg hover:border-rose-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300">
                  <Trash2 className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-full">
                  {totalTools > 0 ? Math.round((deleteMethodCount / totalTools) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{deleteMethodCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">DELETE Methods</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Actions Bar */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={() => {
              setEditTool(null)
              setShowDialog(true)
            }}
            className="group px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-light">Create Tool</span>
          </button>

          {/* 🔍 Cinematic Search Bar */}
          <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:flex-1">
              <input
                type="text"
                placeholder={`Search by ${searchMode === "name" ? "Tool Name" : "URL"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 px-5 py-3 pl-12 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-300"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            </div>

            {/* Toggle Button */}
            <button
              onClick={() =>
                setSearchMode((prev) => (prev === "name" ? "url" : "name"))
              }
              className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
            >
              {searchMode === "name" ? (
                <>
                  <Search className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-light text-slate-700">By Name</span>
                </>
              ) : (
                <>
                  <Globe2 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-light text-slate-700">By URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Agent Filter Dropdown */}
<div className="w-full flex justify-center mb-8">
  <div className="relative w-full md:w-80">
    <select
      value={selectedAgentId}
      onChange={(e) => setSelectedAgentId(e.target.value)}
      className="appearance-none w-full px-6 py-3 pr-12 rounded-xl border border-slate-200 
                 bg-white shadow-sm hover:shadow-md 
                 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-300 
                 cursor-pointer font-light text-slate-700"
    >
      <option value="ALL">All Agents</option>
      {agents.map((agent) => (
        <option key={agent.id} value={agent.id.toString()}>
          {agent.name}
        </option>
      ))}
    </select>


    {/* Custom dropdown arrow */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
      <ChevronDown className="w-5 h-5 text-slate-600" />
    </div>
  </div>
</div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-4 py-2 rounded-xl text-sm font-light transition-all duration-200 ${
                methodFilter === m
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 font-light text-lg">No tools found</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or create a new tool</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {currentTools.map((tool) => (
              <div
                key={tool.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col"
              >
                <div
                  onClick={() => setExpanded(expanded === tool.id ? null : tool.id)}
                  className="cursor-pointer p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-light text-slate-900 truncate flex-1">
                      {tool.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MethodBadge method={tool.method} />
                      {expanded === tool.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-light line-clamp-2">
                    {tool.description || "No description"}
                  </p>
                </div>

                {/* Dropdown */}
                {expanded === tool.id && (
                  <div className="px-6 pb-4">
                    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="truncate font-mono text-xs">{tool.url}</span>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto font-mono">
                        {jsonPretty({
                          headers: tool.headers,
                          query_template: tool.query_template,
                          body_template: tool.body_template,
                          request_parameters: tool.request_parameters ?? tool.parameters,
                          response_payload: tool.response_payload,
                          response_parameters: tool.response_parameters,
                          parameters: tool.parameters,
                          timeout: tool.timeout_ms,
                          speak_during_execution: tool.speak_during_execution,
                        })}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6 flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={async () => {
                      try {
                        const fullTool = await fetchToolDetails(tool.id)
                        setViewTool(fullTool)
                      } catch (error) {
                        console.error("Failed to load full tool for view:", error)
                        setViewTool(tool)
                        toast({
                          title: "Warning",
                          description: "Showing partial tool data. Could not load full details.",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="flex-1 min-w-[90px] px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const fullTool = await fetchToolDetails(tool.id)
                        setEditTool(fullTool)
                      } catch (error) {
                        console.error("Failed to load full tool for edit:", error)
                        toast({
                          title: "Error",
                          description: "Could not load full tool details. Edit is blocked to prevent data loss.",
                          variant: "destructive",
                        })
                        return
                      }
                      setShowDialog(true)
                    }}
                    className="flex-1 min-w-[90px] px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => confirmDelete(tool.id)}
                    className="flex-1 min-w-[90px] px-3 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 bg-white rounded-2xl border border-slate-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 font-light">
                Showing <span className="font-medium text-slate-900">{indexOfFirstTool + 1}</span> to{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(indexOfLastTool, totalFilteredTools)}
                </span>{" "}
                of <span className="font-medium text-slate-900">{totalFilteredTools}</span> results
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
                              currentPage === page
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      )
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">
              {editTool ? "Edit Tool" : "Create Custom Tool"}
            </DialogTitle>
          </DialogHeader>
          <CustomToolsForm tool={editTool} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewTool} onOpenChange={() => setViewTool(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">
              Tool Preview: {viewTool?.name}
            </DialogTitle>
          </DialogHeader>

          {viewTool && (
            <div className="relative max-h-[70vh] overflow-y-auto">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonPretty(viewTool))
                  toast({
                    title: "Copied",
                    description: "Tool JSON copied to clipboard.",
                  })
                }}
                className="absolute top-2 right-2 z-10 w-10 h-10 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-all duration-200"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              <pre className="bg-slate-900 text-slate-100 p-6 rounded-xl text-sm overflow-x-auto font-mono">
                {jsonPretty(viewTool)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
