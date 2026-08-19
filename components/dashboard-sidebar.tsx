// "use client"

// import { useState, useEffect, useRef } from "react"
// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { cn } from "@/lib/utils"
// import Cookies from "js-cookie"
// import { useTutorial } from "@/components/tutorial/TutorialProvider"
// import { SkipTutorialButton } from "@/components/tutorial/SkipTutorialButton"
// import Image from "next/image"

// import {
//   Home,
//   MessageSquare,
//   Users,
//   Settings,
//   Cog,
//   Building,
//   GitBranch,
//   Puzzle,
//   CheckSquare,
//   FileText,
//   User,
//   CreditCard,
//   UserCog,
//   ChevronDown,
//   ChevronRight,
//   FilePlus,
//   ShieldCheck,
//   Wrench, 
//   Sparkles,
//   Cpu,
//   Brain,
//   Bot,
//   Cat,
//   Dog,
// Salad,
// Rabbit,
//   GripVertical,
// } from "lucide-react"

// const navigationItems = [
//   {
//     title: "Dashboard",
//     href: "/dashboard",
//     icon: Home,
//   },
//   {
//     title: "Conversations",
//     href: "/conversations",
//     icon: MessageSquare,
//   },
//   {
//     title: "Agents",
//     href: "/dashboard/agents",
//     icon: Users,
//     companyOnly: true,
//     // children: [
//     //   {
//     //     title: "Workers",
//     //     href: "/dashboard/agents/workers",
//     //     icon: Bot,
//     //   },
//     // ]
//   },
//    {
//     title: "Workers",
//     href: "/dashboard/agents/workers",
//     icon: Bot,
//     companyOnly: true,
//   },
//   {
//     title: "Agent settings",
//     href: "/dashboard/agent-settings",
//     icon: Settings,
//     companyOnly: true,
//   },
//   {
//     title: "Users",
//     href: "/dashboard/users",
//     icon: UserCog,
//     companyOnly: true,
//   },
//   {
//     title: "Custom Tools",
//     href: "/dashboard/tools",
//     icon: Wrench,
//     companyOnly: true,
//   },
//   // {
//   //   title: "Workflows",
//   //   href: "/dashboard/workflows",
//   //   icon: GitBranch,
//   //   companyOnly: true,
//   // },
//   // {
//   //   title: "System Setting",
//   //   icon: Cog,
//   //   companyOnly: true,
//   //   children: [
//   //     {
//   //       title: "Company",
//   //       href: "/system-settings/company",
//   //       icon: Building,
//   //     },
//   //     {
//   //       title: "Branch",
//   //       href: "/system-settings/branch",
//   //       icon: GitBranch,
//   //     },
//   //   ],
//   // },
//   {
//     title: "Integrations",
//     href: "/dashboard/integrations",
//     icon: Puzzle,
//   },
//   {
//     title: "Reporting",
//     href: "/dashboard/reporting",
//     icon: Sparkles,
//     companyOnly: true,
//   },
//   {
//     title: "Logs",
//     href: "/dashboard/tasks",
//     icon: CheckSquare,
//   },
//   // {
//   //   title: "Upload Documents",
//   //   href: "/dashboard/upload-documents",
//   //   icon: FilePlus,
//   // },
//   // {
//   //   title: "Content",
//   //   href: "/dashboard/content",
//   //   icon: FileText,
//   //   companyOnly: true,
//   // },
//   {
//     title: "Account Setting",
//     icon: User,
//     companyOnly: true,
//     children: [
//       {
//         title: "Billing",
//         href: "/dashboard/account-settings/billing",
//         icon: CreditCard,
//       },
//       // {
//       //   title: "User Module",
//       //   href: "/dashboard/account-settings/user-module",
//       //   icon: UserCog,
//       // },
//       {
//         title: "Personal Settings",
//         href: "/dashboard/account-settings/personal-settings",
//         icon: ShieldCheck,
//       },
//     ],
//   },
// ]

// export function DashboardSidebar() {
//   const pathname = usePathname()
//   const [expandedItems, setExpandedItems] = useState<string[]>(["System Setting", "Account Setting"])
//   const [isCollapsed, setIsCollapsed] = useState(false)
//   const [tutorialSteps, setTutorialSteps] = useState<number[]>([])
//   const [isDragging, setIsDragging] = useState(false)
//   const [isFloating, setIsFloating] = useState(false)
//   const [position, setPosition] = useState({ x: 0, y: 0 })
//   const dragRef = useRef<HTMLDivElement>(null)
//   const dragStart = useRef({ x: 0, y: 0 })

//   const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
// const token = Cookies.get("Token") || ""
// const headers = { "Content-Type": "application/json", Authorization: `Token ${token}` }
// const { startTutorial, updateTutorialProgress } = useTutorial();
//   const { driverRef } = useTutorial();

// useEffect(() => {
//   const fetchTutorialProgress = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/companies/get_tutorial/`, { method: "GET", headers });
//       if (!res.ok) throw new Error("Failed to fetch tutorial progress");

//       const data = await res.json();
//       const tutorialArray: number[] = data.tutorial_setup || [];

//       setTutorialSteps(tutorialArray);

//       // If step 1 is not in the array, trigger it in the tutorial
//       // if (!tutorialArray.includes(1)) {
//       //   // updateTutorialProgress(1); // mark step 1 for frontend
//       //   // driverRef.current?.moveNext(); // highlight step 1 in driver.js
//       // }
//     } catch (err) {
//       console.error("Error fetching tutorial:", err);
//     } finally {
//       // setLoading(false);
//     }
//   };

//   fetchTutorialProgress();
// }, []);
// //BASE_URL, headers

//   useEffect(() => {
//     const tutorialSetup = localStorage.getItem("tutorial_setup");
//     if (tutorialSetup) {
//       try {
//         const parsedArray = JSON.parse(tutorialSetup);
//         if (Array.isArray(parsedArray)) {
//           setTutorialSteps(parsedArray);
//         }
//       } catch (error) {
//         console.error("Invalid tutorial_setup format:", error);
//       }
//     }
//   }, []);

//   // Get login type from localStorage
//   const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : "company"

//   // Filter navigation items based on login type
//   const filteredNavigationItems = navigationItems.filter((item) => {
//     if (loginType === "user" && item.companyOnly) {
//       return false
//     }
//     return true
//   })

//   const handleAgentsClick = async () => {
//     driverRef.current?.moveNext();
    
//   if (!tutorialSteps.includes(1)) { // step 1 not completed
    
  
//     const updatedSteps = [...tutorialSteps, 1]
//     setTutorialSteps(updatedSteps)
//     updateTutorialProgress(1);       // mark step complete
     

//     // Patch backend
//     try {
//       await fetch(`${BASE_URL}/companies/update_tutorial/`, {
//         method: "PATCH",
//         headers,
//         body: JSON.stringify({ tutorial_setup: updatedSteps }),
//       })
//     } catch (err) {
//       console.error("Error updating tutorial:", err)
//     }
//     setTimeout(() => {
//       driverRef.current?.moveNext(); // move to step 2
//     }, 3000);
//   }
// }

//   const toggleExpanded = (title: string) => {
//     setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
//   }

//   const handleMouseDown = (e: React.MouseEvent) => {
//     setIsDragging(true)
//     dragStart.current = {
//       x: e.clientX - position.x,
//       y: e.clientY - position.y,
//     }
//   }

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       if (isDragging) {
//         requestAnimationFrame(() => {
//           const newX = e.clientX - dragStart.current.x
//           const newY = e.clientY - dragStart.current.y
          
//           setPosition({ x: newX, y: newY })
          
//           if (Math.abs(newX) > 50 || Math.abs(newY) > 50) {
//             setIsFloating(true)
//           }
//         })
//       }
//     }

//     const handleMouseUp = () => {
//       if (isDragging) {
//         const snapThreshold = 80
//         if (Math.abs(position.x) < snapThreshold && Math.abs(position.y) < snapThreshold) {
//           setPosition({ x: 0, y: 0 })
//           setIsFloating(false)
//         }
//       }
//       setIsDragging(false)
//     }

//     if (isDragging) {
//       document.addEventListener("mousemove", handleMouseMove)
//       document.addEventListener("mouseup", handleMouseUp)
//     }

//     return () => {
//       document.removeEventListener("mousemove", handleMouseMove)
//       document.removeEventListener("mouseup", handleMouseUp)
//     }
//   }, [isDragging, position])

//   return (
//     <>
//       <div className={cn(
//         "flex-shrink-0 transition-all duration-300",
//         isFloating ? "w-0" : (isCollapsed ? "w-[5.5rem]" : "w-[17.5rem]")
//       )}>
//         <div
//           ref={dragRef}
//           className={cn(
//             isCollapsed ? "w-20" : "w-64",
//             "bg-[#0f1f17] flex flex-col rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-emerald-600/10 transition-all duration-300",
//             isFloating ? "fixed top-4 left-4 h-[calc(100vh-2rem)] z-50" : "fixed top-4 left-4 h-[calc(100vh-2rem)] z-10"
//           )}
//           style={isFloating ? {
//             transform: `translate(${position.x}px, ${position.y}px)`,
//             transition: isDragging ? "none" : "all 0.3s ease",
//             cursor: isDragging ? "grabbing" : "default",
//             willChange: isDragging ? "transform" : "auto",
//           } : undefined}
//         >
//           <div
//             className="p-6 flex items-center justify-between cursor-grab active:cursor-grabbing select-none rounded-t-3xl"
//             onMouseDown={handleMouseDown}
//           >
//             {!isCollapsed && (
//               <div className="flex items-center space-x-3">
//                 <Image
//                   src="/Logo.png"
//                   alt="Smart Convo Logo"
//                   width={36}
//                   height={36}
//                   className="rounded-lg pointer-events-none"
//                   draggable={false}
//                 />
//                 <span className="text-xl font-semibold text-white">Smart Convo</span>
//               </div>
//             )}
//             {isCollapsed && (
//               <Image
//                 src="/Logo.png"
//                 alt="Smart Convo Logo"
//                 width={36}
//                 height={36}
//                 className="rounded-lg mx-auto pointer-events-none"
//                 draggable={false}
//               />
//             )}
//             <button
//               onClick={() => setIsCollapsed(!isCollapsed)}
//               className="p-1.5 hover:bg-emerald-600/20 rounded-lg transition-colors"
//             >
//               <ChevronRight
//                 className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
//                   isCollapsed ? "" : "rotate-180"
//                 }`}
//               />
//             </button>
//           </div>

//           <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
//             {filteredNavigationItems.map((item) => (
//               <div key={item.title}>
//                 {item.children ? (
//                   <div>
//                     <button
//                       onClick={() => !isCollapsed && toggleExpanded(item.title)}
//                       className={cn(
//                         "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
//                         "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
//                       )}
//                       title={isCollapsed ? item.title : undefined}
//                     >
//                       <div className="flex items-center space-x-3">
//                         <item.icon className="w-5 h-5 flex-shrink-0" />
//                         {!isCollapsed && <span className="font-medium">{item.title}</span>}
//                       </div>
//                       {!isCollapsed &&
//                         (expandedItems.includes(item.title) ? (
//                           <ChevronDown className="w-4 h-4 flex-shrink-0" />
//                         ) : (
//                           <ChevronRight className="w-4 h-4 flex-shrink-0" />
//                         ))}
//                     </button>
//                     {!isCollapsed && expandedItems.includes(item.title) && (
//                       <div className="ml-8 mt-1 space-y-1">
//                         {item.children.map((child) => (
//                           <Link
//                             key={child.href}
//                             href={child.href}
//                             className={cn(
//                               "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
//                               pathname === child.href
//                                 ? "bg-emerald-600 text-white"
//                                 : "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
//                             )}
//                           >
//                             <child.icon className="w-4 h-4 flex-shrink-0" />
//                             <span className="font-medium">{child.title}</span>
//                           </Link>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <Link
//                     href={item.href}
//                     className={cn(
//                       item.title === "Agents"
//                         ? "sidebar-agents-link flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200"
//                         : "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
//                       pathname === item.href
//                         ? "bg-emerald-600 text-white"
//                         : "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
//                     )}
//                     title={isCollapsed ? item.title : undefined}
//                     onClick={item.title === "Agents" ? handleAgentsClick : undefined} // 👈 attach here
//                   >
//                     <item.icon className="w-5 h-5 flex-shrink-0" />
//                     {!isCollapsed && <span className="font-medium">{item.title}</span>}
//                   </Link>
//                 )}
//               </div>
//             ))}
//           </nav>

//           {/* <div className="p-4 border-t border-white/10">
//   <SkipTutorialButton />
// </div> */}
//           {!tutorialSteps.includes(-1) && !tutorialSteps.includes(9) && (
//             <div className="p-3 border-t border-emerald-600/20 rounded-b-3xl">
//               <SkipTutorialButton />
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }



"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTutorial } from "@/components/tutorial/TutorialProvider"
import Image from "next/image"

import {
  Home,
  MessageSquare,
  Users,
  Settings,
  Cog,
  Building,
  GitBranch,
  Puzzle,
  CheckSquare,
  FileText,
  User,
  CreditCard,
  UserCog,
  ChevronDown,
  ChevronRight,
  FilePlus,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Sparkles,
  Cpu,
  Brain,
  Bot,
  Cat,
  Dog,
  Salad,
  Rabbit,
  GripVertical,
  Megaphone,
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: Users,
    companyOnly: true,
  },
  {
    title: "Agent settings",
    href: "/dashboard/agent-settings",
    icon: Settings,
    companyOnly: true,
  },
  {
    title: "Workers",
    href: "/dashboard/agents/workers",
    icon: Bot,
    companyOnly: true,
  },
  {
    title: "Conversations",
    href: "/conversations",
    icon: MessageSquare,
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Megaphone,
    companyOnly: true,
  },
  {
    title: "Custom Tools",
    href: "/dashboard/tools",
    icon: Wrench,
    companyOnly: true,
  },
  {
    title: "Workflow Studio",
    href: "/dashboard/workflow-studio",
    icon: GitBranch,
    companyOnly: true,
  },
  {
    title: "Reporting",
    href: "/dashboard/reporting",
    icon: Sparkles,
    companyOnly: true,
  },
  {
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: Puzzle,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: UserCog,
    companyOnly: true,
  },
  {
    title: "Activity",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    title: "Security",
    href: "/dashboard/security",
    icon: ShieldAlert,
    companyOnly: true,
  },
  {
    title: "Account Setting",
    icon: User,
    companyOnly: true,
    children: [
      {
        title: "Billing",
        href: "/billing",
        icon: CreditCard,
      },
      {
        title: "Personal Settings",
        href: "/dashboard/account-settings/personal-settings",
        icon: ShieldCheck,
      },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { currentStep, nextStep, markCheckpoint } = useTutorial()
  const [expandedItems, setExpandedItems] = useState<string[]>(["System Setting", "Account Setting"])
  
  // Collapse by default on small screens; also on /conversations
  const [isCollapsed, setIsCollapsed] = useState(
    () => (typeof window !== "undefined" && window.innerWidth < 1024) || pathname === "/conversations",
  )

  const [isDragging, setIsDragging] = useState(false)
  const [isFloating, setIsFloating] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })

  // Auto-collapse / expand the sidebar when crossing the lg breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    const onChange = (e: MediaQueryListEvent) => setIsCollapsed(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Update collapsed state when pathname changes
  useEffect(() => {
    if (pathname === "/conversations") {
      setIsCollapsed(true)
    }
  }, [pathname])

  // Get login type from localStorage
  const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : "company"

  // Filter navigation items based on login type
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (loginType === "user" && item.companyOnly) {
      return false
    }
    return true
  })

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        requestAnimationFrame(() => {
          const newX = e.clientX - dragStart.current.x
          const newY = e.clientY - dragStart.current.y
          
          setPosition({ x: newX, y: newY })
          
          if (Math.abs(newX) > 50 || Math.abs(newY) > 50) {
            setIsFloating(true)
          }
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        const snapThreshold = 80
        if (Math.abs(position.x) < snapThreshold && Math.abs(position.y) < snapThreshold) {
          setPosition({ x: 0, y: 0 })
          setIsFloating(false)
        }
      }
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, position])

  return (
    <>
      <div className={cn(
        "flex-shrink-0 transition-all duration-300",
        isFloating ? "w-0" : (isCollapsed ? "w-[5.5rem]" : "w-[17.5rem]")
      )}>
        <div
          ref={dragRef}
          className={cn(
            isCollapsed ? "w-20" : "w-64",
            "bg-[#0f1f17] flex flex-col rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-emerald-600/10 transition-all duration-300",
            isFloating ? "fixed top-4 bottom-4 left-4 z-50" : "fixed top-4 bottom-4 left-4 z-10"
          )}
          style={isFloating ? {
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? "none" : "all 0.3s ease",
            cursor: isDragging ? "grabbing" : "default",
            willChange: isDragging ? "transform" : "auto",
          } : undefined}
        >
          <div
            className="p-6 flex items-center justify-between cursor-grab active:cursor-grabbing select-none rounded-t-3xl"
            onMouseDown={handleMouseDown}
          >
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <Image
                  src="/Logo.png"
                  alt="Smart Convo Logo"
                  width={36}
                  height={36}
                  className="rounded-lg pointer-events-none"
                  draggable={false}
                />
                <span className="text-xl font-semibold text-white">Smart Convo</span>
              </div>
            )}
            {isCollapsed && (
              <Image
                src="/Logo.png"
                alt="Smart Convo Logo"
                width={36}
                height={36}
                className="rounded-lg mx-auto pointer-events-none"
                draggable={false}
              />
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-emerald-600/20 rounded-lg transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isCollapsed ? "" : "rotate-180"
                }`}
              />
            </button>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {filteredNavigationItems.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => !isCollapsed && toggleExpanded(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">{item.title}</span>}
                      </div>
                      {!isCollapsed &&
                        (expandedItems.includes(item.title) ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        ))}
                    </button>
                    {!isCollapsed && expandedItems.includes(item.title) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                              pathname === child.href
                                ? "bg-emerald-600 text-white"
                                : "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
                            )}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      item.title === "Agents"
                        ? "sidebar-agents-link flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200"
                        : item.title === "Agent settings"
                          ? "sidebar-agent-settings-link flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200"
                          : "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                      pathname === item.href
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:bg-emerald-600/10 hover:text-white",
                    )}
                    title={isCollapsed ? item.title : undefined}
                    onClick={() => {
                      if (item.title === "Agents" && currentStep === "click-agents-sidebar") {
                        markCheckpoint("sidebar")
                        nextStep()
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>

        </div>
      </div>
    </>
  )
}
