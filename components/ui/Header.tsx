"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { destroyCookie } from "nookies"
import {
  FaEllipsisV,
  FaCalendarAlt,
  FaWrench,
  FaCog,
  FaChartLine,
  FaUserTie,
  FaSignOutAlt,
  FaMoon,
  FaSun,
} from "react-icons/fa"
import { logoutSession } from "@/lib/api"
import BrandLogo from "@/components/ui/BrandLogo"
import { useTheme } from "@/components/providers/ThemeProvider"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: FaChartLine },
    { label: "Agenda", href: "/agenda", icon: FaCalendarAlt },
    { label: "Serviços", href: "/servicos", icon: FaWrench },
    { label: "Profissionais", href: "/profissionais", icon: FaUserTie },
    { label: "Configurações", href: "/configuracoes", icon: FaCog },
  ]

  const handleLogout = async () => {
    try {
      await logoutSession()
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error)
    } finally {
      destroyCookie(null, "agendo_logged", { path: "/" })
      setIsOpen(false)
      router.push("/login")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <BrandLogo width={120} height={34} className="h-7 w-auto" />
        </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
            <div className="relative hidden md:block">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
            aria-label="Menu"
          >
            <FaEllipsisV size={16} />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-xl border border-zinc-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <item.icon size={14} className="text-zinc-400" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-zinc-100" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <FaSignOutAlt size={14} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
            <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors md:hidden"
            aria-label="Sair da conta"
          >
            <FaSignOutAlt size={16} />
          </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(24,24,27,0.08)] backdrop-blur md:hidden">
        <div className="flex gap-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const activeClass =
              theme === "dark"
                ? "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-500"
                : "bg-zinc-900 text-white"
            const inactiveClass =
              theme === "dark"
                ? "text-zinc-400 hover:bg-zinc-800"
                : "text-zinc-500 hover:bg-zinc-100"

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center px-1 py-2 text-[11px] font-semibold transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <item.icon size={16} />
                <span className="mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
