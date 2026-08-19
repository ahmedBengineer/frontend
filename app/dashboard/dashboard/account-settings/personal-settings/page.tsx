"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { MapPin } from "lucide-react"

const PersonalSettingsMap = dynamic(() => import("@/components/PersonalSettingsMap"), {
  ssr: false,
  loading: () => <div className="h-[380px] rounded-2xl bg-slate-100 animate-pulse" />,
})

export default function PersonalSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const { toast } = useToast()
  const token = Cookies.get("Token") || ""

  // Fetch initial 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/status/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
        const data = await response.json()
        setTwoFactorEnabled(data.is_2fa_enabled || false)
      } catch (err) {
        toast({ title: "Error", description: "Could not fetch 2FA status", variant: "destructive" })
      } finally {
        setInitializing(false)
      }
    }

    fetch2FAStatus()
  }, [token, toast])

  // Handle toggle switch
  const handle2FAToggle = async () => {
    const newValue = !twoFactorEnabled
    setTwoFactorEnabled(newValue)

    if (newValue) {
      // Enabling 2FA
      setLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/setup/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || "Failed to set up 2FA")
        }

        setQrCode(data.qr_code_base64)
        toast({ title: "QR Code Ready", description: "Scan the code with your Authenticator App." })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setTwoFactorEnabled(false)
      } finally {
        setLoading(false)
      }
    } else {
      // Disabling 2FA
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/disable/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || "Failed to disable 2FA")
        }

        toast({ title: "2FA Disabled", description: "Two-Factor Authentication is now off." })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setTwoFactorEnabled(true)
      }

      setQrCode(null)
      setCode("")
    }
  }

  // Handle 6-digit code verification
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter a valid 6-digit code.", variant: "destructive" })
      return
    }

    setVerifying(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/authentication/2fa/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ token: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || "Invalid code")
      }

      toast({ title: "2FA Verified", description: "Two-Factor Authentication is now enabled." })
      setQrCode(null)
      setCode("")
      setTwoFactorEnabled(true)
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" })
    } finally {
      setVerifying(false)
    }
  }

  if (initializing) {
    return <p className="text-center py-10">Loading Settings...</p>
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Secure your account with an extra layer of protection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa">Enable 2FA</Label>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              disabled={loading || verifying}
            />
          </div>

          {loading && <p>Loading QR Code...</p>}

          {qrCode && (
            <div className="text-center">
              <p className="mb-2">Scan this QR code with your Authenticator App:</p>
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="2FA QR Code"
                className="mx-auto border p-2 rounded shadow-md"
              />

              <div className="mt-6 space-y-4">
                <Label htmlFor="code">Enter 6-digit code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="text-center tracking-widest"
                />
                <Button onClick={handleVerifyCode} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" aria-hidden />
            <CardTitle>3D map preview</CardTitle>
          </div>
          <CardDescription>
            Mapbox Standard style with tilt and rotation (free tier with a public access token). Set{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">.env.local</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonalSettingsMap />
        </CardContent>
      </Card>
    </div>
  )
}

