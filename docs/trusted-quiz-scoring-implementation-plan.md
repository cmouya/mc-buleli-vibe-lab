# Trusted Quiz Scoring — Implementation Plan

## Current local implementation addendum — 2026-09-29

**CURRENT (local worktree `bb11cef`):** Slice 1 pure scorer exists (`bb4084e`, [source](../src/modules/evidence/score-owned-quiz.ts)). Slice 2 quiz/provenance persistence exists (`bb11cef`, [repository](../src/infra/db/owned-step-quiz-repository.ts), [migration 0011](../drizzle/0011_omniscient_jasper_sitwell.sql)). This source inspection does not assert deployment or rerun DB validation.

**ACCEPTED / FROZEN, pending implementation:** Slice 3 trusted HTTP submission and keyed-step rejection are absent. Current HTTP still persists client-declared scores; the internal server-recalculated persistence method is not wired to a trusted submission route. Mastery remains unimplemented and separately gated. **TARGET** enterprise/context capabilities and **EXPLORATORY / DEFERRED** designs are recorded in [Product Positioning](product-positioning.md).

The authored plan below is preserved as its pre-implementation specification. Its “NOT STARTED”, “no schema” and migration-head statements describe that historical authoring checkpoint, not the current state. No additional slice is authorized by this addendum.

---

**Provenance:** Written after human acceptance of the ADR-023 trusted-scoring design. This file is the D-023-10 implementation plan. Authoring it does **not** start code.

**Depends on:** [`docs/trusted-quiz-scoring-decisions.md`](trusted-quiz-scoring-decisions.md) (ADR-023), [`docs/mastery-projection-constraints-decisions.md`](mastery-projection-constraints-decisions.md) (ADR-022), [`docs/skill-intelligence-semantics-decisions.md`](skill-intelligence-semantics-decisions.md) (ADR-021).

**Baseline:** published main `bbd67cd16b3da30db06da7431301bbd01f47e1f3` (`docs: freeze ADR-023 trusted quiz scoring authority`). Migration head `0010_elite_valkyrie`. This plan allocates **no** migration number.

## 1. Purpose and status

Specify the first trusted-quiz implementation so a later execution can recompute `score`, `maxScore`, `passed`, and `answers.correct` on the server without inventing Mastery.

**Status:** PLAN AUTHORED / **IMPLEMENTATION NOT STARTED**
**ADR-023:** Accepted / FROZEN
**Slices:** 1 pure scorer → 2 persistence → 3 trusted API contract
**Code:** NOT STARTED. Do not begin Slice 1 from this authoring commit.
**Migration head:** `0010_elite_valkyrie`

## 2. Frozen architectural inputs

- ADR-021 D-021-01–D-021-19 stay unedited. Evidence stays Step-scoped. Attribution stays explicit M:N. AI is not authority. No Skill HTTP.
- ADR-022 D-022-01–D-022-12 stay unedited. Attribution is not proof. A score is not an isolated `MasteryLevel`. `passed` is I-05 and not Mastery. Current HTTP Evidence is Mastery-untrusted until a server recomputation exists. No historical trust.
- ADR-023 D-023-01–D-023-10 stay unedited. Selections are the only trusted input. The server recomputes score fields. The key is server-owned and not Golden Reference. Provenance is `client_declared` or `server_recalculated`. Keyed Steps reject declared-score authority. No backfill.

Accepted design choices recorded here, not as a rewrite of those rows:

- V1 pass rule is `minimumCorrectCount`
- `score` = number of correct selections
- `maxScore` = quiz item count
- `passed` = `score >= minimumCorrectCount`
- `DEFAULT_PASS_SCORE` is not authority
- Step-owned quiz definition is a separate persistence structure
- V1 items use JSONB
- missing provenance means `client_declared`
- trusted submission is a separate selections-only route
- no public quiz-authoring API in these slices

## 3. Current production state

`POST /api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/evidence` accepts client `score`, `maxScore`, `passed`, and `answers[].correct`. `persistOwnedEvidence` checks the owned Step, then `recordQuizEvidence` copies those fields. `saveOwned` re-proves Step → Path → Goal for the LearnerContext organization and learner.

Progress is derived later. `getOwnedStepCompletion` and `getOwnedPathProgress` treat a Step complete when any owned Evidence row has `passed === true` for that Step. No Mastery write.

`learning_path_steps` has no quiz, options, correct index, or pass rule. Golden Reference `evaluateQuizSubmission` runs in the browser and writes localStorage. It is not this API.

## 4. V1 pass-rule specification

The server quiz stores an integer `minimumCorrectCount`.

- `score` = count of selections whose `selectedIndex` equals that item’s server `correctIndex`
- `maxScore` = number of items
- `passed` = the submission is structurally valid and `score >= minimumCorrectCount`
- Stored invariant: `1 <= minimumCorrectCount <= itemCount`
- Do not default `minimumCorrectCount` to `2` or to `DEFAULT_PASS_SCORE`
- `passed` feeds I-05 only. It is not a Mastery threshold and it does not map to `MasteryLevel`

A ratio is not V1. It needs a rounding rule this repository does not have. An implicit “all items correct” rule would hide the threshold outside the quiz definition.

## 5. Trusted scoring invariants

- The trusted path accepts `questionIndex` and `selectedIndex` only
- The server alone writes `score`, `maxScore`, `passed`, and `correct`
- Client score fields are never merged and the more favorable value is never chosen
- Only a quiz loaded through the owned Goal chain is the key
- Provenance `server_recalculated` is set only by that server path
- The client cannot choose provenance
- Malformed selections persist nothing
- Learner HTTP never returns `correctIndex` or the key
- Trusted `passed` changes derived Progress only
- No Skill attribution, SkillGap, or Mastery write

## 6. Proposed persistence model

Do not add quiz columns to `learning_path_steps`. Step GET returns that row, so a key there would leak.

One new table, one row per Step:

- `step_id` — primary key and foreign key to `learning_path_steps`
- `minimum_correct_count` — integer
- `items` — JSONB

Each item holds the options and `correctIndex`. Domain validation runs before insert: non-empty items, each `correctIndex` inside that item’s options, and the pass-count invariant in §4. No question-level Skill column.

This plan does not name a migration file and does not include SQL. Slice 2, when separately executed, lets the Drizzle generator choose the next filename.

## 7. Provenance semantics

Column concept: `evidence.scoring_provenance`.

- Allowed values: `client_declared` | `server_recalculated`
- `NOT NULL`
- Check constraint on those two values
- Default: `client_declared`

`client_declared` means `score`, `passed`, or `correct` was accepted from the client. `server_recalculated` means the server computed those fields from the key and the selections. Any other value, and any read that cannot classify the row, is treated as `client_declared`. Only `server_recalculated` can later satisfy ADR-022 C4. Provenance is not a `MasteryLevel`.

## 8. Legacy compatibility rules

Existing Evidence rows get the column default `client_declared`. That records absence. It does not recompute `score`, `maxScore`, `passed`, or `answers`. No backfill. No historical re-score.

Unkeyed Steps keep today’s declared-score POST. Those new rows are `client_declared` and may still drive I-05. They are never Mastery-trusted.

When a quiz row is later attached to a Step, that Step’s declared-score POST is rejected and writes nothing. Only the selections route may add Evidence. Rows already stored stay `client_declared` and can still satisfy I-05. Golden Reference localStorage is unchanged.

## 9. Trusted submission API contract

**Unkeyed Step**

- Route: existing `POST .../steps/:stepId/evidence`
- Body: today’s `score`, `maxScore`, `passed`, `answers[].correct`
- Result: persist `client_declared`
- Progress: that `passed` still drives I-05
- `POST .../quiz-attempts`: reject; do not persist

**Keyed Step**

- Legacy `POST .../evidence`: reject after the owned-Step check with a domain error, not `RESOURCE_NOT_FOUND`. Persist nothing.
- Trusted route: `POST /api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/quiz-attempts`
- Body: `selections: [{ questionIndex, selectedIndex }]` only
- `additionalProperties: false`
- If the body also contains `score`, `maxScore`, `passed`, `correct`, or `scoringProvenance`, reject it. Do not ignore those fields.
- Result: server numbers, provenance `server_recalculated`, type `quiz_attempt`
- Progress: that server `passed` drives the existing I-05 read

No public route creates or edits the quiz definition. Tests seed it through the repository port.

Multiple valid attempts remain allowed. Each success inserts a new Evidence row.

## 10. Exact ownership and tenancy chain

session → OrganizationContext → LearnerContext → owned Goal → Path → Step → that Step’s quiz row → selections → scorer → Evidence insert.

The quiz read and the Evidence insert use the same ownership proof as `saveOwned`: `learning_path_steps` → `learning_paths` → `goals`, matching `goalId`, `organizationId`, and `learnerId`. Do not load a quiz by `stepId` alone. Client `organizationId`, `learnerId`, and `skillId` are not authority. A miss is `RESOURCE_NOT_FOUND`.

## 11. Validation and fail-closed behavior

Before any trusted insert:

- `selections` is an array
- length equals the item count
- exactly one selection for each index `0..n-1`
- no duplicate `questionIndex` and no extra index
- `questionIndex` and `selectedIndex` are integers
- `selectedIndex` is inside that item’s options
- no score, pass, correct, or provenance field

On any failure: throw, persist nothing, do not write a `server_recalculated` row for a malformed payload. Cross-tenant access stays `RESOURCE_NOT_FOUND` and does not reveal whether a quiz exists.

## 12. Answer-key confidentiality

- Do not join the quiz table in Step GET, Path GET, or Evidence GET
- Learner responses for a trusted attempt omit `correct` and never include `correctIndex`, the items document, or an explanation
- Internal storage may keep per-answer `correct` for audit
- Legacy `client_declared` Evidence GET may still return the `correct` flag the client originally sent
- Golden Reference bundles that already contain `answer` are not copied into the server quiz

## 13. Migration design constraints

This document allocates **no** migration number and contains **no** SQL. Head remains `0010_elite_valkyrie` until Slice 2 is separately executed.

When that slice runs, the generator migration must:

- create the Step quiz table in §6
- add `scoring_provenance` `NOT NULL` default `client_declared` with the check constraint
- not update existing `score`, `maxScore`, `passed`, or `answers`
- not insert quiz rows from Golden Reference
- not set any existing row to `server_recalculated`

Rollback before any `server_recalculated` row: drop the new column and table. After such a row exists, rollback drops the only trust distinction and is not safe. Existing Evidence stays readable because the default means the current untrusted contract.

## 14. Slice 1 — Pure scorer

**Objective.** A deterministic function: server quiz + selections → `score`, `maxScore`, `passed`, and per-answer `correct`, or a rejection.

**Allowed scope.** New domain module and its unit tests. Export it from the evidence module index if that is the local pattern.

**Prohibited scope.** HTTP, schema, Drizzle, repositories, Evidence POST, Progress changes, quiz persistence, Golden Reference, Mastery, Skill code.

**Likely files.** `src/modules/evidence/score-owned-quiz.ts`, `src/modules/evidence/index.ts`, `tests/unit/modules/score-owned-quiz.test.ts`.

**Tests.** §17 Slice 1.

**Security invariants.** The function has no client `score`, `passed`, or `correct` parameters. It does not return `correctIndex`.

**Entry criteria.** This plan is accepted and a human explicitly authorizes Slice 1 execution. Head is still `0010_elite_valkyrie`. Working tree contains no schema or route edits.

**Exit criteria.** Unit tests and `npm run typecheck` pass. The scorer implements §4 and §11. No other layer changed.

**STOP.** Do not start Slice 2 in the same change. Do not run `db:generate`.

## 15. Slice 2 — Persistence

**Objective.** Persist the quiz definition and Evidence provenance. Legacy saves write `client_declared`. No route behavior change.

**Allowed scope.** Domain validation for a quiz document, Drizzle schema, one generator migration, owned quiz repository, Evidence repository read/write of provenance, DB tests.

**Prohibited scope.** New HTTP routes, changing the Evidence POST contract, public quiz authoring, copying Golden Reference quizzes, Mastery, Skill schema, pre-assigning a migration number in documentation.

**Likely files.** `src/infra/db/schema.ts`, the generator SQL and journal entry, `src/infra/db/step-quiz-repository.ts`, `src/infra/db/owned-evidence-repository.ts`, `tests/db/step-quiz-repository.test.ts`, updates to `tests/db/owned-evidence-repository.test.ts`.

**Tests.** §17 Slice 2.

**Security invariants.** Quiz read/write uses the Goal ownership join. Step reads do not select `items`. Provenance default is `client_declared`. Application code is the only writer of `server_recalculated`, and this slice does not expose that writer over HTTP.

**Entry criteria.** Slice 1 exit criteria are met and a human authorizes Slice 2. Slice 1 is committed or otherwise present on the branch being executed.

**Exit criteria.** `npm run test:db` and `npm run typecheck` pass. Existing rows read as `client_declared`. The check constraint rejects other strings. Wrong organization or learner cannot read the quiz. Head is the generator’s new tag only after this slice actually migrates. Until then the documented head stays `0010_elite_valkyrie`.

**STOP.** Do not add the trusted route in this slice.

## 16. Slice 3 — Trusted API contract

**Objective.** Enforce §9. Keyed Steps reject declared scores. The selections route recomputes and persists `server_recalculated`. Progress still reads `passed` only.

**Allowed scope.** Application service, organization routes, response mapping that strips the key, unit/application tests, API tests, Progress regression tests.

**Prohibited scope.** Quiz authoring HTTP, Golden Reference rewrite, Evidence↔Skill changes, Mastery, SkillGap, Adaptive Path, Phase B, Skill HTTP, changing I-05 to use anything other than `passed`.

**Likely files.** `src/application/submit-owned-quiz-attempt.ts`, `src/application/persist-owned-evidence.ts`, `src/server/routes/v1/organizations.ts`, `tests/unit/application/submit-owned-quiz-attempt.test.ts`, `tests/api/owned-quiz-attempt.test.ts`, `tests/api/owned-evidence.test.ts`, `tests/api/owned-progress.test.ts`.

**Tests.** §17 Slice 3.

**Security invariants.** §7, §10, §11, and §12. Forged score fields do not persist. Cross-tenant access is `RESOURCE_NOT_FOUND`.

**Entry criteria.** Slice 2 exit criteria are met and a human authorizes Slice 3.

**Exit criteria.** `npm test`, `npm run test:api`, `npm run test:db`, and `npm run typecheck` pass. The checks in §17 Slice 3 hold. `npm run test:e2e` is required only if a Golden Reference file changes. This plan forbids that change.

**STOP.** Do not start Mastery, mapping, aggregation, or a quiz-authoring API.

## 17. Detailed test matrix

**Slice 1**

- `score === minimumCorrectCount` passes; one below fails
- `maxScore` equals item count
- the fixture’s threshold is not implicitly `DEFAULT_PASS_SCORE`
- duplicate, missing, extra, and out-of-range selections throw
- the scorer does not accept client `score`, `passed`, or `correct`
- the result object has no `correctIndex`

**Slice 2**

- a pre-existing Evidence row reads `client_declared`
- the check constraint rejects any other provenance string
- a legacy save writes `client_declared`
- quiz lookup with the wrong organization or learner returns not found
- a Step read does not include `items` or `correctIndex`
- storing `minimumCorrectCount` outside `1..itemCount` or a bad `correctIndex` fails in domain validation

**Slice 3**

- unkeyed declared POST still persists and stays `client_declared`
- unkeyed `quiz-attempts` rejects and does not insert
- keyed declared POST rejects and does not insert, including forged `score`, `passed`, and `answers.correct`
- trusted route rejects a body that includes score fields or `scoringProvenance`
- trusted route persists server `score`, `maxScore`, and `passed` with `server_recalculated`
- response and Evidence GET for that row omit `correct` and `correctIndex`
- cross-organization and cross-learner calls return `RESOURCE_NOT_FOUND` and do not reveal the quiz
- server `passed: true` increases derived path progress
- server `passed: false` does not
- a keyed legacy POST does not change progress
- no Mastery row, Skill row, or `evidence_skills` row is written
- existing unkeyed owned-evidence API tests still pass

## 18. Security and threat model

| Threat | Required behavior |
|---|---|
| Forged `score`, `passed`, or `answers.correct` on the trusted route | Reject. Do not merge. |
| Declared-score POST on a keyed Step | Reject. Write nothing. |
| Client-selected provenance | Reject. Only the server sets `server_recalculated`. |
| Answer-key leakage | Quiz table is absent from learner Step, Path, and Evidence reads. Trusted HTTP omits `correct` and `correctIndex`. |
| `stepId`-only lookup | Forbidden. Use the Goal ownership join. |
| Cross-organization or cross-learner access | `RESOURCE_NOT_FOUND`. |
| Quiz enumeration | A foreign Step does not reveal whether a quiz row exists. |
| Replay | Another attempt row. Provenance is not upgraded. No Mastery write. |
| Malformed selections | Persist nothing. |

## 19. Rollback and compatibility

Slice 1 rollback is deleting the scorer and its tests. No data change.

Slice 2 rollback, before any `server_recalculated` row, is dropping the new column and table. After a trusted row exists, do not roll back just to hide provenance.

Slice 3 rollback restores the old POST behavior only together with the Slice 2 rollback, or keyed Steps would again accept declared scores. Unkeyed clients are compatible throughout. Keyed Steps are a deliberate contract change: declared-score clients on those Steps start receiving a domain error.

Compatibility risks: returning `answers.correct` on the trusted response would reveal the chosen key; putting `items` on `learning_path_steps` would leak through Step GET; a provenance default of trusted would violate ADR-023.

## 20. Explicit non-goals

Mastery projection; score→`MasteryLevel`; aggregation; sufficiency; regression; a Mastery rule version; Question→Skill; copying a quiz score onto covered Skills; SkillGap; Adaptive Path; Phase B; Skill HTTP; UNKNOWN as a `MasteryLevel`; historical trust backfill or re-score; Golden Reference as production authority; a public quiz-authoring API; a migration number in this document.

## 21. Implementation gates and exit criteria

- Authoring this file does **not** execute Slice 1
- Slice 1 starts only after an explicit human execution authorization, and only Slice 1
- Slice 2 starts only after Slice 1’s exit criteria and a separate authorization
- Slice 3 starts only after Slice 2’s exit criteria and a separate authorization
- Mastery code stays unauthorized under ADR-022 §22 even after Slice 3
- Each slice stops at its STOP condition

## 22. Files and layers likely affected

Listed per slice in §14–§16. Not affected: `src/views/lesson.js`, `src/store.js`, `src/shared/assessment.js`, Skill modules, SkillGap, Mastery types’ authority, and ADR decision paragraphs.

## 23. Required verification commands

Slice 1: `npm test` and `npm run typecheck`.

Slice 2: `npm run test:db` and `npm run typecheck`. The executor runs `npm run db:generate` only inside Slice 2, without a pre-chosen migration number, then reviews the generated SQL against §13 before migrate.

Slice 3: `npm test`, `npm run test:api`, `npm run test:db`, and `npm run typecheck`. `npm run test:e2e` only if a Golden Reference file was changed, which this plan forbids.

Do not run those commands as part of authoring this plan.

## 24. Final authorization boundary

This document is the accepted implementation plan for ADR-023 D-023-10. It authorizes **no code, no schema edit, and no migration** until a human explicitly starts a slice.

**Next action:** stop. Do not implement Slice 1 in the documentation change that adds this file.

**Still NO-GO after Slice 3:** every item in §20, including Mastery projection.
