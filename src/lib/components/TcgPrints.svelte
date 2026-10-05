<script lang="ts">
	import { ChevronsDownUp, ChevronsUpDown } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import TcgCard from "#lib/components/TcgCard.svelte";
	import { expansionLogo } from "#lib/tcg/logos.js";
	import type { TcgCard as Card, TcgExpansion, TcgPrints, TcgRegion } from "#lib/tcg/types.js";

	let { prints }: { prints: TcgPrints } = $props();

	const tabs: { id: TcgRegion; label: string }[] = [
		{ id: "en", label: "EN expansions" },
		{ id: "ja", label: "JP expansions" },
		{ id: "pocket", label: "TCG Pocket" },
	];

	let region = $state<TcgRegion>("en");
	let active = $state<{ card: Card; expansion: string } | null>(null);
	const pointerBus: { aim: (event: PointerEvent) => void } = { aim: () => {} };
	const collapsed = new SvelteSet<string>();

	function focusClose(node: HTMLButtonElement) {
		node.focus();
	}

	let sections = $derived(prints[region]);

	const emptyCopy: Record<TcgRegion, string> = {
		en: "No English expansions include this Pokémon.",
		ja: "No Japanese expansions include this Pokémon.",
		pocket: "No TCG Pocket expansions include this Pokémon.",
	};

	function releaseLabel(iso: string | null): string {
		if (!iso) return "";
		const [year, month, day] = iso.split("-").map(Number);
		if (!year || !month || !day) return iso;
		return new Intl.DateTimeFormat("en", {
			dateStyle: "long",
			timeZone: "UTC",
		}).format(new Date(Date.UTC(year, month - 1, day)));
	}

	function countLabel(count: number): string {
		return `${count} ${count === 1 ? "card" : "cards"}`;
	}

	function metaLine(expansion: TcgExpansion): string {
		const released = releaseLabel(expansion.releaseDate);
		const count = countLabel(expansion.cards.length);
		return released ? `${released} · ${count}` : count;
	}

	function toggleSection(id: string) {
		if (collapsed.has(id)) collapsed.delete(id);
		else collapsed.add(id);
	}

	function open(card: Card, expansion: string) {
		active = { card, expansion };
	}

	function close() {
		active = null;
	}

	function onkeydown(event: KeyboardEvent) {
		if (active && event.key === "Escape") close();
	}

	$effect(() => {
		if (!active) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	});
</script>

<svelte:window {onkeydown} />

<section class="prints" aria-labelledby="tcg-prints-heading">
	<h3 id="tcg-prints-heading" class="mt-10 mb-4 text-xl font-bold">Cards</h3>
	<div class="bar" role="tablist" aria-label="Card expansions">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				role="tab"
				class="tab"
				aria-selected={region === tab.id}
				onclick={() => {
					region = tab.id;
					close();
				}}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if sections.length === 0}
		<p class="my-6 text-gray-400">{emptyCopy[region]}</p>
	{:else}
		{#each sections as expansion (expansion.id)}
			{@const logo = expansionLogo(expansion.logoId)}
			{@const sectionKey = `${region}:${expansion.id}`}
			{@const shrunk = collapsed.has(sectionKey)}
			<article class={["expansion", shrunk && "is-shrunk"]}>
				<header class="head">
					{#if logo}
						<img class="logo" src={logo} alt="" width="140" height="48" />
					{/if}
					<div>
						<h4 class="title">{expansion.name}</h4>
						<p class="meta">{metaLine(expansion)}</p>
					</div>
					<button
						type="button"
						class="shrink"
						aria-expanded={!shrunk}
						aria-label={`${shrunk ? "Expand" : "Collapse"} ${expansion.name}`}
						onclick={() => toggleSection(sectionKey)}
					>
						{#if shrunk}
							<ChevronsUpDown size={22} aria-hidden="true" />
						{:else}
							<ChevronsDownUp size={22} aria-hidden="true" />
						{/if}
					</button>
				</header>
				{#if !shrunk}
					<ul class="grid">
						{#each expansion.cards as card (card.id)}
							<li>
								<TcgCard {card} onopen={() => open(card, expansion.name)} />
							</li>
						{/each}
					</ul>
				{/if}
			</article>
		{/each}
	{/if}
</section>

{#if active}
	<div
		class="inspect"
		role="dialog"
		aria-modal="true"
		aria-label={`${active.card.name}, ${active.expansion}`}
		tabindex="-1"
		onpointermove={(event) => pointerBus.aim(event)}
	>
		<button type="button" class="backdrop" aria-label="Close card" onclick={close}></button>
		<div class="stage">
			<button type="button" class="close" {@attach focusClose} onclick={close}>
				Close
			</button>
			<div class="rise">
				<TcgCard card={active.card} inspect bus={pointerBus} />
			</div>
			<p class="caption">
				<span class="caption-name">{active.card.name}</span>
				<span>
					{active.expansion}{#if active.card.number}&nbsp;· {active.card.number}{/if}
					{#if active.card.rarity}&nbsp;· {active.card.rarity}{/if}
				</span>
			</p>
		</div>
	</div>
{/if}

<style>
	.bar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem 0;
		background: #242424;
	}

	.tab {
		border: 1px solid rgb(255 255 255 / 18%);
		border-radius: 999px;
		background: transparent;
		color: rgb(255 255 255 / 78%);
		padding: 0.45rem 0.9rem;
		font: inherit;
		cursor: pointer;
	}

	.tab[aria-selected="true"] {
		border-color: #86efac;
		background: rgb(134 239 172 / 14%);
		color: #ecfdf5;
	}

	.tab:focus-visible {
		outline: 2px solid #86efac;
		outline-offset: 2px;
	}

	.expansion {
		margin: 1.75rem 0 2.5rem;
	}

	.head {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.is-shrunk .head {
		margin-bottom: 0;
	}

	.shrink {
		margin-left: auto;
		flex: none;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: rgb(255 255 255 / 78%);
		padding: 0.2rem;
		cursor: pointer;
	}

	.shrink:hover {
		background: rgb(255 255 255 / 8%);
		color: white;
	}

	.shrink:focus-visible {
		outline: 2px solid #86efac;
		outline-offset: 2px;
	}

	.logo {
		height: 3.25rem;
		width: auto;
		max-width: 9.5rem;
		object-fit: contain;
		flex: none;
	}

	.title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
	}

	.meta {
		margin: 0.15rem 0 0;
		color: rgb(255 255 255 / 62%);
		font-size: 0.92rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(42vw, 168px), 1fr));
		gap: 1.35rem 0.85rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.inspect {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: rgb(8 10 14 / 78%);
		cursor: pointer;
	}

	.stage {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		max-height: 100%;
		padding: 3rem 1rem 1.5rem;
	}

	.close {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		border: 1px solid rgb(255 255 255 / 24%);
		border-radius: 999px;
		background: rgb(20 22 28 / 88%);
		color: white;
		font: inherit;
		padding: 0.35rem 0.8rem;
		cursor: pointer;
	}

	.rise {
		animation: rise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.caption {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		margin: 0;
		text-align: center;
		color: rgb(255 255 255 / 82%);
	}

	.caption-name {
		font-size: 1.15rem;
		font-weight: 700;
		color: white;
	}

	@keyframes rise {
		from {
			transform: translateY(28px) scale(0.72);
			opacity: 0.35;
		}

		to {
			transform: none;
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rise {
			animation: none;
		}
	}
</style>
