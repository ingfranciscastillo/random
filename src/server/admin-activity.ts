import { createServerFn } from "@tanstack/react-start";
import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
	pieceReports,
	pieces,
	pieceVotes,
	type ReportStatus,
} from "@/db/schema";
import { requireAdmin } from "@/server/admin-auth";

const PAGE_SIZE = 10;

const validReportStatuses = new Set<ReportStatus>([
	"open",
	"reviewed",
	"dismissed",
]);

export const listReports = createServerFn()
	.validator((data?: { status?: ReportStatus; page?: number }) => {
		const status = data?.status ?? "open";
		if (!validReportStatuses.has(status)) throw new Error("invalid status");
		const page =
			data?.page && Number.isInteger(data.page) && data.page > 0
				? data.page
				: 1;
		return { status, page };
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		const where = eq(pieceReports.status, data.status);

		const [items, [{ total }]] = await Promise.all([
			db
				.select({
					id: pieceReports.id,
					pieceId: pieceReports.pieceId,
					pieceTitle: pieces.title,
					pieceCategory: pieces.category,
					pieceStatus: pieces.status,
					reason: pieceReports.reason,
					note: pieceReports.note,
					status: pieceReports.status,
					createdAt: pieceReports.createdAt,
				})
				.from(pieceReports)
				.leftJoin(pieces, eq(pieces.id, pieceReports.pieceId))
				.where(where)
				.orderBy(desc(pieceReports.createdAt))
				.limit(PAGE_SIZE)
				.offset((data.page - 1) * PAGE_SIZE),
			db.select({ total: count() }).from(pieceReports).where(where),
		]);

		return { items, total, page: data.page, pageSize: PAGE_SIZE };
	});

export const updateReportStatus = createServerFn({ method: "POST" })
	.validator((data: { id: string; status: ReportStatus }) => {
		if (typeof data?.id !== "string" || !data.id) {
			throw new Error("id is required");
		}
		if (!validReportStatuses.has(data.status)) {
			throw new Error("invalid status");
		}
		return data;
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		const [row] = await db
			.update(pieceReports)
			.set({ status: data.status })
			.where(eq(pieceReports.id, data.id))
			.returning();
		return row;
	});

export type VoteSort = "likes" | "dislikes" | "total";
const validVoteSorts = new Set<VoteSort>(["likes", "dislikes", "total"]);

/** Per-piece like/dislike totals, not the raw anonymous vote rows — those carry no admin-actionable identity, just the aggregate. */
export const listVoteStats = createServerFn()
	.validator((data?: { sort?: VoteSort; page?: number }) => {
		const sort =
			data?.sort && validVoteSorts.has(data.sort) ? data.sort : "likes";
		const page =
			data?.page && Number.isInteger(data.page) && data.page > 0
				? data.page
				: 1;
		return { sort, page };
	})
	.handler(async ({ data }) => {
		await requireAdmin();
		const likes = sql<number>`count(*) filter (where ${pieceVotes.value} = 1)`;
		const dislikes = sql<number>`count(*) filter (where ${pieceVotes.value} = -1)`;
		const orderExpr =
			data.sort === "dislikes"
				? dislikes
				: data.sort === "total"
					? sql`count(*)`
					: likes;

		const [items, [{ total }]] = await Promise.all([
			db
				.select({
					id: pieces.id,
					title: pieces.title,
					category: pieces.category,
					type: pieces.type,
					status: pieces.status,
					likes,
					dislikes,
				})
				.from(pieceVotes)
				.innerJoin(pieces, eq(pieces.id, pieceVotes.pieceId))
				.groupBy(pieces.id)
				.orderBy(desc(orderExpr))
				.limit(PAGE_SIZE)
				.offset((data.page - 1) * PAGE_SIZE),
			db
				.select({ total: sql<number>`count(distinct ${pieceVotes.pieceId})` })
				.from(pieceVotes),
		]);

		return { items, total, page: data.page, pageSize: PAGE_SIZE };
	});
