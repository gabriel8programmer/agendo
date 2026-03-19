export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus:ring-zinc-500 disabled:text-zinc-400 disabled:cursor-not-allowed",
}

export const inputStyles = {
  base: "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:cursor-not-allowed",
  label: "block text-xs font-bold uppercase tracking-wider text-zinc-500",
}

export const cardStyles = {
  base: "rounded-2xl bg-white shadow-sm",
}
