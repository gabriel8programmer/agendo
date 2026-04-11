"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const STORAGE_KEY = "agendo_theme"

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyThemeOnDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const resolvedTheme: Theme = stored === "dark" ? "dark" : "light"
    applyThemeOnDocument(resolvedTheme)
    queueMicrotask(() => setTheme(resolvedTheme))
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      localStorage.setItem(STORAGE_KEY, next)
      applyThemeOnDocument(next)
      return next
    })
  }

  const value = useMemo(() => ({ theme, toggleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider")
  }
  return ctx
}
