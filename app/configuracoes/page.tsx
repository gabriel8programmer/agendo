"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import BrandLogo from "@/components/ui/BrandLogo"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  FaStore,
  FaClock,
  FaHistory,
  FaSave,
  FaPlus,
  FaTrash,
  FaCoffee,
  FaExclamationTriangle,
  FaLink,
} from "react-icons/fa"
import {
  getAvailability,
  updateAvailability,
  upsertAvailabilityByUser,
  updateCurrentUserProfile,
} from "@/lib/api"
import { normalizeTime24BR } from "@/lib/utils/date"
import { Availability } from "@/types"
import { useToast } from "@/components/ui/Toast"

const DAYS_INITIALS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function SettingsPage() {
  const { user: authUser, loading: authLoading, refreshUser } = useAuth()
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [personName, setPersonName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [businessSlug, setBusinessSlug] = useState("")
  const [slugLocked, setSlugLocked] = useState(false)
  const [loadedUserId, setLoadedUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const hasSavedAvailability =
    !!availability &&
    typeof availability.id === "string" &&
    availability.id.trim() !== "" &&
    availability.id !== "undefined" &&
    availability.id !== "null"

  useEffect(() => {
    if (authLoading) return

    if (!authUser?.id) {
      setAvailability(null)
      setPersonName("")
      setCompanyName("")
      setBusinessSlug("")
      setSlugLocked(false)
      setLoadedUserId("")
      setLoading(false)
      return
    }
    const currentUser = authUser
    const userId = authUser.id

    async function loadSettings() {
      setLoading(true)
      try {
        const availabilityData = await getAvailability(userId)
        setAvailability(
          availabilityData || {
            id: "",
            userId,
            slotDuration: 30,
            startTime: "09:00",
            endTime: "18:00",
            workDays: [1, 2, 3, 4, 5],
            reservedIntervals: [],
          }
        )
        if (loadedUserId !== userId) {
          setPersonName(currentUser.name || "")
          setCompanyName(currentUser.companyName || currentUser.name || "")
          setBusinessSlug(currentUser.slug || "")
          setSlugLocked(Boolean(currentUser.slugLocked))
          setLoadedUserId(userId)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [authLoading, authUser, loadedUserId])

  const handleToggleDay = (dayIndex: number) => {
    if (!availability) return
    let newWorkDays = [...(availability.workDays || [])]

    if (newWorkDays.includes(dayIndex)) {
      newWorkDays = newWorkDays.filter((d) => d !== dayIndex)
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
    if (!availability || !authUser?.id) return
    const userId = authUser.id
    const availabilityId =
      availability.id || (availability as Availability & { _id?: string })._id || ""
    const normalizedAvailabilityId = String(availabilityId).trim()
    const hasValidId =
      normalizedAvailabilityId !== "" &&
      normalizedAvailabilityId !== "undefined" &&
      normalizedAvailabilityId !== "null"
    const sanitizedSlug = businessSlug.trim()
    const sanitizedCompanyName = companyName.trim()
    const sanitizedPersonName = personName.trim()

    if (!sanitizedPersonName || !sanitizedCompanyName || !sanitizedSlug) {
      showToast("Preencha todos os campos obrigatórios.", "error")
      return
    }

    setSaving(true)
    try {
      const profileResponse = await updateCurrentUserProfile({
        name: sanitizedPersonName,
        companyName: sanitizedCompanyName,
        slug: sanitizedSlug,
      })
      setPersonName(profileResponse.user.name || sanitizedPersonName)
      setCompanyName(profileResponse.user.companyName || sanitizedCompanyName)
      setBusinessSlug(profileResponse.user.slug || sanitizedSlug)
      setSlugLocked(Boolean(profileResponse.user.slugLocked))
      setLoadedUserId(userId)
      await refreshUser()

      const payload = {
        workDays: availability.workDays || [],
        slotDuration: availability.slotDuration,
        startTime: normalizeTime24BR(availability.startTime),
        endTime: normalizeTime24BR(availability.endTime),
        reservedIntervals: (availability.reservedIntervals || []).map((i) => ({
          startTime: normalizeTime24BR(i.startTime),
          endTime: normalizeTime24BR(i.endTime),
        })),
      }

      const updatedAvailability = hasValidId
        ? await updateAvailability(normalizedAvailabilityId, payload)
        : await upsertAvailabilityByUser(userId, payload)

      setAvailability((prev) =>
        prev
          ? {
              ...prev,
              ...updatedAvailability,
              id: updatedAvailability.id || prev.id,
            }
          : updatedAvailability
      )
      showToast("Configurações salvas com sucesso!", "success")
    } catch (error) {
      console.error("Error updating settings:", error)
      showToast(error instanceof Error ? error.message : "Erro ao salvar configurações.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-bold text-sm">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Painel</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Configurações
          </h1>
        </header>

        <div className="space-y-8">
          {!hasSavedAvailability && (
            <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <FaExclamationTriangle size={24} aria-hidden />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Complete sua configuração
                  </h3>
                  <p className="mt-1 text-[15px] font-medium text-muted-foreground leading-relaxed">
                    Seus clientes só poderão agendar horários após você definir os dias e horários de atendimento abaixo.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Perfil e Negócio */}
          <Card className="p-6 md:p-8">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FaStore size={14} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Perfil do Negócio</h2>
            </div>
            
            <div className="space-y-6">
              <Input
                label="Nome Profissional"
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Seu nome completo"
              />
              
              <Input
                label="Nome do Estabelecimento"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Barbearia do João"
              />

              <div className="space-y-2">
                <Input
                  label="Seu Link Exclusivo"
                  id="businessSlug"
                  value={businessSlug}
                  onChange={(e) => setBusinessSlug(e.target.value)}
                  disabled={slugLocked}
                  placeholder="ex: barbearia-joao"
                />
                <div className="flex items-center gap-2 px-1 text-[11px] font-bold">
                  <FaLink size={10} className="text-primary" />
                  <span className="text-muted-foreground">URL Pública:</span>
                  <span className="text-foreground">agendo.me/{businessSlug || "seu-link"}</span>
                </div>
                {slugLocked && (
                  <p className="mt-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                    O link foi bloqueado para garantir a integridade dos seus compartilhamentos.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Horários e Dias */}
          <Card className="p-6 md:p-8">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FaClock size={14} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Expediente e Agenda</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dias de Atendimento</p>
                <div className="flex justify-between gap-1 sm:gap-2">
                  {DAYS_INITIALS.map((day, index) => {
                    const isActive = availability?.workDays?.includes(index) ?? false
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleToggleDay(index)}
                        className={`flex flex-1 h-11 cursor-pointer items-center justify-center rounded-xl border text-xs font-black transition-all ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Início do Expediente"
                  type="time"
                  value={availability?.startTime || "09:00"}
                  onChange={(e) =>
                    setAvailability((prev) => (prev ? { ...prev, startTime: e.target.value } : null))
                  }
                />
                <Input
                  label="Término do Expediente"
                  type="time"
                  value={availability?.endTime || "18:00"}
                  onChange={(e) =>
                    setAvailability((prev) => (prev ? { ...prev, endTime: e.target.value } : null))
                  }
                />
              </div>

              <Input
                label="Intervalo entre horários (minutos)"
                type="number"
                value={availability?.slotDuration || 30}
                onChange={(e) =>
                  setAvailability((prev) =>
                    prev ? { ...prev, slotDuration: Number(e.target.value) } : null
                  )
                }
                min="5"
                step="5"
                placeholder="Ex: 30"
              />
            </div>
          </Card>

          {/* Intervalos e Pausas */}
          <Card className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FaCoffee size={14} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Pausas e Intervalos</h2>
              </div>
              <button
                type="button"
                onClick={handleAddReserved}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-accent-foreground transition-all hover:bg-primary hover:text-white"
              >
                <FaPlus size={8} /> Adicionar
              </button>
            </div>
            
            <p className="mb-6 text-xs font-medium text-muted-foreground leading-relaxed">
              Bloqueie horários específicos em que você não realiza atendimentos, como horário de almoço ou pausas pessoais.
            </p>

            <div className="space-y-4">
              {availability?.reservedIntervals && availability.reservedIntervals.length > 0 ? (
                availability.reservedIntervals.map((interval, idx) => (
                  <div key={idx} className="flex items-end gap-3 animate-in fade-in slide-in-from-right-2">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Input
                        label="Saída"
                        type="time"
                        value={interval.startTime}
                        onChange={(e) => handleReservedChange(idx, "startTime", e.target.value)}
                      />
                      <Input
                        label="Retorno"
                        type="time"
                        value={interval.endTime}
                        onChange={(e) => handleReservedChange(idx, "endTime", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReserved(idx)}
                      className="mb-0.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all hover:bg-destructive hover:text-white active:scale-95"
                      aria-label="Remover pausa"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border p-8 text-center">
                  <div className="mb-2 text-muted-foreground/30">
                    <FaCoffee size={24} />
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nenhuma pausa configurada</p>
                </div>
              )}
            </div>
          </Card>

          <div className="pt-4">
            <Button onClick={handleSubmit} className="h-14 w-full text-base font-black shadow-xl shadow-primary/20" disabled={saving}>
              {saving ? (
                "Salvando..."
              ) : (
                <>
                  <FaSave size={18} />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>

        <footer className="mt-16 mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-muted p-4 opacity-50 ring-1 ring-border">
              <BrandLogo width={80} height={24} className="h-6 w-auto grayscale" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              © 2026 Agendo.me
            </p>
          </div>
        </footer>
      </main>
      {ToastComponent}
    </div>
  )
}
