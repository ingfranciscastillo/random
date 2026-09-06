import { categories, pieces as staticPieces } from "../data/pieces";
import { db } from "./index";
import { pieces } from "./schema";

/** Backfills the curated content already shipped in data/pieces.ts into the DB, matching ids 1:1 so it can be run again safely as content changes. */
async function main() {
	for (const piece of staticPieces) {
		const row = {
			category: piece.category,
			type: piece.type,
			label: categories[piece.category].label,
			title: piece.title,
			context: piece.context,
			sourceName: piece.source?.name,
			sourceUrl: piece.source?.url,
			tags: piece.tags,
			status: "approved" as const,
			submittedBy: "seed" as const,
			reviewedAt: new Date(),
		};

		await db
			.insert(pieces)
			.values({ id: piece.id, ...row })
			.onConflictDoUpdate({
				target: pieces.id,
				set: { ...row, updatedAt: new Date() },
			});
	}

	console.log(`Seeded ${staticPieces.length} pieces.`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
