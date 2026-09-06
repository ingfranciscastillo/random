ALTER TABLE "pieces" ADD COLUMN "source_provider" text;--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "source_external_id" text;--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "verification_notes" text;--> statement-breakpoint
CREATE UNIQUE INDEX "pieces_source_provider_external_id_unique" ON "pieces" ("source_provider","source_external_id") WHERE "source_provider" is not null and "source_external_id" is not null;