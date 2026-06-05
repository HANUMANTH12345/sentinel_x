CREATE TABLE "community_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"reporter" text NOT NULL,
	"type" text NOT NULL,
	"domain" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"extracted_url" text NOT NULL,
	"raw_content" text,
	"score" integer NOT NULL,
	"indicators" text[] DEFAULT '{}' NOT NULL,
	"ai_text" text DEFAULT '' NOT NULL,
	"scam_probability" integer DEFAULT 0 NOT NULL,
	"has_ssl" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "url_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"score" integer NOT NULL,
	"indicators" text[] DEFAULT '{}' NOT NULL,
	"chain" text[] DEFAULT '{}' NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_text" text DEFAULT '' NOT NULL,
	"trackers" text[] DEFAULT '{}' NOT NULL,
	"has_ssl" boolean DEFAULT false NOT NULL,
	"has_hsts" boolean DEFAULT false NOT NULL,
	"status_code" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
