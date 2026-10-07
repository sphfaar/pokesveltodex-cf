import type { PageServerLoad } from "./$types"
import type { PokemonList } from "#lib/types.js";
import { generationRefs, type GenerationRef } from "#lib/generations.js";

type GenerationList = {
  results: { name: string; url: string }[];
};

export const load = (async ({ fetch }) => {
  const [response, generationResponse] = await Promise.all([
    fetch("https://pokeapi.co/api/v2/pokemon-species?limit=50&offset=0"),
    fetch("https://pokeapi.co/api/v2/generation?limit=100"),
  ]);
  const pokedata: PokemonList = await response.json();
  let generations: GenerationRef[] = [];
  if (generationResponse.ok) {
    const generationData: GenerationList = await generationResponse.json();
    generations = generationRefs(generationData.results);
  }
  return {
    pokespeciesList: pokedata.results,
    nextPokeurl: pokedata.next,
    generations,
  };
}) satisfies PageServerLoad;
