import type { Chain } from "./types";

const idFromUrlRgx = /(\d+)(?=\/$)/g;
export class PokeRecursion {
  pokeName: string;
  chain: Chain;
  isFirst: boolean;

  constructor(pokeName: string, chain: Chain, isFirst: boolean) {
    this.pokeName = pokeName;
    this.chain = chain;
    this.isFirst = isFirst;
    this.recursion = this.recursion.bind(this);
  }

  static idFromUrlRgx = /(\d+)(?=\/$)/g;

  get evoRank() {
    return this.recursion(this.chain, this.isFirst);
  }

  recursion(chain: Chain | Chain[], isFirst: boolean): number {
    // multievolution case, like eevee evolutions
    if (Array.isArray(chain)) {
      let id1 = parseInt(chain[0].species.url.match(idFromUrlRgx)[0]);
      for (let i = 0; i < chain.length - 1; i++) {
        const id2 = parseInt(chain[i + 1].species.url.match(idFromUrlRgx)[0]);
        if (id1 + 1 === id2) {
          if (this.pokeName === chain[i].species.name) {
            if (isFirst) return 1;
            return 2;
          }
          isFirst = false;
        } else if (this.pokeName === chain[i].species.name) {
          if (isFirst) return 0;
          return 3;
        } else {
          isFirst = true;
        }
        id1 = id2;
      }
      // checks if it's the last one
      if (this.pokeName === chain[chain.length - 1].name) return 3;
      return 0;
    }
    if (chain.evolves_to.length === 0) {
      if (isFirst) return 0;
      if (this.pokeName === chain.species.name) return 3;
      return 0;
    }
    const id1 = parseInt(chain.species.url.match(idFromUrlRgx)[0]);
    const id2 = parseInt(chain.evolves_to[0].species.url.match(idFromUrlRgx)[0]);
    if (id1 + 1 === id2) {
      if (this.pokeName === chain.species.name) {
        if (isFirst) return 1;
        return 2;
      }
      if (chain.evolves_to.length > 1) return this.recursion(chain.evolves_to, this.isFirst);
      return this.recursion(chain.evolves_to[0], this.isFirst);
    }
    if (this.pokeName === chain.species.name) {
      if (isFirst) return 0;
      return 3;
    }
    // required for baby pokemon case, the first in chain has always higher id
    if (chain.evolves_to.length > 1) return this.recursion(chain.evolves_to, true);
    return this.recursion(chain.evolves_to[0], true);
  }
}
