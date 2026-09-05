import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import type { Category, PieceType } from "@/data/pieces";

/** Where a piece's row-level moderation stands before it can appear in the deck. */
export type PieceStatus = "pending" | "approved" | "rejected";

/** Who created the row: the seed script or a visitor via the submit form. */
export type PieceSource = "seed" | "visitor";

export const pieces = pgTable("pieces", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	category: text("category").$type<Category>().notNull(),
	type: text("type").$type<PieceType>().notNull(),
	label: text("label").notNull(),
	title: text("title").notNull(),
	context: text("context").notNull(),
	sourceName: text("source_name"),
	sourceUrl: text("source_url"),
	tags: text("tags").array(),
	/** Moderation state; only "approved" rows are served to visitors. */
	status: text("status").$type<PieceStatus>().notNull().default("pending"),
	submittedBy: text("submitted_by").$type<PieceSource>().notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/** A single up/down vote. One row per (piece, voter) — re-voting updates value in place. */
export const pieceVotes = pgTable(
	"piece_votes",
	{
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		pieceId: uuid("piece_id")
			.references(() => pieces.id, { onDelete: "cascade" })
			.notNull(),
		/** Anonymous per-visitor identifier (e.g. a signed cookie value), not a user id. */
		voterFingerprint: text("voter_fingerprint").notNull(),
		value: integer("value").$type<1 | -1>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("piece_votes_piece_id_voter_fingerprint_unique").on(
			t.pieceId,
			t.voterFingerprint,
		),
		index("piece_votes_piece_id_idx").on(t.pieceId),
	],
);

/** Predefined report subjects a visitor can pick — no free-form reason. */
export type ReportReason =
	| "incorrect"
	| "duplicate"
	| "offensive"
	| "spam"
	| "broken_link"
	| "other";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export const pieceReports = pgTable(
	"piece_reports",
	{
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		pieceId: uuid("piece_id")
			.references(() => pieces.id, { onDelete: "cascade" })
			.notNull(),
		reason: text("reason").$type<ReportReason>().notNull(),
		note: text("note"),
		reporterFingerprint: text("reporter_fingerprint"),
		status: text("status").$type<ReportStatus>().notNull().default("open"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("piece_reports_piece_id_idx").on(t.pieceId)],
);

export type PieceRow = typeof pieces.$inferSelect;
export type NewPieceRow = typeof pieces.$inferInsert;
export type PieceVoteRow = typeof pieceVotes.$inferSelect;
export type NewPieceVoteRow = typeof pieceVotes.$inferInsert;
export type PieceReportRow = typeof pieceReports.$inferSelect;
export type NewPieceReportRow = typeof pieceReports.$inferInsert;
