"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore(s => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
}