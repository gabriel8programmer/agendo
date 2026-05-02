"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { useAuth } from "@/components/providers/AuthProvider"
import { FaClock, FaTag, FaPlus, FaList, FaTimes, FaPen, FaTrash } from "react-icons/fa"
import { getServices, createService, updateService, deleteServicesBulk } from "@/lib/api"
import { inputStyles } from "@/lib/utils/styles"
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
        className={`group flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
          selectionMode
            ? selected
              ? "border-destructive bg-destructive/10"
              : "border-border bg-card"
            : "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
        }`}
      >
        <div className="flex items-center gap-4">
          {selectionMode && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
                selected
                  ? "border-destructive bg-destructive text-white"
                  : "border-input bg-background text-transparent"
              }`}
            >
              ✓
            </div>
          )}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground transition-colors group-hover:text-primary ${
              selected ? "bg-destructive/20 text-destructive" : ""
            }`}
          >
            <FaTag size={18} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">
              {service.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <FaClock size={12} className="text-primary/50" />
              <span>{service.duration} min</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-base font-black text-foreground">
            {service.price ? `R$ ${Number(service.price).toFixed(2).replace(".", ",")}` : "A combinar"}
          </p>
          {!selectionMode && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <FaPen size={12} />
            </div>
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
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Configurações</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Meus Serviços
          </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Formulário de Novo Serviço */}
          <div className="md:col-span-5">
            <Card className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FaPlus size={14} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Novo Serviço</h2>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  label="Nome do Serviço"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Moderno"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="w-full">
                    <label htmlFor="durationMode" className={inputStyles.label}>
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
                      className={`${inputStyles.base} h-11 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat`}
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value="custom">Outro...</option>
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
                    label="Duração em minutos"
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

                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                >
                  Salvar Serviço
                </Button>
              </form>
            </Card>
          </div>

          {/* Lista de Serviços */}
          <div className="md:col-span-7">
            <Card className="p-6 md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FaList size={14} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Serviços Ativos</h2>
                </div>
                
                <button
                  type="button"
                  onClick={handleToggleSelectionMode}
                  className={`cursor-pointer rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 ${
                    selectionMode
                      ? "bg-foreground text-background"
                      : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                  }`}
                >
                  {selectionMode ? "Cancelar" : "Remover"}
                </button>
              </div>

              {selectionMode && (
                <div className="mb-6 flex items-center justify-between rounded-[1.5rem] bg-destructive/5 p-4 ring-1 ring-destructive/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-destructive">
                    {selectedServiceIds.length} selecionado(s)
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    disabled={selectedServiceIds.length === 0 || deleting}
                    className="h-9 px-4 text-xs"
                  >
                    Excluir Selecionados
                  </Button>
                </div>
              )}

              {loading || authLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
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
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <div className="mb-4 rounded-full bg-muted p-4 opacity-50">
                    <FaTag size={32} />
                  </div>
                  <p className="text-sm font-bold">Nenhum serviço cadastrado.</p>
                  <p className="mt-1 text-xs">Comece adicionando seu primeiro serviço ao lado.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Exclusão */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm border-none p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <FaTrash size={24} />
              </div>
              <h3 className="text-xl font-black text-foreground">Remover serviços?</h3>
              <p className="mt-2 text-[15px] font-medium text-muted-foreground leading-relaxed">
                Você selecionou <span className="font-bold text-foreground">{selectedServiceIds.length} serviço(s)</span>. 
                Esta ação é permanente e não pode ser desfeita.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="danger"
                className="h-12 w-full text-base"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Sim, excluir tudo"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full text-base"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Edição */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none p-8 shadow-2xl shadow-black/20">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Editar</p>
                <h3 className="mt-1 text-xl font-black text-foreground">{editingService.name}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSaveEdit}>
              <Input
                label="Nome do Serviço"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full">
                  <label htmlFor="editDurationMode" className={inputStyles.label}>
                    Duração
                  </label>
                  <select
                    id="editDurationMode"
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
                    className={`${inputStyles.base} h-11 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat`}
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Outro...</option>
                  </select>
                </div>
                <Input
                  label="Preço (R$)"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  step="0.01"
                  placeholder="A combinar"
                />
              </div>
              
              {editDurationMode === "custom" && (
                <Input
                  label="Duração em minutos"
                  type="number"
                  value={editDurationCustom}
                  onChange={(e) => setEditDurationCustom(e.target.value)}
                  min="1"
                  required
                />
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" className="h-12 w-full text-base" disabled={savingEdit}>
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button type="button" variant="ghost" className="h-12 w-full" onClick={handleCloseEdit}>
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
