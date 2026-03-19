// app/configuracoes/page.tsx
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"
import PageHeader from "@/components/ui/PageHeader"
import { FaStore, FaClock, FaHistory, FaSave } from "react-icons/fa"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <PageHeader label="Configuração" title="Configurações Gerais" />

        <form className="space-y-6">
          {/* Informações do Negócio */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaStore size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Informações do Negócio</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Nome do Negócio"
                id="businessName"
                name="businessName"
                placeholder="Minha Barbearia"
                defaultValue="Barbearia do João"
              />

              <Textarea
                label="Descrição (opcional)"
                id="description"
                name="description"
                rows={3}
                placeholder="Conte um pouco sobre seu negócio..."
              />
            </div>
          </Card>

          {/* Horário de Funcionamento */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaClock size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Horário de Funcionamento
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Horário Inicial"
                type="time"
                id="startTime"
                name="startTime"
                defaultValue="09:00"
              />

              <Input
                label="Horário Final"
                type="time"
                id="endTime"
                name="endTime"
                defaultValue="18:00"
              />
            </div>
          </Card>

          {/* Duração dos Slots */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaHistory size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Duração dos Slots</h2>
            </div>

            <div className="flex items-end gap-3">
              <Input
                label="Duração Padrão (minutos)"
                type="number"
                id="slotDuration"
                name="slotDuration"
                defaultValue="30"
                min="5"
                step="5"
              />
              <span className="mb-3 text-sm font-medium text-zinc-500 whitespace-nowrap">
                minutos
              </span>
            </div>
          </Card>

          {/* Botão Salvar */}
          <div className="pt-2">
            <Button type="submit" className="w-full py-4 text-base">
              <FaSave size={16} />
              Salvar Configurações
            </Button>
          </div>
        </form>

        <footer className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 pb-8">
          Powered by Agendo
        </footer>
      </main>
    </div>
  )
}
