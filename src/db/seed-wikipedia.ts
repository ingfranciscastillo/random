import type { Category, PieceType } from "../data/pieces";
import { db } from "./index";
import { pieces } from "./schema";

const WIKI = "https://es.wikipedia.org";
const USER_AGENT = "random-curiosidades-seed/1.0 (personal project)";
const MIN_EXTRACT_LENGTH = 80;
const REQUEST_DELAY_MS = 150;
const RANDOM_BATCH_SIZE = 60;
// Most random articles don't fit any of our categories (small towns, sports,
// discographies…), so the real hit rate is roughly 5-10%. Budget generously.
const MAX_BATCHES = 30;

const targetCount = (() => {
	const arg = process.argv.find((a) => a.startsWith("--count="));
	const n = arg ? Number(arg.slice("--count=".length)) : 20;
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
})();

/**
 * Wikipedia's real category tree pushes almost everything into deep
 * subcategories, so pulling "direct members" of a top-level category
 * returns near-empty lists. Sampling random articles and classifying
 * them ourselves is far more reliable at this scale.
 */
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
	history: [
		"historia",
		"siglo",
		"imperio",
		"guerra",
		"dinastia",
		"revolucion",
		"batalla",
		"antiguedad",
	],
	science: [
		"cientifico",
		"fisica",
		"quimica",
		"biologia",
		"elemento quimico",
		"especie",
		"genetica",
		"molecula",
		"particula",
		"material",
		"geologia",
	],
	culture: [
		"cultura",
		"tradicion",
		"festival",
		"folclore",
		"costumbre",
		"ritual",
		"mitologia",
	],
	nature: [
		"especie",
		"animal",
		"planta",
		"ecosistema",
		"bosque",
		"fauna",
		"flora",
		"mamifero",
		"insecto",
	],
	geography: [
		"ciudad",
		"pais",
		"capital",
		"rio",
		"montana",
		"isla",
		"region",
		"provincia",
		"continente",
		"desierto",
		"lago",
	],
	technology: [
		"tecnologia",
		"invento",
		"dispositivo",
		"software",
		"ordenador",
		"maquina",
		"ingenieria",
		"robot",
	],
	space: [
		"espacio",
		"planeta",
		"estrella",
		"galaxia",
		"nasa",
		"cosmos",
		"astronomia",
		"satelite",
		"cometa",
	],
	language: [
		"idioma",
		"lengua",
		"palabra",
		"gramatica",
		"linguistica",
		"dialecto",
		"alfabeto",
	],
	food: [
		"comida",
		"gastronomia",
		"receta",
		"cocina",
		"alimento",
		"bebida",
		"fruta",
	],
	art: [
		"arte",
		"pintura",
		"escultura",
		"museo",
		"pintor",
		"artista",
		"obra de arte",
	],
	architecture: [
		"arquitectura",
		"edificio",
		"monumento",
		"catedral",
		"puente",
		"torre",
		"construccion",
	],
	psychology: [
		"psicologia",
		"conducta",
		"percepcion",
		"emocion",
		"cognitiv",
		"cerebro",
	],
	mathematics: [
		"matematica",
		"teorema",
		"geometria",
		"algebra",
		"ecuacion",
		"probabilidad",
	],
	internet: [
		"internet",
		"sitio web",
		"pagina web",
		"red social",
		"navegador",
		"protocolo",
		"dominio",
	],
	transport: [
		"transporte",
		"ferrocarril",
		"tren",
		"avion",
		"automovil",
		"barco",
		"aeropuerto",
		"carretera",
	],
	records: ["record", "guinness", "el mas grande", "el mayor", "el primero en"],
	people: [],
	objects: ["objeto", "artefacto", "herramienta", "instrumento"],
};

const PERSON_PATTERN =
	/\b(fue|es) (un|una) (politic|escritor|escritora|cientific|actor|actriz|musico|pintor|filosof|futbolista|deportista|rey\b|reina\b|presidente|inventor|inventora|artista|periodista|director|directora|cantante|rapero|rapera|compositor|compositora|arquitecto|arquitecta|historiador|historiadora|atleta|tenista|ciclista|nadador|nadadora|empresario|empresaria|disenador|disenadora|ingeniero|ingeniera)/;
const PLACE_PATTERN =
	/\b(ciudad|pueblo|isla|pais|region|capital|municipio)\b.{0,12}\bde\b/;
const EVENT_PATTERN =
	/\b(batalla|erupcion|terremoto|revolucion|lanzamiento|eclipse|guerra|epidemia|independencia)\b/;

function stripAccents(s: string): string {
	return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(title: string): string {
	return `wiki-${stripAccents(title)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60)}`;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CATEGORY_KEYWORD_PATTERNS: Record<Category, RegExp[]> =
	Object.fromEntries(
		Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => [
			category,
			keywords.map((kw) => new RegExp(`\\b${escapeRegExp(kw)}`)),
		]),
	) as Record<Category, RegExp[]>;

/** Returns null when no category scores a keyword hit — better to skip than to force a wrong guess. */
function classify(
	description: string,
	extract: string,
): { category: Category; type: PieceType } | null {
	const haystack = stripAccents(`${description} ${extract}`.toLowerCase());

	if (PERSON_PATTERN.test(haystack)) {
		return { category: "people", type: "person" };
	}

	let best: Category | null = null;
	let bestScore = 0;
	for (const [category, patterns] of Object.entries(
		CATEGORY_KEYWORD_PATTERNS,
	) as [Category, RegExp[]][]) {
		const score = patterns.reduce(
			(n, re) => (re.test(haystack) ? n + 1 : n),
			0,
		);
		if (score > bestScore) {
			best = category;
			bestScore = score;
		}
	}
	if (!best) return null;

	if (best === "geography" && PLACE_PATTERN.test(haystack)) {
		return { category: best, type: "place" };
	}
	if (EVENT_PATTERN.test(haystack)) {
		return { category: best, type: "event" };
	}
	if (best === "records") {
		return { category: best, type: "record" };
	}
	return { category: best, type: "fact" };
}

function splitSentences(extract: string): { title: string; context: string } {
	const sentences = extract
		.split(/(?<=[.!?])\s+/)
		.map((s) => s.trim())
		.filter(Boolean);

	const title = truncate(sentences[0] ?? extract, 280);
	const rest = sentences.slice(1).join(" ").trim();
	const context = truncate(rest || extract, 500);
	return { title, context };
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(" ");
	return `${cut.slice(0, lastSpace > 0 ? lastSpace : max - 1)}…`;
}

async function wikiFetch<T>(path: string): Promise<T | null> {
	try {
		const res = await fetch(`${WIKI}${path}`, {
			headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
		});
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

async function randomTitles(limit: number): Promise<string[]> {
	const data = await wikiFetch<{ query?: { random?: { title: string }[] } }>(
		`/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=${limit}`,
	);
	return data?.query?.random?.map((r) => r.title) ?? [];
}

type Summary = {
	type: string;
	title: string;
	description?: string;
	extract?: string;
	content_urls?: { desktop?: { page?: string } };
};

async function pageSummary(title: string): Promise<Summary | null> {
	return wikiFetch<Summary>(
		`/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
	);
}

async function pageTags(title: string): Promise<string[]> {
	const data = await wikiFetch<{
		query?: { pages?: Record<string, { categories?: { title: string }[] }> };
	}>(
		`/w/api.php?action=query&format=json&prop=categories&clshow=!hidden&cllimit=20&titles=${encodeURIComponent(title)}`,
	);
	const page = Object.values(data?.query?.pages ?? {})[0];
	return (page?.categories ?? [])
		.map((c) => c.title.replace(/^Categoría:/, "").toLowerCase())
		.filter((t) => !t.includes("wikipedia") && !t.includes("wikidata"))
		.slice(0, 4);
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	const rows: (typeof pieces.$inferInsert)[] = [];
	const seen = new Set<string>();

	for (
		let batch = 0;
		batch < MAX_BATCHES && rows.length < targetCount;
		batch++
	) {
		const titles = await randomTitles(RANDOM_BATCH_SIZE);

		for (const title of titles) {
			if (rows.length >= targetCount) break;
			if (seen.has(title)) continue;
			seen.add(title);

			await sleep(REQUEST_DELAY_MS);
			const summary = await pageSummary(title);
			if (!summary || summary.type !== "standard") continue;
			if (!summary.extract || summary.extract.length < MIN_EXTRACT_LENGTH)
				continue;

			const classified = classify(summary.description ?? "", summary.extract);
			if (!classified) continue;
			const { category, type } = classified;
			const { title: pieceTitle, context } = splitSentences(summary.extract);
			await sleep(REQUEST_DELAY_MS);
			const tags = await pageTags(title);

			rows.push({
				id: slugify(title),
				category,
				type,
				label: summary.title,
				title: pieceTitle,
				context,
				sourceName: "Wikipedia",
				sourceUrl: summary.content_urls?.desktop?.page,
				tags: tags.length ? tags : undefined,
				status: "pending",
				submittedBy: "seed",
			});
		}
	}

	// Preserves any admin decision already made on a row (approved/rejected)
	// instead of resetting it back to pending on a re-run.
	for (const row of rows) {
		await db
			.insert(pieces)
			.values(row)
			.onConflictDoNothing({ target: pieces.id });
	}

	const distribution = rows.reduce<Record<string, number>>((acc, r) => {
		acc[r.category] = (acc[r.category] ?? 0) + 1;
		return acc;
	}, {});
	console.log(
		`Fetched ${rows.length}/${targetCount} candidates from Wikipedia. Distribution:`,
		distribution,
	);
	console.log("Review them at /admin/review.");
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
