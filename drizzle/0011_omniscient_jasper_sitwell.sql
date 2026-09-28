CREATE TABLE "step_quiz_definitions" (
	"step_id" uuid PRIMARY KEY NOT NULL,
	"minimum_correct_count" integer NOT NULL,
	"items" jsonb NOT NULL,
	CONSTRAINT "step_quiz_definitions_minimum_correct_count_check" CHECK ("step_quiz_definitions"."minimum_correct_count" >= 1),
	CONSTRAINT "step_quiz_definitions_items_array_check" CHECK (jsonb_typeof("step_quiz_definitions"."items") = 'array'),
	CONSTRAINT "step_quiz_definitions_items_nonempty_check" CHECK (jsonb_array_length("step_quiz_definitions"."items") >= 1),
	CONSTRAINT "step_quiz_definitions_minimum_correct_count_lte_items_check" CHECK ("step_quiz_definitions"."minimum_correct_count" <= jsonb_array_length("step_quiz_definitions"."items"))
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "scoring_provenance" text DEFAULT 'client_declared' NOT NULL;--> statement-breakpoint
ALTER TABLE "step_quiz_definitions" ADD CONSTRAINT "step_quiz_definitions_step_id_learning_path_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."learning_path_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_scoring_provenance_check" CHECK ("evidence"."scoring_provenance" IN ('client_declared', 'server_recalculated'));