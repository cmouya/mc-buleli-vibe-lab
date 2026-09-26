export { createSkill, isSkill } from "./skill.js"
export type { Skill, CreateSkillInput } from "./skill.js"

export {
  createOrganizationSkill,
  isOrganizationSkill,
  assertSkillMatchesOrganization,
} from "./organization-skill.js"
export type { OrganizationSkill, CreateOrganizationSkillInput } from "./organization-skill.js"
export type { OrganizationSkillRepository } from "./organization-skill-repository.js"

export { createGoalSkillRequirement, bindGoalSkillRequirement } from "./goal-skill-requirement.js"
export type {
  GoalSkillRequirement,
  CreateGoalSkillRequirementInput,
  BindGoalSkillRequirementInput,
} from "./goal-skill-requirement.js"

export { createStepSkillCoverage, bindStepSkillCoverage } from "./step-skill-coverage.js"
export type {
  StepSkillCoverage,
  CreateStepSkillCoverageInput,
  BindStepSkillCoverageInput,
} from "./step-skill-coverage.js"

export {
  MASTERY_LEVELS,
  isMasteryLevel,
  createLearnerSkill,
  setLearnerSkillLevel,
  addLearnerSkillEvidenceRef,
} from "./learner-skill.js"
export type { LearnerSkill, MasteryLevel, CreateLearnerSkillInput } from "./learner-skill.js"

export { calculateSkillGap, calculateSkillGapFromLearnerSkill } from "./skill-gap.js"
export type { SkillGap, CalculateSkillGapInput } from "./skill-gap.js"
