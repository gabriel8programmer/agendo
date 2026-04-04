"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { useAuth } from "@/components/providers/AuthProvider"
import { FaClock, FaTag, FaPlus, FaList, FaTimes, FaPen, FaTrash } from "react-icons/fa"
import { getServices, createService, updateService, deleteServicesBulk } from "@/lib/api"
import { Service } from "@/types"
import { useToast } from "@/components/ui/Toast"

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1h" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2h" },
]

function getServiceId(service: Service) {
  return service.id || service._id || ""
}

function ServiceItem({
  service,
  onClick,
  selectionMode,
  selected,
}: {
  service: Service
  onClick: () => void
  selectionMode: boolean
  selected: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left shadow-sm border transition-all ${
          selectionMode
            ? selected
              ? "border-red-300 bg-red-50"
              : "border-zinc-200 bg-white"
            : "border-transparent bg-white hover:border-zinc-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {selectionMode && (
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${
                selected
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-zinc-300 bg-white text-transparent"
              }`}
            >
              ✓
            </div>
          )}
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
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-zinc-900">
            {service.price ? `R$ ${Number(service.price).toFixed(2).replace(".", ",")}` : "A combinar"}
          </p>
          {!selectionMode && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <FaPen size={9} />
              Editar
            </span>
          )}
        </div>
      </button>
    </li>
  )
}

export default function ServicosPage() {
  const { user, loading: authLoading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset")
  const [durationPreset, setDurationPreset] = useState("30")
  const [durationCustom, setDurationCustom] = useState("")
  const [price, setPrice] = useState("")
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editName, setEditName] = useState("")
  const [editDurationMode, setEditDurationMode] = useState<"preset" | "custom">("preset")
  const [editDurationPreset, setEditDurationPreset] = useState("30")
  const [editDurationCustom, setEditDurationCustom] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      setServices([])
      setLoading(false)
      return
    }
    const userId = user.id

    async function loadServices() {
      setLoading(true)
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
  }, [authLoading, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const durationValue = durationMode === "preset" ? durationPreset : durationCustom
    const parsedDuration = Number(durationValue)
    if (!name || !user?.id || !Number.isFinite(parsedDuration) || parsedDuration <= 0) return
    const userId = user.id

    try {
      const newService = await createService({
        userId,
        name,
        duration: parsedDuration,
        price: price ? Number(price) : undefined,
      })
      setServices((prev) => [...prev, newService])
      setName("")
      setDurationMode("preset")
      setDurationPreset("30")
      setDurationCustom("")
      setPrice("")
      showToast("Serviço cadastrado com sucesso!", "success")
    } catch (error) {
      console.error("Error creating service:", error)
      showToast("Erro ao criar serviço. Tente novamente.", "error")
    }
  }

  const handleOpenEdit = (service: Service) => {
    if (selectionMode) return
    setEditingService(service)
    setEditName(service.name || "")
    const durationAsString = String(service.duration || "")
    const hasPreset = DURATION_OPTIONS.some((option) => option.value === durationAsString)
    setEditDurationMode(hasPreset ? "preset" : "custom")
    setEditDurationPreset(hasPreset ? durationAsString : "30")
    setEditDurationCustom(hasPreset ? "" : durationAsString)
    setEditPrice(service.price !== undefined && service.price !== null ? String(service.price) : "")
  }

  const handleCloseEdit = () => {
    setEditingService(null)
    setEditName("")
    setEditDurationMode("preset")
    setEditDurationPreset("30")
    setEditDurationCustom("")
    setEditPrice("")
    setSavingEdit(false)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService?.id) return

    const sanitizedName = editName.trim()
    const durationValue = editDurationMode === "preset" ? editDurationPreset : editDurationCustom
    const sanitizedDuration = Number(durationValue)

    if (!sanitizedName) {
      showToast("Informe o nome do serviço.", "error")
      return
    }

    if (!Number.isFinite(sanitizedDuration) || sanitizedDuration <= 0) {
      showToast("Informe uma duração válida.", "error")
      return
    }

    const parsedPrice = editPrice.trim() === "" ? null : Number(editPrice)
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      showToast("Informe um preço válido.", "error")
      return
    }

    setSavingEdit(true)
    try {
      const updated = await updateService(editingService.id, {
        name: sanitizedName,
        duration: sanitizedDuration,
        price: parsedPrice,
      })

      setServices((prev) =>
        prev.map((service) => (service.id === editingService.id ? { ...service, ...updated } : service))
      )
      showToast("Serviço atualizado com sucesso!", "success")
      handleCloseEdit()
    } catch (error) {
      console.error("Error updating service:", error)
      showToast("Erro ao atualizar serviço. Tente novamente.", "error")
      setSavingEdit(false)
    }
  }

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => !prev)
    setSelectedServiceIds([])
  }

  const handleToggleServiceSelection = (service: Service) => {
    const serviceId = getServiceId(service)
    if (!serviceId) return

    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    )
  }

  const handleBulkDelete = async () => {
    if (!user?.id || selectedServiceIds.length === 0) return

    setDeleting(true)
    try {
      const result = await deleteServicesBulk({
        userId: user.id,
        ids: selectedServiceIds,
      })

      setServices((prev) =>
        prev.filter((service) => !selectedServiceIds.includes(getServiceId(service)))
      )
      setSelectedServiceIds([])
      setSelectionMode(false)
      setShowDeleteConfirmModal(false)
      showToast(`${result.deletedCount} serviço(s) removido(s) com sucesso.`, "success")
    } catch (error) {
      console.error("Error deleting services:", error)
      showToast("Erro ao remover serviços. Tente novamente.", "error")
    } finally {
      setDeleting(false)
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
                  <div className="w-full">
                    <label htmlFor="durationMode" className="mb-1 block text-sm font-semibold text-zinc-800">
                      Duração
                    </label>
                    <select
                      id="durationMode"
                      name="durationMode"
                      value={durationMode === "preset" ? durationPreset : "custom"}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "custom") {
                          setDurationMode("custom")
                        } else {
                          setDurationMode("preset")
                          setDurationPreset(value)
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value="custom">Personalizado (minutos)</option>
                    </select>
                  </div>

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
                {durationMode === "custom" && (
                  <Input
                    label="Duração personalizada (min)"
                    type="number"
                    id="durationCustom"
                    name="durationCustom"
                    value={durationCustom}
                    onChange={(e) => setDurationCustom(e.target.value)}
                    min="1"
                    placeholder="Ex: 75"
                    required
                  />
                )}

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
              <div className="mb-6 flex items-center justify-between gap-2 border-b border-zinc-100 pb-4 text-zinc-900">
                <div className="flex items-center gap-2">
                  <FaList size={14} className="text-zinc-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Serviços Cadastrados</h2>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSelectionMode}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    selectionMode
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  <FaTrash size={10} />
                  {selectionMode ? "Cancelar remoção" : "Remover serviços"}
                </button>
              </div>

              {selectionMode && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Selecione os serviços que deseja remover.
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-700">
                      {selectedServiceIds.length} serviço(s) selecionado(s)
                    </p>
                    <Button
                      type="button"
                      onClick={() => setShowDeleteConfirmModal(true)}
                      disabled={selectedServiceIds.length === 0 || deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? "Removendo..." : "Excluir selecionados"}
                    </Button>
                  </div>
                </div>
              )}

              {loading || authLoading ? (
                <p className="text-center text-sm text-zinc-500">Carregando...</p>
              ) : (
                <ul className="space-y-3">
                  {services.map((service) => (
                    <ServiceItem
                      key={service.id ?? service._id ?? `${service.name}-${service.duration}`}
                      service={service}
                      selectionMode={selectionMode}
                      selected={selectedServiceIds.includes(getServiceId(service))}
                      onClick={() =>
                        selectionMode ? handleToggleServiceSelection(service) : handleOpenEdit(service)
                      }
                    />
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

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Confirmar exclusão
                </p>
                <h3 className="text-lg font-bold text-zinc-900">Remover serviços selecionados?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                aria-label="Fechar modal de confirmação"
                disabled={deleting}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <p className="text-sm text-zinc-600">
              Esta ação irá remover{" "}
              <span className="font-semibold text-zinc-900">{selectedServiceIds.length}</span>{" "}
              serviço(s) e não poderá ser desfeita.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Excluir agora"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Editar serviço
                </p>
                <h3 className="text-lg font-bold text-zinc-900">{editingService.name}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                aria-label="Fechar modal de edição"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <Input
                label="Nome do Serviço"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full">
                  <label htmlFor="editDurationMode" className="mb-1 block text-sm font-semibold text-zinc-800">
                    Duração
                  </label>
                  <select
                    id="editDurationMode"
                    name="editDurationMode"
                    value={editDurationMode === "preset" ? editDurationPreset : "custom"}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "custom") {
                        setEditDurationMode("custom")
                      } else {
                        setEditDurationMode("preset")
                        setEditDurationPreset(value)
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Personalizado (minutos)</option>
                  </select>
                </div>
                <Input
                  label="Preço (R$)"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Vazio = A combinar"
                />
              </div>
              {editDurationMode === "custom" && (
                <Input
                  label="Duração personalizada (min)"
                  type="number"
                  value={editDurationCustom}
                  onChange={(e) => setEditDurationCustom(e.target.value)}
                  min="1"
                  placeholder="Ex: 75"
                  required
                />
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseEdit}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={savingEdit}>
                  {savingEdit ? "Salvando..." : "Salvar"}
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
