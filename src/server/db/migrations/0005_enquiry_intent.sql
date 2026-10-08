ALTER TABLE "enquiries" ADD COLUMN "intent" varchar(40);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "details" jsonb;