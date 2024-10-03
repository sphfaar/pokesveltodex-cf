<script lang="ts">
  import type { PageData } from "./$types";
  import type { PokemonList } from "$lib/types";
  import viewport from "$lib/useViewPortAction";
  import Pokelist from "$lib/components/Pokelist.svelte";
  import pokeball from "$lib/images/pokeball.svg";

  export let data: PageData;

  let loading = false;
  let pokespeciesList: { name: string; url: string }[] = data.pokespeciesList;
  let nextPokeurl: string = data.nextPokeurl;

  async function fetchPokemons() {
    if (loading) return;
    loading = true;
    const response = await fetch(nextPokeurl);
    const pokedata: PokemonList = await response.json();
    nextPokeurl = pokedata.next;
    pokespeciesList = [...pokespeciesList, ...pokedata.results];
    loading = false;
  }
</script>

<svelte:head>
  <title>pokesveltodex</title>
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
    <p class="text-center" use:viewport on:enterViewport={fetchPokemons}>
      Scroll for more pokemons
    </p>
  {/if}
{:else}
  <p class="text-center">No more pokemons</p>
{/if}
