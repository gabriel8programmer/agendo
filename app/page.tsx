import ButtonLink from "@/components/ui/ButtonLink"
import { Bungee_Shade } from "next/font/google"

const agendoFont = Bungee_Shade({
  subsets: ["latin"],
  weight: ["400"],
})

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <header className="mb-8 text-center">
          <h1
            className={`${agendoFont.className} text-4xl font-semibold text-zinc-900 [text-shadow:0_2px_0_rgba(0,0,0,0.08),0_4px_0_rgba(0,0,0,0.05)]`}
          >
            Agendo
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600">
            Seu sistema de agendamento online simples e eficiente.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <ButtonLink href="/login" variant="primary">
            Entrar no Sistema
          </ButtonLink>
          <ButtonLink href="/servicos" variant="secondary">
            Ver Serviços
          </ButtonLink>
        </div>
      </main>
    </div>
  )
}
