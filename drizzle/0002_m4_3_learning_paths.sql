CREATE TABLE "learning_path_steps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"path_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"source_step_id" text,
	CONSTRAINT "learning_path_steps_path_position" UNIQUE("path_id","position"),
	CONSTRAINT "learning_path_steps_position_check" CHECK ("learning_path_steps"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"source_path_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_paths_goal_id_idx" ON "learning_paths" USING btree ("goal_id");