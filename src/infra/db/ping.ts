import postgres from "postgres"

export async function pingDatabase(url: string): Promise<true> {
  const client = postgres(url, { max: 1, connect_timeout: 10 })
  try {
    const rows = await client`SELECT 1::int AS ok`
    if (rows[0]?.ok !== 1) {
      throw new Error("unexpected database ping result")
    }
    return true
  } finally {
    await client.end({ timeout: 5 })
  }
}
