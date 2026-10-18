CREATE TABLE "tg_group" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"weekly" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_group_member" (
	"chat_id" bigint NOT NULL,
	"telegram_id" bigint NOT NULL,
	"name" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tg_group_member_chat_id_telegram_id_pk" PRIMARY KEY("chat_id","telegram_id")
);
--> statement-breakpoint
ALTER TABLE "tg_group_member" ADD CONSTRAINT "tg_group_member_chat_id_tg_group_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."tg_group"("chat_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tg_group_member_telegram_idx" ON "tg_group_member" USING btree ("telegram_id");