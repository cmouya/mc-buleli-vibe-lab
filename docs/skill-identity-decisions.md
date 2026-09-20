# Skill Identity — Architecture Freeze

## Status

**Architecture freeze:** COMPLETE
**ADR-020:** Accepted
**Implementation:** NOT STARTED
**Skill Identity:** ARCHITECTURE FREEZE COMPLETE

This file records the human-approved Skill Identity architecture after the post-M6.4 discovery review. It is not executable. It does **not** authorize production code, tests, schema, migration, HTTP, Mastery, SkillGap, Adaptive Path, LearnerState, or Golden Reference changes.

**ADR-020** is **Accepted** in [`docs/architecture-baseline.md`](architecture-baseline.md) §20 ([ADR-020](architecture-baseline.md#adr-020--organization-scoped-skill-identity)). Do not edit ADR-002, ADR-005, ADR-013, ADR-014, ADR-015, ADR-016, ADR-017, ADR-018, or ADR-019 Decision rows.

**M6.4 remains COMPLETE AND VALIDATED** at published SHA `27df119588b511d6783b90dec057773369d0fd27` (244 executable tests). This freeze does not reopen M6.4.

**Next implementation checkpoint:** **NOT AUTHORIZED** by this document. A separate human-approved implementation plan is required before any Skill code.

## Context

The implemented learning spine is:

User → Session → OrganizationContext → LearnerContext → owned Goal → accepted Path → Steps → Evidence → I-05 → derived Step Completion → derived Path Progress.

M6.4 established: Evidence is durable; Completion is derived; Progress is derived; Progress ≠ Mastery; `currentStep` is not authoritative; LearnerState is not required for Progress; Goal remains the ownership root for Path / Step / Evidence.

Learning intelligence cannot proceed safely without durable Skill identity and meaningful binding to learning objects. This freeze defines that identity. It does not implement Skills.

## Frozen architecture

```
Organization
    ↓ governs
Skill identity
    ↑ referenced by
Goal Skill Requirements (many-to-many, no target levels)

Accepted Path
    ↓
Step
    ↕ many-to-many
Skill Coverage

Evidence
    ↓
Step
```

Evidence remains Step-scoped and unchanged. Future I-04 may interpret Evidence through Step → Skill Coverage, but this freeze does **not** define Mastery.

## ADR-020

### Status

Accepted

### Context

See above. Human review approved three forks: organization-scoped Skill identity; Step↔Skill many-to-many coverage; Goal↔Skill explicit many-to-many requirements without target proficiency levels.

### Decision

**A Skill is a stable learning capability.** Skill identity is reusable across Goals and Steps **inside the same Organization**. Skill identity is **not** global across Organizations in this architecture. The same human-readable label in two Organizations does **not** imply the same Skill identity.

Skill is **not** Goal, Step, Evidence, Completion, Progress, Mastery, LearnerSkill, or Learner state.

**Organization governs the Skill catalog.** That is catalog tenancy/governance. Skill is **not** Goal-owned.

**Goal remains the ownership root** for Path, Step, and Evidence. That ownership model is unchanged (ADR-016–019).

**S-01.** A Skill is a stable learning capability, not Step, Evidence, Completion, Progress, Mastery, Goal, or Learner state.

**S-02.** Skill identity is independent of any single Goal and any Learner.

**S-03.** Skill identity is organization-scoped.

**S-04.** Skill catalog is governed by Organization; Skill is not Goal-owned.

**S-05.** Goal remains ownership root for Path, Step, and Evidence.

**S-06.** Goal references Skills as desired-outcome requirements (what capabilities the Goal requires). Requirements are not inferred exclusively from the generated Path. This preserves Goal before Content (I-01).

**S-07.** Goal↔Skill is many-to-many.

**S-08.** Target proficiency levels are not part of this foundation. No `requiredLevel`, target proficiency, or mastery threshold. Existing `MasteryLevel` types do not authorize Goal Skill levels.

**S-09.** Step references Skills as learning coverage.

**S-10.** Step↔Skill is many-to-many. Do not freeze one Step = one Skill. Golden Reference `step.skill` is **not** architectural evidence for one-to-one cardinality. A Skill may appear in several Steps, several Paths, and more than once in the same Path. A Step may cover one or multiple Skills. No primary/secondary Skill and no coverage weights unless a later ADR requires them.

**S-11.** Step Completion remains I-05 and is not Skill Mastery. I-03 is preserved. M6.4 semantics are unchanged. A completed Step does **not** imply that all linked Skills are mastered, that any linked Skill is mastered, that a Mastery level was reached, or that a Goal Skill requirement is satisfied. Progress percentage is **not** a Mastery percentage.

**S-12.** Evidence remains Step-scoped. No `Evidence.skillId`, Skill ids array on Evidence, Skill Mastery result on Evidence, LearnerSkill mutation from Evidence POST, or Mastery mutation from Evidence POST. Evidence POST semantics remain ADR-018. For a multi-Skill Step, passed Evidence does **not** prove every linked Skill. Step→Skill coverage alone is **not** sufficient to prove Mastery. Per-Skill assessment attribution is deferred.

**S-13.** I-04 (Evidence before Mastery) remains defined and **not implemented**. Frozen prerequisites only: stable Skill identity; Goal Skill requirements; Step Skill coverage; existing Learner identity; existing Evidence identity; existing ownership chain.

**S-14.** No LearnerSkill or Mastery persistence. Existing conceptual/in-memory LearnerSkill code is **not** a persistence authority.

**S-15.** Skill prerequisite persistence and enforcement are deferred. Conceptual `prerequisiteIds` may remain where already present. No prerequisite table, cycle detection, graph traversal, or adaptive prerequisite engine.

**S-16.** Skill versioning is deferred. Skill id is stable across ordinary label/description edits. Material semantic replacement may later require a new Skill identity. No SkillVersion, effective dates, historical taxonomy snapshots, or global canonical versioning.

**S-17.** No public Skill HTTP in the first implementation slice. No Skill CRUD, Goal Skill HTTP, Step Skill HTTP, Mastery HTTP, LearnerSkill HTTP, SkillGap HTTP, or Adaptive Path HTTP.

**S-18.** Golden Reference skill labels (`step.skill`, `skills[]`) remain demo/UI proxies. They are **not** server Skill identity. No UUID rewrite, dual-write, server authority, or persisted Skill ids derived directly from arbitrary GR labels. Mapping AI/generated labels to controlled Skill identity is later. I-08: AI is not authority.

**S-19.** No tenant columns are added to Path, Step, or Evidence. A future Skill aggregate may carry `organizationId` because Skill catalog tenancy is intrinsic to that aggregate. Catalog access authority will derive from OrganizationContext. Detailed catalog mutation authorization is not frozen. No RBAC, admin UI, or Skill CRUD HTTP.

**S-20.** No migration number is allocated by this freeze. Current migration head remains `0007_m6_1_goal_ownership`. Do not assume 0008.

**S-21.** Organization-scoped Skill identity does **not** permanently prohibit a future platform-canonical Skill registry or ontology (`canonical Skill` → mapping/overlay → `organization Skill`) if product requirements later justify cross-organization semantic interoperability. That overlay is **out of scope**. Do not implement or design global Skill ids, canonical mappings, aliases, equivalence resolution, cross-org Mastery, or global taxonomy governance now. The current organization-scoped identity must remain usable without such a layer.

### Persistence direction (not implementation authorization)

Likely future persistence, **when independently reviewed and authorized**: organization-scoped `skills`; many-to-many `goal_skills` requirements; many-to-many `step_skills` coverage.

This freeze does **not** authorize schema, migration, foreign keys, indexes, uniqueness constraints, or a migration number.

### Alternatives considered

| | Alternative | Disposition |
|---|-------------|-------------|
| A | Organization-governed Skill catalog | **Accepted** |
| B | Platform-global Skill registry | **Rejected now** — I-10 / undefined mutation authority; overlay may be considered later (S-21) without designing it |
| C | Goal-local Skill identities | **Rejected** — contradicts reusable referent; Goal would own Skills |
| D | Hybrid canonical + org overlay | **Deferred** — not designed (S-21) |
| E | One Step = one Skill | **Rejected** — GR label is not cardinality |
| F | Infer Goal Skills only from Path | **Rejected** — violates Goal before Content as the Goal contract |
| G | Goal Skill target proficiency now | **Rejected** for this foundation (S-08) |
| H | Evidence.skillId now | **Rejected** (S-12) |
| I | Persist LearnerSkill / Mastery now | **Rejected** (S-14) |

### Consequences

**Positive:** reusable tenant-safe Skill identity; Goal remains Path/Step/Evidence ownership root; Completion/Progress/Mastery stay distinct; I-04 can later consume identity and bindings; GR risk stays low.

**Trade-offs:** no cross-org Skill Graph yet; AI labels are not identity; multi-Skill Steps will need later assessment attribution before honest Mastery; catalog mutation rules are not frozen.

### Security invariants

- Skill catalog tenancy is Organization-scoped; Path/Step/Evidence remain Goal-rooted
- Same label in two Organizations ≠ same Skill
- Same-user multi-org: distinct catalogs; no implicit Mastery merge
- OrganizationContext remains membership-authoritative for catalog access when HTTP exists
- No Skill HTTP in the first implementation slice
- Client fields never establish Skill or tenant authority

### Explicit OUT

Mastery computation; Mastery persistence; LearnerSkill persistence; SkillGap computation/persistence; Adaptive Path; LearnerState persistence; currentStep persistence; next-action selection; Skill recommendation; Skill prerequisites implementation; Skill Graph; Skill versioning; global canonical Skill registry; cross-org Skill equivalence; cross-org Mastery; requiredLevel / target proficiency; assessment thresholds; per-Skill Evidence attribution; Evidence.skillId; Evidence list/update/delete HTTP; Evidence POST semantic expansion; Skill CRUD HTTP; Goal CRUD expansion; Path CRUD expansion; tenant columns on Path/Step/Evidence; Golden Reference rewrite; Golden Reference dual-write; RBAC; SSO; Program; Cohort.

### Implementation

**NOT STARTED.** This ADR does not start Skill code.

See [`docs/skill-identity-implementation-plan.md`](skill-identity-implementation-plan.md).
