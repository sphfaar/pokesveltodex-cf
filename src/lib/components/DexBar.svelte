<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { getGenerationFilter } from "#lib/generationFilter.svelte.js";
    import type { GenerationRef } from "#lib/generations.js";

    let { generations }: { generations: GenerationRef[] } = $props();

    const filter = getGenerationFilter();
    untrack(() => filter.adopt(generations));

    onMount(() => {
        void filter.prefetch();
    });
</script>

<div class="flex items-center gap-4 overflow-x-auto px-6 pt-3 pb-1">
    <input
        type="search"
        aria-label="Search"
        placeholder="Search"
        spellcheck="false"
        class="w-40 shrink-0 rounded border border-gray-600 bg-transparent px-2 py-0.5 text-sm text-inherit outline-none placeholder:text-gray-500 focus:border-green-300"
        value={filter.query}
        oninput={(event) => {
            const target = event.currentTarget;
            if (target instanceof HTMLInputElement)
                filter.setQuery(target.value);
        }}
    />
    <p id="generation-filter" class="shrink-0 text-sm text-green-300">
        Generations
    </p>
    <div
        class="flex shrink-0 items-center gap-3"
        role="group"
        aria-labelledby="generation-filter"
    >
        {#each filter.generations as generation (generation.id)}
            <label
                class="inline-flex shrink-0 cursor-pointer items-center gap-1 text-sm"
            >
                <span>{generation.roman}</span>
                <input
                    type="checkbox"
                    class="accent-green-300"
                    checked={filter.selected.has(generation.id)}
                    onchange={() => filter.toggle(generation.id)}
                />
            </label>
        {/each}
    </div>
</div>
