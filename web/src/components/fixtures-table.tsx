'use client'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ExternalLink } from 'lucide-react'
import type { XgsFixture } from '@/types/fixture'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const col = createColumnHelper<XgsFixture>()

function xgBadge(xg: number | null) {
  if (xg === null) return <span className="text-muted-foreground">—</span>
  const cls =
    xg >= 2.0 ? 'text-emerald-400' :
    xg >= 1.5 ? 'text-yellow-400' :
    xg >= 1.0 ? 'text-orange-400' :
    'text-red-400'
  return (
    <span className={cn('font-mono text-sm font-semibold tabular-nums', cls)}>
      {xg.toFixed(1)}
    </span>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const columns = [
  col.accessor('kickoff', {
    header: 'Time',
    cell: info => (
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  col.accessor('home_team', {
    header: 'Home',
    cell: info => <span className="font-medium">{info.getValue() ?? '—'}</span>,
  }),
  col.display({
    id: 'home_xg',
    header: () => <span className="text-xs font-medium text-muted-foreground">xG</span>,
    cell: ({ row }) => xgBadge(row.original.home_xg),
  }),
  col.display({
    id: 'away_xg',
    header: () => <span className="text-xs font-medium text-muted-foreground">xG</span>,
    cell: ({ row }) => xgBadge(row.original.away_xg),
  }),
  col.accessor('away_team', {
    header: 'Away',
    cell: info => <span className="font-medium">{info.getValue() ?? '—'}</span>,
  }),
  col.accessor('odd', {
    header: 'Odd',
    cell: info => (
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  col.accessor('scraped_at', {
    header: 'Scraped',
    cell: info => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(info.getValue())}
      </span>
    ),
  }),
  col.accessor('link', {
    header: '',
    cell: info => info.getValue() ? (
      <a
        href={info.getValue()!}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open preview"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    ) : null,
  }),
]

export function FixturesTable({ rows }: { rows: XgsFixture[] }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id} className="hover:bg-transparent border-border bg-muted/30">
              {hg.headers.map(header => (
                <TableHead key={header.id} className="text-xs uppercase tracking-wider">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No fixtures found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
