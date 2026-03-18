import { createServer, type IncomingMessage, type Server } from "node:http"
import { Readable } from "node:stream"
import { NextRequest } from "next/server"

type RouteHandler = (req: NextRequest) => Response | Promise<Response>

async function readBody(req: IncomingMessage): Promise<Uint8Array | undefined> {
  if (!req.method || req.method === "GET" || req.method === "HEAD") return undefined
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  if (chunks.length === 0) return undefined
  return Buffer.concat(chunks)
}

function getUrl(req: IncomingMessage): string {
  const host = req.headers.host ?? "localhost"
  const path = req.url ?? "/"
  return `http://${host}${path}`
}

export function createRouteTestServer(handler: RouteHandler): Server {
  return createServer(async (req, res) => {
    try {
      const body = await readBody(req)
      const headers = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "undefined") continue
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v)
        } else {
          headers.set(key, value)
        }
      }

      // Next.js' NextRequest has a slightly different RequestInit typing.
      // Avoid casting to the DOM RequestInit type to keep `next build` happy.
      const nextReq = new NextRequest(getUrl(req), {
        method: req.method,
        headers,
        ...(body ? { body } : {}),
      })

      const response = await handler(nextReq)

      res.statusCode = response.status
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      if (response.body) {
        const nodeStream = Readable.fromWeb(response.body as unknown as ReadableStream)
        nodeStream.pipe(res)
      } else {
        res.end()
      }
    } catch (err) {
      res.statusCode = 500
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ error: "internal_error" }))
    }
  })
}
