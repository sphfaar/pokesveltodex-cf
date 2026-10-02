import { pokeVfxs } from "#lib/types_videos/index.js";

const clipByKey = new Map<string, string>();

function pickClip(poketype: string, pokerank: number): string {
  const keys: string[] = [];
  for (const key in pokeVfxs) {
    if (key.startsWith(poketype)) keys.push(key);
  }
  if (keys.length === 0) return "";
  if (keys.length > 1 && pokerank > 1) {
    return pokeVfxs[keys[Math.ceil(Math.random() * (keys.length - 1))]] ?? "";
  }
  return pokeVfxs[keys[0]] ?? "";
}

/** Same species keeps the clip it rolled the first time it mounted. */
export function clipFor(clipKey: string, poketype: string, pokerank: number): string {
  const cached = clipByKey.get(clipKey);
  if (cached !== undefined) return cached;
  const src = pickClip(poketype, pokerank);
  clipByKey.set(clipKey, src);
  return src;
}
