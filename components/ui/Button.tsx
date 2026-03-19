import type { ReactNode, ButtonHTMLAttributes } from "react"
import { buttonStyles } from "@/lib/utils/styles"

type ButtonVariant = "primary" | "secondary"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

export default function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`${buttonStyles.base} ${buttonStyles[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  )
}
