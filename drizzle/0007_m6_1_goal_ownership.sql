ALTER TABLE "goals" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "learner_id" uuid;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_org_id" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_org_learner_fk" FOREIGN KEY ("organization_id","learner_id") REFERENCES "public"."learners"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_ownership_pair_check" CHECK (("goals"."organization_id" IS NULL AND "goals"."learner_id" IS NULL) OR ("goals"."organization_id" IS NOT NULL AND "goals"."learner_id" IS NOT NULL));
