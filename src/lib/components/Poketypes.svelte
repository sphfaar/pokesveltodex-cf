<script lang="ts">
  import type { Type } from "$lib/types";

  let { pkntypes }: { pkntypes: Type[] } = $props();
  const typesVariants: { [index: string]: string } = {
    normal: "bg-normal",
    fire: "bg-fire",
    fighting: "bg-fighting",
    water: "bg-water",
    flying: "bg-flying",
    grass: "bg-grass",
    poison: "bg-poison",
    electric: "bg-electric",
    ground: "bg-ground",
    psychic: "bg-psychic",
    rock: "bg-rock",
    ice: "bg-ice",
    bug: "bg-bug",
    dragon: "bg-dragon",
    ghost: "bg-ghost",
    dark: "bg-dark",
    steel: "bg-steel",
    fairy: "bg-fairy",
    unknow: "bg-unknow",
  };
</script>

{#each pkntypes as pkntype (pkntype.slot)}
  <div
    class="{typesVariants[
      pkntype.type.name
    ]} flex-1 flex justify-center items-center"
  >
    <p class="text-black font-medium drop-shadow-[0_2px_1px_rgba(0,0,0,0.3)]">
      {pkntype.type.name}
    </p>
  </div>
{/each}
