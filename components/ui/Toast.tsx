"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa"

export type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const animFrame = requestAnimationFrame(() => {
      setIsVisible(true)
    })

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 4000)

    return () => {
      cancelAnimationFrame(animFrame)
      clearTimeout(timer)
    }
  }, [onClose])

  const icons = {
    success: <FaCheckCircle className="text-emerald-500" />,
    error: <FaExclamationCircle className="text-destructive" />,
    info: <FaInfoCircle className="text-primary" />,
  }

  return (
    <div
      className={`fixed bottom-20 right-4 left-4 md:left-auto md:bottom-4 md:min-w-80 z-50 flex items-center gap-3 rounded-2xl border border-border bg-popover p-4 shadow-xl shadow-black/5 backdrop-blur-sm transition-all duration-500 ease-out ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
      }`}
    >
      <div className="text-xl">{icons[type]}</div>
      <p className="text-[15px] font-semibold text-foreground">{message}</p>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const ToastComponent = useMemo(
    () => (toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null),
    [toast, hideToast]
  )

  return { showToast, ToastComponent }
}
