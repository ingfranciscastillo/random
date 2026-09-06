import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { type PieceStatus, pieces } from "@/db/schema";
import { requireAdmin } from "@/server/admin-auth";

const validStatuses = new Set<PieceStatus>(["pending", "approved", "rejected"]);

export const listPieces = createServerFn()
	.validator((data?: { status?: PieceStatus }) => {
		const status = data?.status ?? "pending";
		if (!validStatuses.has(status)) throw new Error("invalid status");
		return { status };
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		return db
			.select()
			.from(pieces)
			.where(eq(pieces.status, data.status))
			.orderBy(desc(pieces.createdAt));
	});

export const reviewPiece = createServerFn({ method: "POST" })
	.validator((data: { id: string; decision: "approved" | "rejected" }) => {
		if (typeof data?.id !== "string" || !data.id) {
			throw new Error("id is required");
		}
		if (data.decision !== "approved" && data.decision !== "rejected") {
			throw new Error("invalid decision");
		}
		return data;
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		await db
			.update(pieces)
			.set({
				status: data.decision,
				reviewedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(pieces.id, data.id));
		return { ok: true } as const;
	});
