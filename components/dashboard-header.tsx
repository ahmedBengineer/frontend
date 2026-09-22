// "use client"

// import { Bell, ChevronDown } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { useAuth } from "@/components/auth-provider"
// import { useRouter } from "next/navigation"

// export function DashboardHeader() {
//   const { user, logout } = useAuth()
//   const router = useRouter()

//   const handleLogout = () => {
//     logout()
//     router.push("/login")
//   }

//   return (
//     <header className="bg-white border-b border-slate-200 px-6 py-4">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
//         </div>

//         <div className="flex items-center space-x-4">
//           <div className="flex items-center space-x-2">
//             <span className="text-sm text-slate-600">Active Agent:</span>
//             <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
//               Primary
//             </Badge>
//           </div>

//           <Button variant="ghost" size="icon" className="relative">
//             <Bell className="w-5 h-5 text-slate-600" />
//             <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//           </Button>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" className="flex items-center space-x-2 px-3">
//                 <Avatar className="w-8 h-8">
//                   <AvatarImage src="/placeholder-user.jpg" />
//                   <AvatarFallback className="bg-teal-100 text-teal-700">{user?.name?.charAt(0) || "U"}</AvatarFallback>
//                 </Avatar>
//                 <span className="text-sm text-slate-700">{user?.email}</span>
//                 <ChevronDown className="w-4 h-4 text-slate-500" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56">
//               <DropdownMenuItem>
//                 <span>Profile</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem>
//                 <span>Settings</span>
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem onClick={handleLogout}>
//                 <span>Sign out</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </header>
//   )
// }





"use client"


import { useEffect, useState } from "react"
import { Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"


interface ActionLog {
  id: number
  content_type: string
  user: string
  action: string
  timestamp: string
  object_id: string
  description: string
}

const colorThemes = [
  { name: 'emerald', gradient: 'from-emerald-600 via-teal-600 to-emerald-600', bg: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/10', radial: 'rgba(16,185,129,0.1)' },
 { name: 'teal', gradient: 'from-teal-500 via-cyan-500 to-teal-500', bg: 'from-teal-400/10 via-cyan-400/5 to-emerald-400/10', radial: 'rgba(20,184,166,0.1)' },
{ name: 'coral', gradient: 'from-orange-500 via-red-400 to-orange-500', bg: 'from-orange-300/10 via-red-300/5 to-rose-300/10', radial: 'rgba(249,115,22,0.1)' },
{ name: 'gold', gradient: 'from-yellow-500 via-amber-500 to-yellow-500', bg: 'from-yellow-400/10 via-amber-400/5 to-orange-400/10', radial: 'rgba(234,179,8,0.1)' },
{ name: 'sky', gradient: 'from-sky-400 via-blue-300 to-sky-400', bg: 'from-sky-300/10 via-blue-200/5 to-cyan-300/10', radial: 'rgba(56,189,248,0.1)' },
{ name: 'lavender', gradient: 'from-purple-300 via-violet-300 to-purple-300', bg: 'from-purple-200/10 via-violet-200/5 to-fuchsia-200/10', radial: 'rgba(216,180,254,0.1)' },
{ name: 'salmon', gradient: 'from-rose-400 via-pink-400 to-rose-400', bg: 'from-rose-300/10 via-pink-300/5 to-orange-200/10', radial: 'rgba(251,113,133,0.1)' },
{ name: 'lime', gradient: 'from-lime-400 via-green-400 to-lime-400', bg: 'from-lime-300/10 via-green-300/5 to-emerald-300/10', radial: 'rgba(163,230,53,0.1)' },
]


export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()


  const [primaryAgentName, setPrimaryAgentName] = useState<string | null>(null)
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [displayedText, setDisplayedText] = useState("")
  const [userName, setUserName] = useState("")
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0)


  // Fetch user name from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUserName(userData.name || "User")
        } catch {
          setUserName("User")
        }
      } else {
        setUserName("User")
      }
    }
  }, [])


  // Typewriter effect
  useEffect(() => {
    if (!userName) return
    
    const fullText = `Welcome ${userName}`
    let index = 0
    
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(timer)
      }
    }, 80)


    return () => clearInterval(timer)
  }, [userName])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThemeIndex((prev) => (prev + 1) % colorThemes.length)
    }, 50000)

    return () => clearInterval(interval)
  }, [])


  // Fetch Primary Agent
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })


        if (!res.ok) throw new Error("Failed to fetch agents")
        const data = await res.json()


        const agentList = Array.isArray(data) ? data : data?.results ?? []
        if (agentList.length) {
          const primaryAgent = agentList.find((agent: any) => agent.primary === true)
          if (primaryAgent) setPrimaryAgentName(primaryAgent.name)
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch agents",
          variant: "destructive",
        })
      }
    }


    fetchAgents()
  }, [toast])


  // Fetch Logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/action-logs/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })


        if (!res.ok) throw new Error("Failed to fetch logs")
        const data = await res.json()


        // Sort by timestamp (latest first) and take top 5
        const list = Array.isArray(data) ? data : data?.results ?? []
        const sortedLogs = [...list].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setLogs(sortedLogs.slice(0, 5))
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch logs",
          variant: "destructive",
        })
      }
    }


    fetchLogs()
  }, [toast])


  const handleLogout = () => {
    Cookies.remove("Token")
    Cookies.remove("adminToken")
    Cookies.remove("TempToken")
    localStorage.removeItem("user")
    localStorage.removeItem("userAuth")
    localStorage.removeItem("loginType")


    logout()
    router.push("/login")
  }


  const handleAccountSettings = () => {
    router.push("/dashboard/account-settings/personal-settings")
  }


  const handleBilling = () => {
    router.push("/billing")
  }

  const currentTheme = colorThemes[currentThemeIndex]


  return (
    <header className="sticky top-2 md:top-4 z-[10050] mx-2 md:mx-4 mb-4 md:mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
        <div className={`absolute -inset-[1px] bg-gradient-to-r ${currentTheme.gradient} rounded-xl md:rounded-2xl opacity-60 blur-[2px] animate-[gradient_3s_ease_infinite] bg-[length:200%_100%] transition-all duration-[2000ms] ease-in-out`}></div>
        
        <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.bg} animate-[wave_8s_ease-in-out_infinite] transition-all duration-[2000ms] ease-in-out`}></div>
          <div className="absolute inset-0 animate-pulse transition-all duration-[2000ms] ease-in-out" style={{ background: `radial-gradient(circle at 50% 120%, ${currentTheme.radial}, transparent)` }}></div>
          
          <div className="relative px-3 md:px-6 py-3 md:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-light text-slate-800 tracking-tight">
                  {displayedText}
                  <span className="animate-blink">|</span>
                </h1>
              </div>


              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {primaryAgentName && (
                  <div className="flex items-center space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 transition-all duration-200 hover:shadow-md">
                    <span className="text-[10px] md:text-xs font-medium text-slate-600 hidden sm:inline">Primary Agent</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 font-medium text-[10px] md:text-xs">
                      {primaryAgentName}
                    </Badge>
                  </div>
                )}


                {/* Logs Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50/50 hover:bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 transition-all duration-200 hover:shadow-md hover:scale-105"
                    >
                      <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                      {logs.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-[calc(100vw-2rem)] sm:w-80 p-3 shadow-2xl rounded-xl md:rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
                      {logs.length > 0 && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs border-0">
                          {logs.length}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-slate-200/50" />
                    <div className="max-h-[300px] overflow-y-auto space-y-1.5 mt-2">
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <DropdownMenuItem 
                            key={log.id} 
                            className="flex flex-col items-start p-3 space-y-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <span className="text-sm font-medium text-slate-800 flex-1 leading-tight">
                                {log.description}
                              </span>
                              <Badge
                                className={`text-xs font-medium border-0 flex-shrink-0 ${
                                  log.action === "create"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : log.action === "delete"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {log.action}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              {new Date(log.timestamp).toLocaleString()} 
                              <span className="text-slate-400">•</span> 
                              {log.user}
                            </span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>


                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2 px-2 md:px-3 h-9 md:h-10 rounded-lg md:rounded-xl bg-slate-50/50 hover:bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 transition-all duration-200 hover:shadow-md"
                    >
                      <Avatar className="w-6 h-6 md:w-7 md:h-7 ring-2 ring-white shadow-sm">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs md:text-sm font-medium text-slate-700 max-w-[80px] md:max-w-[150px] truncate hidden sm:inline">
                        {user?.email}
                      </span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 p-2 shadow-2xl rounded-xl md:rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <DropdownMenuItem 
                      onClick={handleBilling}
                      className="px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700">Billings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleAccountSettings}
                      className="px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700">Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2 bg-slate-200/50" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="px-3 py-2.5 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-rose-600">Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes wave {
          0%, 100% {
            background-position: 0% 50%;
            opacity: 0.3;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.6;
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </header>
  )
}
