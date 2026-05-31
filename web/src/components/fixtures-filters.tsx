'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  tournaments: string[]
  search: string
  tournament: string
  total: number
}

export function FixturesFilters({ tournaments, search, tournament, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [inputValue, setInputValue] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync input when URL changes externally (e.g. back button)
  useEffect(() => { setInputValue(search) }, [search])

  function pushUrl(updates: { search?: string; tournament?: string }) {
    const params = new URLSearchParams()
    const newSearch = updates.search ?? search
    const newTournament = updates.tournament ?? tournament
    if (newSearch) params.set('search', newSearch)
    if (newTournament) params.set('tournament', newTournament)
    // page resets to 1 on any filter change
    startTransition(() => {
      router.push(`${pathname}${params.size ? `?${params}` : ''}`)
    })
  }

  function handleSearchChange(value: string) {
    setInputValue(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushUrl({ search: value }), 400)
  }

  function handleTournamentChange(value: string) {
    pushUrl({ tournament: value })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', isPending && 'opacity-60 pointer-events-none')}>
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search teams or tournament…"
          value={inputValue}
          onChange={e => handleSearchChange(e.target.value)}
        />
      </div>

      <select
        value={tournament}
        onChange={e => handleTournamentChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">All Tournaments</option>
        {tournaments.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <span className="text-sm text-muted-foreground whitespace-nowrap ml-auto">
        {total.toLocaleString()} {total === 1 ? 'fixture' : 'fixtures'}
      </span>
    </div>
  )
}
