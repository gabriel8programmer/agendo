import { TextareaHTMLAttributes } from "react"
import { inputStyles } from "@/lib/utils/styles"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export default function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={inputStyles.label}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${inputStyles.base} min-h-24 resize-none ${
          error ? "border-destructive ring-destructive/20" : ""
        } ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  )
}
