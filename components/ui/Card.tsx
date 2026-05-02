import type { ReactNode } from "react"
import { cardStyles } from "@/lib/utils/styles"

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return <div className={`${cardStyles.base} ${className ?? ""}`}>{children}</div>
}
