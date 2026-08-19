"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, CreditCard, Globe, Mail, Phone, MapPin, Building, Activity } from "lucide-react"

export default function ViewCompanyProfile() {
  const params = useParams()
  const companyId = params.id

  const [companyData, setCompanyData] = useState<any | null>(null)
  const [usageData, setUsageData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingUsage, setLoadingUsage] = useState(true)

  useEffect(() => {
    const token = Cookies.get("adminToken")

    const fetchCompany = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token || ""}`,
          },
        })
        const data = await res.json()
        setCompanyData(data)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch company", err)
        setLoading(false)
      }
    }

    const fetchUsage = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/billing/usage/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token || ""}`,
          },
        })
        const data = await res.json()
        console.log(data)
        // Filter usage only for current company
        const usage = data.find((u: any) => u.company === Number(companyId)) || null
        setUsageData(usage)
        setLoadingUsage(false)
      } catch (err) {
        console.error("Failed to fetch usage", err)
        setLoadingUsage(false)
      }
    }

    fetchCompany()
    fetchUsage()
  }, [companyId])

  if (loading || !companyData) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company info skeleton */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6">
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-5 w-full bg-slate-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
              <div className="space-y-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
              <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-14 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient bar */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
        <div>
          <h1 className="text-2xl font-extralight text-slate-900">{companyData.name}</h1>
          <p className="text-sm text-slate-500">Company Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-800">Company Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Basic company details and contact information</p>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Company Name</span>
                </div>
                <p className="text-base font-semibold text-slate-800">{companyData.name}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Email</span>
                </div>
                <p className="text-base text-slate-700">{companyData.email}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Phone</span>
                </div>
                <p className="text-base text-slate-700">{companyData.phone}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Website</span>
                </div>
                <a
                  href={companyData.website}
                  className="text-base text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {companyData.website}
                </a>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Industry</span>
                <p className="text-base text-slate-700">{companyData.industry}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Company Size</span>
                <p className="text-base text-slate-700">{companyData.company_size} employees</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Address</span>
              </div>
              <p className="text-base text-slate-700">{companyData.address}</p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500">Description</span>
              <p className="text-sm text-slate-600 leading-relaxed">{companyData.description}</p>
            </div>
          </div>
        </div>

        {/* Company Stats & Usage */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800">Company Stats</h3>
              <p className="text-xs text-slate-500 mt-0.5">Key metrics and information</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-600">Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                  <span className={`w-2 h-2 rounded-full ${companyData.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className={companyData.status === "active" ? "text-emerald-700" : "text-slate-600"}>
                    {companyData.status}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-600">Plan</span>
                <Badge className="text-xs font-medium bg-indigo-100 text-indigo-700 border-0 rounded-full">{companyData.plan}</Badge>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Date Joined</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(companyData.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <Users className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Total Users</p>
                  <p className="text-sm font-medium text-slate-700">{companyData.users?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <Globe className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Last Login</p>
                  <p className="text-sm font-medium text-slate-700">
                    {companyData.last_login ? new Date(companyData.last_login).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Monthly Usage</p>
                  <p className="text-sm font-medium text-slate-700">{companyData.monthly_usage || 0} API calls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Usage */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800">Company Usage</h3>
              <p className="text-xs text-slate-500 mt-0.5">Minutes, agents, and cost overview</p>
            </div>
            <div>
              {loadingUsage ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-4 w-14 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : usageData ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    <span className="text-slate-600">Current Agents:</span>
                    <span className="font-semibold text-slate-800 ml-auto">{usageData.current_agents}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                    <span className="text-slate-600">Minutes Used:</span>
                    <span className="font-semibold text-slate-800 ml-auto">{usageData.current_minutes_used}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-slate-600">Last Reset:</span>
                    <span className="font-semibold text-slate-800 ml-auto">{new Date(usageData.last_reset).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-slate-600">Extra Minutes:</span>
                    <span className="font-semibold text-slate-800 ml-auto">{usageData.extra_minutes}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-slate-600">Extra Cost:</span>
                    <span className="font-semibold text-slate-800 ml-auto">${usageData.extra_cost}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">No usage available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
