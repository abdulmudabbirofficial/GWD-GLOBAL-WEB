CREATE TYPE "public"."service_group" AS ENUM('engineering', 'experience');--> statement-breakpoint
ALTER TYPE "public"."highlight_group" ADD VALUE 'club_format' BEFORE 'sports_module';--> statement-breakpoint
ALTER TYPE "public"."highlight_group" ADD VALUE 'sports_journey';--> statement-breakpoint
ALTER TYPE "public"."highlight_group" ADD VALUE 'sports_moat';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_flagship" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "metrics" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "features" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "group" "service_group" DEFAULT 'engineering' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "headline" varchar(200) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "ideal_for" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_url" varchar(300);--> statement-breakpoint
UPDATE "products" SET "metrics" = jsonb_build_array(jsonb_build_object('value', "metric_value", 'label', "metric_label"));
