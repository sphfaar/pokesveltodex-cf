<script lang="ts">
  import { pokeVfxs } from "$lib/types_videos";
  import { onMount } from "svelte";
  import { viewport } from "$lib/viewport";

  let { poketype, pokerank }: { poketype: string; pokerank: number } = $props();

  async function handlePlay(element: HTMLElement) {
    if (!(element instanceof HTMLVideoElement)) return;
    if (element.childElementCount > 1) {
      if (element.paused) {
        try {
          await element.play();
        } catch (err) {
          console.error("Video not played (know error)", err);
        }
      }
    }
  }

  async function handlePause(element: HTMLElement) {
    if (!(element instanceof HTMLVideoElement)) return;
    if (element.childElementCount > 1) {
      if (!element.paused) {
        try {
          element.pause();
        } catch (err) {
          console.error("Video not paused", err);
        }
      }
    }
  }

  let pokeVfxSrc = $state("");

  function handleSrcVfx(vfx: string) {
    const pokeVfxKeys: string[] = [];
    for (let key in pokeVfxs) {
      if (key.startsWith(vfx)) {
        pokeVfxKeys.push(key);
      }
    }
    if (pokeVfxKeys.length > 1 && pokerank > 1) {
      return pokeVfxs[
        pokeVfxKeys[Math.ceil(Math.random() * (pokeVfxKeys.length - 1))]
      ];
    }
    return pokeVfxs[pokeVfxKeys[0]];
  }
  onMount(() => {
    pokeVfxSrc = handleSrcVfx(poketype);
  });
</script>

{#if pokeVfxSrc}
  <video
    {@attach viewport({
      onenterViewport: handlePlay,
      onexitViewport: handlePause,
    })}
    loop={true}
    muted={true}
    preload="none"
    playsinline={true}
    disablepictureinpicture={true}
    class="w-full h-full object-cover"
  >
    <source src={pokeVfxSrc} type="video/webm" />
    <track kind="captions" />
  </video>
{/if}
