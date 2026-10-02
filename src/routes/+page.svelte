<script lang="ts">
  import type { PageProps } from "./$types";
  import type { PokemonList } from "#lib/types.js";
  import { untrack } from "svelte";
  import { viewport } from "#lib/viewport.js";
  import Pokelist from "#lib/components/Pokelist.svelte";
  import pokeball from "#lib/images/pokeball.svg";

  let { data }: PageProps = $props();

  let loading = $state(false);
  const pokeSSR = true; // Server Side Rendering pokemons
  // Seed local list state from the first page load, then append as the user scrolls.
  let pokespeciesList = $state.raw(untrack(() => data.pokespeciesList));
  let nextPokeurl = $state(untrack(() => data.nextPokeurl));

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
  <Pokelist {pokespeciesList} />

  {#if nextPokeurl}
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
  {:else}
    <p class="text-center">No more pokemons</p>
  {/if}
</div>
