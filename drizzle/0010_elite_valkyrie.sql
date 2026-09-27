CREATE TABLE "evidence_skills" (
	"evidence_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "evidence_skills_evidence_id_skill_id_pk" PRIMARY KEY("evidence_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_skills_skill_id_idx" ON "evidence_skills" USING btree ("skill_id");