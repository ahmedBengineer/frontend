"use client"

import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const PasswordPrompt = ({ onVerify, onClose, pathKey }: { onVerify: (password: string) => void; onClose: () => void; pathKey: string }) => {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    setSubmitting(true)
    onVerify(password)
    setSubmitting(false)
  }

  return (
    <Dialog open={true} onOpenChange={({ open }) => {
      if (!open) onClose()
    }}>
      <DialogTrigger as-child>
        <button className="hidden" />
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogTitle>🔐 Protected Action</DialogTitle>
        <DialogDescription>
          Protected action detected on {pathKey}
        </DialogDescription>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter password to proceed:
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-slate-200 py-2.5 px-3 text-sm focus-visible:ring-slate-900/20 transition-colors"
              disabled={submitting}
              placeholder="blocked"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setPassword("")
                onClose()
              }}
              disabled={submitting}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!password.trim() || submitting}
              className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-light"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Verifying…" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordPrompt