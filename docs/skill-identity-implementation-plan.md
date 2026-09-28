# Skill Identity — Implementation plan

**Provenance:** PLAN PLACEHOLDER written after ADR-020 acceptance. Later C1 domain contracts and C2 persistence were **separately human-authorized**. This freeze file **does not** authorize Skill Intelligence **implementation** (see **ADR-021** for semantics).

**Depends on:** [`docs/skill-identity-decisions.md`](skill-identity-decisions.md), [ADR-020](architecture-baseline.md#adr-020--organization-scoped-skill-identity).

**Architecture-freeze baseline (historical):** published main `27df119588b511d6783b90dec057773369d0fd27` (**M6.4 COMPLETE AND VALIDATED**; 244 executable tests). At ADR-020 freeze time, migration head remained `0007_m6_1_goal_ownership`. No migration number was allocated **by ADR-020**.

## Status

**Architecture Freeze:** COMPLETE
**C1 domain contracts:** published
**C2 persistence:** C2.1–C2.4 **COMPLETE AND VALIDATED** (pre-C2.5 baseline `545a3c7187467f73f785581fc545a8a1b6f79916`; head `0008_powerful_retro_girl`)
**C2.5:** documentation/regression closure
**ADR-021:** Skill Intelligence **semantics ACCEPTED / FROZEN** — [`skill-intelligence-semantics-decisions.md`](skill-intelligence-semantics-decisions.md)
**Slice 1 Phase A:** Goal Skill `requiredLevel` **write** persistence (`0009_quick_jazinda`; legacy NULL; Phase B deferred)
**Slice 2:** Evidence↔Skill bind-only attribution (`0010_elite_valkyrie`; ⊆ Step coverage; no HTTP)
**ADR-022:** Mastery Projection **semantic constraints ACCEPTED / FROZEN** — [`mastery-projection-constraints-decisions.md`](mastery-projection-constraints-decisions.md). **No** Mastery code.
**ADR-023:** Trusted Quiz Scoring **authority ACCEPTED / FROZEN** — [`trusted-quiz-scoring-decisions.md`](trusted-quiz-scoring-decisions.md). **No** trusted-scoring code, **no** migration.
**Next checkpoint:** **separate implementation plan** for trusted scoring only (D-023-10). This freeze file does **not** authorize that code, score→`MasteryLevel` mapping, aggregation, Mastery code, Skill HTTP, LearnerSkill tables, Phase B, or Adaptive Path.

## Sequence (historical freeze plan — later executed under C2)

1. ADR-020 **Accepted** (this documentation freeze).
2. Human documentation review of the freeze.
3. Separate human authorization of an implementation plan (**done**).
4. Domain semantics/contracts (**C1 done**) → persistence (**C2.1–C2.4 done**) → no HTTP in the first slice (S-17 **still in force**).

## In scope for C1/C2 (later executed; not this freeze file)

- Organization-scoped Skill identity
- Goal↔Skill many-to-many requirements without target levels
- Step↔Skill many-to-many coverage
- Domain types and invariants proving Skill ≠ Goal ≠ Step ≠ Evidence ≠ Completion ≠ Progress ≠ Mastery ≠ LearnerSkill

## Out of scope

Everything listed as OUT in [`docs/skill-identity-decisions.md`](skill-identity-decisions.md): Mastery; LearnerSkill persistence; SkillGap; Adaptive Path; LearnerState; currentStep; Skill HTTP; schema/migration unless a later plan independently authorizes persistence; Path/Step/Evidence tenant columns; Golden Reference rewrite or dual-write; Evidence POST expansion; prerequisites; versioning; global canonical overlay.

## Stop conditions

Any **post-C2** production code, tests, schema, HTTP, Mastery engine, SkillGap wiring, Adaptive Path, LearnerState, or Golden Reference change started from this freeze without a **new** human **implementation** authorization. **ADR-021 is semantics only.**
