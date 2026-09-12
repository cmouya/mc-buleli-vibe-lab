CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"statement" text NOT NULL,
	"level" text NOT NULL,
	"hours_per_week" numeric NOT NULL,
	"intent" text NOT NULL,
	"status" text NOT NULL,
	"analyzed_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_level_check" CHECK ("goals"."level" IN ('debutant', 'intermediaire', 'avance')),
	CONSTRAINT "goals_intent_check" CHECK ("goals"."intent" IN ('professionnel', 'personnel', 'academique')),
	CONSTRAINT "goals_status_check" CHECK ("goals"."status" IN ('draft', 'analyzed', 'confirmed', 'achieved')),
	CONSTRAINT "goals_hours_check" CHECK ("goals"."hours_per_week" > 0)
);
