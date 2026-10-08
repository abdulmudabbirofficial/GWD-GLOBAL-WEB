CREATE TABLE "cta_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" varchar(200) NOT NULL,
	"cta" varchar(120) NOT NULL,
	"label" varchar(120),
	"device" varchar(12),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cta_clicks_created_idx" ON "cta_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cta_clicks_cta_idx" ON "cta_clicks" USING btree ("cta","created_at");