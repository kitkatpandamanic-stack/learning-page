CREATE TABLE "telegram_job_run" (
	"job" text NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_job_run_job_day_pk" PRIMARY KEY("job","day")
);
--> statement-breakpoint
CREATE TABLE "telegram_quiz" (
	"poll_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ref" text NOT NULL,
	"correct_option" smallint NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"day" date,
	"correct" boolean
);
--> statement-breakpoint
ALTER TABLE "telegram_link" ADD COLUMN "reminder_hour" smallint DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_link" ADD COLUMN "reminders_resume_on" date;--> statement-breakpoint
ALTER TABLE "telegram_link" ADD COLUMN "pings" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_quiz" ADD CONSTRAINT "telegram_quiz_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "telegram_quiz_user_day_idx" ON "telegram_quiz" USING btree ("user_id","day");