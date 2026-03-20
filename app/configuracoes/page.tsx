"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import PageHeader from "@/components/ui/PageHeader"
import { FaStore, FaClock, FaHistory, FaSave } from "react-icons/fa"
import { getAvailability, updateAvailability, getUserBySlug } from "@/lib/api"
import { Availability, User } from "@/types"

export default function SettingsPage() {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const userId = "user-1"

  useEffect(() => {
    async function loadSettings() {
      try {
        const [availabilityData, userData] = await Promise.all([
          getAvailability(userId),
          getUserBySlug("barbearia-do-joao"), // Mocked slug
        ])
        setAvailability(availabilityData)
        setUser(userData)
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!availability) return

    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const slotDuration = Number(formData.get("slotDuration"))

    try {
      await updateAvailability(availability.id, {
        startTime,
        endTime,
        slotDuration,
      })
      alert("Configurações salvas com sucesso!")
    } catch (error) {
      console.error("Error updating settings:", error)
      alert("Erro ao salvar configurações.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-sans">
        <Header />
        <main className="mx-auto max-w-2xl p-4 md:p-8">
          <p className="text-center text-sm text-zinc-500">Carregando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <PageHeader label="Configuração" title="Configurações Gerais" />

        <form className="space-y-6" onSubmit={handleSubmit}>
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
                defaultValue={user?.name || ""}
                disabled
              />
              <p className="text-[10px] text-zinc-400 italic">* Nome do negócio não pode ser alterado nesta versão.</p>
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
                defaultValue={availability?.startTime || "09:00"}
                required
              />

              <Input
                label="Horário Final"
                type="time"
                id="endTime"
                name="endTime"
                defaultValue={availability?.endTime || "18:00"}
                required
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
                defaultValue={availability?.slotDuration.toString() || "30"}
                min="5"
                step="5"
                required
              />
              <span className="mb-3 text-sm font-medium text-zinc-500 whitespace-nowrap">
                minutos
              </span>
            </div>
          </Card>

          {/* Botão Salvar */}
          <div className="pt-2">
            <Button type="submit" className="w-full py-4 text-base" disabled={saving}>
              {saving ? "Salvando..." : (
                <>
                  <FaSave size={16} />
                  Salvar Configurações
                </>
              )}
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
