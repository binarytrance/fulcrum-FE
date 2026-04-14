"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { getAccessToken } from "@/lib/api"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Toaster } from "@/components/ui/toast"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated && !getAccessToken()) {
      router.replace("/signin")
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}