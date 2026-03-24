import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/pt-br"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("pt-br")

const TIMEZONE = "America/Sao_Paulo"

/**
 * Converte data (YYYY-MM-DD) e hora (HH:mm) para uma string ISO UTC
 */
export function formatToUTC(date: string, time: string): string {
  return dayjs.tz(`${date} ${time}`, TIMEZONE).toISOString()
}

/**
 * Extrai o horário HH:mm de uma string ISO UTC, convertendo para o fuso de SP
 */
export function formatToLocalTime(isoString: string): string {
  return dayjs(isoString).tz(TIMEZONE).format("HH:mm")
}

/**
 * Retorna o início e o fim de um dia (YYYY-MM-DD) em UTC, baseando-se no fuso de SP
 */
export function getDayRangeUTC(date: string) {
  const start = dayjs.tz(date, TIMEZONE).startOf("day").toISOString()
  const end = dayjs.tz(date, TIMEZONE).endOf("day").toISOString()
  return { start, end }
}

/**
 * Retorna o dia atual no fuso de SP no formato YYYY-MM-DD
 */
export function getTodayDate(): string {
  return dayjs().tz(TIMEZONE).format("YYYY-MM-DD")
}

/**
 * Garante horário no formato brasileiro 24h (00:00–23:59), sem AM/PM.
 * Aceita "H:mm" ou "HH:mm" vindos do input nativo.
 */
export function normalizeTime24BR(input: string): string {
  if (!input || typeof input !== "string") return "00:00"
  const trimmed = input.trim()
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return "00:00"
  let h = parseInt(match[1], 10)
  let m = parseInt(match[2], 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "00:00"
  h = Math.min(23, Math.max(0, h))
  m = Math.min(59, Math.max(0, m))
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export { dayjs }
