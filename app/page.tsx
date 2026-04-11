import ButtonLink from "@/components/ui/ButtonLink"
import BrandLogo from "@/components/ui/BrandLogo"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <BrandLogo width={210} height={60} className="h-12 w-auto" />
          </div>
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
