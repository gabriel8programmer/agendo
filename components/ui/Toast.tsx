"use client"

import { useEffect, useState } from "react"
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
    // Use requestAnimationFrame or a tiny timeout to ensure the animation triggers after mount
    const animFrame = requestAnimationFrame(() => {
      setIsVisible(true)
    })

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 3000)

    return () => {
      cancelAnimationFrame(animFrame)
      clearTimeout(timer)
    }
  }, [onClose])

  const icons = {
    success: <FaCheckCircle className="text-green-500" />,
    error: <FaExclamationCircle className="text-red-500" />,
    info: <FaInfoCircle className="text-blue-500" />,
  }

  const bgColors = {
    success: "bg-white border-green-100",
    error: "bg-white border-red-100",
    info: "bg-white border-blue-100",
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border p-4 shadow-lg transition-all duration-300 ${
        bgColors[type]
      } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      <div className="text-lg">{icons[type]}</div>
      <p className="text-sm font-medium text-zinc-900">{message}</p>
    </div>
  )
}

// Hook para facilitar o uso
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
  }

  const hideToast = () => setToast(null)

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null

  return { showToast, ToastComponent }
}
