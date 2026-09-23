"use client"

import { useEffect } from "react"

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Falha ao registrar Service Worker:", error)
      })
    }
  }, [])

  return null
}
