<script lang="ts">
  import type { PageProps } from "./$types";
  import type { PokemonList } from "#lib/types.js";
  import { untrack } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { navigating } from "$app/state";
  import { viewport } from "#lib/viewport.js";
  import { carryDex, recallDex } from "#lib/pokeDexCarry.js";
  import { getGenerationFilter } from "#lib/generationFilter.svelte.js";
  import Pokelist from "#lib/components/Pokelist.svelte";
  import pokeball from "#lib/images/pokeball.svg";

  let { data }: PageProps = $props();

  let loading = $state(false);
  const pokeSSR = true; // Server Side Rendering pokemons
  // History scroll is applied against the first client render. That render has
  // to already include every page loaded before the detail view, or the offset
  // clamps to the end of the server page.
  const carried = untrack(() => recallDex());
  const filter = getGenerationFilter();
  // The layout keeps the checkboxes. This page only pins the warm band for a
  // Back navigation; a fresh visit, including the header logo, starts at the top.
  untrack(() => {
    filter.pinnedScroll =
      navigating.type === "popstate" ? (carried?.scrollY ?? 0) : 0;
  });
  let pokespeciesList = $state.raw(
    carried?.pokespeciesList ?? untrack(() => data.pokespeciesList),
  );
  let nextPokeurl = $state(
    carried ? carried.nextPokeurl : untrack(() => data.nextPokeurl),
  );

  // Every generation checked, no region hiding species, and an empty search
  // keeps the paged national list. A narrower check, or any search text,
  // replaces it with the full matching species list in national-dex order.
  let allSelected = $derived(filter.allSelected);
  let regionsNarrowed = $derived(filter.regionsNarrowed);
  let searching = $derived(filter.query.trim().length > 0);
  let narrowed = $derived(searching || !allSelected || regionsNarrowed);
  let filteredList = $derived(filter.filteredList());
  let shownList = $derived(filteredList ?? pokespeciesList);
  let waitingForGenerations = $derived(
    narrowed && filteredList === null && !filter.error,
  );

  beforeNavigate(() => {
    carryDex({
      pokespeciesList,
      nextPokeurl,
      scrollY: window.scrollY,
    });
  });

  afterNavigate((nav) => {
    if (nav.type !== "popstate" || filter.pinnedScroll <= 0) return;
    const y = filter.pinnedScroll;
    const apply = () => {
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
    };
    apply();
    requestAnimationFrame(apply);
  });

  let sentinelEl: HTMLElement | undefined;

  // rootMargin is one viewport below the screen. Re-check the box after the
  // list grows, because the exit callback can lag behind the append.
  function sentinelStillNear(element: HTMLElement) {
    if (!element.isConnected) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight * 2;
  }

  async function fetchPokemons() {
    if (loading || !nextPokeurl) return;
    loading = true;
    let appended = false;
    try {
      const response = pokeSSR
        ? await fetch("/api/catch-em-all", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(nextPokeurl),
          })
        : await fetch(nextPokeurl);
      if (!response.ok) throw new Error(`Pokemon page failed (${response.status})`);
      const pokedata: PokemonList = await response.json();
      nextPokeurl = pokedata.next;
      if (pokedata.results.length > 0) {
        pokespeciesList = [...pokespeciesList, ...pokedata.results];
        appended = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
    if (!appended || !sentinelEl) return;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    if (sentinelStillNear(sentinelEl)) void fetchPokemons();
  }

  // One viewport early, separate from the video play/pause observer.
  const loadAhead = viewport(
    {
      onenterViewport(element) {
        sentinelEl = element;
        void fetchPokemons();
      },
      onexitViewport(element) {
        sentinelEl = element;
      },
    },
    { rootMargin: "0px 0px 100% 0px" },
  );
</script>

<svelte:head>
  <title>pokesveltodex</title>
  <link rel="icon" type="image/x-icon" href={pokeball} />
</svelte:head>

<div class="[overflow-anchor:none]">
  {#if waitingForGenerations}
    <img
      width="16"
      height="16"
      class="text-center animate-spin-fast w-16 h-16 fit-contain m-auto"
      src={pokeball}
      alt=""
    />
  {:else if narrowed && filter.error}
    <p class="text-center">Generations could not be loaded.</p>
  {:else}
    <Pokelist pokespeciesList={shownList} restoreScrollY={filter.pinnedScroll} />

    {#if !narrowed && nextPokeurl}
      <div class="pb-8">
        {#if loading}
          <img
            width="16"
            height="16"
            class="text-center animate-spin-fast w-16 h-16 fit-contain m-auto"
            src={pokeball}
            alt=""
          />
        {/if}
        <p class="text-center" {@attach loadAhead}>Scroll for more pokemons</p>
      </div>
    {:else if !narrowed}
      <p class="text-center">No more pokemons</p>
    {:else if shownList.length === 0}
      <p class="text-center">No pokemons</p>
    {/if}
  {/if}
</div>
