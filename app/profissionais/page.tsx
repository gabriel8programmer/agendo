"use client"

import { useEffect, useMemo, useState } from "react"
import { FaClock, FaPlus, FaUserTie, FaWrench } from "react-icons/fa"
import Header from "@/components/ui/Header"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { useAuth } from "@/components/providers/AuthProvider"
import { createProfessional, getProfessionals, getServices, updateProfessional } from "@/lib/api"
import { Professional, Service } from "@/types"
import { useToast } from "@/components/ui/Toast"

const DAYS = [
  { value: 0, label: "D" },
  { value: 1, label: "S" },
  { value: 2, label: "T" },
  { value: 3, label: "Q" },
  { value: 4, label: "Q" },
  { value: 5, label: "S" },
  { value: 6, label: "S" },
]

const DEFAULT_AVAILABILITY: Professional["availability"] = {
  slotDuration: 30,
  startTime: "09:00",
  endTime: "18:00",
  workDays: [1, 2, 3, 4, 5],
  reservedIntervals: [],
}

type FormState = {
  name: string
  whatsapp: string
  isActive: boolean
  serviceIds: string[]
  availability: Professional["availability"]
}

const INITIAL_FORM: FormState = {
  name: "",
  whatsapp: "",
  isActive: true,
  serviceIds: [],
  availability: DEFAULT_AVAILABILITY,
}

export default function ProfessionalsPage() {
  const { user, loading: authLoading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      setServices([])
      setProfessionals([])
      setLoading(false)
      return
    }
    const userId = user.id

    async function loadData() {
      setLoading(true)
      try {
        const [servicesData, professionalsData] = await Promise.all([
          getServices(userId),
          getProfessionals(userId),
        ])
        setServices(servicesData)
        setProfessionals(professionalsData)
      } catch (error) {
        console.error("Erro ao carregar profissionais:", error)
        showToast("Erro ao carregar profissionais.", "error")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, user?.id, showToast])

  const sortedProfessionals = useMemo(
    () => [...professionals].sort((a, b) => a.name.localeCompare(b.name)),
    [professionals]
  )

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
  }

  const handleToggleWorkDay = (day: number) => {
    setForm((prev) => {
      const exists = prev.availability.workDays.includes(day)
      const nextDays = exists
        ? prev.availability.workDays.filter((d) => d !== day)
        : [...prev.availability.workDays, day].sort((a, b) => a - b)
      return {
        ...prev,
        availability: {
          ...prev.availability,
          workDays: nextDays,
        },
      }
    })
  }

  const handleToggleService = (serviceId: string) => {
    setForm((prev) => {
      const exists = prev.serviceIds.includes(serviceId)
      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      }
    })
  }

  const handleEdit = (professional: Professional) => {
    setEditingId(professional.id)
    setForm({
      name: professional.name,
      whatsapp: professional.whatsapp || "",
      isActive: professional.isActive,
      serviceIds: professional.serviceIds || [],
      availability: {
        ...DEFAULT_AVAILABILITY,
        ...professional.availability,
      },
    })
  }

  const handleToggleStatus = async (professional: Professional) => {
    if (!user?.id) return

    try {
      const updated = await updateProfessional(professional.id, {
        userId: user.id,
        isActive: !professional.isActive,
      })
      setProfessionals((prev) =>
        prev.map((item) => (item.id === professional.id ? updated : item))
      )
      showToast(
        updated.isActive ? "Profissional ativado com sucesso." : "Profissional desativado.",
        "success"
      )
    } catch (error) {
      console.error("Erro ao alterar status do profissional:", error)
      showToast("Não foi possível alterar o status do profissional.", "error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    if (!form.name.trim()) {
      showToast("Informe o nome do profissional.", "error")
      return
    }

    if (form.availability.workDays.length === 0) {
      showToast("Selecione ao menos um dia de atendimento.", "error")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateProfessional(editingId, {
          userId: user.id,
          name: form.name.trim(),
          whatsapp: form.whatsapp.trim(),
          isActive: form.isActive,
          serviceIds: form.serviceIds,
          availability: form.availability,
        })

        setProfessionals((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
        showToast("Profissional atualizado com sucesso.", "success")
      } else {
        const created = await createProfessional({
          userId: user.id,
          name: form.name.trim(),
          whatsapp: form.whatsapp.trim(),
          isActive: form.isActive,
          serviceIds: form.serviceIds,
          availability: form.availability,
        })
        setProfessionals((prev) => [created, ...prev])
        showToast("Profissional cadastrado com sucesso.", "success")
      }

      resetForm()
    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      showToast(error instanceof Error ? error.message : "Erro ao salvar profissional.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <PageHeader label="Configuração" title="Profissionais" />

        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4 text-zinc-900">
                <FaPlus size={14} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {editingId ? "Editar profissional" : "Novo profissional"}
                </h2>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Nome do profissional"
                  id="professionalName"
                  name="professionalName"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João"
                  required
                />

                <Input
                  label="WhatsApp (opcional)"
                  id="professionalWhatsapp"
                  name="professionalWhatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="+55 (11) 91234-5678"
                />

                <div className="space-y-2">
                  <p className="block text-sm font-semibold text-zinc-600">Serviços que realiza</p>
                  {services.length === 0 ? (
                    <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                      Cadastre serviços para vinculá-los aos profissionais.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((service) => (
                        <label
                          key={service.id}
                          className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={form.serviceIds.includes(service.id)}
                            onChange={() => handleToggleService(service.id)}
                            className="h-4 w-4"
                          />
                          {service.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <Card className="border border-zinc-200 p-4 shadow-none">
                  <div className="mb-3 flex items-center gap-2 text-zinc-800">
                    <FaClock size={12} />
                    <p className="text-xs font-bold uppercase tracking-wider">Disponibilidade</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Início"
                        type="time"
                        className="theme-time-field"
                        value={form.availability.startTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            availability: { ...prev.availability, startTime: e.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Término"
                        type="time"
                        className="theme-time-field"
                        value={form.availability.endTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            availability: { ...prev.availability, endTime: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Input
                      label="Duração padrão (min)"
                      type="number"
                      min={5}
                      step={5}
                      value={String(form.availability.slotDuration)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          availability: {
                            ...prev.availability,
                            slotDuration: Number(e.target.value || 30),
                          },
                        }))
                      }
                    />
                    <div>
                      <p className="mb-2 block text-sm font-semibold text-zinc-600">Dias de atendimento</p>
                      <div className="flex gap-2">
                        {DAYS.map((day) => {
                          const selected = form.availability.workDays.includes(day.value)
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleToggleWorkDay(day.value)}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold ${
                                selected
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-200 bg-white text-zinc-500"
                              }`}
                            >
                              {day.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Profissional ativo
                </label>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar profissional"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>
                      Cancelar edição
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          <div className="md:col-span-7">
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4 text-zinc-900">
                <FaUserTie size={14} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Profissionais cadastrados</h2>
              </div>

              {loading ? (
                <p className="text-center text-sm text-zinc-500">Carregando...</p>
              ) : sortedProfessionals.length === 0 ? (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                  Nenhum profissional cadastrado ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedProfessionals.map((professional) => {
                    const linkedServices = services.filter((service) =>
                      professional.serviceIds.includes(service.id)
                    )

                    return (
                      <li
                        key={professional.id}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">{professional.name}</p>
                            <p className="text-xs text-zinc-500">
                              {professional.isActive ? "Ativo" : "Inativo"}
                              {professional.whatsapp ? ` • ${professional.whatsapp}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                              onClick={() => handleEdit(professional)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                              onClick={() => handleToggleStatus(professional)}
                            >
                              {professional.isActive ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                          <FaWrench className="text-zinc-400" />
                          {linkedServices.length > 0
                            ? linkedServices.map((service) => service.name).join(", ")
                            : "Sem serviços vinculados"}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </main>
      {ToastComponent}
    </div>
  )
}
