<script lang="ts">
  import type { Stat } from "#lib/types.js";

  let { stats }: { stats: Stat[] } = $props();
</script>

<ul>
  {#each stats as stat (stat.stat.name)}
    <li class="flex flex-row items-center capitalize pb-2">
      <p class="w-36 flex-none inline-block">{stat.stat.name}</p>
      <p class="w-10 flex-none inline-block">{stat.base_stat}</p>
      <div class="w-full border border-solid border-gray-600 rounded-full">
        <div
          class="bg-red-500 h-4 rounded-full"
          style:width="calc({stat.base_stat}%/1.8)"
        ></div>
      </div>
    </li>
  {/each}
</ul>
