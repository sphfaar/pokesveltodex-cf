/** Home-dex region cards, and which introduced species belong to each region. */

export type StarterArt = "browt" | "pombon" | "gecqua";

export type RegionStarter = {
  name: string;
  /** National dex id. Artwork comes from the Pokémon HOME sprite. */
  id?: number;
  /** Bundled artwork for a species that is not on PokeAPI yet. */
  art?: StarterArt;
};

export type RegionGame = {
  label: string;
  /** Left side of a split pill, or the whole pill when `right` is absent. */
  left: string;
  right?: string;
};

export type DexRegion = {
  id: string;
  name: string;
  header: string;
  starters: RegionStarter[];
  games: RegionGame[];
};

const HOME_SPRITE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home";

/** Species introduced in Hisui. The rest of generation 8 belongs to Galar. */
const HISUI_FIRST = 899;
const HISUI_LAST = 905;

export const REGIONS: DexRegion[] = [
  {
    id: "kanto",
    name: "Kanto",
    header: "#a4c967",
    starters: [
      { name: "Bulbasaur", id: 1 },
      { name: "Charmander", id: 4 },
      { name: "Squirtle", id: 7 },
    ],
    games: [
      { label: "Red & Blue", left: "#da3b17", right: "#3052d8" },
      { label: "Yellow", left: "#f7d031" },
      { label: "FireRed & LeafGreen", left: "#dd5400", right: "#90c700" },
      {
        label: "Let's Go, Pikachu!\n& Let's Go, Eevee!",
        left: "#e9d024",
        right: "#c88a47",
      },
    ],
  },
  {
    id: "johto",
    name: "Johto",
    header: "#d3cd72",
    starters: [
      { name: "Chikorita", id: 152 },
      { name: "Cyndaquil", id: 155 },
      { name: "Totodile", id: 158 },
    ],
    games: [
      { label: "Gold & Silver", left: "#d4a01f", right: "#bbbbbb" },
      { label: "Crystal", left: "#4cd1f6" },
      { label: "HeartGold &\nSoulSilver", left: "#e5b201", right: "#a7b6cc" },
    ],
  },
  {
    id: "hoenn",
    name: "Hoenn",
    header: "#95cdbf",
    starters: [
      { name: "Treecko", id: 252 },
      { name: "Torchic", id: 255 },
      { name: "Mudkip", id: 258 },
    ],
    games: [
      { label: "Ruby & Sapphire", left: "#cf2e41", right: "#4458aa" },
      { label: "Emerald", left: "#0a9a59" },
      {
        label: "Omega Ruby\n& Alpha Sapphire",
        left: "#ad2f1a",
        right: "#2e6a9f",
      },
    ],
  },
  {
    id: "sinnoh",
    name: "Sinnoh",
    header: "#ae9bba",
    starters: [
      { name: "Turtwig", id: 387 },
      { name: "Chimchar", id: 390 },
      { name: "Piplup", id: 393 },
    ],
    games: [
      { label: "Diamond & Pearl", left: "#8ab6e3", right: "#d577ab" },
      { label: "Platinum", left: "#9b9b88" },
      {
        label: "Brilliant Diamond\n& Shining Pearl",
        left: "#40b1da",
        right: "#cf7691",
      },
    ],
  },
  {
    id: "unova",
    name: "Unova",
    header: "#99c2d7",
    starters: [
      { name: "Snivy", id: 495 },
      { name: "Tepig", id: 498 },
      { name: "Oshawott", id: 501 },
    ],
    games: [
      { label: "Black & White", left: "#4a4a4a", right: "#949494" },
      { label: "Black 2 & White 2", left: "#3a485a", right: "#9c8483" },
    ],
  },
  {
    id: "kalos",
    name: "Kalos",
    header: "#d45c86",
    starters: [
      { name: "Chespin", id: 650 },
      { name: "Fennekin", id: 653 },
      { name: "Froakie", id: 656 },
    ],
    games: [
      { label: "X & Y (Central)", left: "#0962a8", right: "#ea2346" },
      { label: "X & Y (Coastal)", left: "#0962a8", right: "#ea2346" },
      { label: "X & Y (Mountain)", left: "#0962a8", right: "#ea2346" },
    ],
  },
  {
    id: "alola",
    name: "Alola",
    header: "#df8e7e",
    starters: [
      { name: "Rowlet", id: 722 },
      { name: "Litten", id: 725 },
      { name: "Popplio", id: 728 },
    ],
    games: [
      { label: "Sun & Moon", left: "#ef902a", right: "#5498c8" },
      { label: "Ultra Sun & Ultra\nMoon", left: "#e85b2b", right: "#226db5" },
    ],
  },
  {
    id: "galar",
    name: "Galar",
    header: "#c077b8",
    starters: [
      { name: "Grookey", id: 810 },
      { name: "Scorbunny", id: 813 },
      { name: "Sobble", id: 816 },
    ],
    games: [
      { label: "Sword & Shield", left: "#0ba5e9", right: "#c00754" },
      { label: "The Isle of Armor", left: "#edc30a" },
      { label: "The Crown Tundra", left: "#13a462" },
    ],
  },
  {
    id: "hisui",
    name: "Hisui",
    header: "#788ea3",
    starters: [
      { name: "Rowlet", id: 722 },
      { name: "Cyndaquil", id: 155 },
      { name: "Oshawott", id: 501 },
    ],
    games: [{ label: "Legends: Arceus", left: "#426383" }],
  },
  {
    id: "paldea",
    name: "Paldea",
    header: "#dbc054",
    starters: [
      { name: "Sprigatito", id: 906 },
      { name: "Fuecoco", id: 909 },
      { name: "Quaxly", id: 912 },
    ],
    games: [
      { label: "Scarlet & Violet", left: "#f34a3d", right: "#893eba" },
      { label: "The Teal Mask\n(Kitakami)", left: "#11a99f" },
      { label: "The Indigo Disk\n(Blueberry)", left: "#0c517e" },
    ],
  },
  {
    id: "lumiose",
    name: "Lumiose City",
    header: "#77b7ce",
    starters: [
      { name: "Chikorita", id: 152 },
      { name: "Tepig", id: 498 },
      { name: "Totodile", id: 158 },
    ],
    games: [
      { label: "Legends: Z-A", left: "#3acc5e" },
      { label: "Mega Dimension", left: "#c986de" },
      { label: "Mega Evolution", left: "#48add2", right: "#4b4b4b" },
    ],
  },
  {
    id: "unknown",
    name: "???",
    header: "#9abdb3",
    starters: [
      { name: "Browt", art: "browt" },
      { name: "Pombon", art: "pombon" },
      { name: "Gecqua", art: "gecqua" },
    ],
    games: [{ label: "Winds & Waves", left: "#6be7a7", right: "#106fe4" }],
  },
];

export const REGION_IDS = REGIONS.map((region) => region.id);

/**
 * Region a species was introduced in. Lumiose City has no new species.
 * Generation 10 and later belong to the unnamed Winds & Waves region.
 */
export function regionIdFor(id: number, generationId: number): string {
  switch (generationId) {
    case 1:
      return "kanto";
    case 2:
      return "johto";
    case 3:
      return "hoenn";
    case 4:
      return "sinnoh";
    case 5:
      return "unova";
    case 6:
      return "kalos";
    case 7:
      return "alola";
    case 8:
      return id >= HISUI_FIRST && id <= HISUI_LAST ? "hisui" : "galar";
    case 9:
      return "paldea";
    default:
      return "unknown";
  }
}

export function starterSprite(starter: RegionStarter, art: Record<StarterArt, string>): string {
  if (starter.art) return art[starter.art];
  return `${HOME_SPRITE}/${starter.id}.png`;
}

/** Flat fill, or the diagonal split used on paired versions. */
export function gameBackground(game: RegionGame): string {
  if (!game.right) return game.left;
  return `linear-gradient(135deg, ${game.left} 50%, ${game.right} 50%)`;
}
