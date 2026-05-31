import { getFixtures } from '@/lib/fixtures'
import { FixturesFilters } from '@/components/fixtures-filters'
import { FixturesTable } from '@/components/fixtures-table'
import { FixturesPagination } from '@/components/fixtures-pagination'

interface SearchParams {
  page?: string
  search?: string
  tournament?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const search = sp.search ?? ''
  const tournament = sp.tournament ?? ''

  const data = await getFixtures({ page, search, tournament })

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">XGScore Fixtures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Football match predictions with expected goals (xG) and odds
          </p>
        </div>

        <FixturesFilters
          tournaments={data.tournaments}
          search={search}
          tournament={tournament}
          total={data.total}
        />

        <FixturesTable rows={data.rows} />

        <FixturesPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          search={search}
          tournament={tournament}
        />

      </div>
    </main>
  )
}
