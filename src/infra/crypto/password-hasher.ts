import { hash, hashSync, parseOptions, verify } from "@node-rs/argon2"
import type { PasswordHasher } from "../../modules/auth/index.js"

/** Argon2id = 2 in @node-rs/argon2 (avoid ambient const enum with verbatimModuleSyntax). */
const ARGON2ID = 2

const POLICY = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export function createArgon2idPasswordHasher(): PasswordHasher {
  const dummy = hashSync("learnova-dummy-password-not-used", POLICY)
  return {
    hash(password: string): Promise<string> {
      return hash(password, POLICY)
    },
    async verify(secretHash: string, password: string): Promise<boolean> {
      try {
        return await verify(secretHash, password)
      } catch {
        return false
      }
    },
    dummyHash(): string {
      return dummy
    },
    needsRehash(secretHash: string): boolean {
      try {
        const parsed = parseOptions(secretHash)
        return (
          parsed.algorithm !== POLICY.algorithm ||
          parsed.memoryCost !== POLICY.memoryCost ||
          parsed.timeCost !== POLICY.timeCost ||
          parsed.parallelism !== POLICY.parallelism
        )
      } catch {
        return true
      }
    },
  }
}
