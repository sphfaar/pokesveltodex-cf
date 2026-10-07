import { createContext } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import {
  loadGenerationSpecies,
  peekGenerationSpecies,
  speciesId,
  type GenerationRef,
} from "#lib/generations.js";
import type { Result } from "#lib/types.js";

/**
 * Generation checkboxes for the home dex. The layout owns one instance so a
 * trip to a Pokémon page and back keeps the same checks.
 */
export class GenerationFilter {
  generations = $state.raw<GenerationRef[]>([]);
  readonly speciesByGeneration = new SvelteMap<number, Result[]>();
  error = $state(false);
  /** Warm-band pin. The home page sets this on entry; toggling a box clears it. */
  pinnedScroll = $state(0);
  query = $state("");
  readonly selected = new SvelteSet<number>();

  /** Select every generation the first time they arrive. Later visits keep the checks. */
  adopt(generations: GenerationRef[]) {
    const same =
      this.generations.length === generations.length &&
      this.generations.every(
        (generation, index) => generation.id === generations[index]?.id,
      );
    if (same) return;
    this.generations = generations;
    this.selected.clear();
    for (const generation of generations) this.selected.add(generation.id);
  }

  get allSelected(): boolean {
    return (
      this.generations.length > 0 &&
      this.generations.every((generation) => this.selected.has(generation.id))
    );
  }

  /**
   * Species in the checked generations, in national-dex order, narrowed by the
   * search box. `null` while that set is still loading, or when every
   * generation is checked and the box is empty — then the paged national list
   * stays in charge.
   */
  filteredList(): Result[] | null {
    const needle = normalizeQuery(this.query);
    if (!needle && this.allSelected) return null;
    const base = this.speciesInSelection();
    if (base === null) return null;
    if (!needle) return base;
    return base.filter((entry) => matchesSpecies(entry, needle));
  }

  setQuery(value: string) {
    if (this.query === value) return;
    this.query = value;
    if (typeof window !== "undefined" && window.scrollY !== 0) window.scrollTo(0, 0);
    this.pinnedScroll = 0;
    if (value.trim()) void this.prefetch();
  }

  toggle(id: number) {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    if (typeof window !== "undefined" && window.scrollY !== 0) window.scrollTo(0, 0);
    this.pinnedScroll = 0;
    this.error = false;
    if (!this.allSelected) void this.ensure([...this.selected]);
  }

  prefetch() {
    return this.ensure(this.generations.map((generation) => generation.id));
  }

  private async ensure(ids: number[]) {
    const missing = this.generations.filter(
      (generation) =>
        ids.includes(generation.id) && !peekGenerationSpecies(generation.id),
    );
    try {
      if (missing.length > 0) {
        await Promise.all(missing.map((generation) => loadGenerationSpecies(generation)));
      }
      this.publish(ids);
      this.error = false;
    } catch (error) {
      console.error(error);
      this.publish(ids);
      this.error = true;
    }
  }

  /** Checked generations, or `null` when one of them has not loaded yet. */
  private speciesInSelection(): Result[] | null {
    const merged: Result[] = [];
    const seen: Record<string, true> = {};
    for (const generation of this.generations) {
      if (!this.selected.has(generation.id)) continue;
      const species = this.speciesByGeneration.get(generation.id);
      if (!species) return null;
      for (const entry of species) {
        if (seen[entry.url]) continue;
        seen[entry.url] = true;
        merged.push(entry);
      }
    }
    merged.sort((a, b) => speciesId(a.url) - speciesId(b.url));
    return merged;
  }

  private publish(ids: number[]) {
    for (const id of ids) {
      const species = peekGenerationSpecies(id);
      if (!species || this.speciesByGeneration.get(id) === species) continue;
      this.speciesByGeneration.set(id, species);
    }
  }
}

export const [getGenerationFilter, setGenerationFilter] =
  createContext<GenerationFilter>();

/** Lower case, drop a leading #, and ignore spaces and hyphens. */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/^#/, "").replace(/[\s-]+/g, "");
}

function matchesSpecies(entry: Result, needle: string): boolean {
  const name = entry.name.toLowerCase().replace(/[\s-]+/g, "");
  if (name.includes(needle)) return true;
  if (!/^\d+$/.test(needle)) return false;
  const id = speciesId(entry.url);
  const trimmed = needle.replace(/^0+/, "") || "0";
  return String(id).startsWith(trimmed);
}
