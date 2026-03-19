"use client"

import { FcGoogle } from "react-icons/fc"
import { Bungee_Shade } from "next/font/google"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

const agendoFont = Bungee_Shade({
  subsets: ["latin"],
  weight: ["400"],
})

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8">
          <header className="mb-8">
            <h1
              className={`${agendoFont.className} text-center text-3xl font-semibold text-zinc-900 [text-shadow:0_2px_0_rgba(0,0,0,0.08),0_4px_0_rgba(0,0,0,0.05)]`}
            >
              Agendo
            </h1>
            <p className="mt-1 text-center text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Gerencie seus compromissos
            </p>
          </header>

          <form className="space-y-4">
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              required
            />

            <Input
              label="Senha"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />

            <Button type="button" className="w-full py-3">
              Entrar
            </Button>

            <div className="pt-1 text-right">
              <a
                href="#"
                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-zinc-100" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">ou</span>
              <div className="h-px flex-1 bg-zinc-100" />
            </div>

            <Button type="button" variant="secondary" className="w-full py-3">
              <FcGoogle aria-hidden size={18} />
              Login com Google
            </Button>

            <div className="pt-6 text-center">
              <p className="text-sm font-medium text-zinc-500">Não tem uma conta?</p>
              <Button type="button" variant="secondary" className="mt-3 w-full">
                Criar Conta
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
