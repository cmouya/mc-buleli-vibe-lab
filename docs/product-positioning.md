# Learnova — Product Positioning

**Status:** Product positioning foundation, prepared for human validation. Documentation only; no implementation authorization.
**Reference date:** 2026-09-29. Current capability below is based on the local worktree at `bb11cef`, not an assumed remote state.

## Authority and capability status

This is the canonical product positioning reference. [Product principles](product-principles.md) govern product behavior; [architecture baseline](architecture-baseline.md) §20 and its linked decision records govern accepted architecture. This document does not supersede Accepted/Frozen ADRs or their implementation gates.

| Label | Meaning |
|---|---|
| **CURRENT** | Implemented in local source, with supporting repository evidence. This does not assert a production deployment or a fresh database test run. |
| **ACCEPTED / FROZEN** | Architecturally decided in an accepted ADR or subsequent accepted specification; implementation may be partial or absent. |
| **TARGET** | Intended product capability or architectural concern; detailed design and implementation still require review. |
| **EXPLORATORY / DEFERRED** | A future possibility whose design, scope, or adoption is not decided. |

Historical documents retain their checkpoint meaning. [Architecture](architecture.md) and the early sections of [migration map](migration-map.md) are Prototype 0 snapshots. M5/M6 decision records, Skill Identity freezes, and ADR decision bodies describe their own checkpoints; later implementation does not rewrite their original decisions. For current scope, use local code and the status below alongside the later implementation records.

## 1. Product category — Learning Intelligence System

Learnova is a **Learning Intelligence System (LIS)**. Its defining value is intelligence and orchestration from a goal to demonstrated learning outcomes. It may deliver learning experiences itself. It is not positioned as a traditional LMS, a course catalogue, an LMS with a chatbot, or a replacement for every learning platform.

The **TARGET** product chain is:

```text
Organizational / learner goal
  → Competency requirements
  → Skills
  → Skill gap / learner state
  → Learning journey / learning path
  → Content, learning activities and resources
  → Evidence
  → Assessment
  → Mastery / progression (distinct dimensions)
  → Reassessment / adaptation
  → Measurable learning outcomes and impact
```

Assessment interprets evidence against criteria. Progress describes advancement through the path; mastery requires eligible evidence and deterministic rules. This chain is a product model, not a claim that every stage is implemented. Assessment and adaptation form feedback loops into learner state and the path.

## 2. Goal before Content

**Product principle:** Goal before Content is non-negotiable. Preserve **Skills before Courses**, **Evidence before Completion**, and **Progress is not Mastery**.

Content is a means toward a justified goal and competency outcome. New course, library, search, or catalogue features must connect to goals and skills; they must not turn catalogue browsing into the primary product model. A governed Skill catalog is a referential capability, not catalogue-first course navigation.

## 3. Complementarity with existing LMS ecosystems

**Product principle / TARGET capability:** Learnova should complement an institution's existing LMS, content libraries, identity systems, and learning infrastructure. Adoption must not require replacing an existing LMS.

```text
Existing LMS / Content Providers / Enterprise Systems
                         ↓
              Interoperability Layer (target)
                         ↓
                    Learnova LIS
                         ↓
       Goals → Skills → Paths → Evidence → Mastery → Impact
```

This conceptual relationship does not define data flow direction, a deployed service, or an API contract. Current local learning delivery and persistence do not establish external LMS integration.

## 4. Enterprise interoperability

**TARGET architectural concern:** Enterprise interoperability belongs at explicit interfaces and adapters, preserving domain authority and tenant ownership. It is a future enterprise integration boundary, not a new implementation commitment in this patch.

| Family | Target scope |
|---|---|
| Learning standards | SCORM 1.2, SCORM 2004, xAPI / Tin Can; future equivalent or open standards where justified |
| Identity federation | OpenID Connect (OIDC), SAML 2.0, provider-agnostic enterprise identity integration |
| Learning ecosystem integration | External LMS, learning content providers, enterprise APIs, content federation, progress/completion exchange |
| Learning records | Learning Record Store compatibility where justified |

These are target families, not claims of current support or frozen protocol profiles. Later decisions must define contracts, adapters, trust, and ownership before implementation. No vendor, database structure, adapter API, or deployment topology is selected here. Federation must respect existing User-only sessions and membership-validated OrganizationContext unless a later ADR explicitly changes them. Imported completion must not silently become verified mastery.

## 5. Skills Intelligence

**Product principle:** Skills Intelligence is core to Learnova. It builds on [Skill Identity](skill-identity-decisions.md), its [persistence decisions](skill-identity-persistence-decisions.md), and [Skill Intelligence semantics](skill-intelligence-semantics-decisions.md).

```text
Goal → Required Skills → Current Skill State → Skill Gap
     → Learning Path → Evidence → Mastery → Reassessment / Adaptation
```

**ACCEPTED / FROZEN boundaries:** Skill identity is organization-scoped. Goal requirements and Step coverage are many-to-many. Evidence stays Step-scoped; explicit Evidence↔Skill attribution is constrained to Step coverage. Attribution means relevance, not proof. Current demonstrated proficiency is mastery or UNKNOWN; an initial estimate is separate. UNKNOWN is not `none`. Legacy NULL required proficiency remains unresolved.

Mastery is a recomputable projection under deterministic, versioned rules, subject to [ADR-022](mastery-projection-constraints-decisions.md) and [ADR-023](trusted-quiz-scoring-decisions.md). Completion, progress, Skill coverage, estimates, and AI inference cannot establish it. A quiz score is not an isolated mapping to a mastery level; quiz-only V1 cannot establish `expert`. Multi-Skill global scores cannot be copied to every Skill. The Mastery implementation gate remains closed.

**CURRENT:** Organization Skill persistence, Goal/Step bindings, required proficiency writes, and explicit bind-only Evidence attribution exist. The capability ledger below distinguishes these foundations from a complete intelligence engine.

**TARGET:** Honest skill-gap analysis, demonstrated proficiency, and mastery projections within the accepted semantics.

**EXPLORATORY / DEFERRED:** Skill relationships/prerequisites, AI skills inference, next-best-learning recommendations, role/job-family competency mapping, and adaptive path policies. These require later design; no inference engine or new authority is approved here.

## 6. AI Governance

**Product principle and first-class architectural requirement:** Preserve **AI assists but Domain Rules decide** and **AI decisions must be explainable**, building on ADR-009 and ADR-021–023.

1. AI output is a recommendation or proposal unless deterministic domain rules explicitly authorize its use. AI does not become an independent authority.
2. High-impact learning decisions must remain auditable, with understandable reasons.
3. AI-generated or adaptive decisions should carry provenance where technically applicable, including enough context to identify the proposal and the rules that accepted it. Detailed representation is deferred.
4. Appropriate institutional workflows must eventually allow human review and override of proposals. This does not authorize a trainer override of scoring or mastery; those authority semantics require a later ADR.
5. Tenant/organization AI policies must eventually be enforceable. The policy model and enforcement mechanisms are **TARGET**, not implemented controls.
6. Sensitive institutional data must not silently become model-training data. Provider use, data handling, retention, and institutional choices require explicit governance.
7. AI providers must remain replaceable through interfaces/adapters.
8. Deterministic business rules retain authority over validation, scoring, ownership, and authorization.
9. AI-driven skills inference must be distinguishable from verified mastery and must not close a demonstrated skill gap by itself.
10. AI, imported claims, and human review must not create a second scoring or mastery authority outside accepted trusted-evidence rules.

**CURRENT:** Deterministic mock AI and domain boundaries exist. Comprehensive AI audit/provenance, institutional review workflows, and tenant policy enforcement remain **TARGET**. Evidence scoring provenance is an existing narrower foundation, not proof of platform-wide AI governance implementation.

## 7. African-context learning

**Product principle / TARGET differentiation:** Learnova follows **global architecture, context-aware learning, strong African contextualisation capability**. It remains globally usable; it is not an Africa-only product.

Future contextualisation should support geography, institution, industry, regulatory environment, development context, local case studies, local contributors, language, and infrastructure/connectivity constraints.

An African-context pathway may use African case studies, institutional examples, development-finance contexts, local professional practices, regional constraints, and locally relevant evidence or activities. These are configurable contextual choices, not mandatory properties of every path. Geographical origin must never be a proxy for skill quality or mastery. This patch defines no database model or context engine.

### External requirements reference

BAD/AfDB requirements are an external enterprise benchmark informing the roadmap, not the product identity. Learnova's decisions remain institution-neutral and reusable for multilateral institutions, enterprises, governments, universities, development organisations, and other learning ecosystems. The enterprise/BAD gap audit is a separate task.

## Current capability ledger

| Capability | Status and repository evidence |
|---|---|
| Goal-driven demo learning | **CURRENT:** Vite/vanilla UI, localStorage, deterministic MockAIService, lessons and browser quiz progression; [store](../src/store.js), [mock provider](../src/ai/MockAIService.js). No UI dual-write. |
| Identity and owned learning spine | **CURRENT:** M5.1–M5.3 and M6.1–M6.4 foundations: sessions, OrganizationContext, organization-scoped Learner, owned Goal/Path/Step/Evidence, derived Completion/Progress; [routes](../src/server/routes/v1/organizations.ts), [progress use cases](../src/application/get-owned-progress.ts). Full RBAC is deferred. |
| Skill foundations | **CURRENT:** organization Skills, Goal/Step bindings, requiredLevel writes and bind-only attribution; [schema](../src/infra/db/schema.ts), [Goal binding](../src/application/bind-owned-goal-skill.ts), [Evidence binding](../src/application/bind-owned-evidence-skill.ts). No Skill HTTP or production SkillGap engine. |
| Trusted scoring foundations | **CURRENT:** Slice 1 pure scorer (`bb4084e`); Slice 2 quiz persistence and scoring provenance (`bb11cef`). [Scorer](../src/modules/evidence/score-owned-quiz.ts), [quiz repository](../src/infra/db/owned-step-quiz-repository.ts), [migration 0011](../drizzle/0011_omniscient_jasper_sitwell.sql). Presence in source does not prove migration deployment. |
| Trusted submission API | **ACCEPTED / FROZEN, not wired:** selections-only submission and keyed-step rejection remain to be implemented. Current HTTP Evidence still accepts client-declared fields and persists `client_declared`; it remains Mastery-untrusted. Internal `server_recalculated` persistence is not an end-to-end trusted API. |
| Mastery | **ACCEPTED / FROZEN semantics, unimplemented projection:** ADR-021–023 and ADR-022 implementation gate remain authoritative. |
| Enterprise integration | **TARGET:** SCORM, xAPI, OIDC/SAML federation, LMS synchronization, content federation, and LRS compatibility. Existing REST and password sessions do not establish these capabilities. |
| Adaptation, impact and context | **TARGET:** advanced adaptive learning, enterprise impact analytics and configurable African contextualisation. Concrete policies and designs remain **EXPLORATORY / DEFERRED**. |

## Terminology

| Term | Usage |
|---|---|
| Learning Intelligence System (LIS) | Primary product category. “Platform” may describe technical implementation. |
| Traditional LMS | Descriptive category for existing learning management systems; no blanket claim that all LMS lack intelligence or evidence. |
| Course / content | Learning vehicles and resources justified by goals and skills. |
| Skill / competency | Skill is the stable organization-scoped capability identity. Competency requirements express desired capabilities; they do not introduce another identity model. |
| Evidence / assessment | Evidence records observed work; assessment evaluates it. Persistence and attribution alone do not establish trust or mastery. |
| Completion / progress / mastery | Step completion, path advancement, and demonstrated proficiency respectively; never interchangeable. |
| Adaptive path | Future policy-governed changes using learner state and evidence; current mock path generation is not advanced adaptation. |
| Organization / tenant | Organization is the tenant boundary; sessions authenticate User, and learning ownership resolves through LearnerContext and Goal. Contextualisation does not replace this boundary. |

## Decision classification and future ADR subjects

| Positioning decision | Classification in this patch |
|---|---|
| LIS category | Product principle |
| Goal before Content | Existing product principle, reaffirmed |
| LMS complementarity | Product principle with target integration implications |
| Enterprise interoperability | Target architectural concern; specific commitments deferred |
| Skills Intelligence | Product principle building on existing accepted ADRs |
| AI Governance | Product requirement building on accepted authority boundaries; new mechanisms deferred |
| African contextualisation | Product differentiation principle; specific architecture deferred |

Potential later ADRs: Enterprise Learning Interoperability; Identity Federation; Content Federation; AI Governance / AI Decision Provenance; Data Residency / Retention; Skills Intelligence inference authority. These are not approved implementation decisions. Follow baseline §23 when a specific architectural proposal is ready; no new ADR is required for this documentation-only positioning patch because no existing decision is changed or detailed integration design accepted.

### Contributor guidance

Treat Learnova as a LIS. Keep goals and skills central to content features. Use adapters and explicit boundaries for future integrations. AI must not bypass domain authority; inferred skill must never equal verified mastery. Keep CURRENT, ACCEPTED / FROZEN, TARGET and EXPLORATORY / DEFERRED claims explicit. Keep African contextualisation configurable and preserve all accepted authority and tenant boundaries.
