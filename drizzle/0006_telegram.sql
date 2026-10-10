CREATE TABLE "telegram_link" (
	"user_id" text PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"locale" text NOT NULL,
	"time_zone" text NOT NULL,
	"reminders" boolean DEFAULT false NOT NULL,
	"leaderboard" boolean DEFAULT false NOT NULL,
	"last_reminded" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_link_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_link_token" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"locale" text NOT NULL,
	"time_zone" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_link" ADD CONSTRAINT "telegram_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_token" ADD CONSTRAINT "telegram_link_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;