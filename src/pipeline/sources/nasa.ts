import type { RawCandidate } from "../types";

const USER_AGENT = "random-curiosidades-pipeline/1.0 (personal project)";

async function apod(
	apiKey: string,
	date: string,
): Promise<RawCandidate | null> {
	const res = await fetch(
		`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`,
		{
			headers: { "User-Agent": USER_AGENT },
			signal: AbortSignal.timeout(20_000),
		},
	);
	if (!res.ok) return null;
	const data = (await res.json()) as {
		title?: string;
		explanation?: string;
		date?: string;
		copyright?: string;
		media_type?: string;
	};
	if (!data.title || !data.explanation || data.media_type !== "image")
		return null;

	return {
		sourceProvider: "nasa",
		sourceExternalId: `apod-${date}`,
		sourceUrl: `https://apod.nasa.gov/apod/ap${date.replace(/-/g, "").slice(2)}.html`,
		sourceName: "NASA — Astronomy Picture of the Day",
		category: "space",
		type: "fact",
		facts: `${data.title} (${data.date}). ${data.explanation}${data.copyright ? ` Crédito: ${data.copyright}.` : ""}`,
	};
}

function randomPastDate(daysBack: number): string {
	const d = new Date();
	d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
	return d.toISOString().slice(0, 10);
}

/** Samples random past APOD entries — the archive goes back to 1995, plenty to draw from without repeats mattering much. */
export async function harvestNasa(limit: number): Promise<RawCandidate[]> {
	const apiKey = process.env.NASA_API_KEY;
	if (!apiKey) return [];

	const candidates: RawCandidate[] = [];
	const seenDates = new Set<string>();
	const maxAttempts = limit * 4;

	for (
		let attempt = 0;
		attempt < maxAttempts && candidates.length < limit;
		attempt++
	) {
		const date = randomPastDate(365 * 25);
		if (seenDates.has(date)) continue;
		seenDates.add(date);

		try {
			const candidate = await apod(apiKey, date);
			if (candidate) candidates.push(candidate);
		} catch {
			// skip on any fetch/parse failure and keep sampling other dates
		}
	}

	return candidates;
}
