// app/servicos/page.tsx
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { FaClock, FaTag, FaPlus, FaList } from "react-icons/fa"

// 1. Reusable Service type
interface Service {
  id: number
  name: string
  duration: number
  price: number | null
}

// 2. Mock list of services
const mockServices: Service[] = [
  { id: 1, name: "Corte de Cabelo", duration: 30, price: 50.0 },
  { id: 2, name: "Barba", duration: 20, price: 30.0 },
  { id: 3, name: "Corte e Barba", duration: 50, price: 75.0 },
  { id: 4, name: "Pintura", duration: 60, price: null },
]

function ServiceItem({ service }: { service: Service }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-zinc-200 transition-all">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
          <FaTag size={14} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{service.name}</p>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <FaClock size={10} />
            <span>{service.duration} min</span>
          </div>
        </div>
      </div>
      <p className="text-sm font-bold text-zinc-900">
        {service.price ? `R$ ${service.price.toFixed(2).replace(".", ",")}` : "A combinar"}
      </p>
    </li>
  )
}

export default function ServicosPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <PageHeader label="Configuração" title="Meus Serviços" />

        <div className="grid gap-6 md:grid-cols-12">
          {/* Formulário de Novo Serviço */}
          <div className="md:col-span-5">
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
                <FaPlus size={14} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Novo Serviço</h2>
              </div>

              <form className="space-y-4">
                <Input
                  label="Nome do Serviço"
                  id="name"
                  name="name"
                  placeholder="Ex: Corte de Cabelo"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Duração (min)"
                    type="number"
                    id="duration"
                    name="duration"
                    placeholder="30"
                  />

                  <Input
                    label="Preço (R$)"
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>

                <Button type="submit" className="w-full mt-2">
                  <FaPlus size={12} />
                  Salvar Serviço
                </Button>
              </form>
            </Card>
          </div>

          {/* Lista de Serviços */}
          <div className="md:col-span-7">
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
                <FaList size={14} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Serviços Cadastrados</h2>
              </div>

              <ul className="space-y-3">
                {mockServices.map((service) => (
                  <ServiceItem key={service.id} service={service} />
                ))}
              </ul>

              {mockServices.length === 0 && (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-sm">Nenhum serviço cadastrado.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
