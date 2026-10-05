// "use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTutorial } from "@/components/tutorial/TutorialProvider"
import { SkipTutorialButton } from "@/components/tutorial/SkipTutorialButton"
import Image from "next/image"

import { useNavbarTabs } from "@/hooks/use-navbar-tabs"

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
} from "lucide-react"

// Base navigation items - all possible tabs (company+user tabs)
const baseNavigationItems = [
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
    icon: Sparkles,
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
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: Activity,
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
      // {
      //   title: "User Module",
      //   href: "/dashboard/account-settings/user-module",
      //   icon: UserCog,
      // },
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

  // Get visible tabs for current user (company_users see only permitted tabs)
  const { tabs: visibleTabs, loading: tabsLoading } = useNavbarTabs()

  // Build a set of visible URL paths for quick lookup
  // Cache the visible tabs in localStorage until token is changed
  const [visibleTabPaths, setVisibleTabPaths] = useState<Set<string>>(new Set())
  useEffect(() => {
    // Initialize from visibleTabs if not already cached
    if (visibleTabPaths.size === 0 && !localStorage.getItem("navbar_tab_paths")) {
      const paths = visibleTabs.map((tab) => tab.url_path).filter(Boolean)
      const pathsSet = new Set(paths)
      localStorage.setItem("navbar_tab_paths", JSON.stringify(paths))
      setVisibleTabPaths(pathsSet)
    } else if (tabsLoading) {
      // If still loading, try to use cached version
      const cached = JSON.parse(localStorage.getItem("navbar_tab_paths") || "[]")
      setVisibleTabPaths(new Set(cached))
    }
  }, [visibleTabs, tabsLoading])

  // Filter navigation items based on login type AND tab visibility
  const filteredNavigationItems = baseNavigationItems.filter((item) => {
    // If loginType is "user", hide companyOnly items (existing behavior)
    if (typeof window !== "undefined") {
      const loginType = localStorage.getItem("loginType")
      if (loginType === "user" && item.companyOnly) {
        return false
      }
    }

    // If tab has a URL path and item is companyOnly, check if tab is visible to this user
    if (item.href && item.companyOnly && visibleTabPaths.size > 0) {
      // Check if this tab's URL path is in the visible tabs set
      if (!visibleTabPaths.has(item.href)) {
        return false
      }
    }

    return true
  })