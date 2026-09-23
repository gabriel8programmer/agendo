"use client"

import { FaSun, FaMoon } from "react-icons/fa"
import { useTheme } from "@/components/providers/ThemeProvider"

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 ${className}`}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
    </button>
  )
}
