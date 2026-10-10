CREATE TABLE "saved_code" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"code" text,
	"edited_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_code_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "saved_code" ADD CONSTRAINT "saved_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;