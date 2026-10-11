CREATE TABLE "health_snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"detail" text,
	"who" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "health_snapshot_collected_at_idx" ON "health_snapshot" USING btree ("collected_at");--> statement-breakpoint
CREATE INDEX "security_event_created_at_idx" ON "security_event" USING btree ("created_at");