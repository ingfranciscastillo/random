import { sql } from "drizzle-orm";
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
import type { ReportReason } from "@/lib/report-reasons";

/** Where a piece's row-level moderation stands before it can appear in the deck. */
export type PieceStatus = "pending" | "approved" | "rejected";

/** Who created the row: the seed script or a visitor via the submit form. */
export type PieceSource = "seed" | "visitor";

/** Where an automated pipeline row came from — lets /admin/review show the real provider instead of a generic "seed" label. */
export type PieceSourceProvider = "wikidata" | "nasa" | "wikipedia-seed";

export const pieces = pgTable(
	"pieces",
	{
		/** Matches the slug ids already used in data/pieces.ts (e.g. "hitachi") so seeding is a straight insert. */
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID())
			.notNull(),
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
		/** Which automated pipeline produced this row, if any — null for visitor submissions and the manual curated seed. */
		sourceProvider: text("source_provider").$type<PieceSourceProvider>(),
		/** Stable id from the source (Wikidata QID, APOD date, …) — the real dedup key for pipeline re-runs, unlike a title-derived slug. */
		sourceExternalId: text("source_external_id"),
		/** Set only when the verification pass returns "uncertain" — surfaced to the admin as a flag, not a blocker. */
		verificationNotes: text("verification_notes"),
		/** Raw facts the pipeline drafted this piece from — kept so the admin can ask the LLM to rewrite in place instead of discarding and re-harvesting. Null for visitor submissions and the manual curated seed. */
		sourceFacts: text("source_facts"),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("pieces_source_provider_external_id_unique")
			.on(t.sourceProvider, t.sourceExternalId)
			.where(
				sql`${t.sourceProvider} is not null and ${t.sourceExternalId} is not null`,
			),
	],
);

/** A single up/down vote. One row per (piece, voter) — re-voting updates value in place. */
export const pieceVotes = pgTable(
	"piece_votes",
	{
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		pieceId: text("piece_id")
			.references(() => pieces.id, { onDelete: "cascade" })
			.notNull(),
		/** Anonymous per-visitor identifier (a cookie value), not a user id. */
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

export type ReportStatus = "open" | "reviewed" | "dismissed";

/** A visitor report against a piece. `reason` is a predefined subject — no free-form reason. */
export const pieceReports = pgTable(
	"piece_reports",
	{
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		pieceId: text("piece_id")
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
