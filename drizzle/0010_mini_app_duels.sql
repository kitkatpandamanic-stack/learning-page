CREATE TABLE "tg_duel" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_telegram_id" bigint NOT NULL,
	"creator_user_id" text,
	"creator_name" text NOT NULL,
	"creator_locale" text NOT NULL,
	"language" text NOT NULL,
	"refs" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_duel_play" (
	"duel_id" text NOT NULL,
	"telegram_id" bigint NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	"ms" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp,
	"xp" smallint DEFAULT 0 NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tg_duel_play_duel_id_telegram_id_pk" PRIMARY KEY("duel_id","telegram_id")
);
--> statement-breakpoint
ALTER TABLE "tg_duel" ADD CONSTRAINT "tg_duel_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_duel_play" ADD CONSTRAINT "tg_duel_play_duel_id_tg_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."tg_duel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_duel_play" ADD CONSTRAINT "tg_duel_play_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tg_duel_play_telegram_idx" ON "tg_duel_play" USING btree ("telegram_id","started_at");