export const buttonStyles = {
  base: "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
  danger: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}

export const inputStyles = {
  base: "flex min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  label: "block text-sm font-semibold leading-none text-muted-foreground mb-2",
}

export const cardStyles = {
  base: "rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden",
}
