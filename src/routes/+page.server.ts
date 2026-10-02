import type { PageServerLoad } from "./$types"
import type { PokemonList } from "#lib/types.js";

export const load = (async ({ fetch }) => {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=50&offset=0");
  const pokedata: PokemonList = await response.json();
  const pokespeciesList = pokedata.results;
  const nextPokeurl = pokedata.next;
  return { pokespeciesList, nextPokeurl };
}) satisfies PageServerLoad;
