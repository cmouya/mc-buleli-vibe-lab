# Skill Identity — Persistence implementation plan (not authorized)

**Provenance:** PLAN ONLY. Written after human approval of the C2 persistence architecture. **This file does not authorize C2.1 or any persistence implementation.**

**Depends on:** [`docs/skill-identity-persistence-decisions.md`](skill-identity-persistence-decisions.md), [`docs/skill-identity-decisions.md`](skill-identity-decisions.md) (ADR-020).

**Architecture-freeze baseline:** published main `506f05a7f4db0fa905eaa87631201396de8d58d6` (C1 domain contracts). Migration head remains `0007_m6_1_goal_ownership`. **No migration number is allocated.**

## Status

**Persistence architecture:** FROZEN (documentation)
**Persistence implementation:** NOT STARTED
**C2.1 / C2.2 / C2.3 / C2.4 / C2.5:** NOT STARTED
**Tables created:** none

## Human checkpoints (mandatory)

No later checkpoint may be skipped.

| Checkpoint | Gate |
|---|---|
| **A** | Human approval of this documentation freeze **before C2.1** |
| **B** | Human review of schema/migration design **before migration execution** |
| **C** | Human review after **C2.2** Skill catalog persistence |
| **D** | Human review after **C2.3** Goal↔Skill persistence |
| **E** | Human review after **C2.4** Step↔Skill persistence |
| **F** | Full regression and architecture closure **before C2 is declared complete** |

## Future sequence (not started)

### C2.1 — Schema / migration

**Purpose:** Additive planned structure only (`skills`, `goal_skills`, `step_skills`) when a later human decision allocates a migration number.

**Likely layers:** `src/infra/db/schema.ts`, `drizzle/*`, schema-boundary tests — **not now**.

**Security proof:** no `organization_id` on Path/Step/Evidence; no `Evidence.skillId`; no Mastery columns.

**Non-goals:** adapters, HTTP, allocating 0008 in this documentation freeze.

### C2.2 — Skill catalog persistence

**Purpose:** Persist and tenant-safely resolve `OrganizationSkill`. Stamp `organization_id` from trusted OrganizationContext. Never persist `createSkill` output.

**Security proof:** lookup by `skillId` + trusted organization; forged client org ignored; cross-org get is non-leaking not-found.

**Non-goals:** HTTP Skill CRUD; Goal/Step binds; Path persist changes.

### C2.3 — Goal ↔ Skill persistence

**Purpose:** Authorized **idempotent** Goal Skill binding after owned Goal + Skill lookup in trusted org.

**Security proof:** unowned Goal cannot bind; foreign Skill cannot bind; NULL Goal organization fail-closed; duplicate pair no-op.

**Non-goals:** changing Goal create; proficiency levels.

### C2.4 — Step ↔ Skill persistence

**Purpose:** Authorized **idempotent** Step coverage after Step → Path → Goal proof + Skill lookup in trusted org.

**Security proof:** unowned Step cannot bind; foreign Skill cannot bind; duplicate pair no-op.

**Non-goals:** changing `persistOwnedPath`; Golden Reference labels; label→id mapping.

### C2.5 — Regression closure

**Purpose:** Prove Evidence, I-05 Completion, Path Progress, Goal-rooted ownership, and Golden Reference remain unchanged.

**Non-goals:** Playwright unless a later HTTP slice exists; Mastery.

## Implementation guardrails

- C2-G1–C2-G9 and D-C2-01–D-C2-19.
- Ports typed to `OrganizationSkill` or `skillId` + trusted organization (SHOULD FIX DURING C2).
- Bind transactions: ownership SELECT + Skill SELECT + INSERT pair (unique PK; duplicate = success/no-op).
- Option A: no `organization_id` on joins.
- No public Skill HTTP in the first persistence slice (ADR-020 S-17).
- Do not modify `docs/skill-identity-decisions.md` as part of C2 implementation unless a later ADR requires it.

## Required future test matrix

Before C2 can be accepted, tests must prove:

1. `OrganizationSkill` persists under trusted organization.
2. Skill lookup is organization-scoped.
3. Same label can represent distinct Skill IDs.
4. Same label can exist across organizations.
5. Goal ↔ Skill same-org bind succeeds.
6. Goal ↔ foreign Skill fails without tenant leakage.
7. Step ↔ Skill same-org bind succeeds.
8. Step ↔ foreign Skill fails without tenant leakage.
9. Forged `OrganizationSkill.organizationId` is not authority.
10. Unowned Goal cannot bind.
11. Unowned Step cannot bind.
12. Duplicate Goal ↔ Skill bind is idempotent.
13. Duplicate Step ↔ Skill bind is idempotent.
14. Goal deletion removes joins but not Skill.
15. Step deletion removes joins but not Skill.
16. Skill deletion leaves no orphan joins.
17. Goal may reference multiple Skills.
18. Skill may serve multiple Goals.
19. Step may cover multiple Skills.
20. Skill may be covered by multiple Steps.
21. Existing durable data remains valid with zero bindings.
22. No `organizationId` added to Path/Step/Evidence.
23. No `Evidence.skillId`.
24. I-05 unchanged.
25. Progress unchanged.
26. No Mastery semantics.
27. No Golden Reference rewrite.
28. No automatic label→Skill mapping.

Domain C1 tests already cover identity/bind contracts without DB. C2 adds DB/application proofs. No API tests unless a later slice adds HTTP.

## Explicit non-goals (OUT OF C2)

Public Skill CRUD HTTP; Skill search/catalog UI; prerequisites; versioning; platform-global ontology; LearnerSkill/Mastery persistence; I-04; Adaptive Path; SkillGap; automatic label→Skill mapping; Golden Reference rewrite/dual-write; mutating `persistOwnedGoal` / `persistOwnedPath` in the first slice; Path/Step/Evidence tenant columns; SSO/RBAC expansion; Program/Cohort.

## Stop conditions

Any schema, migration, SQL, adapter, HTTP, Mastery, SkillGap, Adaptive Path, or Golden Reference change started from this file without Checkpoints A–B (and later C–F as applicable).
