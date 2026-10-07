import { createContext } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import {
  loadGenerationSpecies,
  peekGenerationSpecies,
  speciesId,
  type GenerationRef,
} from "#lib/generations.js";
import { REGION_IDS, regionIdFor } from "#lib/regions.js";
import type { Result } from "#lib/types.js";

/**
 * Home dex filters. The layout owns one instance so a trip to a Pokémon page
 * and back keeps the same checks, search, and which region cards are open.
 */
export class GenerationFilter {
  generations = $state.raw<GenerationRef[]>([]);
  readonly speciesByGeneration = new SvelteMap<number, Result[]>();
  error = $state(false);
  /** Warm-band pin. The home page sets this on entry; toggling a box clears it. */
  pinnedScroll = $state(0);
  query = $state("");
  readonly selected = new SvelteSet<number>();
  readonly selectedRegions = new SvelteSet<string>(REGION_IDS);
  readonly expandedRegions = new SvelteSet<string>();

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

  get allRegionsSelected(): boolean {
    return REGION_IDS.every((id) => this.selectedRegions.has(id));
  }

  /**
   * True when an unchecked region would hide species. Lumiose City introduced
   * none, and the unnamed region has none until generation 10 is in the data.
   */
  get regionsNarrowed(): boolean {
    if (this.allRegionsSelected) return false;
    for (const generation of this.generations) {
      if (generation.id === 8) {
        if (!this.selectedRegions.has("galar") || !this.selectedRegions.has("hisui")) return true;
        continue;
      }
      if (!this.selectedRegions.has(regionIdFor(0, generation.id))) return true;
    }
    return false;
  }

  /**
   * Species in the checked generations and regions, in national-dex order,
   * narrowed by the search box. `null` while that set is still loading, or
   * when every generation is checked, no region is hiding species, and the
   * box is empty — then the paged national list stays in charge.
   */
  filteredList(): Result[] | null {
    const needle = normalizeQuery(this.query);
    if (!needle && this.allSelected && !this.regionsNarrowed) return null;
    if (this.selectedRegions.size === 0) return [];
    const base = this.speciesInSelection();
    if (base === null) return null;
    if (!needle) return base;
    return base.filter((entry) => matchesSpecies(entry, needle));
  }

  setQuery(value: string) {
    if (this.query === value) return;
    this.query = value;
    this.pinToTop();
    if (value.trim()) void this.prefetch();
  }

  toggle(id: number) {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.pinToTop();
    this.error = false;
    if (!this.allSelected) void this.ensure([...this.selected]);
  }

  toggleRegion(id: string) {
    const narrowed = this.regionsNarrowed;
    if (this.selectedRegions.has(id)) this.selectedRegions.delete(id);
    else this.selectedRegions.add(id);
    this.error = false;
    if (narrowed || this.regionsNarrowed) {
      this.pinToTop();
      if (this.regionsNarrowed) void this.prefetch();
    }
  }

  toggleExpanded(id: string) {
    if (this.expandedRegions.has(id)) this.expandedRegions.delete(id);
    else this.expandedRegions.add(id);
  }

  private pinToTop() {
    if (typeof window !== "undefined" && window.scrollY !== 0) window.scrollTo(0, 0);
    this.pinnedScroll = 0;
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

  /**
   * Checked generations, dropping species from an unchecked region.
   * `null` when one of those generations has not loaded yet.
   */
  private speciesInSelection(): Result[] | null {
    const regionLimited = this.regionsNarrowed;
    const merged: Result[] = [];
    const seen: Record<string, true> = {};
    for (const generation of this.generations) {
      if (!this.selected.has(generation.id)) continue;
      const species = this.speciesByGeneration.get(generation.id);
      if (!species) return null;
      for (const entry of species) {
        if (seen[entry.url]) continue;
        if (
          regionLimited &&
          !this.selectedRegions.has(regionIdFor(speciesId(entry.url), generation.id))
        ) {
          continue;
        }
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
