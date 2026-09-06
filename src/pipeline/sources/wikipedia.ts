const USER_AGENT = "random-curiosidades-pipeline/1.0 (personal project)";

type WikidataSitelinks = {
	entities?: Record<string, { sitelinks?: Record<string, { title: string }> }>;
};

async function eswikiTitle(qid: string): Promise<string | null> {
	const res = await fetch(
		`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&format=json`,
		{ headers: { "User-Agent": USER_AGENT } },
	);
	if (!res.ok) return null;
	const data = (await res.json()) as WikidataSitelinks;
	return data.entities?.[qid]?.sitelinks?.eswiki?.title ?? null;
}

/**
 * Best-effort supplementary prose for a Wikidata entity — never the source
 * of a claim, only extra context handed to the LLM alongside the structured
 * facts. Returns null when there's no Spanish article or the fetch fails;
 * callers should treat that as "no extra context", not an error.
 */
export async function wikipediaContext(qid: string): Promise<string | null> {
	const title = await eswikiTitle(qid);
	if (!title) return null;

	const res = await fetch(
		`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
		{ headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
	);
	if (!res.ok) return null;
	const data = (await res.json()) as { extract?: string; type?: string };
	if (data.type !== "standard" || !data.extract) return null;
	return data.extract;
}
