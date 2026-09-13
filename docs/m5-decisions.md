# M5 recorded decisions (human-reviewed)

**Status:** Binding for M5.1. Schema/code follow ADR-013. Auth HTTP remains **M5.2**.

**ADR-002** (PostgreSQL) and **ADR-005** (server sessions + HTTP-only cookies) are **unchanged**.

See [ADR-013](architecture-baseline.md#adr-013--m5-identity-island).

## Adopted answers

| # | Decision | Answer |
|---|----------|--------|
| 1 | User vs Learner | **User ≠ Learner.** No `learners` table in M5. Do not use `learner` as an authorization role. |
| 2 | M4 spine | **Unowned** in M5.1. No `user_id` / `learner_id` / `organization_id` on `goals`, `learning_paths`, `learning_path_steps`, `evidence`. No claim/backfill. |
| 3 | Confirm / generate | Stay **public and unchanged** until authenticated persistence is re-audited. |
| 4 | Persist HTTP | Goal/Path/Evidence persist routes wait for **M6**. |
| 5 | Bootstrap | **No unrestricted public registration** in M5.1. In-process bootstrap for tests only. Product onboarding undecided. |
| 6 | Multi-org | **Membership table.** Do not put `organization_id` on `users` as the sole tenancy model. |
| 7 | Roles | **`org_admin` and `member` only.** Not a permission catalog (D-14 deferred). |
| 8 | Sessions | ADR-005 style is future **M5.2**. No session table, cookie library, hasher library, or TTL in M5.1. Do not freeze `sessions.organization_id` as active tenant. |
| 9 | ADR | **ADR-013** additive. Do not edit ADR-002/005 semantics. |

## Out of M5.1

Session, cookies, login/logout, auth hooks, Learner, Progress, LearnerState persistence, Skill, AssessmentAttempt, Mastery, Program/Cohort, M4 ownership columns, persist HTTP, Golden Reference auth/dual-write, full RBAC, new hasher/cookie npm dependencies.
