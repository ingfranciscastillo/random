import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { pieceVotes } from "@/db/schema";
import { getOrCreateVoterId } from "@/server/voter";

export type VoteValue = 1 | -1;

function isVoteValue(value: unknown): value is VoteValue {
	return value === 1 || value === -1;
}

async function scoreFor(pieceId: string) {
	const [row] = await db
		.select({ score: sql<number>`coalesce(sum(${pieceVotes.value}), 0)` })
		.from(pieceVotes)
		.where(eq(pieceVotes.pieceId, pieceId));
	return Number(row?.score ?? 0);
}

export const getVoteState = createServerFn()
	.validator((data: { pieceId: string }) => {
		if (typeof data?.pieceId !== "string" || !data.pieceId) {
			throw new Error("pieceId is required");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const voterId = getOrCreateVoterId();

		const [myVote] = await db
			.select({ value: pieceVotes.value })
			.from(pieceVotes)
			.where(
				and(
					eq(pieceVotes.pieceId, data.pieceId),
					eq(pieceVotes.voterFingerprint, voterId),
				),
			)
			.limit(1);

		return {
			score: await scoreFor(data.pieceId),
			myVote: (myVote?.value ?? 0) as VoteValue | 0,
		};
	});

export const castVote = createServerFn({ method: "POST" })
	.validator((data: { pieceId: string; value: VoteValue }) => {
		if (typeof data?.pieceId !== "string" || !data.pieceId) {
			throw new Error("pieceId is required");
		}
		if (!isVoteValue(data.value)) {
			throw new Error("value must be 1 or -1");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const voterId = getOrCreateVoterId();

		const [existing] = await db
			.select({ id: pieceVotes.id, value: pieceVotes.value })
			.from(pieceVotes)
			.where(
				and(
					eq(pieceVotes.pieceId, data.pieceId),
					eq(pieceVotes.voterFingerprint, voterId),
				),
			)
			.limit(1);

		// Voting the same direction again clears the vote instead of stacking it.
		const clearing = existing !== undefined && existing.value === data.value;

		if (clearing) {
			await db.delete(pieceVotes).where(eq(pieceVotes.id, existing.id));
		} else if (existing) {
			await db
				.update(pieceVotes)
				.set({ value: data.value })
				.where(eq(pieceVotes.id, existing.id));
		} else {
			await db.insert(pieceVotes).values({
				pieceId: data.pieceId,
				voterFingerprint: voterId,
				value: data.value,
			});
		}

		return {
			score: await scoreFor(data.pieceId),
			myVote: clearing ? 0 : (data.value as VoteValue | 0),
		};
	});
