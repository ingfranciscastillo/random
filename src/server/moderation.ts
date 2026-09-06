import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { type PieceStatus, pieces } from "@/db/schema";
import { rewriteCandidate } from "@/pipeline/rewrite";
import { verifyDraft } from "@/pipeline/verify";
import { requireAdmin } from "@/server/admin-auth";

const validStatuses = new Set<PieceStatus>(["pending", "approved", "rejected"]);
const PAGE_SIZE = 10;

export const listPieces = createServerFn()
	.validator(
		(data?: { status?: PieceStatus; search?: string; page?: number }) => {
			const status = data?.status ?? "pending";
			if (!validStatuses.has(status)) throw new Error("invalid status");
			const page =
				data?.page && Number.isInteger(data.page) && data.page > 0
					? data.page
					: 1;
			return { status, search: data?.search?.trim() || undefined, page };
		},
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		const conditions = [eq(pieces.status, data.status)];
		if (data.search) {
			const term = `%${data.search}%`;
			conditions.push(
				or(
					ilike(pieces.title, term),
					ilike(pieces.context, term),
					ilike(pieces.label, term),
				) ?? eq(pieces.status, data.status),
			);
		}
		const where = and(...conditions);

		const [items, [{ total }]] = await Promise.all([
			db
				.select()
				.from(pieces)
				.where(where)
				.orderBy(desc(pieces.createdAt))
				.limit(PAGE_SIZE)
				.offset((data.page - 1) * PAGE_SIZE),
			db.select({ total: count() }).from(pieces).where(where),
		]);

		return { items, total, page: data.page, pageSize: PAGE_SIZE };
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

export const updatePiece = createServerFn({ method: "POST" })
	.validator(
		(data: {
			id: string;
			label: string;
			title: string;
			context: string;
			tags: string[];
		}) => {
			if (typeof data?.id !== "string" || !data.id) {
				throw new Error("id is required");
			}
			const label = data.label.trim();
			const title = data.title.trim();
			const context = data.context.trim();
			if (!label || !title || !context) {
				throw new Error("label, title and context are required");
			}
			return {
				id: data.id,
				label,
				title,
				context,
				tags: data.tags.map((t) => t.trim()).filter(Boolean),
			};
		},
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		const [row] = await db
			.update(pieces)
			.set({
				label: data.label,
				title: data.title,
				context: data.context,
				tags: data.tags,
				updatedAt: new Date(),
			})
			.where(eq(pieces.id, data.id))
			.returning();
		return row;
	});

/** Re-runs the LLM rewrite (and verification) against the facts the piece was originally drafted from, optionally steered by an editor note — for fixing a specific wording issue without discarding and re-harvesting the candidate. */
export const regeneratePiece = createServerFn({ method: "POST" })
	.validator((data: { id: string; feedback?: string }) => {
		if (typeof data?.id !== "string" || !data.id) {
			throw new Error("id is required");
		}
		return { id: data.id, feedback: data.feedback?.trim() || undefined };
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		const [row] = await db.select().from(pieces).where(eq(pieces.id, data.id));
		if (!row) throw new Error("piece not found");
		if (!row.sourceFacts) {
			throw new Error("esta pieza no tiene hechos guardados para reescribir");
		}

		const candidate = {
			sourceProvider: row.sourceProvider ?? "wikidata",
			sourceExternalId: row.sourceExternalId ?? row.id,
			sourceUrl: row.sourceUrl ?? "",
			sourceName: row.sourceName ?? "",
			category: row.category,
			type: row.type,
			facts: row.sourceFacts,
		};

		const draft = await rewriteCandidate(candidate, data.feedback);
		if (!draft) throw new Error("el modelo no devolvió una reescritura válida");

		const verdict = await verifyDraft(candidate, draft);
		if (verdict.verdict === "unsupported") {
			// Keep the existing draft untouched — surface why the rewrite was rejected instead of replacing a piece with one that fails its own check.
			throw new Error(
				`La reescritura no pasó verificación: ${verdict.issues.join(" ")}`,
			);
		}

		const [updated] = await db
			.update(pieces)
			.set({
				label: draft.label,
				title: draft.title,
				context: draft.context,
				tags: draft.tags,
				verificationNotes:
					verdict.verdict === "uncertain" ? verdict.issues.join(" ") : null,
				updatedAt: new Date(),
			})
			.where(eq(pieces.id, data.id))
			.returning();
		return { piece: updated, verdict: verdict.verdict };
	});
