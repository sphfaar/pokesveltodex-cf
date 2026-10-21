import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PokemonSchema, PokemonSpecieSchema } from '#lib/types.js';
import { loadPrints } from '#lib/tcg/prints.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG = 40;
const SPECIES_PATH = /^\/api\/v2\/pokemon-species\/\d+\/?$/;

interface Poke {
  mon: PokemonSchema;
  species: PokemonSpecieSchema;
}

function pokemonSlug(raw: string): string {
  const slug = raw.toLowerCase();
  if (slug.length > MAX_SLUG || !SLUG.test(slug)) error(404, 'Not Found');
  return slug;
}

function speciesUrl(raw: unknown): URL {
  if (typeof raw !== 'string') error(502, 'Upstream request failed');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    error(502, 'Upstream request failed');
  }
  url.username = '';
  url.password = '';
  if (url.origin !== 'https://pokeapi.co' || url.search !== '' || !SPECIES_PATH.test(url.pathname)) {
    error(502, 'Upstream request failed');
  }
  return url;
}

async function pokeJson<T>(doFetch: typeof fetch, url: URL): Promise<T> {
  let response: Response;
  try {
    response = await doFetch(url, { redirect: 'error' });
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error('PokeAPI fetch failed', err);
    error(502, 'Upstream request failed');
  }
  if (response.status === 404) error(404, 'Not Found');
  if (!response.ok) {
    await response.body?.cancel();
    error(502, 'Upstream request failed');
  }
  try {
    return (await response.json()) as T;
  } catch (err) {
    if (isHttpError(err)) throw err;
    error(502, 'Upstream request failed');
  }
}

export const load = (async ({ fetch, params }) => {
  const slug = pokemonSlug(params.slug);
  const pokemon = await pokeJson<PokemonSchema>(
    fetch,
    new URL(`https://pokeapi.co/api/v2/pokemon/${slug}`),
  );
  // The first body chooses this hop. Only a PokéAPI species URL is followed.
  const pokemonSpecies = await pokeJson<PokemonSpecieSchema>(fetch, speciesUrl(pokemon.species?.url));
  const poke: Poke = {
    mon: pokemon,
    species: pokemonSpecies,
  };
  const tcg = loadPrints(pokemonSpecies.id);
  // Mark the streamed promise handled so a rejection before paint cannot crash the server.
  tcg.catch(() => {});
  return { poke, tcg };
}) satisfies PageServerLoad;
