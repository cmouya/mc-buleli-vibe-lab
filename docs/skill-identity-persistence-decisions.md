# Skill Identity — Persistence architecture decisions

## Status

**Persistence architecture freeze:** COMPLETE
**Persistence implementation:** NOT STARTED
**C2.1–C2.5:** NOT AUTHORIZED
**Migration number:** UNALLOCATED (head remains `0007_m6_1_goal_ownership`)

This file freezes the **human-approved** persistence architecture for ADR-020 Skill Identity. It is **not** executable. It does **not** create tables, modify Drizzle schema, generate SQL, or allocate migration 0008.

**Depends on:** [`docs/skill-identity-decisions.md`](skill-identity-decisions.md) (ADR-020 S-01–S-21). Do not rewrite that ADR.

**C1 published:** `feat: add Skill Identity domain contracts` (`506f05a7f4db0fa905eaa87631201396de8d58d6`). Domain contracts exist. Durable Skill rows **do not**.

## Guardrails (mandatory)

**C2-G1.** Only ADR-020 organization-scoped Skill identity may become a persistent Skill row.

**C2-G2.** Phase 0 `createSkill` output MUST NOT become persistent catalog identity.

**C2-G3.** A client-built `OrganizationSkill.organizationId` MUST NOT establish tenant authority.

**C2-G4.** Persistent Skill lookup must prove the Skill belongs to the trusted organization.

**C2-G5.** Goal ↔ Skill writes must establish trusted Goal ownership and resolve the Skill within that trusted organization before persisting the pair.

**C2-G6.** Step ↔ Skill writes must establish Goal-rooted Step ownership and resolve the Skill within that trusted organization before persisting the pair.

**C2-G7.** Do not add `organizationId` to Path, Step, or Evidence.

**C2-G8.** Skill label/name is never identity or authorization authority.

**C2-G9.** Do not introduce Mastery semantics into persistence.

## Frozen decisions

**D-C2-01.** Persistent Skill identity is organization-scoped.

**D-C2-02.** Only `OrganizationSkill` maps to persistent Skill identity.

**D-C2-03.** Future `skills.organization_id` is mandatory.

**D-C2-04.** Skill name is a label, never identity or authorization authority.

**D-C2-05.** Goal ↔ Skill is an explicit many-to-many relation.

**D-C2-06.** Step ↔ Skill is an explicit many-to-many relation.

**D-C2-07.** Future `goal_skills` and `step_skills` do **not** carry `organization_id`.

**D-C2-08.** Cross-tenant consistency uses trusted Goal-rooted ownership plus organization-scoped Skill resolution.

**D-C2-09.** Duplicate Goal ↔ Skill pairs are structurally prevented.

**D-C2-10.** Duplicate Step ↔ Skill pairs are structurally prevented.

**D-C2-11.** Deleting a Goal or Step may remove join rows but MUST NOT delete the reusable Skill.

**D-C2-12.** Deleting a Skill must not leave orphan join rows.

**D-C2-13.** Evidence schema remains unchanged.

**D-C2-14.** No tenant column is added to Path / Step / Evidence.

**D-C2-15.** No Mastery / I-04 implementation belongs to C2.

**D-C2-16.** No automatic label → Skill identity resolution.

**D-C2-17.** Existing durable records remain valid with zero Skill bindings.

**D-C2-18.** A future migration is additive and requires no legacy backfill unless future implementation evidence proves otherwise. **No migration number is allocated by this freeze.**

**D-C2-19.** Duplicate authorized Goal ↔ Skill and Step ↔ Skill binds are **idempotent**. An already-existing pair `(goalId, skillId)` or `(stepId, skillId)` must succeed as a no-op. It must **not** create a second row, create a new learning event, alter Completion, alter Progress, or imply Mastery.

## Future conceptual persistence model (NOT IMPLEMENTED)

**No table has been created.** The following is planned shape only.

### `skills` (planned)

| Field | Semantics |
|---|---|
| `id` | Durable UUID identity (same generation style as other Learnova entities) |
| `organization_id` | Mandatory FK → `organizations.id` (catalog governance) |
| `name` | Mandatory **label**; not unique; not identity |
| `description` | Optional |
| `created_at` | Follows repository `created_at` convention |

Planned index: `skills_organization_id_idx`. **No uniqueness on name.** Duplicate labels are allowed inside one organization and across organizations.

Planned organization FK delete: **RESTRICT** (do not drop catalog Skills when deleting an Organization unless a later ADR says otherwise).

**Excluded:** learnerId, goalId, stepId, masteryLevel, requiredLevel, targetLevel, prerequisiteIds, version, status, canonicalSkillId, `updated_at` (not required in the first persistence slice).

### `goal_skills` (planned)

| Field | Semantics |
|---|---|
| `goal_id` | FK → `goals.id` |
| `skill_id` | FK → `skills.id` |

Preferred key: **PRIMARY KEY (`goal_id`, `skill_id`)**. No `organization_id`. No proficiency, mastery, weight, or status.

Conceptual delete: Goal deletion **CASCADE** join rows; Skill deletion **CASCADE** join rows; deleting a join row never deletes Goal or Skill.

Planned reverse-lookup index: `goal_skills_skill_id_idx`.

### `step_skills` (planned)

| Field | Semantics |
|---|---|
| `step_id` | FK → `learning_path_steps.id` |
| `skill_id` | FK → `skills.id` |

Preferred key: **PRIMARY KEY (`step_id`, `skill_id`)**. No `organization_id`. No mastery, completion, primarySkill, weight, or requiredLevel.

Conceptual delete: Step deletion **CASCADE** join rows; Skill deletion **CASCADE** join rows; deleting a join row never deletes Step or Skill. Path deletion that cascades Steps also removes coverage rows, not Skills.

Planned reverse-lookup index: `step_skills_skill_id_idx`.

## Tenant integrity — Option A (ACCEPTED)

**Simple relational FKs** plus **trusted repository/application ownership proof**.

Do **not** duplicate `organization_id` onto join tables. Do **not** introduce composite tenant FKs in this slice.

**Limitation (must remain documented):** foreign keys alone cannot prove `Goal.organization_id == Skill.organization_id` (or the Step equivalent). Tenant consistency **MUST** be proven **before** relation persistence.

## Trusted bind flows (conceptual)

Request identifiers (`goalId`, `stepId`, `skillId`, client `organizationId` / `learnerId`) are **not** authority.

**Goal ↔ Skill (planned):**

authenticated User → OrganizationContext → LearnerContext → owned Goal → trusted Goal organization → resolve Skill by **`skillId` + trusted organizationId from the persisted Skill row** → bind `GoalSkillRequirement` → persist `goal_skills` **idempotently**.

**Step ↔ Skill (planned):**

authenticated User → OrganizationContext → LearnerContext → owned Step via **Step → Path → Goal** → trusted Goal organization → resolve Skill by **`skillId` + trusted organization** → bind `StepSkillCoverage` → persist `step_skills` **idempotently**.

Never trust: body `organizationId`, client `learnerId`, client `OrganizationSkill.organizationId`, Skill name/label.

**Legacy Goal with NULL `organization_id`:** fail closed for Skill binding.

**Cross-tenant Skill lookup:** non-leaking not-found (same class as unowned Goal/Step).

Skill organization comes from the **database Skill row**, not from a caller-built object.

## Legacy Skill boundary

Phase 0 `Skill` / `createSkill` / `isSkill` remain conceptual compatibility constructs. They are **not** persistence authority.

ADR-020 `OrganizationSkill` / `createOrganizationSkill` is the catalog identity that **may** map to future `skills`.

`isSkill` may structurally accept an `OrganizationSkill`. That is **not** a freeze blocker.

**SHOULD FIX DURING C2:** persistence ports/adapters explicitly use `OrganizationSkill` or `skillId` + trusted organization; never `isSkill` / `createSkill` as persistence authority.

**SAFE TO DEFER:** rename `OrganizationSkill`; deprecate `createSkill`; tighten `isSkill`; branded SkillId.

## Path / Goal integration (first persistence slice)

Do **not** change `persistOwnedGoal` to auto-create requirements.

Do **not** change `persistOwnedPath` to auto-create coverage. Generator / Golden Reference `step.skill` remains a **label**. No `label → Skill ID` mapping. No GR rewrite. No dual-write.

Initial Goal↔Skill and Step↔Skill persistence use **separate explicit authorized bind** operations.

## Completion / Progress / Evidence

C2 persistence **MUST NOT** modify: Evidence schema; `Evidence.skillId`; I-05; `assertEvidenceAllowsCompletion`; Step Completion; Path Progress; `currentStep`; M6.3 Evidence POST; M6.4 progress derivation.

Skill coverage is not Completion. Passed Evidence is not Skill Mastery. Repeated Skill binding does not affect Completion or Progress.

## I-04 / Mastery

C2 creates **identity infrastructure only**. After persistence exists, Learnova may have stable org-scoped Skill ids, Goal requirements, Step coverage, and Step-scoped Evidence that can later be interpreted through coverage.

Still **OUT:** per-Skill Evidence attribution; LearnerSkill persistence; Mastery state/thresholds; SkillGap; Adaptive Path; I-04 implementation.

## Future migration concept (NOT AUTHORIZED)

A later additive migration **may** create `skills`, then `goal_skills`, then `step_skills`. Existing Goals / Paths / Steps / Evidence need **no backfill**. Zero Skill bindings remain valid.

**Do not** create the migration, generate SQL, allocate 0008, or edit `drizzle/meta/_journal.json` / `schema.ts` from this freeze.

See [`docs/skill-identity-persistence-implementation-plan.md`](skill-identity-persistence-implementation-plan.md).
