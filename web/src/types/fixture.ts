export interface XgsFixture {
  id: number
  tournament: string        // NOT NULL in DB
  kickoff: string | null
  home_team: string | null
  away_team: string | null
  home_xg: number | null   // DOUBLE PRECISION
  away_xg: number | null   // DOUBLE PRECISION
  odd: string | null
  link: string | null
  scraped_at: Date          // TIMESTAMPTZ → JS Date via postgres driver
}
