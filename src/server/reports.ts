import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { pieceReports } from "@/db/schema";
import { type ReportReason, reportReasons } from "@/lib/report-reasons";
import { getOrCreateVoterId } from "@/server/voter";

const validReasons = new Set<string>(reportReasons.map((r) => r.value));

export const createReport = createServerFn({ method: "POST" })
	.validator(
		(data: { pieceId: string; reason: ReportReason; note?: string }) => {
			if (typeof data?.pieceId !== "string" || !data.pieceId) {
				throw new Error("pieceId is required");
			}
			if (!validReasons.has(data.reason)) {
				throw new Error("invalid reason");
			}
			const note = data.note?.trim();
			if (note && note.length > 280) {
				throw new Error("note is too long");
			}
			return {
				pieceId: data.pieceId,
				reason: data.reason,
				note: note || undefined,
			};
		},
	)
	.handler(async ({ data }) => {
		const reporterId = getOrCreateVoterId();
		await db.insert(pieceReports).values({
			pieceId: data.pieceId,
			reason: data.reason,
			note: data.note,
			reporterFingerprint: reporterId,
		});
		return { ok: true } as const;
	});
