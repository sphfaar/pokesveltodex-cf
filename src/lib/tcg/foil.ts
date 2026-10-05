import type { Foil } from "./types.js";

interface Variants {
	holo?: boolean | null;
	reverse?: boolean | null;
}

/**
 * Pick a foil treatment from the printed rarity. Reverse is used only when the
 * rarity itself says so, because the catalogue flags most modern commons as
 * having a reverse printing without that being a separate card.
 */
export function foilFor(
	rarity: string | null | undefined,
	name: string,
	variants?: Variants | null,
): Foil {
	const rarityText = (rarity ?? "").toLowerCase();
	const nameText = name.toLowerCase();

	if (rarityText.includes("crown") || rarityText.includes("star")) return "secret";
	if (rarityText.includes("diamond")) return "pocket";
	if (rarityText.includes("pikachu rare")) return "holo";
	if (
		rarityText.includes("secret") ||
		rarityText.includes("hyper") ||
		rarityText.includes("gold") ||
		rarityText.includes("rainbow") ||
		rarityText.includes("illustration") ||
		rarityText.includes("special art") ||
		rarityText.includes("art rare") ||
		rarityText.includes("ultra")
	) {
		return "secret";
	}
	if (rarityText.includes("radiant") || nameText.startsWith("radiant ")) return "radiant";
	if (rarityText.includes("amazing")) return "cosmos";
	if (
		rarityText.includes("vmax") ||
		rarityText.includes("vstar") ||
		nameText.includes("vmax") ||
		nameText.includes("vstar")
	) {
		return "v";
	}
	if (rarityText.includes("holo rare v") || / v$/.test(nameText) || nameText.endsWith("v")) return "v";
	if (
		rarityText.includes("holo") ||
		rarityText.includes("double rare") ||
		variants?.holo ||
		/(?:ex|gx)$/i.test(nameText) ||
		nameText.includes("デルタ") ||
		name.includes("☆") ||
		name.includes("★") ||
		name.includes("δ")
	) {
		return "holo";
	}
	if (rarityText === "rare") return "holo";
	if (rarityText.includes("reverse")) return "reverse";
	return "basic";
}
