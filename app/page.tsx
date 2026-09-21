import ButtonLink from "@/components/ui/ButtonLink"
import BrandLogo from "@/components/ui/BrandLogo"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl shadow-black/5 md:p-12">
        <header className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
              <BrandLogo width={200} height={50} className="h-10 w-auto" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bem-vindo ao Agendo</h1>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-muted-foreground">
            A plataforma completa para gerir seus agendamentos com simplicidade.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <ButtonLink href="/login" variant="primary" className="h-14 text-base font-bold">
            Começar Agora
          </ButtonLink>
          <ButtonLink
            href="/planos"
            variant="secondary"
            className="h-14 text-sm font-semibold flex items-center justify-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            Ver Planos & Preços (a partir de R$ 22,41)
          </ButtonLink>
          <ButtonLink
            href="/servicos"
            variant="link"
            className="h-10 text-xs text-muted-foreground"
          >
            Ver Serviços Cadastrados
          </ButtonLink>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
            Powered by Agendo
          </p>
        </footer>
      </main>
    </div>
  )
}
