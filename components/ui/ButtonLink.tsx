import type { ReactNode } from "react"
import Link from "next/link"
import { buttonStyles } from "@/lib/utils/styles"

type ButtonVariant = "primary" | "secondary"

type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

export default function ButtonLink({
  href,
  variant = "primary",
  children,
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${buttonStyles.base} ${buttonStyles[variant]} ${className ?? ""}`}
    >
      {children}
    </Link>
  )
}
