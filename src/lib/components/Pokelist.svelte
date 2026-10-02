<script lang="ts">
  import type { Result } from "#lib/types.js";
  import { resolve } from "$app/paths";
  import Pokecard from "./Pokecard.svelte";
  import {
    INITIAL_WARM,
    POKE_CELL_HEIGHT,
    POKE_MIN_TRACK,
    columnsForWidth,
    indexRange,
  } from "#lib/pokeWindow.js";

  let { pokespeciesList }: { pokespeciesList: Result[] } = $props();

  let measured = $state(false);
  let scrollY = $state(0);
  let viewportH = $state(0);
  let listTop = $state(0);
  let padTop = $state(0);
  let listWidth = $state(0);
  let padX = $state(0);
  let gapX = $state(8);
  let gapY = $state(8);

  let columns = $derived(
    measured ? columnsForWidth(listWidth - padX, POKE_MIN_TRACK, gapX) : 1,
  );

  function bounds() {
    const count = pokespeciesList.length;
    if (!measured) return { start: 0, end: Math.min(count, INITIAL_WARM) };
    return indexRange({
      count,
      columns,
      cellHeight: POKE_CELL_HEIGHT,
      rowGap: gapY,
      listTop,
      padTop,
      scrollY,
      viewportH,
    });
  }

  // Numbers compare by value, so a scroll that stays inside the same rows
  // does not re-render the grid.
  let warmStart = $derived(bounds().start);
  let warmEnd = $derived(bounds().end);

  function trackList(element: Element) {
    if (!(element instanceof HTMLElement)) return;
    let frame = 0;
    // Locals, not state reads: an attachment re-runs when it reads $state.
    let seenGapX = Number.NaN;
    let seenGapY = Number.NaN;
    let seenPadX = Number.NaN;
    let seenPadTop = Number.NaN;
    let seenWidth = Number.NaN;
    let seenTop = Number.NaN;
    let seenScroll = Number.NaN;
    let seenView = Number.NaN;
    let seenMeasured = false;

    const read = () => {
      frame = 0;
      const styles = getComputedStyle(element);
      const nextGapX = Number.parseFloat(styles.columnGap) || 0;
      const nextGapY = Number.parseFloat(styles.rowGap) || 0;
      const nextPadX =
        (Number.parseFloat(styles.paddingLeft) || 0) +
        (Number.parseFloat(styles.paddingRight) || 0);
      const nextPadTop = Number.parseFloat(styles.paddingTop) || 0;
      const nextWidth = element.clientWidth;
      const nextTop = element.getBoundingClientRect().top + window.scrollY;
      const nextScroll = window.scrollY;
      const nextView = window.innerHeight;

      if (seenGapX !== nextGapX) {
        seenGapX = nextGapX;
        gapX = nextGapX;
      }
      if (seenGapY !== nextGapY) {
        seenGapY = nextGapY;
        gapY = nextGapY;
      }
      if (seenPadX !== nextPadX) {
        seenPadX = nextPadX;
        padX = nextPadX;
      }
      if (seenPadTop !== nextPadTop) {
        seenPadTop = nextPadTop;
        padTop = nextPadTop;
      }
      if (seenWidth !== nextWidth) {
        seenWidth = nextWidth;
        listWidth = nextWidth;
      }
      if (!(Math.abs(seenTop - nextTop) <= 1)) {
        seenTop = nextTop;
        listTop = nextTop;
      }
      if (seenScroll !== nextScroll) {
        seenScroll = nextScroll;
        scrollY = nextScroll;
      }
      if (seenView !== nextView) {
        seenView = nextView;
        viewportH = nextView;
      }
      if (!seenMeasured) {
        seenMeasured = true;
        measured = true;
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }
</script>

<ul
  class="grid grid-cols-pokegrid gap-2 p-6 [overflow-anchor:none]"
  style:--poke-cell="{POKE_CELL_HEIGHT}px"
  {@attach trackList}
>
  {#each pokespeciesList as pokemon, index (pokemon.name)}
    <li class="poke-cell">
      <div class="poke-skip">
        {#if index >= warmStart && index < warmEnd}
          <Pokecard name={pokemon.name} url={pokemon.url} />
        {:else}
          <a
            class="block h-full pt-2 text-center font-thin text-gray-400 italic capitalize"
            href={resolve("/pokemon/[slug]", { slug: pokemon.name })}
          >
            {pokemon.name}
          </a>
        {/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  .poke-cell {
    box-sizing: border-box;
    height: var(--poke-cell);
    padding-block: 0.75rem;
    overflow: hidden;
  }

  .poke-skip {
    height: 100%;
    content-visibility: auto;
    contain-intrinsic-size: auto var(--poke-cell);
  }
</style>
