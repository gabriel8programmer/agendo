"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getCurrentSession } from "@/lib/api"
import { User } from "@/types"

type AuthContextValue = {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const data = await getCurrentSession()
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider")
  }
  return ctx
}
