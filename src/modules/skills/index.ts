export { createSkill, isSkill } from "./skill.js"
export type { Skill, CreateSkillInput } from "./skill.js"

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
