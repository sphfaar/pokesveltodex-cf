import type { PageServerLoad } from './$types';
import type { PokemonSchema, PokemonSpecieSchema } from '#lib/types.js';
import { loadPrints } from '#lib/tcg/prints.js';

interface Poke {
  mon: PokemonSchema;
  species: PokemonSpecieSchema;
}
export const load = (async ({ fetch, params }) => {
  const pokemon: PokemonSchema = await fetch(`https://pokeapi.co/api/v2/pokemon/${params.slug}`).then(res => res.json());
  const pokemonSpecies: PokemonSpecieSchema = await fetch(pokemon.species.url).then(res => res.json());
  const poke: Poke = {
    mon: pokemon,
    species: pokemonSpecies,
  }
  const tcg = loadPrints(pokemonSpecies.id);
  // Mark the streamed promise handled so a rejection before paint cannot crash the server.
  tcg.catch(() => {});
  return { poke, tcg };
}) satisfies PageServerLoad;
