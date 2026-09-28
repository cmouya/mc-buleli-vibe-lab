# Trusted Quiz Scoring Authority & Evidence Provenance — Architecture Freeze

## 1. Status

**Architecture freeze:** COMPLETE
**ADR-023:** Accepted / FROZEN
**Date:** 2026-09-28
**Kind:** scoring-authority and provenance freeze (not an implementation)

This ADR freezes who may compute quiz `score`, `maxScore`, `passed`, and `answers.correct`; where the answer key lives; how trust provenance is classified; and how the current Evidence POST transitions when a key exists. It **does not authorize** trusted-scoring code, tests, schema, SQL, Drizzle, a migration, HTTP changes, Mastery projection, score→`MasteryLevel` mapping, aggregation, sufficiency, regression, a rule version, Question→Skill, SkillGap, Adaptive Path, Phase B, or Skill HTTP.

**Implementation (this ADR freeze):** NOT STARTED / NOT AUTHORIZED
**Migration allocated by this ADR:** none. Head remains `0010_elite_valkyrie`.

**Baseline:** published main `fd558b8e681d80b47a72a4666e23c74f5c279c01` (`docs: freeze ADR-022 mastery projection constraints`). ADR-022 remains **ACCEPTED / FROZEN**.

**ADR-021** and **ADR-022** decision bodies stay historical. Do **not** rewrite D-021-01–D-021-19 or D-022-01–D-022-12. This file is a **post-ADR-022 refinement**.

**Binding ADR table:** [`docs/architecture-baseline.md`](architecture-baseline.md) §20 ([ADR-023](architecture-baseline.md#adr-023--trusted-quiz-scoring-authority-and-evidence-provenance)).

**Depends on:** [`docs/skill-intelligence-semantics-decisions.md`](skill-intelligence-semantics-decisions.md) (ADR-021), [`docs/mastery-projection-constraints-decisions.md`](mastery-projection-constraints-decisions.md) (ADR-022).

**Human acceptance:** the ADR-023 design is accepted. **D-023-04** keyed-step transition is accepted. Permanent dual authority on keyed Steps is **rejected**.

## 2. Context

Production Evidence POST persists client-declared `score`, `maxScore`, `passed`, and `answers[].correct`. The server does not recompute them. Persisted Steps have no quiz answer key. Golden Reference `evaluateQuizSubmission` runs in the browser, and `DEFAULT_PASS_SCORE` is not production scoring authority.

ADR-022 C4 already freezes that this HTTP Evidence is Mastery-untrusted, and D-022-11 prefers server-side recalculation once a trusted key and submitted answers exist. ADR-022 does not itself define the key, the provenance classes, or the POST transition. Without this ADR, an implementer could treat client score fields as trusted, copy Golden Reference keys into production, backfill history as trusted, or keep a client-declared `passed` alive on a Step that already has a server key.

## 3. Problem Statement

Learnova can persist quiz Evidence and derive Progress from `passed`, but it has no frozen scoring authority or trust provenance. Coding trusted scoring now would invent the key, the provenance rule, and the Evidence POST contract.

## 4. Scope

This ADR freezes:

- D-023-01–D-023-10
- trusted-path input and server recomputation
- server-owned answer-key authority and non-disclosure
- `client_declared` vs `server_recalculated`
- no historical trust backfill
- the keyed-step Evidence POST transition
- Progress vs Mastery for `passed`
- the ownership chain for key load and trusted submit
- persistence concepts, with no migration allocated
- the implementation gate

## 5. Non-Goals

This ADR is **not** trusted-scoring implementation, schema, or a migration. It is **not** Mastery projection, score→`MasteryLevel` mapping, aggregation, sufficiency, regression, a rule version, Question→Skill, SkillGap, Adaptive Path, Phase B, Skill HTTP, or adding UNKNOWN to `MasteryLevel`.

## 6. Decision Register (D-023-01–D-023-10)

### D-023-01 — Scoring authority

On the trusted path the client may submit selection indexes only: `questionIndex` and `selectedIndex`. The server must recompute `score`, `maxScore`, `passed`, and each answer’s `correct` from the server key and those selections. The server must **never** treat client `score`, `maxScore`, `passed`, or `answers.correct` as scoring authority. Client values are not merged with the server result. The more favorable value is not chosen.

### D-023-02 — Answer-key authority

The authoritative key is a **server-persisted quiz definition** owned by the Step through the Goal. It is not Evidence, not Golden Reference `lessons.js`, and not `DEFAULT_PASS_SCORE`. Golden Reference quizzes remain demo/UI proxies. Learner-facing Step, Evidence, and submission responses must **not** include the correct index, which option is correct, or any explanation that reveals the key.

The activity pass rule that yields `passed` lives on that server quiz definition. It is an I-05 activity rule only. It is not a Mastery threshold and it is not `DEFAULT_PASS_SCORE`. The concrete shape (minimum correct count versus ratio) is **not** frozen here; it belongs to a later implementation plan and must not copy `DEFAULT_PASS_SCORE` by default.

### D-023-03 — Evidence trust provenance

Two semantic classes, fail closed:

- **`client_declared`** — `score`, `passed`, or `correct` was accepted from the client.
- **`server_recalculated`** — the server computed those fields from the server key and the submitted selections.

Missing or unknown provenance means **`client_declared`**, never trusted. Only `server_recalculated` can later satisfy ADR-022 C4. Provenance is not a `MasteryLevel` and is not Mastery.

Historical rows and today’s HTTP-created rows stay **`client_declared`**. Retroactive trust, re-scoring, or backfill is **forbidden** unless a later ADR authorizes it.

### D-023-04 — Evidence POST transition

Keyed-step switch. Permanent dual authority on keyed Steps is **rejected**.

- A Step with **no** server key keeps the current declared-score POST. Those writes are always `client_declared`. They may still drive I-05. They are never Mastery-trusted.
- Trusted submission is a **distinct** contract: selections only, and only when that owned Step has a server key. Provenance is `server_recalculated`.
- When a Step **has** a server key, the declared-score POST for that Step is **rejected**. A client-declared `passed` must not complete that Step beside the key.
- Rows already stored are not rewritten.
- Golden Reference localStorage is unchanged by this ADR.

A global replacement of today’s POST is not this freeze: Steps that have no key cannot yet be server-scored. A permanent legacy declared-score path on keyed Steps is rejected.

### D-023-05 — Progress

Server-calculated `passed` drives I-05 for `server_recalculated` Evidence. Client-declared `passed` may continue to drive I-05 only for `client_declared` Evidence on Steps with no server key. Neither value determines `MasteryLevel`.

### D-023-06 — Tenancy and non-disclosure

Key load and trusted submit use only:

session → OrganizationContext → LearnerContext → owned Goal → Path → Step → that Step’s quiz definition.

Fail closed with `RESOURCE_NOT_FOUND` (or equivalent). Do **not** fetch the key by `stepId` alone. Client `organizationId`, `learnerId`, and `skillId` are not authority. The answer key must not appear in learner-facing HTTP or in persisted Evidence `answers`.

### D-023-07 — Persistence concepts

This ADR names two future concepts and allocates **no** migration, **no** table, and **no** column:

- a Step-owned server quiz definition (items, correct index, and the activity pass rule that yields `passed`)
- an Evidence provenance class as in D-023-03

No Mastery table, no rule-version table, no LearnerSkill table, and no Evidence↔Skill change. Head remains `0010_elite_valkyrie` until a later implementation plan is separately authorized. SQL shape and names are not frozen here.

### D-023-08 — Exclusions

This ADR does **not** authorize:

- trusted-scoring implementation
- schema or migration implementation
- Mastery projection
- score→`MasteryLevel` mapping
- aggregation, sufficiency, regression, or a rule version
- Question→Skill mapping, or copying one quiz score onto every covered Skill
- SkillGap, Adaptive Path, Phase B, Skill HTTP
- UNKNOWN as a `MasteryLevel`
- historical re-score or trust backfill
- Golden Reference rewrite

### D-023-09 — Compatibility

Post-ADR-022 refinement only. Do **not** edit historical ADR-021 or ADR-022 decision paragraphs.

| Item | ADR-023 effect |
|---|---|
| **D-021-05 / D-021-06 / D-021-08 / S-12** | **PRESERVED.** Evidence stays Step-scoped. Attribution stays explicit M:N. No `Evidence.skillId`. Trusted scoring does not add attribution and does not make Evidence a Mastery write. |
| **D-021-07 / D-022-09** | **PRESERVED.** A failed trusted attempt may still be stored. This ADR does not project Mastery. |
| **D-021-09 / D-021-11 / D-021-12 / I-03** | **PRESERVED.** No Mastery cache. Progress ≠ Mastery. LearnerSkill is not authority. |
| **D-021-10 / I-08 / S-17** | **PRESERVED.** AI is not scoring or Mastery authority. No Skill HTTP. |
| **D-021-15** | **EXTENDED** by D-023-06 for answer-key lookup. Client ids stay non-authoritative. |
| **D-021-16 / S-18** | **PRESERVED.** Golden Reference keys and `DEFAULT_PASS_SCORE` are not the production key. |
| **S-08** | Stays **SUPERSEDED** by ADR-021. ADR-023 does not restore it and does not touch `requiredLevel`. |
| **D-022-01–D-022-05** | **PRESERVED.** Attribution ≠ proof. A trusted score is still not an isolated map to `MasteryLevel`. Quiz-alone V1 still cannot establish `expert`. A global score is still not copied per Skill. UNKNOWN is not added to `MasteryLevel`. |
| **D-022-10** | **EXTENDED.** `passed` remains I-05 and not Mastery. Client and server results are not silently repaired. |
| **D-022-11 / C4** | **REFINED, not rewritten.** This ADR specifies recalculation and provenance. It does not mark current rows trusted. |
| **D-022-12 / Slice 1 / Slice 2** | **UNCHANGED.** No Phase B. `evidence_skills` stays bind-only. |
| **ADR-022 §13** | Still true **of ADR-022**: that freeze does not change Evidence POST. ADR-023 is the later decision that defines a future change. This ADR does not edit that sentence. |
| **ADR-022 §22** | **STILL CLOSED.** Trusted scoring is necessary for later Mastery and is not sufficient. Mapping, aggregation, sufficiency, regression, and a rule version remain unfrozen. |

### D-023-10 — Implementation gate

Trusted-scoring **code** remains **NO-GO** until both of the following exist:

- this ADR is **Accepted / FROZEN** (this document)
- a **separate human-authorized implementation plan** that may define schema and the activity pass-rule shape

That later plan still must not start the work in D-023-08. Mastery projection remains NO-GO after ADR-023. ADR-022 §22 remains the gate for Mastery code.

Even after this freeze, the following stay **NO-GO**: trusted-scoring implementation until the separate plan; schema/migration implementation; Mastery projection; score→`MasteryLevel` mapping; aggregation; sufficiency; regression; Question→Skill; SkillGap; Adaptive Path; Phase B; Skill HTTP; historical trust backfill.

## 7. Current implementation (unchanged by this freeze)

Today’s `POST /api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/evidence` still accepts client-declared score fields and still persists them. Those rows are `client_declared`. No server key exists. No provenance column exists. Progress still uses persisted `passed` under the current contract. This freeze does not change that runtime behavior.

## 8. Consequences

Positive: a later scoring slice cannot honestly treat client score fields as trusted, use Golden Reference as the key, hide the key in a learner response, or backfill history.

Trade-off: **no** trusted quiz result exists until a later implementation plan and code. Current HTTP Evidence remains Mastery-untrusted.

## 9. Acceptance Criteria

Documentation of this ADR makes all of the following unmistakable:

- client selections are the only trusted-path input
- the server recomputes `score`, `maxScore`, `passed`, and `correct`
- client `score`, `maxScore`, `passed`, and `correct` are never scoring authority
- the key is server-persisted, Step-owned through the Goal, and not Golden Reference
- learner-facing APIs do not disclose the key
- `server_recalculated` and `client_declared` are distinct
- missing provenance is `client_declared`
- historical rows are not backfilled or re-scored
- unkeyed Steps keep today’s declared-score POST
- keyed Steps reject that POST
- permanent dual authority on keyed Steps is rejected
- `passed` drives I-05 only and does not set `MasteryLevel`
- tenancy is the owned Goal chain, fail closed
- no migration is allocated
- trusted scoring, schema, Mastery, mapping, aggregation, SkillGap, Adaptive Path, Phase B, and Skill HTTP stay out
- ADR-021 and ADR-022 decision rows are not rewritten

## 10. Out of Scope / Future Work

Activity pass-rule shape (minimum correct count versus ratio), to be chosen in the implementation plan without defaulting to `DEFAULT_PASS_SCORE`. SQL shape for the two D-023-07 concepts. Then, only under that plan, trusted-scoring implementation. Mastery projection remains a still later gate under ADR-022 §22.

## Exit / Freeze State

**ACCEPTED / FROZEN.** This ADR did **not** start implementation. Head `0010_elite_valkyrie`. Next trusted-scoring **code** requires a separate implementation plan satisfying D-023-10. Mastery **code** remains unauthorized.
