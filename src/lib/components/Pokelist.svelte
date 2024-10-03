<script lang="ts">
  import type { Result } from "$lib/types";
  import Pokecard from "./Pokecard.svelte";

  export let pokespeciesList: Result[];
</script>

<ul class="grid grid-cols-pokegrid gap-2 p-6">
  {#each pokespeciesList as pokemon (pokemon.name)}
    <Pokecard name={pokemon.name} url={pokemon.url} />
  {/each}
</ul>
