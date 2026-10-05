export type Foil =
	| "basic"
	| "reverse"
	| "holo"
	| "v"
	| "secret"
	| "radiant"
	| "cosmos"
	| "pocket";

export type TcgRegion = "en" | "ja" | "pocket";

export interface TcgCard {
	id: string;
	name: string;
	number: string;
	rarity: string;
	foil: Foil;
	/** Grid scan. English prints prefer images.pokemontcg.io. */
	image: string;
	/** Large scan used in the inspect view. */
	imageLarge: string;
	fallbackImage: string | null;
	fallbackLarge: string | null;
	/** Third scan, used when the preferred hosts have no picture. */
	extraImage: string | null;
	extraLarge: string | null;
}

export interface TcgExpansion {
	id: string;
	logoId: string;
	name: string;
	/** ISO date YYYY-MM-DD, when the source has one. */
	releaseDate: string | null;
	/** Cards in the expansion, including secret rares when the source counts them. */
	cardCount: number;
	cards: TcgCard[];
}

export interface TcgPrints {
	en: TcgExpansion[];
	ja: TcgExpansion[];
	pocket: TcgExpansion[];
}
