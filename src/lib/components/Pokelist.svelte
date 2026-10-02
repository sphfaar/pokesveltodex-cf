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

  let {
    pokespeciesList,
    restoreScrollY = 0,
  }: { pokespeciesList: Result[]; restoreScrollY?: number } = $props();

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
    // History scroll lands after this attachment. Hold the saved offset so the
    // warm band mounts the row the user left, until the viewport arrives there.
    let pendingRestore = restoreScrollY > 0;

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
      if (pendingRestore && Math.abs(nextScroll - restoreScrollY) <= 2) {
        pendingRestore = false;
      }

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
      const followedScroll = pendingRestore ? restoreScrollY : nextScroll;
      if (seenScroll !== followedScroll) {
        seenScroll = followedScroll;
        scrollY = followedScroll;
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

    const onScroll = () => {
      // Ignore a leftover 0 from the detail page. A real move that is not the
      // saved offset means the user scrolled, so follow the viewport again.
      if (
        pendingRestore &&
        window.scrollY > 1 &&
        Math.abs(window.scrollY - restoreScrollY) > 2
      ) {
        pendingRestore = false;
      }
      schedule();
    };

    read();
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
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
