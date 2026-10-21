/**
 * Expansion logo files use Scrydex / Pokémon TCG API ids
 * (`sv3`, `base1_ja`, `tcgp-A1`). TCGdex, which supplies the searchable
 * catalogue, uses a close but not identical id (`sv03.5`, `PMCG1`, `P-A`).
 */

const ENGLISH_LOGO: Record<string, string> = {
	"2011bw": "mcd11",
	"2012bw": "mcd12",
	"2014xy": "mcd14",
	"2015xy": "mcd15",
	"2016xy": "mcd16",
	"2017sm": "mcd17",
	"2018sm": "mcd18",
	"2019sm": "mcd19",
	"2021swsh": "mcd21",
	"2022swsh": "mcd22",
	"2023sv": "mcd23",
	"2024sv": "mcd24",
	cel25cc: "cel25c",
	fut2020: "fut20",
	hgssp: "hsp",
	lc: "base6",
	"sv10.5b": "zsv10pt5",
	"sv10.5w": "rsv10pt5",
	"swsh10.5": "pgo",
	"tk-ex-latia": "tk1a",
	"tk-ex-latio": "tk1b",
	"tk-ex-m": "tk2b",
	"tk-ex-p": "tk2a",
};

/** Japanese TCGdex ids that are not just the logo stem in another case. */
const JAPANESE_LOGO: Record<string, string> = {
	PMCG1: "base1_ja",
	PMCG2: "base2_ja",
	PMCG3: "base3_ja",
	PMCG4: "base4_ja",
	E1: "ecard1_ja",
	E2: "ecard2_ja",
	E3: "ecard3_ja",
	E4: "ecard4_ja",
	E5: "ecard5_ja",
	L1a: "l1hg_ja",
	L1b: "l1ss_ja",
	LL: "ll1_ja",
	"M-P": "mp_ja",
	S1W: "swsh1w_ja",
	S1H: "swsh1h_ja",
	S1a: "swsh1a_ja",
	S2: "swsh2_ja",
	S2a: "swsh2a_ja",
	S3: "swsh3_ja",
	S3a: "swsh3a_ja",
	S4: "swsh4_ja",
	S4a: "swsh4a_ja",
	S5I: "swsh5i_ja",
	S5R: "swsh5r_ja",
	S5a: "swsh5a_ja",
	S6a: "swsh6a_ja",
	S6H: "swsh6h_ja",
	S6K: "swsh6k_ja",
	S7D: "swsh7d_ja",
	S7R: "swsh7r_ja",
	S8: "swsh8_ja",
	S8a: "swsh8a_ja",
	S8b: "swsh8b_ja",
	S9: "swsh9_ja",
	S9a: "swsh9a_ja",
	S10D: "swsh10d_ja",
	S10P: "swsh10p_ja",
	S10a: "swsh10a_ja",
	S10b: "swsh10b_ja",
	S11: "swsh11_ja",
	S11a: "swsh11a_ja",
	S12: "swsh12_ja",
	S12a: "swsh12a_ja",
	"SV-P": "svp_ja",
	XY1a: "xy1x_ja",
	XY1b: "xy1y_ja",
	XY5a: "xy5g_ja",
	XY5b: "xy5t_ja",
	XY8a: "xy8r_ja",
	XY11a: "xy11f_ja",
	XY11b: "xy11c_ja",
};

export function englishLogoId(setId: string): string {
	const mapped = ENGLISH_LOGO[setId];
	if (mapped) return mapped;
	let id = setId;
	// Champion's Path, Shining Fates, Shining Legends, and Dragon Majesty
	// dropped the decimal instead of using the later "pt5" spelling.
	if (/^swsh(?!12(?:\.5|$))/.test(id) && id.includes(".5")) id = id.replace(".", "");
	if (/^sm\d+\.5/.test(id)) id = id.replace(".", "");
	id = id.replaceAll(".5", "pt5");
	id = id.replace(/\d+/g, (digits) => String(Number(digits)));
	return id;
}

export function japaneseLogoId(setId: string): string {
	return JAPANESE_LOGO[setId] ?? `${setId.toLowerCase()}_ja`;
}

export function pocketLogoId(setId: string): string {
	return `tcgp-${setId.replaceAll("-", "")}`;
}

/** Printed number as images.pokemontcg.io names the file. */
export function cardImageNumber(localId: string): string {
	if (/^\d+$/.test(localId)) return String(Number(localId));
	return localId;
}

export function pokemontcgImages(setId: string, localId: string): { small: string; large: string } {
	const number = cardImageNumber(localId);
	const base = `https://images.pokemontcg.io/${setId}/${number}`;
	return { small: `${base}.png`, large: `${base}_hires.png` };
}

/** Scrydex serves newer sets that images.pokemontcg.io has not published. */
export function scrydexImages(setId: string, localId: string): { small: string; large: string } {
	const number = cardImageNumber(localId);
	const base = `https://images.scrydex.com/pokemon/${setId}-${number}`;
	return { small: `${base}/small`, large: `${base}/large` };
}

const TCGDEX_ASSETS = "https://assets.tcgdex.net";

/** Scan base from the catalogue. Only an https TCGdex asset URL is turned into a file. */
export function tcgdexImages(image: string | null | undefined): { small: string; large: string } | null {
	if (!image) return null;
	let url: URL;
	try {
		url = new URL(image);
	} catch {
		return null;
	}
	url.username = "";
	url.password = "";
	if (url.origin !== TCGDEX_ASSETS || url.search !== "" || url.hash !== "") return null;
	const path = url.pathname.replace(/\/+$/, "");
	if (path === "") return null;
	const base = `${TCGDEX_ASSETS}${path}`;
	return { small: `${base}/low.webp`, large: `${base}/high.webp` };
}

export function setIdFromCard(cardId: string, localId: string): string {
	const suffix = `-${localId}`;
	if (cardId.endsWith(suffix)) return cardId.slice(0, -suffix.length);
	const split = cardId.lastIndexOf("-");
	return split === -1 ? cardId : cardId.slice(0, split);
}
