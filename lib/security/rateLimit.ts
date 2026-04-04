type RateLimitState = {
  count: number
  windowStart: number
  blockedUntil: number
}

type RateLimitOptions = {
  windowMs: number
  maxAttempts: number
  blockMs: number
}

type ConsumeResult = {
  allowed: boolean
  retryAfterSec: number
}

declare global {
  var __agendoRateLimitStore: Map<string, RateLimitState> | undefined
}

function getStore() {
  if (!globalThis.__agendoRateLimitStore) {
    globalThis.__agendoRateLimitStore = new Map()
  }
  return globalThis.__agendoRateLimitStore
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  return req.headers.get("x-real-ip") || "unknown"
}

export function buildRateLimitKey(kind: string, ip: string, identifier: string) {
  return `${kind}:${ip}:${identifier.toLowerCase()}`
}

export function consumeRateLimit(key: string, options: RateLimitOptions): ConsumeResult {
  const now = Date.now()
  const store = getStore()
  const state = store.get(key)

  if (!state) {
    store.set(key, { count: 1, windowStart: now, blockedUntil: 0 })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (state.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
    }
  }

  if (now - state.windowStart >= options.windowMs) {
    state.count = 0
    state.windowStart = now
  }

  state.count += 1

  if (state.count > options.maxAttempts) {
    state.blockedUntil = now + options.blockMs
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(options.blockMs / 1000)),
    }
  }

  state.blockedUntil = 0
  return { allowed: true, retryAfterSec: 0 }
}

export function resetRateLimit(key: string) {
  getStore().delete(key)
}

export function clearRateLimitStore() {
  getStore().clear()
}
