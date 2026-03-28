import crypto from "node:crypto"

const SESSION_SECRET = process.env.AUTH_SECRET || "dev-auth-secret-change-me"

export const SESSION_COOKIE = "agendo_session"
export const SESSION_HINT_COOKIE = "agendo_logged"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 dias

type SessionPayload = {
  userId: string
  email: string
  name: string
  exp: number
}

function toBase64Url(input: Buffer | string) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buffer.toString("base64url")
}

function fromBase64Url<T>(input: string): T | null {
  try {
    return JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
  return `${salt.toString("hex")}:${key.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, keyHex] = storedHash.split(":")
  if (!saltHex || !keyHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const key = Buffer.from(keyHex, "hex")
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, key.length, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
  if (derived.length !== key.length) return false
  return crypto.timingSafeEqual(derived, key)
}

export function createSessionToken(input: { userId: string; email: string; name: string }) {
  const payload: SessionPayload = {
    userId: input.userId,
    email: input.email,
    name: input.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const payloadEncoded = toBase64Url(JSON.stringify(payload))
  const signature = toBase64Url(
    crypto.createHmac("sha256", SESSION_SECRET).update(payloadEncoded).digest()
  )
  return `${payloadEncoded}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [payloadEncoded, signature] = token.split(".")
  if (!payloadEncoded || !signature) return null

  const expectedSignature = toBase64Url(
    crypto.createHmac("sha256", SESSION_SECRET).update(payloadEncoded).digest()
  )

  const incoming = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (incoming.length !== expected.length) return null
  if (!crypto.timingSafeEqual(incoming, expected)) return null

  const payload = fromBase64Url<SessionPayload>(payloadEncoded)
  if (!payload) return null
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

export function toSafeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex")
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
