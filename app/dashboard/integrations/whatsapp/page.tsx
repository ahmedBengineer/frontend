"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, Wifi, WifiOff,
  RefreshCw, Send, Phone, Building2, Shield, Zap, ExternalLink,
  Copy, MessageSquare, Image, FileText, MapPin, X, ChevronRight,
  Loader2, Info
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

declare global {
  interface Window { FB: any; fbAsyncInit: () => void }
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL

type WaStatus = "connected" | "disconnected" | "pending" | "error" | "none"

interface WaIntegration {
  id: number
  company: number
  business_id: string
  waba_id: string
  phone_number_id: string
  access_token_masked: string
  token_expires_at: string | null
  business_name: string
  phone_number: string
  display_phone_number: string
  status: WaStatus
  webhook_verified: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface PhoneProfile {
  id: number
  status: string
  display_phone_number: string
  phone_details: {
    id: string
    display_phone_number: string
    verified_name: string
    quality_rating: string
    status: string
    platform_type: string
  }
}

type MessageType = "text" | "template" | "media" | "location"
type MediaType = "image" | "video" | "audio" | "document"

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Token ${Cookies.get("Token") || ""}`,
})

export default function WhatsAppIntegrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const stateRef = useRef<string | null>(null)
  const codeRef = useRef<string | null>(null)

  const [status, setStatus] = useState<WaStatus>("none")
  const [integration, setIntegration] = useState<WaIntegration | null>(null)
  const [profile, setProfile] = useState<PhoneProfile | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const [activeTab, setActiveTab] = useState<"overview" | "send" | "profile">("overview")
  const [msgType, setMsgType] = useState<MessageType>("text")
  const [mediaType, setMediaType] = useState<MediaType>("image")
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    to: "", message: "", template_name: "", language_code: "en_US",
    media_url: "", caption: "", lat: "", lng: "", name: "", address: "",
  })

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoadingStatus(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp/status/`, { headers: authHeaders() })
      if (res.status === 404) { setStatus("none"); setIntegration(null); return }
      if (!res.ok) throw new Error()
      const data: WaIntegration = await res.json()
      setStatus(data.status)
      setIntegration(data)
    } catch {
      if (!silent) toast({ description: "Failed to fetch WhatsApp status.", variant: "destructive" })
    } finally {
      if (!silent) setLoadingStatus(false)
    }
  }, [toast])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (status === "connected" && activeTab === "profile") fetchProfile()
  }, [status, activeTab])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.includes('facebook.com')) return
      let data: any
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data }
      catch { return }
      if (data?.type !== 'WA_EMBEDDED_SIGNUP') return

      if (data.event === 'FINISH') {
        const { waba_id, phone_number_id, business_id } = data.data
        fetch(`${BASE}/integrations/whatsapp/finalize/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waba_id, phone_number_id, business_id,
            state: stateRef.current,
            code: codeRef.current || '',
          }),
        })
          .then(async (res) => {
            const integration = await res.json()
            if (res.ok) {
              setIntegration(integration)
              setStatus(integration.status)
              toast({ description: integration.status === 'connected' ? 'WhatsApp connected successfully!' : 'WhatsApp setup pending Meta review.' })
            } else {
              toast({ description: integration.error || 'Finalization failed.', variant: 'destructive' })
            }
          })
          .catch((e: any) => toast({ description: e.message || 'Failed to finalize.', variant: 'destructive' }))
          .finally(() => { setConnecting(false); codeRef.current = null })
      } else if (data.event === 'CANCEL') {
        toast({ description: 'WhatsApp setup was cancelled.', variant: 'destructive' })
        setConnecting(false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1675591740398507',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      })
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const fetchProfile = async () => {
    setLoadingProfile(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp/profile/`, { headers: authHeaders() })
      if (res.ok) setProfile(await res.json())
    } catch { /* non-critical */ }
    finally { setLoadingProfile(false) }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp/connect/`, {
        method: 'POST', headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to get OAuth config')
      const cfg = await res.json()
      stateRef.current = cfg.state

      window.FB.login(
        (response: any) => {
          if (!response.authResponse) {
            toast({ description: 'WhatsApp setup was cancelled.', variant: 'destructive' })
            setConnecting(false)
            return
          }
          // Capture the OAuth code for the finalize request
          codeRef.current = response.authResponse.code || null
        },
        {
          config_id: '1704232200811815',
          response_type: 'code',
          override_default_response_type: true,
          extras: { sessionInfoVersion: '3', version: 'v4' },
        }
      )
    } catch (e: any) {
      toast({ description: e.message || 'Failed to start OAuth.', variant: 'destructive' })
      setConnecting(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp/complete/`, {
        method: "POST", headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Still pending")
      setStatus("connected")
      setIntegration(data)
      toast({ description: "WhatsApp connected successfully!" })
    } catch (e: any) {
      toast({ description: e.message, variant: "destructive" })
    } finally { setCompleting(false) }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch(`${BASE}/integrations/whatsapp/disconnect/`, {
        method: "POST", headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      setStatus("none")
      setIntegration(null)
      setProfile(null)
      toast({ description: "WhatsApp disconnected." })
    } catch {
      toast({ description: "Failed to disconnect.", variant: "destructive" })
    } finally { setDisconnecting(false) }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      let payload: any = { to: form.to, message_type: msgType }
      if (msgType === "text") payload.message = form.message
      else if (msgType === "template") {
        payload.template_name = form.template_name
        payload.language_code = form.language_code
        payload.components = []
      } else if (msgType === "media") {
        payload.media_type = mediaType
        payload.media_url = form.media_url
        if (form.caption) payload.caption = form.caption
      } else if (msgType === "location") {
        payload.lat = parseFloat(form.lat)
        payload.lng = parseFloat(form.lng)
        if (form.name) payload.name = form.name
        if (form.address) payload.address = form.address
      }

      const res = await fetch(`${BASE}/integrations/whatsapp/send-message/`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(JSON.stringify(data))
      const msgId = data.messages?.[0]?.id
      toast({ description: msgId ? `Message sent! ID: ${msgId}` : "Message sent successfully!" })
      setForm(f => ({ ...f, to: "", message: "", media_url: "", caption: "", lat: "", lng: "", name: "", address: "" }))
    } catch (e: any) {
      toast({ description: "Failed to send message.", variant: "destructive" })
    } finally { setSending(false) }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ description: "Copied to clipboard!" })
  }

  const qualityColor = (r: string) =>
    r === "GREEN" ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : r === "YELLOW" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200"

  if (loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-light text-sm">Loading WhatsApp integration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/integrations")}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">WhatsApp Business</h1>
                <p className="text-xs text-slate-500 font-light">Meta Embedded Signup</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {status !== "none" && (
              <button
                onClick={() => fetchStatus()}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── NOT CONNECTED ─────────────────────────────────────────── */}
        {status === "none" && (
          <ConnectCard onConnect={handleConnect} connecting={connecting} />
        )}

        {/* ── PENDING ───────────────────────────────────────────────── */}
        {status === "pending" && (
          <PendingCard
            integration={integration}
            onComplete={handleComplete}
            completing={completing}
            onRefresh={() => fetchStatus()}
          />
        )}

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {status === "error" && (
          <ErrorCard onRetry={handleConnect} connecting={connecting} />
        )}

        {/* ── DISCONNECTED ──────────────────────────────────────────── */}
        {status === "disconnected" && (
          <DisconnectedCard onReconnect={handleConnect} connecting={connecting} />
        )}

        {/* ── CONNECTED ─────────────────────────────────────────────── */}
        {status === "connected" && integration && (
          <>
            {/* Overview card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#25D366]/5 via-white to-white px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{integration.business_name || "WhatsApp Business"}</p>
                    <p className="text-xs text-slate-500 font-light">{integration.display_phone_number || integration.phone_number}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                  Disconnect
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                {(["overview", "send", "profile"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-xs font-medium capitalize transition-colors border-b-2 ${
                      activeTab === tab
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab === "send" ? "Send Message" : tab === "profile" ? "Phone Profile" : "Overview"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <OverviewTab integration={integration} onCopy={copyToClipboard} />
                )}
                {activeTab === "send" && (
                  <SendTab
                    form={form} setForm={setForm}
                    msgType={msgType} setMsgType={setMsgType}
                    mediaType={mediaType} setMediaType={setMediaType}
                    sending={sending} onSend={handleSend}
                  />
                )}
                {activeTab === "profile" && (
                  <ProfileTab
                    profile={profile}
                    loading={loadingProfile}
                    onRefresh={fetchProfile}
                    qualityColor={qualityColor}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: WaStatus }) {
  const map: Record<WaStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    connected: { label: "Connected", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Wifi className="w-3 h-3" /> },
    pending:   { label: "Pending approval", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    error:     { label: "Error", cls: "bg-red-50 text-red-700 border-red-200", icon: <AlertCircle className="w-3 h-3" /> },
    disconnected: { label: "Disconnected", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <WifiOff className="w-3 h-3" /> },
    none:      { label: "Not connected", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <WifiOff className="w-3 h-3" /> },
  }
  const m = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  )
}

// ─── Connect Card ──────────────────────────────────────────────────────────────
function ConnectCard({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Connect WhatsApp Business</h2>
          <p className="text-sm text-slate-500 font-light max-w-md mx-auto mb-8">
            Use Meta&apos;s Embedded Signup to connect your WhatsApp Business account. A popup window will open — complete the flow there.
          </p>

          <button
            onClick={onConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bc59] text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-[#25D366]/30 disabled:opacity-60"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )}
            {connecting ? "Opening OAuth..." : "Connect with Meta"}
          </button>
        </div>

        <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Shield className="w-4 h-4" />, title: "Secure OAuth", desc: "Industry-standard Meta Embedded Signup" },
            { icon: <Zap className="w-4 h-4" />, title: "Instant Messaging", desc: "Send text, media, templates & more" },
            { icon: <Phone className="w-4 h-4" />, title: "Business Profile", desc: "Manage your WABA phone identity" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{f.title}</p>
                <p className="text-xs text-slate-500 font-light mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">How it works</p>
        <div className="space-y-3">
          {[
            "Click Connect — a secure Meta popup opens",
            "Log in with your Facebook Business account",
            "Select or create your WhatsApp Business Account (WABA)",
            "Meta redirects back — we save your connection automatically",
            "If your display name is under review, come back in ≤ 24h and click Complete",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-600 font-light">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pending Card ──────────────────────────────────────────────────────────────
function PendingCard({ integration, onComplete, completing, onRefresh }: {
  integration: WaIntegration | null
  onComplete: () => void
  completing: boolean
  onRefresh: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Awaiting Meta Approval</p>
          <p className="text-xs text-amber-700 font-light">Your phone number display name is under review</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 font-light flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{integration?.metadata?.pending_reason || "Meta is reviewing your display name — this typically takes up to 24 hours."}</span>
        </div>
        <p className="text-sm text-slate-600 font-light">
          Once Meta approves, click <strong className="font-medium text-slate-900">Complete Setup</strong> to finish connecting your account. You don&apos;t need to go through OAuth again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Complete Setup
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-light rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Card ────────────────────────────────────────────────────────────────
function ErrorCard({ onRetry, connecting }: { onRetry: () => void; connecting: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 mb-1">Integration Error</p>
        <p className="text-sm text-slate-500 font-light mb-4">Something went wrong with your WhatsApp integration. Try reconnecting.</p>
        <button
          onClick={onRetry}
          disabled={connecting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Retry Connection
        </button>
      </div>
    </div>
  )
}

// ─── Disconnected Card ─────────────────────────────────────────────────────────
function DisconnectedCard({ onReconnect, connecting }: { onReconnect: () => void; connecting: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <WifiOff className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 mb-1">Integration Disconnected</p>
        <p className="text-sm text-slate-500 font-light mb-4">Your WhatsApp connection was revoked or expired. Reconnect to restore messaging.</p>
        <button
          onClick={onReconnect}
          disabled={connecting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bc59] text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          Reconnect WhatsApp
        </button>
      </div>
    </div>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ integration, onCopy }: { integration: WaIntegration; onCopy: (v: string) => void }) {
  const fields = [
    { label: "Business Name", value: integration.business_name, icon: <Building2 className="w-3.5 h-3.5" /> },
    { label: "Phone Number", value: integration.display_phone_number || integration.phone_number, icon: <Phone className="w-3.5 h-3.5" /> },
    { label: "WABA ID", value: integration.waba_id, icon: <Shield className="w-3.5 h-3.5" />, copy: true },
    { label: "Phone Number ID", value: integration.phone_number_id, icon: <Phone className="w-3.5 h-3.5" />, copy: true },
    { label: "Business ID", value: integration.business_id, icon: <Building2 className="w-3.5 h-3.5" />, copy: true },
    { label: "Access Token", value: integration.access_token_masked, icon: <Shield className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.label} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl group">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              {f.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{f.label}</p>
              <p className="text-sm text-slate-800 font-light truncate mt-0.5">{f.value || "—"}</p>
            </div>
            {f.copy && f.value && (
              <button
                onClick={() => onCopy(f.value!)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border ${integration.webhook_verified ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          {integration.webhook_verified
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          }
          <span className={`text-xs font-medium ${integration.webhook_verified ? "text-emerald-700" : "text-red-700"}`}>
            Webhook {integration.webhook_verified ? "Verified" : "Unverified"}
          </span>
        </div>
        <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Connected</p>
            <p className="text-xs text-slate-700 font-light">
              {new Date(integration.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Send Message Tab ──────────────────────────────────────────────────────────
function SendTab({ form, setForm, msgType, setMsgType, mediaType, setMediaType, sending, onSend }: {
  form: any; setForm: (f: any) => void
  msgType: MessageType; setMsgType: (t: MessageType) => void
  mediaType: MediaType; setMediaType: (t: MediaType) => void
  sending: boolean; onSend: () => void
}) {
  const upd = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  const msgTypes: { type: MessageType; icon: React.ReactNode; label: string }[] = [
    { type: "text", icon: <MessageSquare className="w-4 h-4" />, label: "Text" },
    { type: "template", icon: <FileText className="w-4 h-4" />, label: "Template" },
    { type: "media", icon: <Image className="w-4 h-4" />, label: "Media" },
    { type: "location", icon: <MapPin className="w-4 h-4" />, label: "Location" },
  ]

  return (
    <div className="space-y-5">
      {/* Message type selector */}
      <div className="flex gap-2 flex-wrap">
        {msgTypes.map(m => (
          <button
            key={m.type}
            onClick={() => setMsgType(m.type)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              msgType === m.type
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* To field */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700">To (phone number with country code)</Label>
        <Input
          value={form.to} onChange={e => upd("to", e.target.value)}
          placeholder="+12025551234" className="rounded-xl border-slate-200 text-sm"
        />
      </div>

      {/* Text */}
      {msgType === "text" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700">Message</Label>
          <Textarea
            value={form.message} onChange={e => upd("message", e.target.value)}
            placeholder="Type your message..." rows={4}
            className="rounded-xl border-slate-200 text-sm resize-none"
          />
        </div>
      )}

      {/* Template */}
      {msgType === "template" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Template Name</Label>
            <Input value={form.template_name} onChange={e => upd("template_name", e.target.value)} placeholder="hello_world" className="rounded-xl border-slate-200 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Language Code</Label>
            <Input value={form.language_code} onChange={e => upd("language_code", e.target.value)} placeholder="en_US" className="rounded-xl border-slate-200 text-sm" />
          </div>
        </div>
      )}

      {/* Media */}
      {msgType === "media" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["image","video","audio","document"] as MediaType[]).map(t => (
              <button
                key={t}
                onClick={() => setMediaType(t)}
                className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-all ${
                  mediaType === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                }`}
              >{t}</button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Media URL</Label>
            <Input value={form.media_url} onChange={e => upd("media_url", e.target.value)} placeholder="https://example.com/file.jpg" className="rounded-xl border-slate-200 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Caption (optional)</Label>
            <Input value={form.caption} onChange={e => upd("caption", e.target.value)} placeholder="Optional caption" className="rounded-xl border-slate-200 text-sm" />
          </div>
        </div>
      )}

      {/* Location */}
      {msgType === "location" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Latitude</Label>
              <Input value={form.lat} onChange={e => upd("lat", e.target.value)} placeholder="37.4226711" className="rounded-xl border-slate-200 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Longitude</Label>
              <Input value={form.lng} onChange={e => upd("lng", e.target.value)} placeholder="-122.0849872" className="rounded-xl border-slate-200 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Location Name (optional)</Label>
            <Input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Googleplex" className="rounded-xl border-slate-200 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Address (optional)</Label>
            <Input value={form.address} onChange={e => upd("address", e.target.value)} placeholder="1600 Amphitheatre Pkwy" className="rounded-xl border-slate-200 text-sm" />
          </div>
        </div>
      )}

      <button
        onClick={onSend}
        disabled={sending || !form.to}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bc59] text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? "Sending..." : "Send Message"}
      </button>
    </div>
  )
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile, loading, onRefresh, qualityColor }: {
  profile: PhoneProfile | null
  loading: boolean
  onRefresh: () => void
  qualityColor: (r: string) => string
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-slate-500 font-light">Profile not loaded.</p>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" /> Load Profile
        </button>
      </div>
    )
  }

  const d = profile.phone_details
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Details</p>
        <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Verified Name", value: d.verified_name },
          { label: "Display Number", value: d.display_phone_number },
          { label: "Platform", value: d.platform_type },
          { label: "Status", value: d.status },
        ].map(f => (
          <div key={f.label} className="p-3.5 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{f.label}</p>
            <p className="text-sm text-slate-800 font-light mt-0.5">{f.value || "—"}</p>
          </div>
        ))}
      </div>
      {d.quality_rating && (
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${qualityColor(d.quality_rating)}`}>
          <Shield className="w-3.5 h-3.5" /> Quality Rating: {d.quality_rating}
        </div>
      )}
    </div>
  )
}
