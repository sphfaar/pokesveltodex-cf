import { error, isHttpError } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const MAX_BYTES = 1_048_576;
const TIMEOUT_MS = 10_000;

function pokeApiUrl(raw: unknown): URL {
  if (typeof raw !== "string") throw error(400, "Bad Request");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw error(400, "Bad Request");
  }

  // Drop credentials before the allowlist check and before fetch.
  target.username = "";
  target.password = "";

  if (target.origin !== "https://pokeapi.co" || !target.pathname.startsWith("/api/v2/")) {
    throw error(403, "Forbidden");
  }

  return target;
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw error(502, "Upstream response too large");
  }

  const body = response.body;
  if (!body) return new Uint8Array();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw error(502, "Upstream response too large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export const POST: RequestHandler = async ({ request, setHeaders }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, "Bad Request");
  }

  const target = pokeApiUrl(body);

  let upstream: Response;
  try {
    // Fetch the parsed URL. redirect:error refuses a second hop off this host.
    upstream = await fetch(target, {
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("PokeAPI fetch failed", err);
    throw error(502, "Upstream request failed");
  }

  if (!upstream.ok) {
    await upstream.body?.cancel();
    throw error(502, "Upstream request failed");
  }

  const bytes = await readLimited(upstream, MAX_BYTES);
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw error(502, "Upstream request failed");
  }

  // The body picks the payload. A shared cache keyed only on this URL can serve one POST to everyone.
  setHeaders({
    "cache-control": "private, no-store",
  });

  return Response.json(data);
};
