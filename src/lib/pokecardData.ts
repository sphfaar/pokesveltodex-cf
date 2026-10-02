import type {
  EvolutionChainSchema,
  PokemonFormSchema,
  PokemonSpecieSchema,
  Type,
} from "#lib/types.js";
import { PokeRecursion } from "#lib/pokeRecursion.js";

export type PokecardView = {
  name: string;
  id: number;
  color: string;
  sprite: string;
  types: Type[];
  evolution_rank: number;
};

const MAX_IN_FLIGHT = 6;

const ready = new Map<string, PokecardView>();
const jsonCache = new Map<string, Promise<unknown>>();

type Job = {
  listeners: number;
  started: boolean;
  promise: Promise<PokecardView>;
  reject: (reason: unknown) => void;
};

const jobs = new Map<string, Job>();
const queue: Array<{ url: string; begin: () => void }> = [];
let active = 0;

function pump() {
  while (active < MAX_IN_FLIGHT && queue.length > 0) {
    const next = queue.shift();
    if (!next) return;
    const job = jobs.get(next.url);
    if (!job || job.listeners <= 0) continue;
    active += 1;
    job.started = true;
    next.begin();
  }
}

function finish() {
  active -= 1;
  pump();
}

async function fetchJson<T>(url: string, useProxy: boolean): Promise<T> {
  const response = useProxy
    ? await fetch("/api/catch-em-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(url),
      })
    : await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json() as Promise<T>;
}

function cachedJson<T>(url: string, useProxy: boolean): Promise<T> {
  const existing = jsonCache.get(url) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = fetchJson<T>(url, useProxy).catch((err: unknown) => {
    jsonCache.delete(url);
    throw err;
  });
  jsonCache.set(url, promise);
  return promise;
}

async function assemble(
  name: string,
  url: string,
  pokeSSR: boolean,
): Promise<PokecardView> {
  // Species stays a direct PokeAPI fetch, matching the previous card.
  const specieData = await cachedJson<PokemonSpecieSchema>(url, false);
  const formUrl = `https://pokeapi.co/api/v2/pokemon-form/${specieData.id}`;
  const [pokeFormData, evoChainData] = await Promise.all([
    cachedJson<PokemonFormSchema>(formUrl, pokeSSR),
    cachedJson<EvolutionChainSchema>(specieData.evolution_chain.url, pokeSSR),
  ]);
  const isFirst = specieData.evolves_from_species ? false : true;
  const evolution_rank = new PokeRecursion(name, evoChainData.chain, isFirst).evoRank;
  return {
    name,
    id: specieData.id,
    color: specieData.color.name,
    sprite: pokeFormData.sprites.front_default ?? "",
    types: pokeFormData.types,
    evolution_rank,
  };
}

export function peekPokecard(url: string): PokecardView | undefined {
  return ready.get(url);
}

/**
 * Fetch a card, sharing in-flight work and caching species, form, and
 * evolution chain by PokeAPI URL. `cancel` drops a job that has not started
 * so a card that left the warm band does not hold one of the six slots.
 */
export function loadPokecard(
  name: string,
  url: string,
  pokeSSR: boolean,
): { promise: Promise<PokecardView>; cancel: () => void } {
  const cached = ready.get(url);
  if (cached) return { promise: Promise.resolve(cached), cancel() {} };

  let job = jobs.get(url);
  if (!job) {
    let resolve: (view: PokecardView) => void = () => {};
    let reject: (reason: unknown) => void = () => {};
    const promise = new Promise<PokecardView>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    job = { listeners: 0, started: false, promise, reject };
    jobs.set(url, job);
    queue.push({
      url,
      begin() {
        assemble(name, url, pokeSSR)
          .then((view) => {
            ready.set(url, view);
            resolve(view);
          })
          .catch((err: unknown) => {
            reject(err);
          })
          .finally(() => {
            jobs.delete(url);
            finish();
          });
      },
    });
  }

  const tracked = job;
  tracked.listeners += 1;
  pump();

  let cancelled = false;
  return {
    promise: tracked.promise,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      tracked.listeners -= 1;
      if (tracked.listeners > 0 || tracked.started) return;
      tracked.reject(new DOMException("Aborted", "AbortError"));
      jobs.delete(url);
    },
  };
}
