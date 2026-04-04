import { track } from "@vercel/analytics/server"

type EventProperties = Record<string, string | number | boolean | null | undefined>

function isTelemetryEnabled() {
  if (process.env.ENABLE_ANALYTICS === "1") return true
  return process.env.NODE_ENV === "production"
}

export function trackServerEvent(eventName: string, properties?: EventProperties) {
  if (!isTelemetryEnabled()) return

  void track(eventName, properties).catch((error) => {
    console.error(`Telemetry error (${eventName}):`, error)
  })
}

