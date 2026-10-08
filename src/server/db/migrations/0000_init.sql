CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."ecosystem_kind" AS ENUM('core', 'venture', 'community', 'capability', 'network');--> statement-breakpoint
CREATE TYPE "public"."event_scope" AS ENUM('company', 'club', 'sports');--> statement-breakpoint
CREATE TYPE "public"."highlight_group" AS ENUM('operating_model', 'club_pillar', 'sports_module');--> statement-breakpoint
CREATE TYPE "public"."organization_kind" AS ENUM('client', 'government', 'ecosystem', 'sports_partner', 'sports_club');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('live', 'in_development', 'in_design', 'paused');--> statement-breakpoint
CREATE TYPE "public"."stat_group" AS ENUM('company', 'sports', 'club');--> statement-breakpoint
CREATE TYPE "public"."team_group" AS ENUM('core', 'club');--> statement-breakpoint
CREATE TYPE "public"."team_tier" AS ENUM('founder', 'executive', 'lead');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'in_progress', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."enquiry_topic" AS ENUM('project', 'partnership', 'club', 'sports', 'careers', 'other');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" varchar(600) NOT NULL,
	"href" varchar(300),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profile" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"legal_name" varchar(160) NOT NULL,
	"brand_name" varchar(80) NOT NULL,
	"tagline" varchar(120) NOT NULL,
	"motto" varchar(160) NOT NULL,
	"founded_idea" varchar(7) NOT NULL,
	"incorporated_on" varchar(10) NOT NULL,
	"cin" varchar(21) NOT NULL,
	"gstin" varchar(15) NOT NULL,
	"locality" varchar(80) NOT NULL,
	"city" varchar(80) NOT NULL,
	"region" varchar(80) NOT NULL,
	"country" varchar(80) NOT NULL,
	"email" varchar(254),
	"phone" varchar(32),
	"socials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_profile_singleton" CHECK ("company_profile"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "ecosystem_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"kind" "ecosystem_kind" NOT NULL,
	"summary" varchar(300) NOT NULL,
	"facts" text[] DEFAULT '{}'::text[] NOT NULL,
	"href" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ecosystem_entities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ecosystem_links" (
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	CONSTRAINT "ecosystem_links_from_id_to_id_pk" PRIMARY KEY("from_id","to_id"),
	CONSTRAINT "ecosystem_links_no_self" CHECK ("ecosystem_links"."from_id" <> "ecosystem_links"."to_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"summary" varchar(400) NOT NULL,
	"scope" "event_scope" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"venue" varchar(200),
	"registration_url" varchar(500),
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group" "highlight_group" NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(120) NOT NULL,
	"summary" varchar(240) NOT NULL,
	"detail" text,
	"metric" varchar(40),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" varchar(80) NOT NULL,
	"country" varchar(80) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"is_hq" boolean DEFAULT false NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" varchar(200) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" varchar(300) DEFAULT '' NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "organization_kind" NOT NULL,
	"logo_url" varchar(500),
	"website_url" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"category" varchar(120) NOT NULL,
	"tagline" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"status" "product_status" NOT NULL,
	"metric_value" varchar(24) NOT NULL,
	"metric_label" varchar(60) NOT NULL,
	"accent" varchar(7) DEFAULT '#D0021B' NOT NULL,
	"href" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recognitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"detail" varchar(240),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recognitions_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"summary" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"deliverables" text[] DEFAULT '{}'::text[] NOT NULL,
	"technologies" text[] DEFAULT '{}'::text[] NOT NULL,
	"visual_mode" smallint DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"group" "stat_group" DEFAULT 'company' NOT NULL,
	"value" numeric(14, 4) NOT NULL,
	"decimals" smallint DEFAULT 0 NOT NULL,
	"prefix" varchar(8) DEFAULT '' NOT NULL,
	"suffix" varchar(8) DEFAULT '' NOT NULL,
	"label" varchar(80) NOT NULL,
	"description" varchar(200),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stats_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(120) NOT NULL,
	"role" varchar(160) NOT NULL,
	"group" "team_group" NOT NULL,
	"tier" "team_tier" NOT NULL,
	"bio" text,
	"photo_url" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(60) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(100),
	"meta" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"company" varchar(160),
	"topic" "enquiry_topic" NOT NULL,
	"message" text NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"source_path" varchar(200),
	"ip_hash" varchar(64),
	"user_agent" varchar(300),
	"handled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystem_links" ADD CONSTRAINT "ecosystem_links_from_id_ecosystem_entities_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."ecosystem_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystem_links" ADD CONSTRAINT "ecosystem_links_to_id_ecosystem_entities_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."ecosystem_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "events_scope_start_idx" ON "events" USING btree ("scope","is_published","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "highlights_group_slug_unique" ON "highlights" USING btree ("group","slug");--> statement-breakpoint
CREATE INDEX "highlights_group_order_idx" ON "highlights" USING btree ("group","is_published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_city_country_unique" ON "locations" USING btree ("city","country_code");--> statement-breakpoint
CREATE INDEX "organizations_kind_order_idx" ON "organizations" USING btree ("kind","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "products_order_idx" ON "products" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "services_order_idx" ON "services" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "team_group_order_idx" ON "team_members" USING btree ("group","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("status","created_at");