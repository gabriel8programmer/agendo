"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import PageHeader from "@/components/ui/PageHeader"
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

const DAYS_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"]

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
      showToast("Preencha nome, nome da empresa e slug.", "error")
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
          {!hasSavedAvailability && (
            <Card className="border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="mt-0.5 text-amber-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Primeiro passo: salve sua configuração inicial
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Seus agendamentos só serão liberados depois que você salvar os dias e horários
                    desta página.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Informações do Negócio */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaStore size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Informações do Negócio</h2>
            </div>
            <Input
              label="Nome da Pessoa"
              id="personName"
              name="personName"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
            <div className="mt-4">
              <Input
                label="Nome da Empresa"
                id="companyName"
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Slug do Negócio (URL)"
                id="businessSlug"
                name="businessSlug"
                value={businessSlug}
                onChange={(e) => setBusinessSlug(e.target.value)}
                disabled={slugLocked}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {slugLocked
                  ? "Slug já definido e bloqueado para novas alterações."
                  : "Você pode definir o slug uma única vez."}
              </p>
            </div>
          </Card>

          {/* Dias de Atendimento */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
              <FaClock size={14} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Dias de Atendimento</h2>
            </div>
            <div className="flex gap-2">
              {DAYS_INITIALS.map((initial, index) => {
                const isActive = availability?.workDays?.includes(index) ?? false

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleToggleDay(index)}
                    className={`flex flex-1 h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
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
                step={60}
                value={availability?.startTime || "09:00"}
                onChange={(e) =>
                  setAvailability((prev) => (prev ? { ...prev, startTime: e.target.value } : null))
                }
              />
              <Input
                label="Término"
                type="time"
                step={60}
                value={availability?.endTime || "18:00"}
                onChange={(e) =>
                  setAvailability((prev) => (prev ? { ...prev, endTime: e.target.value } : null))
                }
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
            <p className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Use este espaço para bloquear períodos em que você não atende, como almoço, pausa
              entre turnos ou compromissos pessoais.
            </p>

            <div className="space-y-3">
              {availability?.reservedIntervals && availability.reservedIntervals.length > 0 ? (
                availability.reservedIntervals.map((interval, idx) => (
                  <div key={idx} className="flex items-end gap-3 group">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <Input
                        type="time"
                        step={60}
                        value={interval.startTime}
                        onChange={(e) => handleReservedChange(idx, "startTime", e.target.value)}
                      />
                      <Input
                        type="time"
                        step={60}
                        value={interval.endTime}
                        onChange={(e) => handleReservedChange(idx, "endTime", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReserved(idx)}
                      className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
                      aria-label="Remover horário reservado"
                    >
                      <FaTrash size={16} />
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
              onChange={(e) =>
                setAvailability((prev) =>
                  prev ? { ...prev, slotDuration: Number(e.target.value) } : null
                )
              }
              min="5"
              step="5"
            />
          </Card>

          {/* Salvar */}
          <Button onClick={handleSubmit} className="w-full py-4 text-base" disabled={saving}>
            {saving ? (
              "Salvando..."
            ) : (
              <>
                <FaSave size={16} />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        <footer className="mt-12 pb-8">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center">
            <Image src="/logo.svg" alt="Agendo" width={72} height={22} className="h-5 w-auto" />
            <p className="text-xs text-zinc-500">Seu negócio organizado, cliente bem atendido.</p>
          </div>
        </footer>
      </main>
      {ToastComponent}
    </div>
  )
}
