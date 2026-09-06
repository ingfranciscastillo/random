import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import {
	type Category,
	categories,
	type Piece,
	type PieceType,
	typeLabels,
} from "@/data/pieces";
import { db } from "@/db";
import { pieces } from "@/db/schema";

const validCategories = new Set<string>(Object.keys(categories));
const validTypes = new Set<string>(Object.keys(typeLabels));

export const getApprovedPieces = createServerFn().handler(
	async (): Promise<Piece[]> => {
		const rows = await db
			.select()
			.from(pieces)
			.where(eq(pieces.status, "approved"));
		return rows.map((row) => ({
			id: row.id,
			category: row.category,
			type: row.type,
			label: row.label,
			title: row.title,
			context: row.context,
			source:
				row.sourceName && row.sourceUrl
					? { name: row.sourceName, url: row.sourceUrl }
					: undefined,
			tags: row.tags ?? undefined,
		}));
	},
);

export const createPiece = createServerFn({ method: "POST" })
	.validator(
		(data: {
			category: Category;
			type: PieceType;
			title: string;
			context: string;
		}) => {
			if (!validCategories.has(data?.category)) {
				throw new Error("invalid category");
			}
			if (!validTypes.has(data?.type)) {
				throw new Error("invalid type");
			}
			const title = data.title?.trim();
			const context = data.context?.trim();
			if (!title || !context) {
				throw new Error("title and context are required");
			}
			if (title.length > 280 || context.length > 500) {
				throw new Error("title or context is too long");
			}
			return { category: data.category, type: data.type, title, context };
		},
	)
	.handler(async ({ data }) => {
		const [row] = await db
			.insert(pieces)
			.values({
				category: data.category,
				type: data.type,
				label: categories[data.category].label,
				title: data.title,
				context: data.context,
				submittedBy: "visitor",
			})
			.returning({ id: pieces.id });
		return { id: row?.id } as const;
	});
