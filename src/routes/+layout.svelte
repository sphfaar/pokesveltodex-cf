<script lang="ts">
  import "../app.css";
  import type { LayoutProps } from "./$types";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import DexBar from "#lib/components/DexBar.svelte";
  import {
    GenerationFilter,
    setGenerationFilter,
  } from "#lib/generationFilter.svelte.js";
  import type { GenerationRef } from "#lib/generations.js";

  let { children }: LayoutProps = $props();

  const filter = new GenerationFilter();
  setGenerationFilter(filter);

  let home = $derived(page.url.pathname === "/");
  let generations = $derived.by((): GenerationRef[] => {
    const value = (page.data as { generations?: GenerationRef[] }).generations;
    return Array.isArray(value) ? value : [];
  });
</script>

<header class="pt-8">
  <a href={resolve("/")}>
    <pre class="text-[0.3em] text-green-300 text-center">
      ██████╗  ██████╗ ██╗  ██╗███████╗███████╗██╗   ██╗███████╗██╗  ████████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
      ██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝██╔════╝██║   ██║██╔════╝██║  ╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
      ██████╔╝██║   ██║█████╔╝ █████╗  ███████╗██║   ██║█████╗  ██║     ██║   ██║   ██║██║  ██║█████╗   ╚███╔╝ 
      ██╔═══╝ ██║   ██║██╔═██╗ ██╔══╝  ╚════██║╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
      ██║     ╚██████╔╝██║  ██╗███████╗███████║ ╚████╔╝ ███████╗███████╗██║   ╚██████╔╝██████╔╝███████╗██╔╝ ██╗
      ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝╚═╝    ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
    </pre>
  </a>
  {#if home && generations.length > 0}
    <div class="container mx-auto">
      <DexBar {generations} />
    </div>
  {/if}
</header>
<main class="container mx-auto">
  {@render children()}
</main>
