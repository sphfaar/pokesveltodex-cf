<script lang="ts">
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { viewport } from "#lib/viewport.js";
  import { clipFor } from "#lib/pokeClip.js";

  let {
    poketype,
    pokerank,
    clipKey,
  }: { poketype: string; pokerank: number; clipKey: string } = $props();

  let pokeVfxSrc = $state("");
  let video: HTMLVideoElement | undefined;
  let inHotBand = false;

  function play(element: HTMLVideoElement) {
    if (element.childElementCount <= 1) return;
    if (!element.paused) return;
    element.play().catch((err: unknown) => {
      console.error("Video not played (know error)", err);
    });
  }

  function pause(element: HTMLVideoElement) {
    if (element.childElementCount <= 1) return;
    if (element.paused) return;
    try {
      element.pause();
    } catch (err) {
      console.error("Video not paused", err);
    }
  }

  function handlePlay(element: HTMLElement) {
    if (!(element instanceof HTMLVideoElement)) return;
    video = element;
    inHotBand = true;
    if (document.hidden) return;
    play(element);
  }

  function handlePause(element: HTMLElement) {
    if (!(element instanceof HTMLVideoElement)) return;
    video = element;
    inHotBand = false;
    pause(element);
  }

  function onVisibility() {
    if (!video) return;
    if (document.hidden) {
      pause(video);
      return;
    }
    if (inHotBand) play(video);
  }

  // Drop the decoded frame when the warm band unmounts this clip.
  // pause() only stops the clock and keeps the last frame.
  const releaseVideo: Attachment = (element) => {
    return () => {
      if (!(element instanceof HTMLVideoElement)) return;
      element.pause();
      for (const source of element.querySelectorAll("source")) {
        source.removeAttribute("src");
      }
      element.load();
    };
  };

  const hotBand = viewport(
    { onenterViewport: handlePlay, onexitViewport: handlePause },
    { rootMargin: "0px" },
  );

  onMount(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      pokeVfxSrc = media.matches ? "" : clipFor(clipKey, poketype, pokerank);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  });
</script>

<svelte:document onvisibilitychange={onVisibility} />

{#if pokeVfxSrc}
  <video
    {@attach hotBand}
    {@attach releaseVideo}
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
