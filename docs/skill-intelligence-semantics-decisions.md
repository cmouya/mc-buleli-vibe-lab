# Skill Intelligence Semantics — Architecture Freeze

## Status

**Architecture freeze:** COMPLETE
**ADR-021:** Accepted / FROZEN
**Date:** 2026-09-27
**Implementation (this ADR freeze):** NOT STARTED by this ADR
**Later Slice 1 Phase A (separately authorized):** Goal Skill `requiredLevel` **write** persistence — valid new binds `emerging` \| `proficient` \| `expert`; legacy `goal_skills.required_level` **NULL** remains transitional; different-level / legacy-NULL rebind **conflicts**; migration `0009_quick_jazinda` (generator-selected). Phase B NOT NULL **deferred**.
**Later Slice 2 (separately authorized):** Evidence↔Skill **explicit bind-only** M:N (`evidence_skills`; ⊆ persisted Step coverage; no backfill; no HTTP). Attribution ≠ Mastery.
**Migration head:** `0010_elite_valkyrie`

This file is the binding record for **ADR-021**. Human architecture review **approved** decisions D-021-01–D-021-19. This freeze is **documentation / semantics only**. It does **not** authorize production code, tests, schema, SQL, Drizzle, or migration `0009`.

**Baseline:** published main `0d6f1d688bc0ff44ca116e825cd95d292177af3d` (`docs: close C2 skill identity persistence`). C2 Skill Identity persistence remains **CLOSED / FROZEN**.

**ADR-020** remains the historical Skill Identity freeze. Do **not** rewrite ADR-020 Decision rows or S-01–S-21 bodies. Compatibility is recorded in this file.

**Binding ADR table:** [`docs/architecture-baseline.md`](architecture-baseline.md) §20 ([ADR-021](architecture-baseline.md#adr-021--skill-intelligence-semantics)).

**Depends on:** [`docs/skill-identity-decisions.md`](skill-identity-decisions.md) (ADR-020), C2 persistence ledger [`docs/skill-identity-persistence-implementation-plan.md`](skill-identity-persistence-implementation-plan.md).

**Next implementation checkpoint:** this ADR freeze still does **not** authorize further slices. **Slice 1 Phase A** was authorized separately. Next remaining: Phase B NOT NULL, Evidence attribution, Mastery, SkillGap wiring — each needs its own plan.

## Context

C2 made organization-scoped Skill identity durable and bound Goal↔Skill and Step↔Skill without levels, without Evidence→Skill attribution, and without Mastery. The learning spine remains:

User → Session → OrganizationContext → LearnerContext → owned Goal → accepted Path → Steps → Evidence → I-05 → derived Step Completion → derived Path Progress.

SkillGap and I-04 cannot be computed honestly from those facts alone. ADR-021 freezes the missing **semantics** so later slices cannot invent false Mastery or treat Golden Reference labels as identity.

## Problem

Learnova can persist **which Skills a Goal requires** and **which Skills a Step covers**, but cannot truthfully state **required proficiency**, **demonstrated proficiency**, or **which Evidence concerns which Skill**.

## Decision

**Skill Intelligence semantics freeze.** Goal Skill requirements include `requiredLevel`. Demonstrated proficiency is a **recomputable Mastery projection** from **explicit Evidence↔Skill many-to-many attribution** (subset of Step coverage). SkillGap compares required level to **known** demonstrated level, or is **unknown**. LearnerSkill is **not** Mastery authority. AI is **not** Mastery authority (I-08). Adaptive Path and Skill HTTP remain **out**. **No implementation** is started by this ADR.

Numbered decisions D-021-01–D-021-19 below are **accepted**.

## Semantic Definitions

| Term | Meaning |
|---|---|
| **Required Proficiency** | The `MasteryLevel` a **Goal** needs on a bound Skill. Independently asserted on the Goal↔Skill requirement. Not Evidence. |
| **Initial Estimate** | A non-authoritative claim (self-assessment, diagnostic, import) **before** or **without** this system's attributed Evidence. Not Evidence, not Mastery, not Current Proficiency. Persistence **deferred**. |
| **Observed Performance** | Raw attempt facts on Evidence (`score`, `passed`, `answers`). |
| **Evidence** | Durable Step-scoped learning proof (today: `quiz_attempt`). Ownership remains Step → Path → Goal. |
| **Evidence attribution** | Explicit M:N fact: this Evidence **concerns** these Skills. Not Mastery. |
| **Demonstrated Proficiency** | Level supported by attributed Evidence under deterministic rules. |
| **Mastery** | Authoritative demonstrated proficiency: a **recomputable projection**. Evidence history is the source of truth. |
| **Current Proficiency** | What SkillGap uses: demonstrated Mastery, or **UNKNOWN**. |
| **UNKNOWN** | Learnova lacks sufficient attributed Evidence / rules result to determine demonstrated proficiency. **Not** the same as `none`. |
| **`none` (MasteryLevel)** | A determined level on the scale. Valid as a **demonstrated** result. **Invalid** as `requiredLevel`. Absence of Evidence must **not** auto-become `none`. |
| **LearnerSkill** | C1-era in-memory sketch. **Not** production Mastery authority. Future read DTO **deferred**. |
| **SkillGap** | Comparison of Required Proficiency vs **known** Demonstrated Proficiency (`unknown` \| `open` \| `closed`, optional ordinal `gapSize`). |
| **Progress** | Path Completion percentage (M6.4). Not Mastery. |
| **Completion** | I-05 Step complete from passed Evidence for that Step. Not Mastery. |

## Required Proficiency

**D-021-01.** `GoalSkillRequirement` evolves **semantically** from Goal + Skill to **Goal + Skill + `requiredLevel`**. Goal↔Skill remains **many-to-many**. One required level per `(goalId, skillId)` for this freeze.

`requiredLevel` uses existing `MasteryLevel`: `none` \| `emerging` \| `proficient` \| `expert`.

**`none` is not a valid `requiredLevel`.** If a Skill is not required, do not bind it with `requiredLevel = none`.

**Currently implemented (Slice 1 Phase A):** new owned binds persist `requiredLevel`. C2 rows without a level remain `required_level` **NULL** (not `none`). Domain `GoalSkillRequirement` never contains NULL.

## Proficiency Scale

**D-021-14.** Use repository `MasteryLevel` only. Do **not** introduce `developing`, `mastered`, 0–100, or percentage proficiency unless a later ADR changes the scale.

The same ordinal scale is valid for required and demonstrated levels. Ordinal distance is **steps remaining**, not a mastery percentage.

## Unknown vs None

**D-021-02.** UNKNOWN demonstrated proficiency and `none` are distinct. Absence of Evidence **MUST NOT** automatically become `none`.

## Initial Estimate

**D-021-04.** Initial Estimate is a **separate** fact. It may later influence **initial** personalization. It **MUST NOT** automatically become Evidence, Mastery, or Current Demonstrated Proficiency, and **MUST NOT** close SkillGap. Estimate persistence is **DEFERRED**.

## Current Proficiency

**D-021-03.** Current Proficiency used by SkillGap is the demonstrated Mastery projection **or** UNKNOWN. Initial Estimate is **not** Current Proficiency.

## Evidence Attribution

**D-021-05.** Evidence remains Step-scoped. Step → Path → Goal remains the ownership path. Skill-only Evidence is **rejected**.

**D-021-06.** Evidence↔Skill attribution is conceptually **many-to-many**. One Evidence may demonstrate zero, one, or multiple Skills. Attributed Skills **⊆** that Step's `StepSkillCoverage`. Attribution is **explicit**. Do **not** infer that Evidence applies to every covered Skill.

**D-021-07.** Attribution ≠ Mastery. Failed Evidence may still be attributed as observed performance.

**D-021-08.** Do **not** adopt a singleton `Evidence.skillId` as the semantic model. Criterion-level Assessment→Skill mediation may come later; it is **not** required for this MVP semantic foundation.

**Currently implemented:** Evidence has `stepId` only. **Attribution is accepted, not implemented.** Evidence POST (ADR-018) is **unchanged** by this freeze.

## Mastery Model

**D-021-09.** Authoritative Mastery is a **recomputable projection** from attributed Evidence + deterministic domain rules. A future persisted Mastery row may be a **cache**, never the source of truth.

**D-021-11.** Progress ≠ Mastery (I-03). I-05 Completion ≠ I-04 Mastery. Passed quiz may complete a Step without establishing Skill Mastery. Step Skill coverage ≠ Mastery.

**Currently implemented:** I-04 remains **unimplemented**. Domain `Mastery` type exists; production does not project Mastery.

## Mastery Authority

**D-021-10.** AI is **not** Mastery authority. AI may assist, propose, explain, recommend. AI must **not** determine or override Mastery, create authoritative Evidence, or create authoritative Evidence attribution. Deterministic domain rules are authoritative for MVP Mastery. Human/trainer authority may be designed later. **I-08 is preserved.**

## LearnerSkill Role

**D-021-12.** LearnerSkill is **not** an authoritative write entity for demonstrated proficiency. C1 `setLearnerSkillLevel` **MUST NOT** be treated as production Mastery. Do **not** create a `learner_skills` authority table from that model. A future read DTO (estimate / demonstrated / unknown) is **DEFERRED**.

## SkillGap Semantics

**D-021-13.** SkillGap compares Required Proficiency vs **KNOWN** Demonstrated Proficiency.

- If demonstrated proficiency is UNKNOWN → status **unknown** (do **not** convert to `none`).
- If known and current < required → **open**.
- If known and current ≥ required → **closed**.

Optional ordinal `gapSize` = scale steps remaining. **Not** a percentage. Existing `calculateSkillGap` is a **pure-function sketch** and does not encode UNKNOWN; it is **not** production SkillGap.

**Currently implemented:** domain helper only. **SkillGap application wiring is deferred.**

## Tenancy / Security

**D-021-15.** No client-provided `organizationId`, `learnerId`, or `skillId` is tenant authority.

Future requirement persistence must prove: trusted context → owned Goal → Organization Skill.

Future Evidence attribution must prove: trusted context → owned Evidence → Step → Path → Goal; attributed Skill must (1) belong to the same Organization and (2) already belong to the Step's coverage.

## AI Boundary

| Role | Classification |
|---|---|
| Interpret Goal | ALLOWED TO ASSIST |
| Propose required Skills / `requiredLevel` | ALLOWED TO PROPOSE |
| Propose Evidence attribution | ALLOWED TO PROPOSE |
| Assess free-text/project | ALLOWED TO ASSIST; recorded Evidence/Mastery need deterministic or later human authority |
| Recommend Mastery / explain SkillGap / recommend path adaptation | ALLOWED TO PROPOSE / ASSIST |
| Determine or override Mastery; create authoritative Evidence or attribution | **NOT ALLOWED AS AUTHORITY** |
| Mutate accepted Path as Adaptive Path authority | **NOT ALLOWED** (D-021-17) |

## Compatibility with ADR-020

Do **not** edit historical ADR-020 Decision rows or S-bodies.

| Item | Result |
|---|---|
| C2 Skill Identity; Goal↔Skill M:N; Step↔Skill M:N | **PRESERVED** |
| I-03, I-05, I-08 | **PRESERVED** |
| S-06, S-07, S-09, S-10, S-11 | **PRESERVED** |
| **S-08** | **SUPERSEDED** — Goal Skill requirements now include `requiredLevel` (not implemented) |
| **S-12** | **REFINED / PARTIALLY SUPERSEDED** — Evidence remains Step-scoped; coverage ≠ Mastery; Evidence POST does not mutate Mastery; passed Evidence does not master all Step Skills. **Superseded:** total exclusion of Skill attribution. ADR-021 allows a **separate** Evidence↔Skill M:N relation (not a singleton `Evidence.skillId`) |
| S-13 | **REFINED** — I-04 still unimplemented; prerequisites now include requiredLevel + attribution semantics |
| **S-14** | **REFINED** — LearnerSkill is still not persistence/Mastery authority. Demonstrated proficiency is the Mastery **projection** |
| **S-17** | **UNCHANGED** — no Skill HTTP |
| **S-18** | **PRESERVED** — GR labels are not canonical Skill identity |
| S-20 | **UNCHANGED for this ADR** — ADR-021 also allocates **no** migration |

## Consequences

Positive: honest SkillGap and I-04 become **designable**; C2 identity remains; false Mastery from coverage/completion/self-report is forbidden.

Trade-offs: C2 `goal_skills` rows have no level until a later authorized slice; in-memory SkillGap/LearnerSkill helpers are **not** the production model.

## Rejected Alternatives

| | Alternative | Disposition |
|---|---|---|
| R3 | Program-level required proficiency | **Rejected now** — Program does not exist |
| R4 | Goal Skill remains binary | **Rejected** — SkillGap cannot be honest |
| R5 | Infer Goal requirements only from Path/coverage | **Rejected** — I-01 / S-06 |
| R2 | Separate GoalSkillTarget aggregate | **Rejected for MVP** — premature vs extending the existing pair |
| B | Singleton `Evidence.skillId` | **Rejected** — fights Step↔Skill M:N |
| A as Mastery path | Coverage implies attribution/Mastery | **Rejected** — S-11 / S-12 preserved parts |
| D now | Full Assessment/criterion persistence | **Deferred** — Assessment not persisted |
| P3 | Authoritative `learner_skills` updated in place | **Rejected** |
| P5 | Progress % as current proficiency | **Rejected** — I-03 |
| M2 as source of truth | Persisted Mastery as authority | **Rejected** |
| M5 | AI determines Mastery | **Rejected** — I-08 |

## Deferred Decisions

Initial Estimate persistence; Skill HTTP/API; Skill list/search; Goal Skill read API; Step Skill coverage read API; unbind/update/delete; `learner_skills` authority table; criterion-level Assessment persistence; Mastery cache/event store; `ruleVersion`; trainer override; imported credential authority; SkillGap application wiring; Adaptive Path; Program/Cohort; Golden Reference rewrite; **any** schema/migration including `0009`.

**D-021-16.** Golden Reference `step.skill`, `skills[]`, localStorage learnerState, quiz completion, and progress percentage **must not** become production Skill/Mastery authority. **S-18 preserved.**

**D-021-17.** This ADR does **not** authorize Adaptive Path. Runtime adaptation still needs honest SkillGap **and** a future policy ADR.

**D-021-18.** This ADR does **not** authorize Skill HTTP. **S-17 unchanged.**

## Future schema (NON-AUTHORIZED)

If a **later** implementation plan is approved, likely implications include: additive `requiredLevel` on Goal Skill persistence (**Slice 1 Phase A now shipped:** nullable `goal_skills.required_level`, CHECK, no default); an Evidence↔Skill attribution table (**Slice 2 now shipped:** bind-only `evidence_skills`, ⊆ Step coverage, no backfill); **no** authoritative `learner_skills` table; Mastery derived in-process first. **Do not** treat Mastery tables as existing.

## Implementation Authorization

**D-021-19.** ADR-021 is a **documentation / semantic freeze**. It authorizes **no** production implementation, **no** migration, **no** `0009`.

Smallest later slice (only after a separate plan): persist Goal Skill `requiredLevel` (still tenant-safe, still no HTTP). Then Evidence↔Skill attribution. Then in-process Mastery projection. Then SkillGap application. **None of these are started by this freeze.**

## Exit / Freeze State

**ACCEPTED / FROZEN.** This ADR did **not** start implementation. **Slice 1 Phase A** (later authorized) persists Goal Skill `requiredLevel` for **new** writes. **Slice 2** (later authorized) persists explicit Evidence↔Skill attribution bind-only. Phase B, Mastery, SkillGap wiring, Adaptive Path, and Skill HTTP remain **out**. Head `0010_elite_valkyrie`.
