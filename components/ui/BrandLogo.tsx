"use client"

import Image from "next/image"
import { useTheme } from "@/components/providers/ThemeProvider"

type BrandLogoProps = {
  width: number
  height: number
  className?: string
  alt?: string
}

export default function BrandLogo({ width, height, className, alt = "Agendo" }: BrandLogoProps) {
  const { theme } = useTheme()
  const src = theme === "dark" ? "/logo-dark.png" : "/logo.png"

  return <Image src={src} alt={alt} width={width} height={height} className={className} />
}
