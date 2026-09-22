<script lang="ts">
  import type { PageProps } from "./$types";
  import type { PokemonList } from "$lib/types";
  import { untrack } from "svelte";
  import { viewport } from "$lib/viewport";
  import Pokelist from "$lib/components/Pokelist.svelte";
  import pokeball from "$lib/images/pokeball.svg";

  let { data }: PageProps = $props();

  let loading = $state(false);
  const pokeSSR = true; // Server Side Rendering pokemons
  // Seed local list state from the first page load, then append as the user scrolls.
  let pokespeciesList = $state.raw(untrack(() => data.pokespeciesList));
  let nextPokeurl = $state(untrack(() => data.nextPokeurl));

  async function fetchPokemons() {
    if (loading || !nextPokeurl) return;
    loading = true;
    const response = pokeSSR
      ? await fetch("/api/catch-em-all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPokeurl),
        })
      : await fetch(nextPokeurl);
    const pokedata: PokemonList = await response.json();
    nextPokeurl = pokedata.next;
    pokespeciesList = [...pokespeciesList, ...pokedata.results];
    loading = false;
  }
</script>

<svelte:head>
  <title>pokesveltodex</title>
  <link rel="icon" type="image/x-icon" href={pokeball} />
</svelte:head>

<Pokelist {pokespeciesList} />

{#if nextPokeurl}
  {#if loading}
    <img
      width="16"
      height="16"
      class="text-center animate-spin-fast w-16 h-16 fit-contain m-auto"
      src={pokeball}
      alt=""
    />
  {:else}
    <p class="text-center" {@attach viewport({ onenterViewport: fetchPokemons })}>
      Scroll for more pokemons
    </p>
  {/if}
{:else}
  <p class="text-center">No more pokemons</p>
{/if}
