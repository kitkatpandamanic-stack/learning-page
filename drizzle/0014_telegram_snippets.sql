CREATE TABLE "tg_snippet" (
	"id" text PRIMARY KEY NOT NULL,
	"author_telegram_id" bigint NOT NULL,
	"author_name" text NOT NULL,
	"sender_telegram_id" bigint NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tg_snippet_sender_idx" ON "tg_snippet" USING btree ("sender_telegram_id","created_at");--> statement-breakpoint
CREATE INDEX "tg_snippet_expires_idx" ON "tg_snippet" USING btree ("expires_at");