"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  RefreshCw,
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  MessageSquare,
  Trash2,
  Image as ImageIcon,
  FileText,
} from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_BASE_URL

type InstanceStatus = "created" | "waiting_qr" | "connecting" | "connected" | "disconnected" | "logged_out" | "failed" | "none"

interface Instance {
  id: number
  instance_id: string
  instance_name: string
  agent_id: string | null
  phone_number: string | null
  display_name: string | null
  status: InstanceStatus
  webhook_url: string
  created_at: string
  updated_at: string
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${Cookies.get("Token") || ""}`,
  }
}

function StatusBadge({ status }: { status: InstanceStatus }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    connected: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: <Wifi className="w-3 h-3" /> },
    waiting_qr: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <QrCode className="w-3 h-3" /> },
    connecting: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    disconnected: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: <WifiOff className="w-3 h-3" /> },
    logged_out: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <XCircle className="w-3 h-3" /> },
    failed: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <XCircle className="w-3 h-3" /> },
    created: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", icon: <Smartphone className="w-3 h-3" /> },
    none: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", icon: null },
  }
  const c = config[status] || config.none
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      {c.icon}
      {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  )
}

export default function WhatsAppSelfPage() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [instanceName, setInstanceName] = useState("")

  const [activeInstance, setActiveInstance] = useState<Instance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [pollingQr, setPollingQr] = useState(false)
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [sendTo, setSendTo] = useState("")
  const [sendText, setSendText] = useState("")
  const [sending, setSending] = useState(false)

  const [tab, setTab] = useState<"overview" | "send">("overview")

  const { toast } = useToast()
  const router = useRouter()

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/instances/`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Failed to fetch instances")
      const data = await res.json()
      setInstances(data)
      if (activeInstance) {
        const updated = data.find((i: Instance) => i.instance_id === activeInstance.instance_id)
        if (updated) setActiveInstance(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeInstance])

  useEffect(() => {
    fetchInstances()
  }, [])

  useEffect(() => {
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
    }
  }, [])

  const handleCreate = async () => {
    if (!instanceName.trim()) {
      toast({ description: "Please enter an instance name.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/connect/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ instance_name: instanceName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create instance")
      }
      const data = await res.json()
      toast({ description: "Instance created! Now scan the QR code." })
      setInstanceName("")
      await fetchInstances()
      const newInstance: Instance = {
        id: 0,
        instance_id: data.instance_id,
        instance_name: instanceName.trim(),
        agent_id: null,
        phone_number: null,
        display_name: null,
        status: data.status || "created",
        webhook_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setActiveInstance(newInstance)
      startQrPolling(data.instance_id)
    } catch (err: any) {
      toast({ description: err.message || "Failed to create instance", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const startQrPolling = (instanceId: string) => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
    setPollingQr(true)
    setQrCode(null)

    const poll = async () => {
      try {
        const res = await fetch(`${BASE}/integrations/whatsapp-baileys/qr/${instanceId}/`, { headers: authHeaders() })
        if (!res.ok) return
        const data = await res.json()

        if (data.status === "connected" || data.status === "CONNECTED") {
          if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
          setPollingQr(false)
          setQrCode(null)
          toast({ description: "WhatsApp connected successfully!" })
          await fetchInstances()
          await refreshStatus(instanceId)
          return
        }

        if (data.qr) {
          setQrCode(data.qr)
        }
      } catch (err) {
        console.error("QR poll error:", err)
      }
    }

    poll()
    qrIntervalRef.current = setInterval(poll, 3000)

    setTimeout(() => {
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current)
        setPollingQr(false)
        if (!activeInstance || activeInstance.status !== "connected") {
          toast({ description: "QR code expired. Click 'Get QR' to try again.", variant: "destructive" })
        }
      }
    }, 120000)
  }

  const refreshStatus = async (instanceId: string) => {
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/status/${instanceId}/`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setActiveInstance(prev => prev ? {
        ...prev,
        status: data.status?.toLowerCase() || prev.status,
        phone_number: data.phone_number || prev.phone_number,
        display_name: data.display_name || prev.display_name,
      } : null)
      await fetchInstances()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async () => {
    if (!activeInstance || !sendTo.trim() || !sendText.trim()) {
      toast({ description: "Enter a phone number and message.", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/send/${activeInstance.instance_id}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ to: sendTo.trim(), text: sendText.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to send")
      }
      const data = await res.json()
      toast({ description: `Message sent! ID: ${data.message_id?.slice(0, 12)}...` })
      setSendText("")
    } catch (err: any) {
      toast({ description: err.message || "Failed to send message", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const handleReconnect = async (instanceId: string) => {
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/reconnect/${instanceId}/`, {
        method: "POST",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Reconnect failed")
      toast({ description: "Reconnection initiated." })
      startQrPolling(instanceId)
    } catch (err: any) {
      toast({ description: err.message, variant: "destructive" })
    }
  }

  const handleDisconnect = async (instanceId: string) => {
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp-baileys/disconnect/${instanceId}/`, {
        method: "POST",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Disconnect failed")
      toast({ description: "Instance disconnected." })
      setActiveInstance(null)
      setQrCode(null)
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
      await fetchInstances()
    } catch (err: any) {
      toast({ description: err.message, variant: "destructive" })
    }
  }

  const handleSelectInstance = (instance: Instance) => {
    setActiveInstance(instance)
    setQrCode(null)
    setTab("overview")
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
    setPollingQr(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto" />
          <p className="text-slate-500 font-light">Loading WhatsApp instances...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/integrations")}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-slate-900">WhatsApp Self</h1>
                <p className="text-sm text-slate-500 font-light">Connect your own WhatsApp number via QR scan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left sidebar - Instances list */}
          <div className="col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Instances</h2>
              </div>

              {/* Create new */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Instance name..."
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="bg-[#25D366] hover:bg-[#20bc59] text-white shrink-0"
                    size="sm"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </div>

              {/* Instance list */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {instances.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No instances yet</p>
                    <p className="text-xs text-slate-400 mt-1">Create one above to get started</p>
                  </div>
                ) : (
                  instances.map((inst) => (
                    <button
                      key={inst.instance_id}
                      onClick={() => handleSelectInstance(inst)}
                      className={`w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors ${
                        activeInstance?.instance_id === inst.instance_id ? "bg-slate-50 border-l-4 border-[#25D366]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{inst.instance_name}</p>
                          {inst.phone_number && (
                            <p className="text-xs text-slate-500 mt-0.5">+{inst.phone_number}</p>
                          )}
                        </div>
                        <StatusBadge status={inst.status} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel - Active instance */}
          <div className="col-span-8">
            {!activeInstance ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <QrCode className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-light text-slate-900 mb-2">Select or Create an Instance</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Create a new WhatsApp instance and scan the QR code with your phone to connect.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Instance header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-slate-900">{activeInstance.instance_name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge status={activeInstance.status} />
                      {activeInstance.phone_number && (
                        <span className="text-xs text-slate-500">+{activeInstance.phone_number}</span>
                      )}
                      {activeInstance.display_name && (
                        <span className="text-xs text-slate-500">({activeInstance.display_name})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshStatus(activeInstance.instance_id)}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                    </Button>
                    {activeInstance.status === "connected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDisconnect(activeInstance.instance_id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Disconnect
                      </Button>
                    )}
                    {(activeInstance.status === "disconnected" || activeInstance.status === "failed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconnect(activeInstance.instance_id)}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reconnect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                {activeInstance.status === "connected" && (
                  <div className="px-8 border-b border-slate-100">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setTab("overview")}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                          tab === "overview" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setTab("send")}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                          tab === "send" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="px-8 py-6">
                  {/* QR Code section (for non-connected states) */}
                  {activeInstance.status !== "connected" && activeInstance.status !== "logged_out" && (
                    <div className="text-center py-8">
                      {qrCode ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 mb-4">
                            Scan this QR code with WhatsApp on your phone
                          </p>
                          <div className="inline-block p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-lg">
                            <img
                              src={qrCode}
                              alt="WhatsApp QR Code"
                              className="w-64 h-64"
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-4">
                            Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device
                          </p>
                          {pollingQr && (
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Waiting for scan...
                            </div>
                          )}
                        </div>
                      ) : pollingQr ? (
                        <div className="space-y-4">
                          <Loader2 className="w-10 h-10 animate-spin text-[#25D366] mx-auto" />
                          <p className="text-sm text-slate-600">Generating QR code...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <QrCode className="w-16 h-16 text-slate-200 mx-auto" />
                          <p className="text-sm text-slate-600">Click below to generate a QR code</p>
                          <Button
                            onClick={() => startQrPolling(activeInstance.instance_id)}
                            className="bg-[#25D366] hover:bg-[#20bc59] text-white"
                          >
                            <QrCode className="w-4 h-4 mr-2" /> Get QR Code
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logged out state */}
                  {activeInstance.status === "logged_out" && (
                    <div className="text-center py-8 space-y-4">
                      <XCircle className="w-12 h-12 text-red-300 mx-auto" />
                      <p className="text-slate-700 font-medium">Session Logged Out</p>
                      <p className="text-sm text-slate-500">This session was logged out from WhatsApp. Create a new instance to reconnect.</p>
                    </div>
                  )}

                  {/* Connected - Overview */}
                  {activeInstance.status === "connected" && tab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Connected</span>
                          </div>
                          <p className="text-xs text-green-700">Session is active and ready to send/receive messages.</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="w-5 h-5 text-slate-600" />
                            <span className="text-sm font-medium text-slate-800">Phone Details</span>
                          </div>
                          <p className="text-sm text-slate-700 font-mono">+{activeInstance.phone_number || "N/A"}</p>
                          {activeInstance.display_name && (
                            <p className="text-xs text-slate-500 mt-1">{activeInstance.display_name}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-slate-800 mb-3">Instance Info</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Instance ID:</span>
                            <p className="text-slate-800 font-mono text-xs mt-0.5">{activeInstance.instance_id}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Name:</span>
                            <p className="text-slate-800 mt-0.5">{activeInstance.instance_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Created:</span>
                            <p className="text-slate-800 mt-0.5">{new Date(activeInstance.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Status:</span>
                            <p className="text-slate-800 mt-0.5 capitalize">{activeInstance.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected - Send Message */}
                  {activeInstance.status === "connected" && tab === "send" && (
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="send-to" className="text-sm text-slate-700">
                          Phone Number (with country code, no +)
                        </Label>
                        <Input
                          id="send-to"
                          placeholder="923001234567"
                          value={sendTo}
                          onChange={(e) => setSendTo(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="send-text" className="text-sm text-slate-700">
                          Message
                        </Label>
                        <textarea
                          id="send-text"
                          placeholder="Type your message..."
                          value={sendText}
                          onChange={(e) => setSendText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                          rows={4}
                          className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 resize-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSend}
                          disabled={sending || !sendTo.trim() || !sendText.trim()}
                          className="bg-[#25D366] hover:bg-[#20bc59] text-white"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Message
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
