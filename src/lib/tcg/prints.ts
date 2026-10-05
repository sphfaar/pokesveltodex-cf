import { foilFor } from "./foil.js";
import {
	englishLogoId,
	japaneseLogoId,
	pocketLogoId,
	pokemontcgImages,
	scrydexImages,
	setIdFromCard,
	tcgdexImages,
} from "./ids.js";
import type { TcgCard, TcgExpansion, TcgPrints } from "./types.js";

const TCGDEX = "https://api.tcgdex.net/v2";
const GRAPHQL = `${TCGDEX}/graphql`;
const CACHE_MS = 60 * 60 * 1000;

interface Variants {
	holo?: boolean | null;
	reverse?: boolean | null;
}

interface GqlCard {
	id: string;
	name: string;
	localId: string;
	rarity: string | null;
	image: string | null;
	variants: Variants | null;
	set: { id: string };
}

interface GqlSet {
	id: string;
	name: string;
	releaseDate: string | null;
	cardCount: { official: number; total: number };
	serie: { id: string } | null;
}

interface JaBrief {
	id: string;
	localId: string;
	name: string;
	image?: string | null;
}

interface JaSetPayload {
	id: string;
	name: string;
	releaseDate?: string | null;
	cardCount?: { official?: number; total?: number };
	serie?: { id: string };
	cards?: { id: string; image?: string | null; localId: string; name: string }[];
}

interface SetMeta {
	id: string;
	name: string;
	releaseDate: string | null;
	total: number;
	pocket: boolean;
}

interface JaMeta {
	name: string;
	releaseDate: string | null;
	total: number;
	images: Map<string, string>;
}

const printsCache = new Map<number, { at: number; value: Promise<TcgPrints> }>();
let englishSets: Promise<Map<string, SetMeta>> | null = null;
const japaneseSets = new Map<string, Promise<JaMeta>>();

export function loadPrints(dexId: number): Promise<TcgPrints> {
	const hit = printsCache.get(dexId);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
	const value = buildPrints(dexId).catch((error: unknown) => {
		printsCache.delete(dexId);
		throw error;
	});
	printsCache.set(dexId, { at: Date.now(), value });
	return value;
}

async function buildPrints(dexId: number): Promise<TcgPrints> {
	const [english, japanese] = await Promise.all([
		loadEnglish(dexId).catch(() => [] as TcgExpansion[]),
		loadJapanese(dexId).catch(() => [] as TcgExpansion[]),
	]);
	const en: TcgExpansion[] = [];
	const pocket: TcgExpansion[] = [];
	for (const expansion of english) {
		if (expansion.id.startsWith("tcgp:")) pocket.push({ ...expansion, id: expansion.id.slice(5) });
		else en.push(expansion);
	}
	return { en, ja: japanese, pocket };
}

async function loadEnglish(dexId: number): Promise<TcgExpansion[]> {
	const [sets, cards] = await Promise.all([englishCatalogue(), englishCards(dexId)]);
	const groups = new Map<string, TcgCard[]>();
	for (const card of cards) {
		const meta = sets.get(card.set.id);
		const pocket = meta?.pocket ?? isPocketId(card.set.id);
		const logoId = pocket ? pocketLogoId(card.set.id) : englishLogoId(card.set.id);
		const scans = tcgdexImages(card.image);
		const ptcg = pocket ? null : pokemontcgImages(logoId, card.localId);
		const printed: TcgCard = {
			id: card.id,
			name: card.name,
			number: cardImageLabel(card.localId),
			rarity: card.rarity && card.rarity !== "None" ? card.rarity : "",
			foil: foilFor(card.rarity, card.name, card.variants),
			...pictureFields(ptcg, scans, scrydexImages(logoId, card.localId)),
		};
		const key = `${pocket ? "tcgp:" : ""}${card.set.id}`;
		const list = groups.get(key);
		if (list) list.push(printed);
		else groups.set(key, [printed]);
	}
	return groupExpansions(groups, (key) => {
		const pocket = key.startsWith("tcgp:");
		const id = pocket ? key.slice(5) : key;
		const meta = sets.get(id);
		return {
			id: key,
			logoId: pocket ? pocketLogoId(id) : englishLogoId(id),
			name: meta?.name ?? id,
			releaseDate: meta?.releaseDate ?? null,
			cardCount: meta?.total ?? 0,
		};
	});
}

async function loadJapanese(dexId: number): Promise<TcgExpansion[]> {
	const cards = await getJson<JaBrief[]>(`${TCGDEX}/ja/cards?dexId=eq:${dexId}`);
	const bySet = new Map<string, JaBrief[]>();
	for (const card of cards) {
		const setId = setIdFromCard(card.id, card.localId);
		const list = bySet.get(setId);
		if (list) list.push(card);
		else bySet.set(setId, [card]);
	}
	const metas = new Map<string, JaMeta>();
	await pool([...bySet.keys()], 8, async (setId) => {
		metas.set(setId, await japaneseSet(setId));
	});
	const groups = new Map<string, TcgCard[]>();
	for (const [setId, prints] of bySet) {
		const meta = metas.get(setId);
		const printed = prints.map((card) => {
			const base = card.image ?? meta?.images.get(card.id) ?? null;
			const scans = tcgdexImages(base);
			return {
				id: card.id,
				name: card.name,
				number: card.localId,
				rarity: "",
				foil: foilFor(null, card.name, null),
				...pictureFields(null, scans, scrydexImages(japaneseLogoId(setId), card.localId)),
			} satisfies TcgCard;
		});
		groups.set(setId, printed);
	}
	return groupExpansions(groups, (setId) => {
		const meta = metas.get(setId);
		return {
			id: setId,
			logoId: japaneseLogoId(setId),
			name: meta?.name ?? setId,
			releaseDate: meta?.releaseDate ?? null,
			cardCount: meta?.total ?? 0,
		};
	});
}

function groupExpansions(
	groups: Map<string, TcgCard[]>,
	metaFor: (key: string) => Omit<TcgExpansion, "cards">,
): TcgExpansion[] {
	const expansions: TcgExpansion[] = [];
	for (const [key, cards] of groups) {
		cards.sort(byNumber);
		const meta = metaFor(key);
		expansions.push({
			...meta,
			cardCount: meta.cardCount > 0 ? meta.cardCount : cards.length,
			cards,
		});
	}
	expansions.sort(byRelease);
	return expansions;
}

async function englishCatalogue(): Promise<Map<string, SetMeta>> {
	englishSets ??= fetchEnglishSets().catch((error: unknown) => {
		englishSets = null;
		throw error;
	});
	return englishSets;
}

async function fetchEnglishSets(): Promise<Map<string, SetMeta>> {
	const data = await graphql<{ sets: GqlSet[] }>(
		`{ sets { id name releaseDate cardCount { official total } serie { id } } }`,
	);
	const map = new Map<string, SetMeta>();
	for (const set of data.sets) {
		map.set(set.id, {
			id: set.id,
			name: set.name,
			releaseDate: set.releaseDate,
			total: set.cardCount?.total ?? set.cardCount?.official ?? 0,
			pocket: set.serie?.id === "tcgp" || isPocketId(set.id),
		});
	}
	return map;
}

async function englishCards(dexId: number): Promise<GqlCard[]> {
	const cards: GqlCard[] = [];
	for (let page = 1; page <= 12; page += 1) {
		const data = await graphql<{ cards: GqlCard[] }>(
			`query Cards($dex: Int!, $page: Int!) {
				cards(filters: { dexId: $dex }, pagination: { page: $page, itemsPerPage: 200 }) {
					id name localId rarity image
					variants { holo reverse normal }
					set { id }
				}
			}`,
			{ dex: dexId, page },
		);
		cards.push(...data.cards);
		if (data.cards.length < 200) break;
	}
	return cards;
}

function japaneseSet(setId: string): Promise<JaMeta> {
	const cached = japaneseSets.get(setId);
	if (cached) return cached;
	const pending = fetchJapaneseSet(setId).catch((error: unknown) => {
		japaneseSets.delete(setId);
		throw error;
	});
	japaneseSets.set(setId, pending);
	return pending;
}

async function fetchJapaneseSet(setId: string): Promise<JaMeta> {
	const set = await getJson<JaSetPayload>(`${TCGDEX}/ja/sets/${encodeURIComponent(setId)}`);
	const images = new Map<string, string>();
	for (const card of set.cards ?? []) {
		if (card.image) images.set(card.id, card.image);
	}
	return {
		name: set.name,
		releaseDate: set.releaseDate ?? null,
		total: set.cardCount?.total ?? set.cardCount?.official ?? 0,
		images,
	};
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
	const response = await fetch(GRAPHQL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ query, variables }),
		signal: AbortSignal.timeout(25_000),
	});
	if (!response.ok) throw new Error(`TCGdex GraphQL ${response.status}`);
	const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
	if (body.errors?.length) throw new Error(body.errors[0].message);
	if (!body.data) throw new Error("TCGdex GraphQL returned no data");
	return body.data;
}

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return (await response.json()) as T;
}

function isPocketId(setId: string): boolean {
	return setId.startsWith("P-") || /^[AB]\d/.test(setId);
}

function cardImageLabel(localId: string): string {
	if (/^\d+$/.test(localId)) return String(Number(localId));
	return localId;
}

function pictureFields(
	preferred: { small: string; large: string } | null,
	scans: { small: string; large: string } | null,
	scrydex: { small: string; large: string },
): Pick<TcgCard, "image" | "imageLarge" | "fallbackImage" | "fallbackLarge" | "extraImage" | "extraLarge"> {
	const small = [preferred?.small, scans?.small, scrydex.small].filter((url): url is string => Boolean(url));
	const large = [preferred?.large, scans?.large, scrydex.large].filter((url): url is string => Boolean(url));
	return {
		image: small[0] ?? "",
		imageLarge: large[0] ?? "",
		fallbackImage: small[1] ?? null,
		fallbackLarge: large[1] ?? null,
		extraImage: small[2] ?? null,
		extraLarge: large[2] ?? null,
	};
}

function byNumber(a: TcgCard, b: TcgCard): number {
	const an = Number(a.number.replace(/\D/g, "")) || 0;
	const bn = Number(b.number.replace(/\D/g, "")) || 0;
	if (an !== bn) return an - bn;
	return a.number.localeCompare(b.number);
}

function byRelease(a: TcgExpansion, b: TcgExpansion): number {
	if (a.releaseDate && b.releaseDate && a.releaseDate !== b.releaseDate) {
		return b.releaseDate.localeCompare(a.releaseDate);
	}
	if (a.releaseDate && !b.releaseDate) return -1;
	if (!a.releaseDate && b.releaseDate) return 1;
	return a.name.localeCompare(b.name);
}

async function pool<T>(items: T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
	if (items.length === 0) return;
	let index = 0;
	const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
		while (index < items.length) {
			const current = items[index];
			index += 1;
			await task(current);
		}
	});
	await Promise.all(workers);
}
