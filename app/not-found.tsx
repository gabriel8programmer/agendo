import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import BrandLogo from "@/components/ui/BrandLogo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo width={180} height={52} className="h-12 w-auto" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Erro 404</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">Página não encontrada</h1>
          <p className="mt-3 text-sm text-zinc-600">
            O link que você acessou não existe ou foi removido.
          </p>

          <div className="mt-6 space-y-3">
            <ButtonLink href="/" variant="primary" className="w-full">
              Ir para início
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" className="w-full">
              Ir para login
            </ButtonLink>
          </div>
        </Card>
      </main>
    </div>
  )
}
