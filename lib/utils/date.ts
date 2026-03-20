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

export { dayjs }
