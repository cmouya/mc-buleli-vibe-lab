# Skill Identity — Persistence implementation plan

**Provenance:** PLAN written after human approval of the C2 persistence architecture. Later C2.1–C2.4 slices were **separately human-authorized**. This file is now the **C2 ledger**. **C2.5 does not authorize post-C2 product work.**

**Depends on:** [`docs/skill-identity-persistence-decisions.md`](skill-identity-persistence-decisions.md), [`docs/skill-identity-decisions.md`](skill-identity-decisions.md) (ADR-020).

**Architecture-freeze baseline (historical):** published main `506f05a7f4db0fa905eaa87631201396de8d58d6` (C1 domain contracts). At freeze time, migration head was `0007_m6_1_goal_ownership` and **no C2 migration number was allocated yet**.

**Pre-C2.5 implementation baseline:** published main `545a3c7187467f73f785581fc545a8a1b6f79916` (`feat: implement C2.4 tenant-safe step skill binding`). **C2.1–C2.4 CLOSED/FROZEN.**

## Status

**Persistence architecture:** FROZEN (D-C2-01–D-C2-19; Option A)
**Persistence implementation:** C2.1–C2.4 **COMPLETE AND VALIDATED**
**C2.5 / Checkpoint F:** documentation and regression **closure** (this checkpoint)
**Tables:** `skills`, `goal_skills`, `step_skills` exist (`SCHEMA_SLICE` `c2.1-skill-identity-schema`)
**Migration head:** `0008_powerful_retro_girl` (no `0009`)
**Next product work:** **NOT AUTHORIZED** — requires a **new ADR / design checkpoint** after C2 close. C2.5 does not select that slice.

## Human checkpoints (mandatory)

No later checkpoint may be skipped.

| Checkpoint | Gate |
|---|---|
| **A** | Human approval of this documentation freeze **before C2.1** — **DONE** |
| **B** | Human review of schema/migration design **before migration execution** — **DONE** |
| **C** | Human review after **C2.2** Skill catalog persistence — **DONE** |
| **D** | Human review after **C2.3** Goal↔Skill persistence — **DONE** |
| **E** | Human review after **C2.4** Step↔Skill persistence — **DONE** (Checkpoint E / post-C2.4 roadmap) |
| **F** | Full regression and architecture closure **before C2 is declared complete** — **this C2.5 record** |

## Sequence (C2.1–C2.4 implemented; C2.5 closure)

### C2.1 — Schema / migration

**Status:** **DONE.** Migration `0008_powerful_retro_girl`. Layers: `src/infra/db/schema.ts`, `drizzle/*`, schema-boundary tests.

**Purpose:** Additive planned structure only (`skills`, `goal_skills`, `step_skills`) when a later human decision allocates a migration number.

**Security proof:** no `organization_id` on Path/Step/Evidence; no `Evidence.skillId`; no Mastery columns.

**Non-goals (freeze-time):** adapters, HTTP, allocating 0008 **from this documentation freeze**. (0008 was allocated later in C2.1.)

### C2.2 — Skill catalog persistence

**Status:** **DONE.** INSERT-only catalog persist; tenant-safe get-by-id. No list/search/update/delete in C2.

**Purpose:** Persist and tenant-safely resolve `OrganizationSkill`. Stamp `organization_id` from trusted OrganizationContext. Never persist `createSkill` output.

**Security proof:** lookup by `skillId` + trusted organization; forged client org ignored; cross-org get is non-leaking not-found.

**Non-goals:** HTTP Skill CRUD; Goal/Step binds; Path persist changes.

### C2.3 — Goal ↔ Skill persistence

**Status:** **DONE.** Tenant-safe idempotent bind in one transaction. No Goal-Skill list/unbind.

**Purpose:** Authorized **idempotent** Goal Skill binding after owned Goal + Skill lookup in trusted org.

**Security proof:** unowned Goal cannot bind; foreign Skill cannot bind; NULL Goal organization fail-closed; duplicate pair no-op.

**Non-goals:** changing Goal create; proficiency levels.

### C2.4 — Step ↔ Skill persistence

**Status:** **DONE.** Step → Path → Goal proof + Skill proof + INSERT in one transaction. Independent of `goal_skills`. No Step-Skill list/unbind.

**Purpose:** Authorized **idempotent** Step coverage after Step → Path → Goal proof + Skill lookup in trusted org.

**Security proof:** unowned Step cannot bind; foreign Skill cannot bind; duplicate pair no-op.

**Non-goals:** changing `persistOwnedPath`; Golden Reference labels; label→id mapping.

### C2.5 — Regression closure

**Status:** **THIS CHECKPOINT.** Documentation reconciliation + existing-suite regression. **No new product capability.** No production-code change.

**Purpose:** Prove Evidence, I-05 Completion, Path Progress, Goal-rooted ownership, and Golden Reference remain unchanged.

**Non-goals:** Playwright unless a later HTTP slice exists; Mastery; Skill reads; Skill HTTP; LearnerSkill; Evidence.skillId; SkillGap; Adaptive Path.

## C2 closure record (Checkpoint F)

C2 was **Skill Identity persistence infrastructure** after ADR-020 / C1:

| Slice | What shipped | Pre-C2.5 baseline |
|---|---|---|
| C2.1 | `skills`, `goal_skills`, `step_skills`; `0008_powerful_retro_girl` | schema slice `c2.1-skill-identity-schema` |
| C2.2 | `persistOrganizationSkill` / `getOrganizationSkill` | INSERT-only catalog; org-scoped get |
| C2.3 | `bindOwnedGoalSkill` | owned Goal + org Skill; idempotent `goal_skills` |
| C2.4 | `bindOwnedStepSkill` | owned Step via Path→Goal; idempotent `step_skills` |
| C2.5 | docs + regression closure | no schema; no `0009` |

**Intentionally still deferred after C2 close:** organization Skill list/search; `getSkillsForGoal`; Step coverage reads; unbind; catalog update/delete; Skill HTTP/API; LearnerSkill persistence; LearnerState persistence; `Evidence.skillId`; Mastery / I-04; SkillGap production implementation; Adaptive Path engine.

Post-C2 product direction requires a **new ADR / design checkpoint**. C2.5 does not choose that slice.

## Implementation guardrails

- C2-G1–C2-G9 and D-C2-01–D-C2-19.
- Ports typed to `OrganizationSkill` or `skillId` + trusted organization (SHOULD FIX DURING C2).
- Bind transactions: ownership SELECT + Skill SELECT + INSERT pair (unique PK; duplicate = success/no-op).
- Option A: no `organization_id` on joins.
- No public Skill HTTP in the first persistence slice (ADR-020 S-17).
- Do not modify `docs/skill-identity-decisions.md` as part of C2 implementation unless a later ADR requires it.

## Required test matrix (C2 closure)

Proven by C2.1–C2.4 suites plus existing M6 Evidence/Progress/E2E tests. C2.5 adds no duplicate tests where the invariant is already covered.

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

Any **post-C2** schema, adapter, HTTP, Mastery, SkillGap, Adaptive Path, or Golden Reference change started from this file without a **new** human-authorized design checkpoint. C2.1–C2.4 remain **FROZEN**.
