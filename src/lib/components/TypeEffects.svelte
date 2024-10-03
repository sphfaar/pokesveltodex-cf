<script lang="ts">
  import { pokeVfxs } from "$lib/types_videos";
  import { onMount } from "svelte";

  import viewport from "$lib/useViewPortAction";

  export let poketype: string;
  export let pokerank: number;

  async function handlePlay(e: Event) {
    const videoElement = e.target as HTMLVideoElement;
    if (videoElement.childElementCount > 1) {
      if (videoElement.paused) {
        try {
          await videoElement.play();
        } catch (err) {
          console.error("Video not played (know error)", err);
        }
      }
    }
  }

  async function handlePause(e: Event) {
    const videoElement = e.target as HTMLVideoElement;
    if (videoElement.childElementCount > 1) {
      if (!videoElement.paused) {
        try {
          await videoElement.pause();
        } catch (err) {
          console.error("Video not paused", err);
        }
      }
    }
  }

  let pokeVfxSrc: string = "";

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
    use:viewport
    on:enterViewport={handlePlay}
    on:exitViewport={handlePause}
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
