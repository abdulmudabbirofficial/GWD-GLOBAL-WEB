CREATE TYPE "public"."gallery_tag" AS ENUM('team', 'events', 'workshops');--> statement-breakpoint
ALTER TYPE "public"."product_status" ADD VALUE 'ideation';--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"url" varchar(500) NOT NULL,
	"small_url" varchar(500),
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"tag" "gallery_tag" DEFAULT 'events' NOT NULL,
	"alt" varchar(300) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_photos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_order_idx" ON "gallery_photos" USING btree ("is_published","sort_order");