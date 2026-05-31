import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined
}

// Reuse the connection across hot-reloads in dev (avoids "too many connections")
const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL!, { max: 10 })

if (process.env.NODE_ENV !== 'production') {
  globalThis._sql = sql
}

export default sql
