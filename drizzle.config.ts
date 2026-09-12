import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/infra/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://learnova:learnova@localhost:5432/learnova",
  },
})
