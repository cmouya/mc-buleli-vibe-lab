import type { Evidence } from "../../shared/types/domain.types.js"

export interface EvidenceRepository {
  save(evidence: Evidence): Promise<Evidence>
  getById(id: string): Promise<Evidence | null>
  getByStepId(stepId: string): Promise<Evidence[]>
}
