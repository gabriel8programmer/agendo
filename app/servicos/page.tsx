"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { FaClock, FaTag, FaPlus, FaList } from "react-icons/fa"
import { getServices, createService } from "@/lib/api"
import { Service } from "@/types"
import { useToast } from "@/components/ui/Toast"

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
        {service.price ? `R$ ${Number(service.price).toFixed(2).replace(".", ",")}` : "A combinar"}
      </p>
    </li>
  )
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [duration, setDuration] = useState("")
  const [price, setPrice] = useState("")
  const { showToast, ToastComponent } = useToast()
  const userId = "user-1" // Mocked userId

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await getServices(userId)
        setServices(data)
      } catch (error) {
        console.error("Error loading services:", error)
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !duration) return

    try {
      const newService = await createService({
        userId,
        name,
        duration: Number(duration),
        price: price ? Number(price) : undefined,
      })
      setServices((prev) => [...prev, newService])
      setName("")
      setDuration("")
      setPrice("")
      showToast("Serviço cadastrado com sucesso!", "success")
    } catch (error) {
      console.error("Error creating service:", error)
      showToast("Erro ao criar serviço. Tente novamente.", "error")
    }
  }

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

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Nome do Serviço"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte de Cabelo"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Duração (min)"
                    type="number"
                    id="duration"
                    name="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    required
                  />

                  <Input
                    label="Preço (R$)"
                    type="number"
                    id="price"
                    name="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
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

              {loading ? (
                <p className="text-center text-sm text-zinc-500">Carregando...</p>
              ) : (
                <ul className="space-y-3">
                  {services.map((service) => (
                    <ServiceItem key={service._id} service={service} />
                  ))}
                </ul>
              )}

              {!loading && services.length === 0 && (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-sm">Nenhum serviço cadastrado.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      {ToastComponent}
    </div>
  )
}
