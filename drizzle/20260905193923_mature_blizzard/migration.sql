CREATE TABLE "piece_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"piece_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"reporter_fingerprint" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piece_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"piece_id" uuid NOT NULL,
	"voter_fingerprint" text NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category" text NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"title" text NOT NULL,
	"context" text NOT NULL,
	"source_name" text,
	"source_url" text,
	"tags" text[],
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_by" text NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "piece_reports_piece_id_idx" ON "piece_reports" ("piece_id");--> statement-breakpoint
CREATE UNIQUE INDEX "piece_votes_piece_id_voter_fingerprint_unique" ON "piece_votes" ("piece_id","voter_fingerprint");--> statement-breakpoint
CREATE INDEX "piece_votes_piece_id_idx" ON "piece_votes" ("piece_id");--> statement-breakpoint
ALTER TABLE "piece_reports" ADD CONSTRAINT "piece_reports_piece_id_pieces_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "pieces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "piece_votes" ADD CONSTRAINT "piece_votes_piece_id_pieces_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "pieces"("id") ON DELETE CASCADE;