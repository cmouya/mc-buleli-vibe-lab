/**
 * Shared domain error — no framework dependencies.
 */

export class DomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "DomainError"
    this.code = code
  }
}

export interface DomainClockOptions {
  /** ISO timestamp for deterministic tests */
  now?: string
}

export function resolveNow(opts?: DomainClockOptions): string {
  return opts?.now ?? new Date().toISOString()
}
