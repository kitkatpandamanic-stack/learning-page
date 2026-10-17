CREATE TABLE "tg_blitz" (
	"telegram_id" bigint NOT NULL,
	"day" date NOT NULL,
	"language" text NOT NULL,
	"user_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	"ms" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp,
	"xp" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "tg_blitz_telegram_id_day_language_pk" PRIMARY KEY("telegram_id","day","language")
);
--> statement-breakpoint
ALTER TABLE "tg_blitz" ADD CONSTRAINT "tg_blitz_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tg_blitz_day_language_idx" ON "tg_blitz" USING btree ("day","language");