import { createHash, randomBytes } from "node:crypto"

const TOKEN_BYTES = 32

export function createSha256TokenDigest() {
  return {
    digest(rawToken: string): string {
      return createHash("sha256").update(rawToken, "utf8").digest("hex")
    },
  }
}

export function createRandomSessionTokenIssuer() {
  return {
    issue(): string {
      return randomBytes(TOKEN_BYTES).toString("base64url")
    },
  }
}
