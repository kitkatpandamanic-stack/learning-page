CREATE TABLE "tg_wordle" (
	"telegram_id" bigint NOT NULL,
	"day" date NOT NULL,
	"language" text NOT NULL,
	"user_id" text,
	"guesses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"solved" boolean DEFAULT false NOT NULL,
	"finished_at" timestamp,
	"xp" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "tg_wordle_telegram_id_day_language_pk" PRIMARY KEY("telegram_id","day","language")
);
--> statement-breakpoint
ALTER TABLE "tg_wordle" ADD CONSTRAINT "tg_wordle_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;