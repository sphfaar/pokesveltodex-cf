import type { Result } from "#lib/types.js";

export type GenerationRef = {
  id: number;
  roman: string;
  url: string;
};

const TRAILING_ID = /\/(\d+)\/?$/;

export function speciesId(url: string): number {
  const match = TRAILING_ID.exec(url);
  return match ? Number(match[1]) : 0;
}

/** PokeAPI names generations `generation-ix`. The bar shows the roman numeral. */
export function generationRef(name: string, url: string): GenerationRef | null {
  const id = speciesId(url);
  if (!Number.isInteger(id) || id <= 0) return null;
  const prefix = "generation-";
  if (!name.startsWith(prefix)) return null;
  const roman = name.slice(prefix.length).toUpperCase();
  if (!roman) return null;
  return { id, roman, url };
}

export function generationRefs(
  results: { name: string; url: string }[],
): GenerationRef[] {
  const generations: GenerationRef[] = [];
  for (const result of results) {
    const generation = generationRef(result.name, result.url);
    if (generation) generations.push(generation);
  }
  generations.sort((a, b) => a.id - b.id);
  return generations;
}

type GenerationDetail = {
  pokemon_species: { name: string; url: string }[];
};

const ready = new Map<number, Result[]>();
const inflight = new Map<number, Promise<Result[]>>();

export function peekGenerationSpecies(id: number): Result[] | undefined {
  return ready.get(id);
}

export function loadGenerationSpecies(generation: GenerationRef): Promise<Result[]> {
  const hit = ready.get(generation.id);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(generation.id);
  if (pending) return pending;

  const promise = fetch(generation.url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Generation failed (${response.status}) for ${generation.url}`);
      }
      const data = (await response.json()) as GenerationDetail;
      const species = data.pokemon_species.map((entry) => ({
        name: entry.name,
        url: entry.url,
      }));
      species.sort((a, b) => speciesId(a.url) - speciesId(b.url));
      ready.set(generation.id, species);
      return species;
    })
    .finally(() => {
      inflight.delete(generation.id);
    });

  inflight.set(generation.id, promise);
  return promise;
}
