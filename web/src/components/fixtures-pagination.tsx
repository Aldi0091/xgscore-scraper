'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  page: number
  totalPages: number
  total: number
  search: string
  tournament: string
}

export function FixturesPagination({ page, totalPages, search, tournament }: Props) {
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tournament) params.set('tournament', tournament)
    params.set('page', String(p))
    return `?${params}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-end gap-3 py-2">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={pageUrl(page - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}

      <span className="text-sm tabular-nums text-muted-foreground select-none">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={pageUrl(page + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}
