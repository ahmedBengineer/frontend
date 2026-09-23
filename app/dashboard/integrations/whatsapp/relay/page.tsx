'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? ''

function RelayInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    const finish = (integration: any, error: string | null) => {
      localStorage.setItem('wa_connect_result', JSON.stringify({ integration, error }))
      window.close()
    }

    if (!code || !state) {
      finish(null, 'Missing code or state from Meta redirect.')
      return
    }

    fetch(`${BASE}/integrations/whatsapp/callback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) finish(data, null)
        else finish(null, data.error ?? 'Finalization failed.')
      })
      .catch((err) => finish(null, err.message ?? 'Network error.'))
  }, [searchParams])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Connecting your WhatsApp account, please wait...</p>
    </div>
  )
}

export default function WhatsAppRelayPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><p>Loading...</p></div>}>
      <RelayInner />
    </Suspense>
  )
}
