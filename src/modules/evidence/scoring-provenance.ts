import type { ScoringProvenance } from "../../shared/types/domain.types.js"

export const CLIENT_DECLARED_PROVENANCE = "client_declared" satisfies ScoringProvenance
export const SERVER_RECALCULATED_PROVENANCE = "server_recalculated" satisfies ScoringProvenance

/**
 * Fail closed. Only the exact persisted value server_recalculated is trusted.
 * Missing, null, malformed, and unknown values stay client_declared.
 */
export function scoringProvenanceFromPersisted(value: unknown): ScoringProvenance {
  return value === SERVER_RECALCULATED_PROVENANCE
    ? SERVER_RECALCULATED_PROVENANCE
    : CLIENT_DECLARED_PROVENANCE
}
