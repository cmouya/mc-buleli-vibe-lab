CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"step_id" uuid NOT NULL,
	"type" text NOT NULL,
	"score" numeric NOT NULL,
	"max_score" numeric NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_type_check" CHECK ("evidence"."type" IN ('quiz_attempt')),
	CONSTRAINT "evidence_score_check" CHECK ("evidence"."score" >= 0),
	CONSTRAINT "evidence_max_score_check" CHECK ("evidence"."max_score" > 0),
	CONSTRAINT "evidence_score_lte_max_check" CHECK ("evidence"."score" <= "evidence"."max_score")
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_step_id_learning_path_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."learning_path_steps"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_step_id_idx" ON "evidence" USING btree ("step_id");