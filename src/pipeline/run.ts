import { db } from "../db/index";
import { pieces } from "../db/schema";
import { rewriteCandidate } from "./rewrite";
import { harvestNasa } from "./sources/nasa";
import { harvestWikidata } from "./sources/wikidata";
import { wikipediaContext } from "./sources/wikipedia";
import type { RawCandidate } from "./types";
import { verifyDraft } from "./verify";

type SourceName = "wikidata" | "nasa";
const ALL_SOURCES: SourceName[] = ["wikidata", "nasa"];

function parseArgs() {
	const countArg = process.argv.find((a) => a.startsWith("--count="));
	const sourcesArg = process.argv.find((a) => a.startsWith("--sources="));
	const count = countArg ? Number(countArg.slice("--count=".length)) : 10;
	const sources = sourcesArg
		? (sourcesArg.slice("--sources=".length).split(",") as SourceName[]).filter(
				(s) => ALL_SOURCES.includes(s),
			)
		: ALL_SOURCES;
	return {
		count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
		sources: sources.length > 0 ? sources : ALL_SOURCES,
	};
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function harvest(
	sources: SourceName[],
	count: number,
): Promise<RawCandidate[]> {
	const perSource = Math.ceil(count / sources.length);
	const batches = await Promise.all(
		sources.map((source) => {
			if (source === "wikidata") return harvestWikidata(perSource);
			return harvestNasa(perSource);
		}),
	);
	return batches.flat();
}

async function main() {
	const { count, sources } = parseArgs();
	console.log(
		`Harvesting up to ${count} candidates from: ${sources.join(", ")}`,
	);

	const candidates = await harvest(sources, count);
	console.log(`Got ${candidates.length} raw candidates.`);

	let inserted = 0;
	let discarded = 0;
	let flagged = 0;

	for (const candidate of candidates) {
		let context: string | null = null;
		if (candidate.sourceProvider === "wikidata") {
			try {
				context = await wikipediaContext(candidate.sourceExternalId);
			} catch {
				context = null;
			}
		}

		let draft: Awaited<ReturnType<typeof rewriteCandidate>>;
		try {
			draft = await rewriteCandidate({
				...candidate,
				context: context ?? undefined,
			});
		} catch (err) {
			console.error(`Rewrite failed for ${candidate.sourceExternalId}:`, err);
			continue;
		}
		if (!draft) {
			discarded++;
			continue;
		}

		await sleep(300);

		let verdict: Awaited<ReturnType<typeof verifyDraft>>;
		try {
			verdict = await verifyDraft(candidate, draft);
		} catch (err) {
			console.error(`Verify failed for ${candidate.sourceExternalId}:`, err);
			continue;
		}

		if (verdict.verdict === "unsupported") {
			discarded++;
			continue;
		}
		if (verdict.verdict === "uncertain") flagged++;

		await db
			.insert(pieces)
			.values({
				category: candidate.category,
				type: candidate.type,
				label: draft.label,
				title: draft.title,
				context: draft.context,
				sourceName: candidate.sourceName,
				sourceUrl: candidate.sourceUrl,
				tags: draft.tags,
				status: "pending",
				submittedBy: "seed",
				sourceProvider: candidate.sourceProvider,
				sourceExternalId: candidate.sourceExternalId,
				verificationNotes:
					verdict.verdict === "uncertain"
						? verdict.issues.join(" ")
						: undefined,
			})
			.onConflictDoNothing({
				target: [pieces.sourceProvider, pieces.sourceExternalId],
			});

		inserted++;
		await sleep(300);
	}

	console.log(
		`Done. Inserted ${inserted} (of which ${flagged} flagged uncertain), discarded ${discarded}.`,
	);
	console.log("Review them at /admin/review.");
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
