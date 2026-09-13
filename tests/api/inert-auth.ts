import type { LoginDependencies } from "../../src/application/index.js"

/** In-memory auth ports so API tests can start the full route table without Postgres. */
export function inertAuth(): LoginDependencies {
  return {
    credentials: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
      async getByTypeAndIdentifier() {
        return null
      },
    },
    users: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
    },
    memberships: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
      async listByUserId() {
        return []
      },
    },
    sessions: {
      async save(item) {
        return item
      },
      async getByTokenHash() {
        return null
      },
      async revokeByTokenHash() {},
    },
    hasher: {
      async hash() {
        throw new Error("login must not hash passwords")
      },
      async verify() {
        return false
      },
      dummyHash() {
        return "h:dummy"
      },
      needsRehash() {
        return false
      },
    },
    tokens: {
      issue() {
        return "unused"
      },
    },
    digest: {
      digest(raw) {
        return `sha:${raw}`
      },
    },
  }
}
