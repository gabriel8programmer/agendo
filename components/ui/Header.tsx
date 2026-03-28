"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { destroyCookie } from "nookies"
import {
  FaEllipsisV,
  FaCalendarAlt,
  FaWrench,
  FaCog,
  FaChartLine,
  FaSignOutAlt,
} from "react-icons/fa"
import { logoutSession } from "@/lib/api"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: FaChartLine },
    { label: "Agenda", href: "/agenda", icon: FaCalendarAlt },
    { label: "Serviços", href: "/servicos", icon: FaWrench },
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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="Agendo" width={120} height={34} className="h-7 w-auto" />
        </Link>

        <div className="relative">
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
      </div>
    </header>
  )
}
