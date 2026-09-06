import { createServerFn } from "@tanstack/react-start";

import {
	type Category,
	categories,
	type PieceType,
	typeLabels,
} from "@/data/pieces";
import { db } from "@/db";
import { pieces } from "@/db/schema";

const validCategories = new Set<string>(Object.keys(categories));
const validTypes = new Set<string>(Object.keys(typeLabels));

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
