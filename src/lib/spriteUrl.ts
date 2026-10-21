const POKE_SPRITES = "https://raw.githubusercontent.com";
const SPRITE_PREFIX = "/PokeAPI/sprites/";

/** Pokémon sprite or official artwork. Only an https PokéAPI sprite URL is returned. */
export function pokeSpriteUrl(raw: string | null | undefined): string | null {
	if (typeof raw !== "string" || raw === "") return null;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	url.username = "";
	url.password = "";
	if (url.origin !== POKE_SPRITES || url.search !== "" || url.hash !== "") return null;
	if (!url.pathname.startsWith(SPRITE_PREFIX) || url.pathname.length === SPRITE_PREFIX.length) return null;
	return `${POKE_SPRITES}${url.pathname}`;
}
