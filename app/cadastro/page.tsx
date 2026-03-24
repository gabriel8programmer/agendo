"use client"

import Image from "next/image"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8">
          <header className="mb-8">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="Agendo" width={220} height={64} className="h-14 w-auto" />
            </div>
            <p className="mt-1 text-center text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Crie sua conta
            </p>
          </header>

          <form className="space-y-4">
            <Input
              label="Nome"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome completo"
              required
            />

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
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirmar Senha"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full py-3">
              Criar Conta
            </Button>

            <div className="pt-3 text-center">
              <p className="text-sm font-medium text-zinc-500">Já tem uma conta?</p>
              <ButtonLink href="/login" variant="secondary" className="mt-3 w-full">
                Entrar
              </ButtonLink>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
