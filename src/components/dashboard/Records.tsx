import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { type DashboardData, type Selection, type View, statusLabels } from './config'
import { getRecords, type RecordRow } from './record-data'
import { EmptyState } from './ui'

export function RecordTable({
  columns,
  rows,
  onSelect,
  caption,
}: {
  columns: string[]
  rows: RecordRow[]
  onSelect: (record: Selection) => void
  caption: string
}) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => (
                <td key={columns[index]} data-label={columns[index]}>
                  {cell}
                </td>
              ))}
              <td className="table-action">
                <Button
                  variant="link"
                  className="text-link"
                  onClick={() => onSelect(row.detail)}
                  aria-label={`View ${row.name}`}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const emptyCopy: Record<string, [string, string]> = {
  applications: [
    'No applications yet',
    'New business applications will appear here, ready for review.',
  ],
  sellers: [
    'Your sellers, all in one place',
    'Approved businesses and their storefront details will appear here.',
  ],
  products: [
    'No listings to review',
    'Product details, customer reports and listing status will appear here.',
  ],
  orders: [
    'No orders yet',
    'Purchases and delivery progress will appear here once orders are available.',
  ],
  complaints: [
    'No customer concerns to review',
    'Customer reports and resolution details will appear here.',
  ],
  audit: ['No activity yet', 'Marketplace decisions and the people behind them will appear here.'],
}

export default function Records({
  view,
  data,
  onSelect,
}: {
  view: View
  data: DashboardData
  onSelect: (record: Selection) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const { columns, rows } = getRecords(view, data)
  const statuses = [...new Set(rows.map((row) => row.status))]
  const filtered = rows
    .filter(
      (row) =>
        (filter === 'all' || row.status === filter) &&
        row.search.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'oldest'
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
    )
  const hasFilters = query !== '' || filter !== 'all'
  const reset = () => {
    setQuery('')
    setFilter('all')
  }
  const [emptyTitle, emptyDescription] = emptyCopy[view] ?? [
    'No records yet',
    'Records will appear here.',
  ]

  return (
    <section className="panel records-panel" aria-label="Records">
      <div className="records-toolbar">
        <label className="search-field">
          <span className="sr-only">Search {view === 'audit' ? 'activity' : view}</span>
          <Input
            type="search"
            placeholder={`Search ${view === 'products' ? 'listings' : view === 'audit' ? 'activity' : view}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-controls">
          {view !== 'audit' && (
            <label>
              <span>Status</span>
              <NativeSelect
                aria-label="Filter by status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <NativeSelectOption value="all">All statuses</NativeSelectOption>
                {statuses.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {statusLabels[status] ?? status}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
          <label>
            <span>Sort by</span>
            <NativeSelect
              aria-label="Sort records"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <NativeSelectOption value="newest">Newest first</NativeSelectOption>
              <NativeSelectOption value="oldest">Oldest first</NativeSelectOption>
              <NativeSelectOption value="name">Name A–Z</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
      </div>
      {hasFilters && (
        <div className="filter-summary">
          <span role="status">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
          <Button variant="link" className="text-link" onClick={reset}>
            Clear filters
          </Button>
        </div>
      )}
      {filtered.length ? (
        <RecordTable
          columns={columns}
          rows={filtered}
          onSelect={onSelect}
          caption={`${view} records`}
        />
      ) : hasFilters ? (
        <EmptyState
          title="No matching records"
          description="Try a different search or clear your filters to see all records."
          action="Clear filters"
          onAction={reset}
        />
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
      <div className="table-footer">
        <span>
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </span>
      </div>
    </section>
  )
}
