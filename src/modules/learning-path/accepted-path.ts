export interface AcceptedPathStep {
  id: string
  position: number
  title: string
  description: string
  sourceStepId?: string
}

export interface AcceptedLearningPath {
  id: string
  goalId: string
  title: string
  summary?: string
  sourcePathId?: string
  steps: AcceptedPathStep[]
}
