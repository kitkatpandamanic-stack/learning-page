CREATE TABLE "streak_freeze" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streak_freeze_user_id_kind_day_pk" PRIMARY KEY("user_id","kind","day")
);
--> statement-breakpoint
ALTER TABLE "streak_freeze" ADD CONSTRAINT "streak_freeze_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;