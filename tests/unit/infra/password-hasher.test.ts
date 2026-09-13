import { describe, expect, it } from "vitest"
import { createArgon2idPasswordHasher } from "../../../src/infra/crypto/password-hasher.js"

describe("infra — Argon2id hasher", () => {
  it("hashes and verifies with argon2id PHC strings", async () => {
    const hasher = createArgon2idPasswordHasher()
    const hashed = await hasher.hash("correct-horse")
    expect(hashed.startsWith("$argon2id$")).toBe(true)
    expect(await hasher.verify(hashed, "correct-horse")).toBe(true)
    expect(await hasher.verify(hashed, "wrong")).toBe(false)
    expect(hasher.needsRehash(hashed)).toBe(false)
  })

  it("treats malformed or non-Argon2id hashes as verification failure", async () => {
    const hasher = createArgon2idPasswordHasher()
    expect(await hasher.verify("not-argon2", "secret")).toBe(false)
    expect(await hasher.verify("$2a$10$legacybcryptplaceholder............", "secret")).toBe(false)
  })
})
