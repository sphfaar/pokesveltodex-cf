<script lang="ts">
	import type { TcgCard } from "#lib/tcg/types.js";

	let {
		card,
		inspect = false,
		onopen,
		bus,
	}: {
		card: TcgCard;
		inspect?: boolean;
		onopen?: () => void;
		/** Filled so a full-screen layer can tilt this card without a per-card window listener. */
		bus?: { aim: (event: PointerEvent) => void };
	} = $props();

	let rotator: HTMLElement | undefined;
	let attempt = $state(0);

	let sources = $derived.by(() => {
		const raw = inspect
			? [card.imageLarge, card.fallbackLarge, card.extraLarge]
			: [card.image, card.fallbackImage, card.extraImage];
		return raw.filter((url): url is string => Boolean(url));
	});

	let source = $derived(sources[attempt] ?? "");
	let scrydex = $derived(source.startsWith("https://images.scrydex.com/"));

	function miss(from: string) {
		if (sources[attempt] !== from) return;
		attempt += 1;
	}

	function onerror(event: Event) {
		const img = event.currentTarget;
		if (!(img instanceof HTMLImageElement)) return;
		miss(img.src);
	}

	// Missing keys come back as a card-back picture, not a failed request.
	// pokemontcg.io uses HTTP 404 with a 640×892 PNG that Chrome still paints.
	// Scrydex answers HTTP 200 with a small back at 245×341 or 244×342.
	function onload(event: Event) {
		const img = event.currentTarget;
		if (!(img instanceof HTMLImageElement)) return;
		if (isCardBack(img)) miss(img.src);
	}

	const BACK_X = [24, 120, 200];
	// Top border of the two Scrydex card-back renders. Real scans of the same
	// pixel size do not share these colors.
	const BLUE_BACK: ReadonlyArray<readonly [number, number, number]> = [
		[25, 38, 83],
		[25, 38, 83],
		[25, 38, 83],
	];
	const YELLOW_BACK: ReadonlyArray<readonly [number, number, number]> = [
		[202, 180, 30],
		[199, 179, 41],
		[201, 182, 55],
	];

	function isCardBack(img: HTMLImageElement): boolean {
		const width = img.naturalWidth;
		const height = img.naturalHeight;
		if (width === 640 && height === 892) return true;
		if (!img.src.includes("images.scrydex.com")) return false;
		if (width === 245 && height === 341) return matches(border(img), BLUE_BACK);
		if (width === 244 && height === 342) return matches(border(img), YELLOW_BACK);
		return false;
	}

	function border(img: HTMLImageElement): ([number, number, number] | null)[] {
		const canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) return BACK_X.map(() => null);
		try {
			context.drawImage(img, 0, 0);
			return BACK_X.map((x) => {
				const [red, green, blue] = context.getImageData(x, 6, 1, 1).data;
				return [red, green, blue] as [number, number, number];
			});
		} catch {
			return BACK_X.map(() => null);
		}
	}

	function matches(
		swatch: ([number, number, number] | null)[],
		expected: ReadonlyArray<readonly [number, number, number]>,
	): boolean {
		return expected.every((color, index) => {
			const seen = swatch[index];
			if (!seen) return false;
			return color.every((channel, channelIndex) => Math.abs(channel - seen[channelIndex]) <= 28);
		});
	}

	const reduceMotion =
		typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
	let targetX = 0.5;
	let targetY = 0.5;
	let currentX = 0.5;
	let currentY = 0.5;
	let frame = 0;
	let last = 0;
	let hovering = false;

	function paint(x: number, y: number) {
		const node = rotator;
		if (!node) return;
		const amount = inspect ? 26 : 16;
		const rx = (y - 0.5) * amount;
		const ry = (0.5 - x) * amount;
		const shift = inspect ? 1 : 0;
		const shine = 0.28 + Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2.2) * 0.62;
		node.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
		node.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
		node.style.setProperty("--tx", `${((x - 0.5) * 36 * shift).toFixed(2)}px`);
		node.style.setProperty("--ty", `${((y - 0.5) * 28 * shift).toFixed(2)}px`);
		node.style.setProperty("--px", `${(x * 100).toFixed(2)}%`);
		node.style.setProperty("--py", `${(y * 100).toFixed(2)}%`);
		node.style.setProperty("--angle", `${(115 + (x - 0.5) * 90 + (y - 0.5) * 40).toFixed(2)}deg`);
		node.style.setProperty("--shine", shine.toFixed(3));
	}

	function step(now: number) {
		const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
		last = now;
		const glide = 1 - Math.exp(-dt * (inspect ? 7 : 14));
		currentX += (targetX - currentX) * glide;
		currentY += (targetY - currentY) * glide;
		paint(currentX, currentY);
		const settled = Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001;
		if (settled) {
			frame = 0;
			return;
		}
		frame = requestAnimationFrame(step);
	}

	function track() {
		if (reduceMotion) return;
		if (frame) return;
		last = 0;
		frame = requestAnimationFrame(step);
	}

	function aim(event: PointerEvent, bounds: DOMRect) {
		targetX = clamp((event.clientX - bounds.left) / bounds.width);
		targetY = clamp((event.clientY - bounds.top) / bounds.height);
		track();
	}

	function holdRotator(node: HTMLElement) {
		rotator = node;
		if (bus) {
			bus.aim = (event: PointerEvent) => {
				aim(event, node.getBoundingClientRect());
			};
		}
		return () => {
			if (frame) cancelAnimationFrame(frame);
			if (rotator === node) rotator = undefined;
		};
	}

	function clamp(value: number): number {
		if (value < -0.15) return -0.15;
		if (value > 1.15) return 1.15;
		return value;
	}

	function onpointerenter(event: PointerEvent) {
		if (inspect || event.pointerType !== "mouse") return;
		hovering = true;
		const node = rotator;
		if (!node) return;
		aim(event, node.getBoundingClientRect());
	}

	function onpointermove(event: PointerEvent) {
		if (inspect || !hovering) return;
		const node = rotator;
		if (!node) return;
		aim(event, node.getBoundingClientRect());
	}

	function onpointerleave() {
		if (inspect) return;
		hovering = false;
		targetX = 0.5;
		targetY = 0.5;
		track();
	}
</script>

{#snippet face()}
	<span
		class="tcg-rotator"
		{@attach holdRotator}
		style="--rx:0deg;--ry:0deg;--tx:0px;--ty:0px;--px:50%;--py:50%;--angle:115deg;--shine:0.32"
	>
		{#if source}
			<img
				src={source}
				alt=""
				width="63"
				height="88"
				draggable="false"
				decoding="async"
				loading={inspect ? "eager" : "lazy"}
				crossorigin={scrydex ? "anonymous" : undefined}
				{onload}
				{onerror}
			/>
		{:else}
			<span class="noscan">{card.name}</span>
		{/if}
		<span class="shine"></span>
		<span class="glare"></span>
	</span>
{/snippet}

{#if inspect}
	<div class="tcg-card is-inspect foil-{card.foil}">
		{@render face()}
	</div>
{:else}
	<button
		type="button"
		class="tcg-card foil-{card.foil}"
		aria-label={`${card.name}${card.number ? `, ${card.number}` : ""}. Open a larger view.`}
		onclick={() => onopen?.()}
		{onpointerenter}
		{onpointermove}
		{onpointerleave}
	>
		{@render face()}
	</button>
{/if}

<style>
	.tcg-card {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: start;
		cursor: pointer;
		perspective: 900px;
	}

	.tcg-card:focus-visible {
		outline: 2px solid #86efac;
		outline-offset: 4px;
		border-radius: 0.6rem;
	}

	.is-inspect {
		width: min(26rem, 86vw);
		cursor: default;
		perspective: 1400px;
	}

	.tcg-rotator {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 63 / 88;
		border-radius: 4.8% / 3.4%;
		overflow: hidden;
		background: #111;
		transform: translate3d(var(--tx), var(--ty), 0) rotateX(var(--rx)) rotateY(var(--ry));
		transform-style: preserve-3d;
		box-shadow:
			0 10px 18px rgb(0 0 0 / 35%),
			0 2px 4px rgb(0 0 0 / 45%);
		will-change: transform;
	}

	.is-inspect .tcg-rotator {
		box-shadow:
			0 28px 50px rgb(0 0 0 / 55%),
			0 8px 16px rgb(0 0 0 / 40%);
	}

	img,
	.noscan {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
		pointer-events: none;
		user-select: none;
	}

	.noscan {
		display: grid;
		place-items: center;
		padding: 0.75rem;
		text-align: center;
		background:
			linear-gradient(160deg, rgb(255 255 255 / 8%), transparent 40%),
			#1a1c22;
		color: rgb(255 255 255 / 78%);
		font-size: 0.85rem;
	}

	.tcg-rotator:not(:has(img)) .shine,
	.tcg-rotator:not(:has(img)) .glare {
		display: none;
	}

	.shine,
	.glare {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
	}

	.glare {
		background: radial-gradient(
			circle at var(--px) var(--py),
			rgb(255 255 255 / 72%),
			rgb(255 255 255 / 16%) 18%,
			transparent 52%
		);
		mix-blend-mode: soft-light;
		opacity: 0.85;
	}

	.shine {
		opacity: var(--shine);
		mix-blend-mode: color-dodge;
	}

	.foil-basic .shine {
		display: none;
	}

	.foil-holo .shine {
		background: linear-gradient(
			var(--angle),
			transparent 12%,
			rgb(255 70 170 / 55%) 32%,
			rgb(70 220 255 / 50%) 48%,
			rgb(255 230 90 / 45%) 64%,
			transparent 84%
		);
		background-size: 180% 180%;
		background-position: var(--px) var(--py);
	}

	.foil-reverse .shine {
		background: repeating-linear-gradient(
			var(--angle),
			rgb(255 70 100 / 40%) 0 3px,
			rgb(60 210 255 / 40%) 3px 6px,
			rgb(255 220 80 / 32%) 6px 9px
		);
	}

	.foil-v .shine {
		background:
			linear-gradient(var(--angle), transparent 0 36%, rgb(255 255 255 / 55%) 46%, transparent 56%),
			linear-gradient(
				calc(var(--angle) + 35deg),
				rgb(255 50 120 / 45%),
				rgb(70 190 255 / 45%),
				rgb(255 210 70 / 40%)
			);
		background-size: 160% 160%;
		background-position: var(--px) var(--py);
	}

	.foil-secret .shine {
		background: conic-gradient(
			from var(--angle),
			rgb(255 40 90 / 55%),
			rgb(255 200 40 / 55%),
			rgb(40 255 190 / 50%),
			rgb(90 90 255 / 55%),
			rgb(255 40 180 / 55%),
			rgb(255 40 90 / 55%)
		);
	}

	.foil-radiant .shine {
		background: conic-gradient(
			from var(--angle) at var(--px) var(--py),
			transparent 0 18%,
			rgb(255 255 255 / 70%) 28%,
			transparent 40% 62%,
			rgb(120 220 255 / 65%) 74%,
			transparent 86%
		);
	}

	.foil-cosmos .shine {
		background-image:
			radial-gradient(circle at 20% 30%, rgb(255 255 255 / 85%) 0 1px, transparent 1.6px),
			radial-gradient(circle at 70% 55%, rgb(170 220 255 / 90%) 0 1px, transparent 1.7px),
			radial-gradient(circle at 40% 80%, rgb(255 190 255 / 80%) 0 1px, transparent 1.5px),
			linear-gradient(var(--angle), rgb(40 0 80 / 35%), rgb(0 30 80 / 20%));
		background-size:
			18px 22px,
			26px 18px,
			16px 24px,
			100% 100%;
		background-position:
			var(--px) var(--py),
			calc(var(--px) * 0.7) var(--py),
			var(--px) calc(var(--py) * 1.15),
			center;
		mix-blend-mode: screen;
	}

	.foil-pocket .shine {
		background: linear-gradient(
			var(--angle),
			transparent 28%,
			rgb(255 255 255 / 55%) 46%,
			rgb(170 140 255 / 55%) 54%,
			transparent 72%
		);
		background-size: 160% 160%;
		background-position: var(--px) var(--py);
	}

	@media (prefers-reduced-motion: reduce) {
		.tcg-rotator {
			transform: none;
		}

		.shine,
		.glare {
			display: none;
		}
	}
</style>
