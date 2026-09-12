# M5 — Authentication + Multi-tenancy (non-binding planning brief)

**Status:** Planned. Not implemented. Not authorized.

**Depends on:** M0–M4 Done.

**M5 implementation decisions remain subject to a dedicated M5 architecture audit and human approval.**

This file is a **non-binding** next-slice brief after M4 closure. It is not an implementation spec. It does not authorize schema, API, Golden Reference, or ADR changes. It does not freeze User, Organization, membership, role, session, tenant, or ownership-FK designs.

## Objective (hypothesis)

M5 should introduce **verified identity** and **organization tenancy** so later slices can attach learner-scoped state without inventing anonymous owners.

How identity, tenancy, sessions, and ownership are modeled is **undecided** until the M5 audit.

## Already satisfied (M3–M4)

- Fastify `/api/v1/` + OpenAPI + `inject()` tests
- PostgreSQL + versioned Drizzle migrations (ADR-002: PostgreSQL as persistence; **not** a tenant-boundary ADR)
- Domain repository ports; Drizzle in `src/infra/db/` only (ADR-007)
- Durable anonymous spine: Goal → accepted Path → Steps → Evidence
- Golden Reference still on `localStorage` (intentional)

## Out of scope for this brief (and not M4.5)

Do not smuggle these into an unapproved M5 slice:

- Progress (`todo` / `current` / `done`, path %)
- LearnerState persistence
- Skill / LearnerSkill / SkillGap tables
- AssessmentAttempt
- Mastery
- Dual-write from Golden Reference
- Changing confirm/generate contracts unless a later approved plan requires it
- Seed data of fake orgs/learners as a substitute for real identity

Progress is not Mastery. Evidence-before-Completion (I-05) stays in domain.

Whether persist HTTP for Goal/Path/Evidence belongs in M5, M6, or later is an **open question** for the M5/M6 audits.

## Candidate concepts (not decisions)

These names are **hypotheses** only. The M5 audit must choose, reject, or replace them.

| Candidate | Open questions |
|-----------|----------------|
| Organization | Is this the tenant boundary? One org per user? Nested orgs? |
| User | Credentials vs SSO? Same as Learner or distinct actor? |
| Membership / assignment | How (if at all) does a user relate to an org? Role stub vs later RBAC? |
| Session | ADR-005 prefers server sessions + HTTP-only cookies; exact library is D-11 (deferred). |

**Not decided here:** exact User model, exact Organization model, OrganizationMembership schema, role model, RBAC matrix (D-14), tenant schema, session library.

## Existing M4 tables (facts, not an ownership design)

`goals`, `learning_paths`, `learning_path_steps`, `evidence` have UUID PKs and **no** `user_id` / `learner_id` / `organization_id` columns today.

**Open question for the M5 audit:** how (if at all) later identity attaches to these rows. Examples that must **not** be treated as chosen:

- nullable FKs added by `ALTER TABLE`
- required FKs and backfill
- join tables / ownership tables instead of columns on the spine
- leaving historical rows anonymous forever

Do **not** add ownership columns until an M5 implementation plan is approved.

## Deferred (unchanged)

- PostgreSQL hosting (D-01)
- Exact session library (D-11)
- Enterprise SSO (D-05 / D-09)
- RBAC matrix (D-14)

ADR-005 (session style) and ADR-002 (PostgreSQL persistence) remain accepted. They do **not** by themselves specify tenant tables or FKs.

## Golden Reference

Unchanged until an approved M5/M6 plan says otherwise.

## Exact next action

1. Run a **dedicated M5 architecture audit** and obtain **human approval**.
2. Only then implement the approved bounded slice. Do not persist Progress, LearnerState, Skill, or Mastery in that same unscoped motion.
