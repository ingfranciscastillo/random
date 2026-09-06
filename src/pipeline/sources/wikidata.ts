import type { Category, PieceType } from "../../data/pieces";
import type { RawCandidate } from "../types";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "random-curiosidades-pipeline/1.0 (personal project)";

type QueryTemplate = {
	category: Category;
	type: PieceType;
	/** Short label used only for logging/debugging, not stored anywhere. */
	name: string;
	sparql: string;
};

/**
 * Curated, hand-picked SPARQL templates — one (or more) per category we can
 * cover reliably with structured Wikidata claims. Not every category has a
 * clean Wikidata shape (e.g. "language"/word trivia doesn't fit lexemes well
 * without a lot more work), so this list is intentionally partial: adding a
 * category later means adding one more template here, not redesigning
 * anything.
 */
const TEMPLATES: QueryTemplate[] = [
	{
		category: "science",
		type: "fact",
		name: "chemical-elements-discovery",
		sparql: `
			SELECT ?item ?itemLabel ?date ?discovererLabel WHERE {
				?item wdt:P31 wd:Q11344.
				?item wdt:P575 ?date.
				OPTIONAL { ?item wdt:P61 ?discoverer. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY RAND()
			LIMIT 15
		`,
	},
	{
		category: "nature",
		type: "fact",
		name: "critically-endangered-species",
		sparql: `
			SELECT ?item ?itemLabel WHERE {
				?item wdt:P141 wd:Q219127.
				?item wdt:P105 wd:Q7432.
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY RAND()
			LIMIT 15
		`,
	},
	{
		category: "geography",
		type: "place",
		name: "world-heritage-sites",
		sparql: `
			SELECT ?item ?itemLabel ?countryLabel ?inception WHERE {
				?item wdt:P1435 wd:Q9259.
				OPTIONAL { ?item wdt:P17 ?country. }
				OPTIONAL { ?item wdt:P571 ?inception. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY RAND()
			LIMIT 15
		`,
	},
	{
		category: "technology",
		type: "object",
		name: "inventions-with-inventor",
		// No ORDER BY RAND() here: P61 (inventor) alone is set on a huge,
		// unbounded slice of Wikidata, and randomizing that full scan times
		// out. Requiring P571 (inception date) too narrows it enough to run
		// fast without randomizing.
		sparql: `
			SELECT ?item ?itemLabel ?inventorLabel ?date WHERE {
				?item wdt:P61 ?inventor.
				?item wdt:P571 ?date.
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			LIMIT 15
		`,
	},
	{
		category: "history",
		type: "event",
		name: "historical-battles",
		sparql: `
			SELECT ?item ?itemLabel ?date ?locationLabel WHERE {
				?item wdt:P31 wd:Q178561.
				?item wdt:P585 ?date.
				OPTIONAL { ?item wdt:P276 ?location. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY RAND()
			LIMIT 15
		`,
	},
	{
		category: "records",
		type: "record",
		name: "tallest-skyscrapers",
		sparql: `
			SELECT ?item ?itemLabel ?height ?cityLabel WHERE {
				?item wdt:P31 wd:Q11303.
				?item wdt:P2048 ?height.
				OPTIONAL { ?item wdt:P131 ?city. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY DESC(?height)
			LIMIT 15
		`,
	},
	{
		category: "objects",
		type: "object",
		name: "musical-instruments",
		sparql: `
			SELECT ?item ?itemLabel ?inventorLabel ?date WHERE {
				?item wdt:P31 wd:Q34379.
				OPTIONAL { ?item wdt:P61 ?inventor. }
				OPTIONAL { ?item wdt:P571 ?date. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
			}
			ORDER BY RAND()
			LIMIT 15
		`,
	},
];

type SparqlBinding = Record<string, { value: string; type: string }>;

const QUERY_TIMEOUT_MS = 20_000;

async function runSparql(sparql: string): Promise<SparqlBinding[]> {
	const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}&format=json`;
	const res = await fetch(url, {
		headers: {
			"User-Agent": USER_AGENT,
			Accept: "application/sparql-results+json",
		},
		signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
	});
	if (!res.ok) {
		throw new Error(`Wikidata SPARQL failed: ${res.status} ${res.statusText}`);
	}
	const data = (await res.json()) as { results: { bindings: SparqlBinding[] } };
	return data.results.bindings;
}

function qidFromUri(uri: string): string {
	return uri.split("/").pop() ?? uri;
}

/** wikibase:label falls back to the raw entity id when no es/en label exists — that's not usable prose. */
function looksLikeRawEntityId(value: string): boolean {
	return /^[QLP]\d+$/.test(value);
}

/**
 * Wikidata dates come back as full ISO datetimes ("1868-08-18T00:00:00Z").
 * The trailing "T00:00:00Z" is never meaningful for these claims (precision
 * is day/year at best) and, worse, glues the day number to a "T" with no
 * word boundary between them — that broke the verifier's plain \b\d\b
 * grounding check, which never saw "18" as a token and flagged every date
 * as unsupported. Trimming to the date part fixes both problems at once.
 */
function formatValue(value: string): string {
	const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})T/);
	return isoDate ? isoDate[1] : value;
}

function bindingsToFacts(binding: SparqlBinding, skip: Set<string>): string {
	return Object.entries(binding)
		.filter(([key, val]) => !skip.has(key) && !looksLikeRawEntityId(val.value))
		.map(([key, val]) => `${key}: ${formatValue(val.value)}`)
		.join("; ");
}

export async function harvestWikidata(limit: number): Promise<RawCandidate[]> {
	const candidates: RawCandidate[] = [];
	const templates = [...TEMPLATES].sort(() => Math.random() - 0.5);

	for (const template of templates) {
		if (candidates.length >= limit) break;
		let bindings: SparqlBinding[];
		try {
			bindings = await runSparql(template.sparql);
		} catch {
			continue;
		}

		for (const binding of bindings) {
			if (candidates.length >= limit) break;
			const item = binding.item?.value;
			const label = binding.itemLabel?.value;
			if (!item || !label || looksLikeRawEntityId(label)) continue;

			const qid = qidFromUri(item);
			const facts = bindingsToFacts(binding, new Set(["item"]));

			candidates.push({
				sourceProvider: "wikidata",
				sourceExternalId: qid,
				sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
				sourceName: "Wikidata",
				category: template.category,
				type: template.type,
				facts: `${label} — ${facts}`,
			});
		}
	}

	return candidates;
}
