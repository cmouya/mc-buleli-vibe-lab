# Mastery Projection Semantic Constraints — Architecture Freeze

## 1. Status

**Architecture freeze:** COMPLETE
**ADR-022:** Accepted / FROZEN
**Date:** 2026-09-28
**Kind:** semantic **constraints** freeze (not an algorithm specification)

**C1 — CONSTRAINTS FREEZE / IMPLEMENTATION GATE.** This ADR freezes semantic boundaries, prohibitions, the conceptual pipeline, compatibility notes, and the implementation gate. It **does not authorize** Mastery projection code, tests, schema, SQL, Drizzle, HTTP, SkillGap application, Learner State production, Adaptive Path, Phase B required proficiency, trusted scoring, or numeric formulas.

**C4 (status).** Current HTTP-created quiz Evidence is **Mastery-untrusted** until trusted scoring exists. Persistence and Progress behavior are unchanged.

**Implementation (this ADR freeze):** NOT STARTED / NOT AUTHORIZED
**Migration allocated by this ADR:** none. Head remains `0010_elite_valkyrie`.

**Baseline:** published main `f4159e6a4ebf3b9d34cdd439ea91e047a7fab84a` (`feat: persist evidence skill attribution`). Slice 2 Evidence↔Skill attribution remains **CLOSED / FROZEN**.

**ADR-021** remains the historical Skill Intelligence freeze. Do **not** rewrite ADR-021 Decision rows D-021-01–D-021-19. This file is a **post-ADR-021 refinement**.

**Binding ADR table:** [`docs/architecture-baseline.md`](architecture-baseline.md) §20 ([ADR-022](architecture-baseline.md#adr-022--mastery-projection-semantic-constraints)).

**Depends on:** [`docs/skill-intelligence-semantics-decisions.md`](skill-intelligence-semantics-decisions.md) (ADR-021), Slice 1 required proficiency persistence, Slice 2 `evidence_skills`.

**Human D1–D12 alias:** D-022-01 … D-022-12 are 1:1 with the human-approved D1–D12 register. No semantic change.

## 2. Context

Slice 2 made explicit Evidence↔Skill attribution durable (`evidence_skills`; ⊆ Step coverage; bind-only; no HTTP). ADR-021 already froze that Mastery is a **recomputable projection** from attributed Evidence + deterministic rules, that UNKNOWN ≠ `none`, and that LearnerSkill is not authority.

A formal D1–D12 review concluded **PASS WITH REQUIRED CLARIFICATIONS**. Without an explicit constraints ADR, a later implementer could treat attribution as proof, map `score/maxScore` in isolation to `MasteryLevel`, copy one quiz score onto every attributed Skill, collapse UNKNOWN into `none`, treat client-declared POST scores as Mastery authority, or ship quiz-only `expert`.

## 3. Problem Statement

Learnova can persist Evidence and bind Skills, but lacks frozen **eligibility, interpretation limits, trust, result shape, and gates**. Coding a projection now would invent fake Mastery.

## 4. Scope

This ADR freezes:

- conceptual pipeline stages
- D-022-01–D-022-12 (D1–D12)
- required clarifications **C1–C4**
- compatibility with ADR-021 and named invariants
- domain-model warnings
- deferred implementation-blocking decisions
- the implementation gate
- persistence/migration boundary (none)

## 5. Non-Goals

**C1 (repeat).** This ADR is **not**: a projection algorithm; implementation authorization; schema/API design; score-threshold decision; aggregation formula; trusted-scoring implementation; SkillGap, Learner State, or Adaptive Path implementation; Phase B; Skill HTTP.

## 6. Terminology

| Term | Meaning |
|---|---|
| **Evidence** | Durable Step-scoped learning proof (persisted today: `quiz_attempt`). |
| **Evidence↔Skill attribution** | Explicit M:N fact: this Evidence **concerns** this Skill. Not proof. Not Mastery. |
| **Eligibility** | Whether an attributed Evidence item may enter Mastery Projection V1 (type, trust, quantitative single-Skill rule). |
| **Interpretation** | How eligible Evidence contributes a signal under versioned rules (not isolated `score` → level). |
| **Mastery Projection** | Recomputable **current** demonstrated proficiency: UNKNOWN or a known `MasteryLevel`. |
| **UNKNOWN** | No demonstrated level can currently be determined from eligible, interpretable Evidence. **Not** a `MasteryLevel`. |
| **`none`** | Known scale value: Evidence suffice to interpret, but `emerging` is not demonstrated. |
| **Current demonstrated proficiency** | V1 projection output. |
| **Historical / peak demonstrated proficiency** | Distinct concept. **Not** a durable fact today. Out of V1. |

## 7. Conceptual Projection Pipeline

Stages remain distinct:

Evidence → Evidence↔Skill Attribution → Evidence Eligibility → Evidence Interpretation → Mastery Projection

Attribution does not skip eligibility or interpretation. Coverage (`step_skills`) is not attribution and not Mastery.

## 8. Decision Register (D1–D12 ≡ D-022-01–D-022-12)

### D-022-01 (D1) — Evidence↔Skill attribution

Attribution means: **this Evidence concerns this Skill.** It does **not** by itself mean: this Evidence **proves** this Skill. Pipeline stages in §7 remain distinct.

### D-022-02 (D2) — Quiz contribution

An eligible `quiz_attempt` is a quantitative signal that **may** contribute to demonstrated proficiency. `score/maxScore` must **not** be converted **directly and in isolation** into a `MasteryLevel`. Projection must use deterministic, versioned rules that account for eligibility and aggregation. **V1:** quiz Evidence may contribute **at most** to `proficient`; quiz Evidence **alone** must **never** establish `expert`. Stronger Evidence for expert is future work. Numeric thresholds are **not** frozen here.

### D-022-03 (D3) — Multiple Evidence and attempts

All eligible Evidence attributed to a Skill remain history and **may** contribute. Projection must **not** be defined solely as simple average, best score only, or latest attempt only. It should reflect consistency. More recent Evidence **may** challenge earlier Evidence; recency must **not** be the sole rule. One isolated Evidence item must **not** automatically establish or erase Mastery. Exact aggregation mathematics are **deferred**.

### D-022-04 (D4) — Multi-Skill Evidence

An Evidence item attributed to multiple Skills remains **relevant** to each. Its **global** score must **not** be copied or interpreted as an individual score for every Skill. **V1 quantitative interpretation:** a quiz signal is directly interpretable only when the Evidence is attributed to **exactly one** Skill. Multi-Skill quiz Evidence remains persisted and attributed; it is **quantitatively ineligible** until reliable per-Skill decomposition exists (e.g. Question→Skill or per-Skill scoring). The M:N attribution model is **unchanged**.

### D-022-05 (D5) — UNKNOWN vs `none`

UNKNOWN and `none` are distinct. UNKNOWN: no demonstrated level can currently be determined from available eligible, interpretable Evidence. `none`: Evidence are sufficient to interpret but do not demonstrate minimum `emerging`. UNKNOWN must **not** be added to `MasteryLevel`, silently converted to `none`, or represented by authoritative `LearnerSkill` defaulting to `none`. Canonical `MasteryLevel` remains `none | emerging | proficient | expert`.

### D-022-06 (D6) — Regression / non-monotonicity

Current demonstrated Mastery is **not** strictly monotonic. A previous projection may be revised downward when new eligible, interpretable, sufficiently coherent Evidence no longer support the earlier level. One isolated negative item must **not** automatically cause regression. Regression uses the same deterministic, versioned, explainable rules. Historical achievement and current demonstrated proficiency are **distinct concepts**. Exact regression mathematics are **deferred**.

### D-022-07 (D7) — Eligible Evidence types (V1)

Only `quiz_attempt` may be eligible. `submission` and `observation` remain recognized domain types but are **ineligible** until persistence, eligibility, interpretation, and trust semantics are explicitly defined. No type becomes Mastery-authoritative merely by existing in the domain union.

### D-022-08 (D8) — Rule versioning

Every projection is produced by deterministic rules identified by an explicit **immutable** rule version. Identical durable Evidence, attribution, trusted relevant inputs, and rule version ⇒ **reproducible** result. A semantically meaningful rule change requires a **new** version. Explainability must identify **rule version** and **contributing Evidence**. Versioning must **not** make a persisted Mastery row the source of truth. Evidence and attribution remain durable authoritative **inputs**. Mastery remains recomputable.

### D-022-09 (D9) — Failed Evidence

An otherwise eligible `quiz_attempt` does **not** become ineligible solely because `passed = false`. Failed Evidence may remain an interpretable negative or insufficient signal. `passed = false` must **not** automatically produce `none`. One failed item must **not** automatically erase Mastery. Effects follow D-022-03 and D-022-06. Insufficient Evidence ⇒ UNKNOWN. `none` requires sufficient interpretable Evidence that `emerging` is not demonstrated.

### D-022-10 (D10) — `passed` vs `score/maxScore`

`passed` is activity success/completion under activity rules. It may continue to support **Progress** (I-05). It must **not** directly determine `MasteryLevel`. For eligible quiz Evidence, `score/maxScore` is the quantitative signal for interpretation and still must **not** map directly and in isolation to `MasteryLevel`. If `passed` conflicts with **declared** quantitative evaluation rules, the system must not silently repair or pick the more favorable value; inconsistency is explicit or the Evidence is **non-interpretable**. **Those quantitative rules do not exist in the repository today.** Conflict-handling is a **semantic constraint / future interpretation requirement**, not an executable invariant already present.

### D-022-11 (D11) — Trust / authoritative scoring

Evidence persistence and Mastery authority are distinct. Evidence whose `score`, `maxScore`, or `passed` are merely declared by an untrusted client may remain persisted and may serve existing non-Mastery mechanisms. Such client-declared results must **not** automatically become authoritative Mastery inputs. Authoritative Mastery requires quiz results calculated or verified by a trusted authority using deterministic rules. When submitted answers and a trusted answer key exist, **server-side recalculation is preferred**. Trust provenance must eventually be representable and auditable.

### D-022-12 (D12) — Legacy NULL required proficiency

`requiredLevel = NULL` means the required **target** is **unresolved**. It is **not** a default. No Mastery, SkillGap, Learner State, or Adaptive component may silently invent that target. **Mastery Projection is independent of `requiredLevel`** and may still be computed. For SkillGap: NULL-target Skills are **excluded** from quantitative gap computation and remain conceptually unresolved targets. Future Phase B resolves NULL only from legitimate auditable provenance; only then may a later NOT NULL constraint be considered. Phase B is **not** authorized by this ADR.

## 9. Projection Result Semantics

**C2 — CONCEPTUAL PROJECTION RESULT.** The conceptual result is:

- **UNKNOWN**, or
- a **known** `MasteryLevel` (`none | emerging | proficient | expert`)

UNKNOWN is **not** added to `MasteryLevel`. This freeze does **not** add a TypeScript type.

## 10. Evidence Eligibility Constraints

V1 eligibility requires all of:

- type `quiz_attempt` (D-022-07)
- trusted / Mastery-authoritative scoring (D-022-11, **C4**) — current HTTP POST Evidence **fails this** until trusted scoring exists
- for **quantitative** interpretation: exactly one attributed Skill (D-022-04)

Attribution may exist without eligibility. Failed `passed = false` does not by itself make an item ineligible (D-022-09).

## 11. Evidence Interpretation Constraints

- No isolated `score/maxScore` → `MasteryLevel` (D-022-02, D-022-10).
- `passed` does not determine `MasteryLevel` (D-022-10).
- Quiz-alone V1 cannot establish `expert` (D-022-02).
- Score/passed conflict handling is **latent** until interpretation rules exist (D-022-10). Do not treat today’s persisted rows as already conflict-checked.

## 12. Multi-Evidence / Regression Constraints

D-022-03, D-022-06, D-022-09. One isolated item neither establishes nor erases nor automatically regresses Mastery. Formulas deferred.

## 13. Trust & Authoritative Scoring

**C4 — CURRENT HTTP EVIDENCE IS MASTERY-UNTRUSTED.** Production Evidence POST accepts client-declared `score`, `maxScore`, `passed`, and `answers[]` including `correct`. The server does **not** recompute against a Step/Path answer key. **All current HTTP-created quiz Evidence is not authoritative Mastery input until trusted scoring exists.** Storage and Progress (I-05) remain valid under existing contracts. Do **not** change Evidence POST in this freeze. Do **not** implement trusted scoring here.

## 14. Current vs Historical Demonstrated Proficiency

**C3.** Current demonstrated proficiency and historical/peak demonstrated proficiency are **distinct**. **V1 scope is current only.** Peak/history is **not** a durable fact today and must not be invented or persisted by this freeze. A later decision may derive or persist peak.

## 15. Rule Versioning & Recomputability

See D-022-08. Optional future Mastery row = **cache only**, never source of truth (ADR-021 D-021-09 preserved).

## 16. Progress vs Mastery Boundary

**I-03:** Progress ≠ Mastery. Path % and Step completion must not become demonstrated proficiency. **I-05:** `passed` may remain Step-completion authority. D-022-09 and D-022-10 do **not** rewrite Progress.

## 17. Required Proficiency / SkillGap Boundary

Mastery Projection does not read `goal_skills.required_level`. SkillGap (when later authorized) compares required vs **known** demonstrated, or is unknown; NULL requiredLevel ⇒ exclude from quantitative gap (D-022-12). Existing `calculateSkillGap` does not encode UNKNOWN and is **not** production.

## 18. Tenant Isolation & Non-Leakage

No new tenant authority. Future projection **must** reuse:

trusted `LearnerContext` → owned Evidence (Evidence → Step → Path → Goal) → persisted `evidence_skills` → Skill in the same organization.

Do **not** fetch attributions by `skill_id` alone in a way that bypasses Goal/learner/organization ownership. Fail-closed non-leakage (`RESOURCE_NOT_FOUND` / equivalent) remains required. This ADR introduces **no HTTP**.

## 19. Compatibility with ADR-021 / Existing Invariants

Do **not** edit historical ADR-020 S-bodies or ADR-021 D-021-* Decision paragraphs.

| Item | ADR-022 effect |
|---|---|
| **S-08** | Remains **SUPERSEDED** by ADR-021 `requiredLevel`. D-022-12 does **not** restore S-08. |
| **S-12** | **PRESERVED** (as refined by ADR-021): Step-scoped Evidence; no `Evidence.skillId`; separate M:N attribution allowed; **attribution ≠ proof**; Evidence POST ≠ Mastery. |
| **S-14** | **PRESERVED:** LearnerSkill is not Mastery source of truth; default `none` must not encode UNKNOWN. |
| **S-17** | **UNCHANGED:** no Skill HTTP. |
| **S-18** | **PRESERVED:** Golden Reference / `DEFAULT_PASS_SCORE` is not Mastery authority. |
| **I-03** | **PRESERVED.** |
| **I-05** | **PRESERVED.** |
| **I-08** | **PRESERVED:** AI is not Mastery authority. |
| **ADR-021** | Post-021 **constraints refinement**. Decision rows **unrewritten**. |
| **Slice 1** | `requiredLevel` persistence unchanged; legacy NULL unresolved; **no Phase B**. |
| **Slice 2** | M:N, coverage subset, tenant chain, bind-only, no automatic attribution, no HTTP — **unchanged**. |

## 20. Domain Model Warnings

Do **not** change these types in this freeze.

1. **`MasteryLevel`** — remains the **known** proficiency scale. Do not add UNKNOWN.
2. **Existing `Mastery` DTO** — must **not** be assumed to be the frozen projection result. It lacks `ruleVersion`. `confidence` is **not** frozen.
3. **`LearnerSkill`** — must **not** become authoritative Mastery state. Default `none` would collapse UNKNOWN.
4. **`calculateSkillGap` / SkillGap sketch** — cannot safely consume UNKNOWN; must not be wired to production Mastery before a later specification.
5. **`Evidence`** — durable event/history. Current `score` / `passed` / `answers.correct` are **not** automatically Mastery-authoritative (**C4**).

## 21. Deferred Implementation Decisions

**Implementation-blocking; not ADR-022-freeze-blocking.** Do **not** invent values in this freeze:

- numeric score→interpretation thresholds
- exact aggregation mathematics
- exact recency weighting
- exact evidence-count / sufficiency thresholds
- exact rules for projecting `none`
- exact regression algorithm
- rule-version identifier/constant
- trusted scoring implementation
- server-held answer key or equivalent scoring authority
- trust provenance representation
- future `submission` / `observation` interpretation
- future expert-level Evidence semantics (non-quiz)
- future per-Skill decomposition for multi-Skill Evidence
- optional historical/peak projection persistence
- optional non-authoritative Mastery cache

## 22. Implementation Gate

**C1.** Mastery **code** remains unauthorized until a **separate human-authorized implementation specification** (then a later Agent slice) defines **all** of:

- score interpretation / mapping (still not isolated direct map to `MasteryLevel`)
- aggregation mathematics (not average/best/latest-only)
- sufficiency rules (`none` vs UNKNOWN)
- regression mathematics as needed
- **trusted scoring** (current HTTP Evidence remains ineligible — **C4**)

Also required before code: an explicit rule-version identifier; projection result UNKNOWN | known `MasteryLevel`; reuse of the tenant-safe ownership chain; LearnerSkill not used as source of truth.

## 23. Persistence / Migration Consequences

This documentation freeze requires: **no** schema change, **no** migration, **no** Mastery table, **no** LearnerSkill table, **no** rule-version table, **no** trust-provenance table, **no** Assessment answer-key schema, **no** Evidence schema modification. Later implementation needs are §21 dependencies only.

## 24. Consequences

Positive: later Mastery work cannot honestly treat attribution as proof, quiz POST as trusted Mastery, or UNKNOWN as `none`.

Trade-off: **no** production demonstrated proficiency until a later spec **and** trusted scoring exist.

## 25. Acceptance Criteria

Documentation of this ADR makes all of the following unmistakable:

- attribution ≠ proof
- quiz score ≠ direct `MasteryLevel`
- quiz-only V1 cannot establish `expert`
- multi-Skill global score is not copied per Skill
- UNKNOWN ≠ `none`
- current demonstrated Mastery may regress under later deterministic rules
- only `quiz_attempt` may be eligible in V1
- projection rules are versioned and recomputable
- failed Evidence may remain interpretable
- `passed` ≠ Mastery
- current HTTP Evidence is Mastery-untrusted
- `requiredLevel` NULL is unresolved, not default
- Progress ≠ Mastery
- LearnerSkill is not Mastery authority
- no implementation is authorized
- numeric thresholds/formulas remain deferred
- no schema/migration is required
- Slice 1 and Slice 2 remain unchanged
- ADR-021 historical decisions are not rewritten

## 26. Out of Scope / Future Work

Expert-from-complementary Evidence; Question→Skill scoring; peak persist; Mastery cache; SkillGap application; Adaptive Path; Phase B; Skill HTTP; AI as Mastery authority.

## Exit / Freeze State

**ACCEPTED / FROZEN.** This ADR did **not** start implementation. Head `0010_elite_valkyrie`. Next Mastery **code** requires a separate implementation specification satisfying §22.
