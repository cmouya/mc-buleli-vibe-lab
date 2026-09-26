CREATE TABLE "goal_skills" (
	"goal_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "goal_skills_goal_id_skill_id_pk" PRIMARY KEY("goal_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_skills" (
	"step_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "step_skills_step_id_skill_id_pk" PRIMARY KEY("step_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "goal_skills" ADD CONSTRAINT "goal_skills_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_skills" ADD CONSTRAINT "goal_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_skills" ADD CONSTRAINT "step_skills_step_id_learning_path_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."learning_path_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_skills" ADD CONSTRAINT "step_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_skills_skill_id_idx" ON "goal_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skills_organization_id_idx" ON "skills" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "step_skills_skill_id_idx" ON "step_skills" USING btree ("skill_id");