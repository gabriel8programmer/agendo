import { InputHTMLAttributes, useState, type ReactNode } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { inputStyles } from "@/lib/utils/styles"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export default function Input({ label, error, id, className, icon, ...props }: InputProps) {
  const isPasswordField = props.type === "password"
  const [showPassword, setShowPassword] = useState(false)
  const resolvedType = isPasswordField && showPassword ? "text" : props.type

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={inputStyles.label}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-muted-foreground/50 pointer-events-none transition-colors group-focus-within:text-primary">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`${inputStyles.base} ${icon ? "pl-11" : ""} ${isPasswordField ? "pr-12" : ""} ${
            error ? "border-destructive ring-destructive/20" : ""
          } ${className ?? ""}`}
          {...props}
          type={resolvedType}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-3.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <FaEyeSlash aria-hidden size={18} /> : <FaEye aria-hidden size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  )
}
