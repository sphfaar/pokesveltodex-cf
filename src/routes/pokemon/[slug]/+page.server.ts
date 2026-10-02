import type { PageServerLoad } from './$types';
import type { PokemonSchema, PokemonSpecieSchema } from '#lib/types.js';

export const csr = false;
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
  return { poke };
}) satisfies PageServerLoad;
