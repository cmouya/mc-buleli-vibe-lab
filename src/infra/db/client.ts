import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema.js"

export function createSqlClient(url: string) {
  return postgres(url, { max: 1 })
}

export function createDb(
  client: ReturnType<typeof postgres>,
): PostgresJsDatabase<typeof schema> {
  return drizzle(client, { schema })
}
