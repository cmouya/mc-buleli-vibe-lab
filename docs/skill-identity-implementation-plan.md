# Skill Identity — Implementation plan (not authorized)

**Provenance:** PLAN PLACEHOLDER ONLY. Written after ADR-020 acceptance so the repository has a freeze record in the same documentation pattern as M6.x. **This file does not authorize implementation.**

**Depends on:** [`docs/skill-identity-decisions.md`](skill-identity-decisions.md), [ADR-020](architecture-baseline.md#adr-020--organization-scoped-skill-identity).

**Architecture-freeze baseline:** published main `27df119588b511d6783b90dec057773369d0fd27` (**M6.4 COMPLETE AND VALIDATED**; 244 executable tests). Migration head remains `0007_m6_1_goal_ownership`. No migration number is allocated by ADR-020.

## Status

**Architecture Freeze:** COMPLETE
**Implementation:** NOT STARTED
**Next checkpoint:** separately authorized Skill Identity implementation planning (domain contracts before database before HTTP). Do not start that checkpoint from this file.

## Sequence (future, not started)

1. ADR-020 **Accepted** (this documentation freeze).
2. Human documentation review of the freeze.
3. Separate human authorization of an implementation plan.
4. Only then: domain semantics/contracts → (if authorized) persistence review → no HTTP in the first slice (S-17).

## In scope for a future implementation plan (not this freeze)

- Organization-scoped Skill identity
- Goal↔Skill many-to-many requirements without target levels
- Step↔Skill many-to-many coverage
- Domain types and invariants proving Skill ≠ Goal ≠ Step ≠ Evidence ≠ Completion ≠ Progress ≠ Mastery ≠ LearnerSkill

## Out of scope

Everything listed as OUT in [`docs/skill-identity-decisions.md`](skill-identity-decisions.md): Mastery; LearnerSkill persistence; SkillGap; Adaptive Path; LearnerState; currentStep; Skill HTTP; schema/migration unless a later plan independently authorizes persistence; Path/Step/Evidence tenant columns; Golden Reference rewrite or dual-write; Evidence POST expansion; prerequisites; versioning; global canonical overlay.

## Stop conditions

Any production code, tests, schema, migration, HTTP, Mastery, SkillGap, Adaptive Path, LearnerState, or Golden Reference change started from this freeze without a new human implementation authorization.
