export const buttonStyles = {
  base: "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold leading-none shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  primary:
    "theme-primary-button bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus:ring-zinc-500 disabled:text-zinc-400 disabled:cursor-not-allowed",
  danger: "bg-red-700 text-white hover:bg-red-800"
}

export const inputStyles = {
  base: "mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50",
  label: "block text-sm font-semibold text-zinc-600",
}

export const cardStyles = {
  base: "rounded-2xl bg-white shadow-sm",
}
