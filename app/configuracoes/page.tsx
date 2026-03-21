"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import PageHeader from "@/components/ui/PageHeader"
import { FaStore, FaClock, FaHistory, FaSave, FaPlus, FaTrash, FaCoffee } from "react-icons/fa"
import { getAvailability, updateAvailability, getUserBySlug } from "@/lib/api"
import { Availability, User } from "@/types"
import { useToast } from "@/components/ui/Toast"

const DAYS_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"]

export default function SettingsPage() {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const userId = "user-1"

  useEffect(() => {
    async function loadSettings() {
      try {
        const [availabilityData, userData] = await Promise.all([
          getAvailability(userId),
          getUserBySlug("barbearia-do-joao"),
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

  const handleToggleDay = (dayIndex: number) => {
    if (!availability) return
    let newWorkDays = [...(availability.workDays || [])]
    
    if (newWorkDays.includes(dayIndex)) {
      newWorkDays = newWorkDays.filter(d => d !== dayIndex)
    } else {
      newWorkDays.push(dayIndex)
    }

    setAvailability({
      ...availability,
      workDays: newWorkDays.sort((a, b) => a - b),
    })
  }

  const handleAddReserved = () => {
    if (!availability) return
    const newReserved = [...(availability.reservedIntervals || [])]
    newReserved.push({ startTime: "12:00", endTime: "13:00" })
    setAvailability({ ...availability, reservedIntervals: newReserved })
  }

  const handleRemoveReserved = (index: number) => {
    if (!availability || !availability.reservedIntervals) return
    const newReserved = [...availability.reservedIntervals]
    newReserved.splice(index, 1)
    setAvailability({ ...availability, reservedIntervals: newReserved })
  }

  const handleReservedChange = (index: number, field: "startTime" | "endTime", value: string) => {
    if (!availability || !availability.reservedIntervals) return
    const newReserved = [...availability.reservedIntervals]
    newReserved[index][field] = value
    setAvailability({ ...availability, reservedIntervals: newReserved })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!availability) return

    setSaving(true)
    try {
      await updateAvailability(availability.id, {
        workDays: availability.workDays || [],
        slotDuration: availability.slotDuration,
        startTime: availability.startTime,
        endTime: availability.endTime,
        reservedIntervals: availability.reservedIntervals || [],
      })
      showToast("Configurações salvas com sucesso!", "success")
    } catch (error) {
      console.error("Error updating settings:", error)
      showToast("Erro ao salvar configurações.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-sans text-center p-8">
        <p className="text-zinc-500 text-sm">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <PageHeader label="Configuração" title="Minha Agenda" />

        <div className="space-y-6">
          {/* Informações do Negócio */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaStore size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Informações do Negócio</h2>
            </div>
            <Input
              label="Nome do Negócio"
              id="businessName"
              name="businessName"
              defaultValue={user?.name || ""}
              disabled
            />
          </Card>

          {/* Dias de Atendimento */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaClock size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Dias de Atendimento</h2>
            </div>
            <div className="flex justify-between gap-1">
              {DAYS_INITIALS.map((initial, index) => {
                const isActive = availability?.workDays?.includes(index) ?? false

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleToggleDay(index)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                        : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-300 shadow-sm"
                    }`}
                  >
                    {initial}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Horário de Expediente Global */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaClock size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Horário de Expediente</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Início"
                type="time"
                value={availability?.startTime || "09:00"}
                onChange={(e) => setAvailability(prev => prev ? ({ ...prev, startTime: e.target.value }) : null)}
              />
              <Input
                label="Término"
                type="time"
                value={availability?.endTime || "18:00"}
                onChange={(e) => setAvailability(prev => prev ? ({ ...prev, endTime: e.target.value }) : null)}
              />
            </div>
          </Card>

          {/* Horários Reservados */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2 text-zinc-900">
                <FaCoffee size={14} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Horários Reservados</h2>
              </div>
              <button
                type="button"
                onClick={handleAddReserved}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
              >
                <FaPlus size={8} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {availability?.reservedIntervals && availability.reservedIntervals.length > 0 ? (
                availability.reservedIntervals.map((interval, idx) => (
                  <div key={idx} className="flex items-end gap-3 group">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <Input
                        type="time"
                        value={interval.startTime}
                        onChange={(e) => handleReservedChange(idx, "startTime", e.target.value)}
                      />
                      <Input
                        type="time"
                        value={interval.endTime}
                        onChange={(e) => handleReservedChange(idx, "endTime", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReserved(idx)}
                      className="mb-2 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic bg-zinc-50 p-4 rounded-xl text-center border border-dashed border-zinc-200">
                  Nenhum horário reservado (pausa) configurado.
                </p>
              )}
            </div>
          </Card>

          {/* Duração dos Slots */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaHistory size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Configuração de Agenda</h2>
            </div>
            <Input
              label="Duração de cada agendamento (minutos)"
              type="number"
              value={availability?.slotDuration || 30}
              onChange={(e) => setAvailability(prev => prev ? ({ ...prev, slotDuration: Number(e.target.value) }) : null)}
              min="5"
              step="5"
            />
          </Card>

          {/* Salvar */}
          <Button onClick={handleSubmit} className="w-full py-4 text-base" disabled={saving}>
            {saving ? "Salvando..." : (
              <>
                <FaSave size={16} />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        <footer className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 pb-8">
          Powered by Agendo
        </footer>
      </main>
      {ToastComponent}
    </div>
  )
}
