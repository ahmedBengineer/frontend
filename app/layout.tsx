import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { SubscriptionProvider } from "@/components/subscription-provider"
import { TutorialProvider } from "@/components/tutorial/TutorialProvider"
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay"
import 'leaflet/dist/leaflet.css'
import "@xyflow/react/dist/style.css"
import "@livekit/components-styles"

export const metadata: Metadata = {
  title: "Smart Convo - Dashboard",
  description: "Modern corporate dashboard for Smart Convo",
    // generator: 'v0.dev'
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();
        ` }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
          <AuthProvider><SubscriptionProvider><TutorialProvider>{children}<TutorialOverlay /><Toaster /></TutorialProvider></SubscriptionProvider></AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
