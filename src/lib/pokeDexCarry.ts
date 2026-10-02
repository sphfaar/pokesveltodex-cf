import type { Result } from "./types.js";

/** Client-only list from the last visit to the home dex. The server module stays empty. */
export type CarriedDex = {
  pokespeciesList: Result[];
  nextPokeurl: string | null;
  scrollY: number;
};

let carried: CarriedDex | undefined;

export function carryDex(dex: CarriedDex) {
  carried = dex;
}

export function recallDex(): CarriedDex | undefined {
  return carried;
}
