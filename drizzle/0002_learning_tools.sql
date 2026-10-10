CREATE TABLE "bookmark" (
	"user_id" text NOT NULL,
	"permalink" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_user_id_permalink_pk" PRIMARY KEY("user_id","permalink")
);
--> statement-breakpoint
CREATE TABLE "page_visit" (
	"user_id" text NOT NULL,
	"permalink" text NOT NULL,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_visit_user_id_permalink_pk" PRIMARY KEY("user_id","permalink")
);
--> statement-breakpoint
CREATE TABLE "review_card" (
	"user_id" text NOT NULL,
	"ref" text NOT NULL,
	"box" integer DEFAULT 0 NOT NULL,
	"due_on" date NOT NULL,
	"first_reviewed_on" date NOT NULL,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_card_user_id_ref_pk" PRIMARY KEY("user_id","ref")
);
--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_visit" ADD CONSTRAINT "page_visit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_card" ADD CONSTRAINT "review_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_visit_user_visited_idx" ON "page_visit" USING btree ("user_id","visited_at");--> statement-breakpoint
CREATE INDEX "review_card_user_due_idx" ON "review_card" USING btree ("user_id","due_on");