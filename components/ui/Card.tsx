import type { ReactNode } from "react"
import { cardStyles } from "@/lib/utils/styles"

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return <section className={`${cardStyles.base} ${className ?? ""}`}>{children}</section>
}
