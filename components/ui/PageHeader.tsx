interface PageHeaderProps {
  label: string
  title: string
  className?: string
}

export default function PageHeader({ label, title, className }: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className ?? ""}`}>
      <p className="text-sm font-medium text-zinc-600 uppercase tracking-widest">{label}</p>
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
    </header>
  )
}
