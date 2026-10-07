<script lang="ts">
    import { ChevronsDownUp, ChevronsUpDown } from "@lucide/svelte";
    import browt from "#lib/images/starters/browt.webp";
    import gecqua from "#lib/images/starters/gecqua.webp";
    import pombon from "#lib/images/starters/pombon.webp";
    import { getGenerationFilter } from "#lib/generationFilter.svelte.js";
    import {
        gameBackground,
        starterSprite,
        type DexRegion,
        type StarterArt,
    } from "#lib/regions.js";

    let { region }: { region: DexRegion } = $props();

    const filter = getGenerationFilter();
    const art: Record<StarterArt, string> = { browt, pombon, gecqua };

    let checked = $derived(filter.selectedRegions.has(region.id));
    let expanded = $derived(filter.expandedRegions.has(region.id));
</script>

{#if expanded}
    <article class="w-56 shrink-0 rounded-xl bg-[#e0f2b6] p-2 select-none">
        <div
            class="relative flex items-center rounded-lg px-1.5 py-1.5"
            style:background-color={region.header}
        >
            <label class="z-10 inline-flex cursor-pointer">
                <input
                    type="checkbox"
                    class="size-3.5 accent-green-300"
                    checked={checked}
                    onchange={() => filter.toggleRegion(region.id)}
                />
                <span class="sr-only">{region.name}</span>
            </label>
            <span
                class="pointer-events-none absolute inset-x-8 text-center text-sm font-bold text-black"
                aria-hidden="true">{region.name}</span
            >
            <button
                type="button"
                class="z-10 ml-auto inline-flex cursor-pointer text-black outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                aria-expanded="true"
                aria-label={`Collapse ${region.name}`}
                onclick={() => filter.toggleExpanded(region.id)}
            >
                <ChevronsDownUp size={18} aria-hidden="true" />
            </button>
        </div>
        <div class="flex items-center justify-center py-1">
            {#each region.starters as starter (starter.name)}
                <img
                    class="size-[4.25rem] object-contain"
                    src={starterSprite(starter, art)}
                    alt={starter.name}
                    width="68"
                    height="68"
                    draggable="false"
                />
            {/each}
        </div>
        <ul class="flex flex-col gap-1.5">
            {#each region.games as game (game.label)}
                <li
                    class="rounded-md px-1.5 py-1.5 text-center text-sm leading-tight font-bold whitespace-pre-line text-black"
                    style:background={gameBackground(game)}
                >
                    {game.label}
                </li>
            {/each}
        </ul>
    </article>
{:else}
    <div class="flex shrink-0 items-center gap-1 text-sm select-none">
        <label class="inline-flex cursor-pointer items-center gap-1">
            <input
                type="checkbox"
                class="accent-green-300"
                checked={checked}
                onchange={() => filter.toggleRegion(region.id)}
            />
            <span>{region.name}</span>
        </label>
        <button
            type="button"
            class="inline-flex cursor-pointer text-green-300 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300"
            aria-expanded="false"
            aria-label={`Expand ${region.name}`}
            onclick={() => filter.toggleExpanded(region.id)}
        >
            <ChevronsUpDown size={18} aria-hidden="true" />
        </button>
    </div>
{/if}
