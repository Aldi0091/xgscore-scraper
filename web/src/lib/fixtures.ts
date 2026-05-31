import sql from './db'
import type { XgsFixture } from '@/types/fixture'

export const PAGE_SIZE = 25

export interface FixturesParams {
  page?: number
  search?: string
  tournament?: string
}

export interface FixturesResult {
  rows: XgsFixture[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  tournaments: string[]
}

// postgres.js returns TIMESTAMPTZ as JS Date — not serializable to Client Components
type RawFixture = Omit<XgsFixture, 'scraped_at'> & { scraped_at: Date }

export async function getFixtures({
  page = 1,
  search = '',
  tournament = '',
}: FixturesParams = {}): Promise<FixturesResult> {
  const offset = (page - 1) * PAGE_SIZE
  const like = `%${search}%`

  const searchFilter = search
    ? sql`AND (home_team ILIKE ${like} OR away_team ILIKE ${like} OR tournament ILIKE ${like})`
    : sql``

  const tournamentFilter = tournament
    ? sql`AND tournament = ${tournament}`
    : sql``

  const [rawRows, [{ count }], tourRows] = await Promise.all([
    sql<RawFixture[]>`
      SELECT *
      FROM xgs_fixtures
      WHERE TRUE ${searchFilter} ${tournamentFilter}
      ORDER BY scraped_at DESC, id DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count
      FROM xgs_fixtures
      WHERE TRUE ${searchFilter} ${tournamentFilter}
    `,
    sql<{ tournament: string }[]>`
      SELECT DISTINCT tournament
      FROM xgs_fixtures
      WHERE tournament <> ''
      ORDER BY tournament
    `,
  ])

  const rows: XgsFixture[] = rawRows.map(r => ({
    ...r,
    scraped_at: r.scraped_at instanceof Date ? r.scraped_at.toISOString() : String(r.scraped_at),
  }))

  return {
    rows,
    total: count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(count / PAGE_SIZE),
    tournaments: tourRows.map(r => r.tournament),
  }
}
