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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <BrandLogo width={120} height={34} className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Menu"
              >
                <FaEllipsisV size={18} />
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-popover p-2 shadow-xl border border-border ring-1 ring-black/5 focus:outline-none z-20 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                      {menuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            pathname === item.href
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <item.icon size={14} className={pathname === item.href ? "text-primary" : "text-muted-foreground"} />
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-2 h-px bg-border" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
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
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors md:hidden"
              aria-label="Sair da conta"
            >
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] backdrop-blur md:hidden">
        <div className="flex px-2 py-1 gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon size={20} className={isActive ? "mb-0.5" : "mb-1"} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
