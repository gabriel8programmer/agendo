"use client"

import { useEffect, useMemo, useState } from "react"
import { FaClock, FaPlus, FaUserTie, FaWrench, FaTimes, FaCheck, FaPhone } from "react-icons/fa"
import Header from "@/components/ui/Header"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit Modal State
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [editForm, setEditForm] = useState<FormState>(INITIAL_FORM)
  const [savingEdit, setSavingEdit] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingProfessional) {
        setEditingProfessional(null)
        setEditForm(INITIAL_FORM)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editingProfessional])

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

  const handleOpenEdit = (professional: Professional) => {
    setEditingProfessional(professional)
    setEditForm({
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

  const handleCloseEdit = () => {
    setEditingProfessional(null)
    setEditForm(INITIAL_FORM)
  }

  const handleToggleEditWorkDay = (day: number) => {
    setEditForm((prev) => {
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

  const handleToggleEditService = (serviceId: string) => {
    setEditForm((prev) => {
      const exists = prev.serviceIds.includes(serviceId)
      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      }
    })
  }

  const handleToggleStatus = async (professional: Professional) => {
    if (!user?.id) return

    try {
      const updated = await updateProfessional(professional.id, {
        userId: user.id,
        isActive: !professional.isActive,
      })
      setProfessionals((prev) => prev.map((item) => (item.id === professional.id ? updated : item)))
      showToast(
        updated.isActive ? "Profissional ativado com sucesso." : "Profissional desativado.",
        "success"
      )
    } catch (error) {
      console.error("Erro ao alterar status do profissional:", error)
      showToast("Não foi possível alterar o status do profissional.", "error")
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
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
      resetForm()
    } catch (error) {
      console.error("Erro ao cadastrar profissional:", error)
      showToast(error instanceof Error ? error.message : "Erro ao cadastrar profissional.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !editingProfessional) return

    if (!editForm.name.trim()) {
      showToast("Informe o nome do profissional.", "error")
      return
    }

    if (editForm.availability.workDays.length === 0) {
      showToast("Selecione ao menos um dia de atendimento.", "error")
      return
    }

    setSavingEdit(true)
    try {
      const updated = await updateProfessional(editingProfessional.id, {
        userId: user.id,
        name: editForm.name.trim(),
        whatsapp: editForm.whatsapp.trim(),
        isActive: editForm.isActive,
        serviceIds: editForm.serviceIds,
        availability: editForm.availability,
      })

      setProfessionals((prev) =>
        prev.map((item) => (item.id === editingProfessional.id ? updated : item))
      )
      showToast("Profissional atualizado com sucesso.", "success")
      handleCloseEdit()
    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      showToast(error instanceof Error ? error.message : "Erro ao salvar profissional.", "error")
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Equipe</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Profissionais
          </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Formulário */}
          <div className="md:col-span-5">
            <Card className="sticky top-24 p-6 md:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FaPlus size={12} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Novo Profissional
                </h2>
              </div>

              <form className="space-y-6" onSubmit={handleCreateSubmit}>
                <Input
                  label="Nome Completo"
                  id="professionalName"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Carlos Oliveira"
                  required
                />

                <Input
                  label="WhatsApp (opcional)"
                  id="professionalWhatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />

                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Serviços Habilitados
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {services.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Nenhum serviço disponível
                        </p>
                      </div>
                    ) : (
                      services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleToggleService(service.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                            form.serviceIds.includes(service.id)
                              ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-background hover:border-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`text-sm font-bold ${form.serviceIds.includes(service.id) ? "text-primary" : "text-foreground"}`}
                          >
                            {service.name}
                          </span>
                          {form.serviceIds.includes(service.id) && (
                            <FaCheck className="text-primary" size={12} />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-[2rem] border border-border bg-muted/30 p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <FaClock size={12} className="text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-wider">
                      Expediente Padrão
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Início"
                      type="time"
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
                      value={form.availability.endTime}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          availability: { ...prev.availability, endTime: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Dias de Atendimento
                    </p>
                    <div className="flex justify-between gap-1">
                      {DAYS.map((day) => {
                        const isSelected = form.availability.workDays.includes(day.value)
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleToggleWorkDay(day.value)}
                            className={`flex flex-1 h-9 cursor-pointer items-center justify-center rounded-xl border text-[10px] font-black transition-all ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "border-border bg-background text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" className="h-12 w-full text-base" disabled={saving}>
                    {saving ? "Adicionando..." : "Adicionar Profissional"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Lista */}
          <div className="md:col-span-7">
            <Card className="p-6 md:p-8">
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FaUserTie size={14} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Equipe Cadastrada
                </h2>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : sortedProfessionals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <div className="mb-4 rounded-full bg-muted p-4 opacity-50">
                    <FaUserTie size={32} />
                  </div>
                  <p className="text-sm font-bold">Nenhum profissional cadastrado.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {sortedProfessionals.map((professional) => {
                    const linkedServices = services.filter((service) =>
                      professional.serviceIds.includes(service.id)
                    )

                    return (
                      <li
                        key={professional.id}
                        className={`group rounded-[1.75rem] border p-5 transition-all ${
                          professional.isActive
                            ? "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                            : "border-transparent bg-muted/20 opacity-70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg ${
                                professional.isActive
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {professional.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-foreground">{professional.name}</h3>
                                {!professional.isActive && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                                    Inativo
                                  </span>
                                )}
                              </div>
                              {professional.whatsapp && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                  <FaPhone size={10} className="text-primary/50" />
                                  {professional.whatsapp}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(professional)}
                              className="flex-1 sm:flex-none h-10 px-4 cursor-pointer rounded-xl bg-accent text-accent-foreground text-xs font-black transition-all hover:bg-accent/80 active:scale-95"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleStatus(professional)}
                              className={`flex-1 sm:flex-none h-10 px-4 cursor-pointer rounded-xl text-xs font-black transition-all active:scale-95 ${
                                professional.isActive
                                  ? "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                                  : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                              }`}
                            >
                              {professional.isActive ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/50">
                          {linkedServices.length > 0 ? (
                            linkedServices.map((service) => (
                              <span
                                key={service.id}
                                className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight"
                              >
                                <FaWrench size={8} />
                                {service.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase italic">
                              Sem serviços vinculados
                            </span>
                          )}
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
      {/* Modal de Edição de Profissional */}
      {editingProfessional && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-professional-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEdit()
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
        >
          <Card className="w-full max-w-lg max-h-[90vh] flex flex-col border border-border p-6 md:p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  Editar Profissional
                </p>
                <h3
                  id="edit-professional-title"
                  className="mt-0.5 text-xl font-black text-foreground truncate max-w-[240px] sm:max-w-sm"
                >
                  {editingProfessional.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                aria-label="Fechar modal"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 flex-1 overflow-y-auto pr-1 space-y-6">
              <Input
                label="Nome Completo"
                id="editProfessionalName"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Carlos Oliveira"
                required
              />

              <Input
                label="WhatsApp (opcional)"
                id="editProfessionalWhatsapp"
                value={editForm.whatsapp}
                onChange={(e) => setEditForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(11) 99999-9999"
              />

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Serviços Habilitados
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {services.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Nenhum serviço disponível
                      </p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleToggleEditService(service.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                          editForm.serviceIds.includes(service.id)
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-background hover:border-muted-foreground/30"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            editForm.serviceIds.includes(service.id)
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {service.name}
                        </span>
                        {editForm.serviceIds.includes(service.id) && (
                          <FaCheck className="text-primary" size={12} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-[2rem] border border-border bg-muted/30 p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <FaClock size={12} className="text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    Expediente Padrão
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Início"
                    type="time"
                    value={editForm.availability.startTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        availability: { ...prev.availability, startTime: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Término"
                    type="time"
                    value={editForm.availability.endTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        availability: { ...prev.availability, endTime: e.target.value },
                      }))
                    }
                  />
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Dias de Atendimento
                  </p>
                  <div className="flex justify-between gap-1">
                    {DAYS.map((day) => {
                      const isSelected = editForm.availability.workDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleToggleEditWorkDay(day.value)}
                          className={`flex flex-1 h-9 cursor-pointer items-center justify-center rounded-xl border text-[10px] font-black transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="h-12 w-full text-base" disabled={savingEdit}>
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-full"
                  onClick={handleCloseEdit}
                  disabled={savingEdit}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {ToastComponent}
    </div>
  )
}
