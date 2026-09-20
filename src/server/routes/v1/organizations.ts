import type { FastifyInstance } from "fastify"
import {
  getOwnedEvidence,
  getOwnedGoal,
  getOwnedPath,
  getOwnedStep,
  persistOwnedGoal,
  persistOwnedPath,
  persistOwnedEvidence,
  getOwnedPathProgress,
  resolveLearnerContext,
  resolveOrganizationContext,
  resolveSession,
  type LearnerRepository,
  type LoginDependencies,
  type OwnedDerivedContentRepository,
  type OwnedGoalRepository,
  type OwnedLearningPathRepository,
  type OwnedEvidenceRepository,
  type OwnedProgressRepository,
} from "../../../application/index.js"
import { AUTH_COOKIE_NAME } from "../../auth-cookie.js"
import { DomainError } from "../../../modules/shared/index.js"

export type OrganizationRouteDependencies = LoginDependencies & {
  learners: LearnerRepository
  ownedGoals: OwnedGoalRepository
  ownedDerived: OwnedDerivedContentRepository
  ownedPaths: OwnedLearningPathRepository
  ownedEvidence: OwnedEvidenceRepository
  ownedProgress: OwnedProgressRepository
}

const ownedGoalBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["statement", "level", "hoursPerWeek", "intent"],
  properties: {
    statement: { type: "string", minLength: 1 },
    level: { type: "string", enum: ["debutant", "intermediaire", "avance"] },
    hoursPerWeek: { type: "number", exclusiveMinimum: 0 },
    intent: { type: "string", enum: ["professionnel", "personnel", "academique"] },
  },
} as const

const ownedPathBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["pathId", "pathTitle", "steps"],
  properties: {
    pathId: { type: "string" },
    pathTitle: { type: "string", minLength: 1 },
    summary: { type: "string" },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: true,
        required: ["title"],
        properties: {
          id: { type: "string" },
          title: { type: "string", minLength: 1 },
          description: { type: "string" },
        },
      },
    },
    organizationId: { type: "string" },
    learnerId: { type: "string" },
    goalId: { type: "string" },
  },
} as const

const ownedEvidenceBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "maxScore", "passed", "answers"],
  properties: {
    score: { type: "number" },
    maxScore: { type: "number" },
    passed: { type: "boolean" },
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["questionIndex", "selectedIndex", "correct"],
        properties: {
          questionIndex: { type: "number" },
          selectedIndex: { type: "number" },
          correct: { type: "boolean" },
        },
      },
    },
    organizationId: { type: "string" },
    learnerId: { type: "string" },
    goalId: { type: "string" },
    stepId: { type: "string" },
    type: { type: "string" },
    id: { type: "string" },
    recordedAt: { type: "string" },
  },
} as const

const NOT_FOUND = new DomainError("GOAL_NOT_FOUND", "Goal not found")
const RESOURCE_NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  deps: OrganizationRouteDependencies,
): Promise<void> {
  app.get(
    "/api/v1/organizations/:organizationId/context",
    {
      schema: {
        tags: ["organizations"],
        summary: "Resolve membership-validated organization context",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId } = request.params as { organizationId: string }
      const context = resolveOrganizationContext(auth, organizationId)
      return {
        userId: context.userId,
        organizationId: context.organizationId,
        role: context.role,
      }
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/learner-context",
    {
      schema: {
        tags: ["organizations"],
        summary: "Resolve server-side LearnerContext for the authorized organization",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId } = request.params as { organizationId: string }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      return {
        learnerId: learner.learnerId,
        userId: learner.userId,
        organizationId: learner.organizationId,
      }
    },
  )

  app.post(
    "/api/v1/organizations/:organizationId/goals",
    {
      schema: {
        tags: ["organizations"],
        summary: "Create a Goal owned by the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
        body: ownedGoalBodySchema,
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId } = request.params as { organizationId: string }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const body = request.body as {
        statement: string
        level: "debutant" | "intermediaire" | "avance"
        hoursPerWeek: number
        intent: "professionnel" | "personnel" | "academique"
      }
      return persistOwnedGoal(body, learner, deps.ownedGoals)
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/goals/:goalId",
    {
      schema: {
        tags: ["organizations"],
        summary: "Read a Goal owned by the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId } = request.params as {
        organizationId: string
        goalId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const goal = await getOwnedGoal(goalId, learner, deps.ownedGoals)
      if (!goal) {
        throw NOT_FOUND
      }
      return goal
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/goals/:goalId/path",
    {
      schema: {
        tags: ["organizations"],
        summary: "Read the LearningPath owned through the Goal for the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId } = request.params as {
        organizationId: string
        goalId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const path = await getOwnedPath(goalId, learner, deps.ownedDerived)
      if (!path) {
        throw RESOURCE_NOT_FOUND
      }
      return path
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/goals/:goalId/path/progress",
    {
      schema: {
        tags: ["organizations"],
        summary: "Read derived Path Progress for the owned Goal of the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: ["totalSteps", "completedSteps", "progressPercent"],
            properties: {
              totalSteps: { type: "number" },
              completedSteps: { type: "number" },
              progressPercent: { type: "number" },
            },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId } = request.params as {
        organizationId: string
        goalId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      return getOwnedPathProgress(goalId, learner, deps.ownedDerived, deps.ownedProgress)
    },
  )

  app.post(
    "/api/v1/organizations/:organizationId/goals/:goalId/path",
    {
      schema: {
        tags: ["organizations"],
        summary: "Persist an accepted LearningPath under an owned Goal for the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
          },
        },
        body: ownedPathBodySchema,
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId } = request.params as {
        organizationId: string
        goalId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const body = request.body as {
        pathId: string
        pathTitle: string
        summary?: string
        steps: unknown[]
        organizationId?: string
        learnerId?: string
        goalId?: string
      }
      const proposal = {
        pathId: body.pathId,
        pathTitle: body.pathTitle,
        steps: body.steps,
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
      }
      return persistOwnedPath(
        {
          goalId,
          proposal,
          organizationId: body.organizationId,
          learnerId: body.learnerId,
        },
        learner,
        deps.ownedGoals,
        deps.ownedPaths,
      )
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId",
    {
      schema: {
        tags: ["organizations"],
        summary: "Read a Step owned through the Goal for the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId", "stepId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
            stepId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId, stepId } = request.params as {
        organizationId: string
        goalId: string
        stepId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const step = await getOwnedStep(stepId, goalId, learner, deps.ownedDerived)
      if (!step) {
        throw RESOURCE_NOT_FOUND
      }
      return step
    },
  )

  app.post(
    "/api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/evidence",
    {
      schema: {
        tags: ["organizations"],
        summary: "Persist scored Evidence under an owned Step for the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId", "stepId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
            stepId: { type: "string" },
          },
        },
        body: ownedEvidenceBodySchema,
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId, stepId } = request.params as {
        organizationId: string
        goalId: string
        stepId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const body = request.body as {
        score: number
        maxScore: number
        passed: boolean
        answers: Array<{ questionIndex: number; selectedIndex: number; correct: boolean }>
      }
      return persistOwnedEvidence(
        {
          goalId,
          stepId,
          score: body.score,
          maxScore: body.maxScore,
          passed: body.passed,
          answers: body.answers,
        },
        learner,
        deps.ownedDerived,
        deps.ownedEvidence,
      )
    },
  )

  app.get(
    "/api/v1/organizations/:organizationId/goals/:goalId/evidence/:evidenceId",
    {
      schema: {
        tags: ["organizations"],
        summary: "Read Evidence owned through the Goal for the resolved LearnerContext",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId", "goalId", "evidenceId"],
          properties: {
            organizationId: { type: "string" },
            goalId: { type: "string" },
            evidenceId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId, goalId, evidenceId } = request.params as {
        organizationId: string
        goalId: string
        evidenceId: string
      }
      const organization = resolveOrganizationContext(auth, organizationId)
      const learner = await resolveLearnerContext(organization, deps.learners)
      const item = await getOwnedEvidence(evidenceId, goalId, learner, deps.ownedDerived)
      if (!item) {
        throw RESOURCE_NOT_FOUND
      }
      return item
    },
  )
}
