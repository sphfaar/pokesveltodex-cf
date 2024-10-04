import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, setHeaders }) => {
  const pokeurl: string = await request.json();
  try {
    const urlSecCheck = new URL(pokeurl);
    if (!urlSecCheck || urlSecCheck.origin !== "https://pokeapi.co") {
      throw error(403, "Forbidden");
    }
  } catch (e) {
    console.error("URL Security check failed", e);
    throw error(500, "Internal Server Error");
  }
  const res = await fetch(pokeurl)
  const data = await res.json();

  setHeaders({
    "cache-control": "public, max-age=3600",
  })

  return json(data);
}
