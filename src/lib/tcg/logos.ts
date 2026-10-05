const files = import.meta.glob("../images/expansions/*.avif", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

const logos = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
	const file = path.split("/").pop();
	if (!file) continue;
	logos.set(file.replace(/\.avif$/, ""), url);
}

export function expansionLogo(id: string): string | undefined {
	return logos.get(id);
}
