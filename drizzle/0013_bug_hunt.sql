CREATE TABLE "tg_bughunt" (
	"id" text PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"user_id" text,
	"day" date NOT NULL,
	"language" text NOT NULL,
	"cards" jsonb NOT NULL,
	"started_at" timestamp NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	"finished_at" timestamp,
	"xp" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tg_bughunt" ADD CONSTRAINT "tg_bughunt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tg_bughunt_day_language_idx" ON "tg_bughunt" USING btree ("day","language");--> statement-breakpoint
CREATE INDEX "tg_bughunt_telegram_idx" ON "tg_bughunt" USING btree ("telegram_id","language");