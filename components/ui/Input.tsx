import { InputHTMLAttributes, useState } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { inputStyles } from "@/lib/utils/styles"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className, ...props }: InputProps) {
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
      <div className="relative">
        <input
          id={id}
          className={`${inputStyles.base} ${isPasswordField ? "pr-20" : ""} ${className ?? ""}`}
          {...props}
          type={resolvedType}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-zinc-900"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <FaEyeSlash aria-hidden size={18} /> : <FaEye aria-hidden size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
