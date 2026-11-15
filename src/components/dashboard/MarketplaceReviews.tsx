'use client'

import { useRef, useState } from 'react'
import { marketplaceAdmin, readMarketplaceCollection } from '@/lib/marketplace-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useMarketplaceCollection } from './MarketplaceData'
import { Status } from './ui'
import { ReviewRecordDetails } from './ReviewRecordDetails'
import { ReviewActions } from './ReviewActions'
import {
  decisionCopy,
  matchesReview,
  reviewCopy,
  reviewDate,
  reviewSubtitle,
  reviewTime,
  reviewTitle,
  type ReviewDecision,
  type ReviewView,
} from './review-records'
import { statusLabels } from './config'
import styles from './marketplace-reviews.module.css'

export default function MarketplaceReviews({ view }: { view: ReviewView }) {
  const path = view === 'complaints' ? 'reports' : view
  const records = useMarketplaceCollection(path)
  const { rows, loading } = records
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const toast = useToast()
  const lock = useRef(false),
    detail = useRef<HTMLHeadingElement>(null)
  const copy = reviewCopy[view]
  const filtered = rows
    .filter((row) => (filter === 'all' || row.status === filter) && matchesReview(row, query))
    .sort((a, b) => {
      if (view === 'applications') {
        const priority = (status: string) =>
          status === 'pending' ? 0 : status === 'more-info' ? 1 : 2
        const order = priority(a.status) - priority(b.status)
        if (order) return order
      }
      return (
        reviewTime(b).localeCompare(reviewTime(a)) || reviewTitle(a).localeCompare(reviewTitle(b))
      )
    })
  const selected = filtered.find((row) => row.id === selectedId) || filtered[0]
  function clearFilters() {
    setQuery('')
    setFilter('all')
  }
  function select(id: string) {
    if (busy) return
    setSelectedId(id)
    setError('')
    requestAnimationFrame(() =>
      detail.current?.focus({ preventScroll: window.matchMedia('(min-width: 1100px)').matches }),
    )
  }
  async function update(decision: ReviewDecision, reason: string) {
    if (lock.current || !selected || path === 'reports') return false
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const data = await marketplaceAdmin<unknown>(`/${path}/${encodeURIComponent(selected.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ status: decision, reason }),
      })
      const updated = readMarketplaceCollection(path, { [path]: [data] })[0]
      if (updated.id !== selected.id || updated.status !== decision)
        throw new Error(
          'The server returned an unexpected decision. Refresh to check the latest status.',
        )
      records.replace(updated)
      setSelectedId(selected.id)
      if (path === 'applications' && decision === 'approved') records.invalidate('sellers')
      toast({ title: decisionCopy[decision].success, description: reviewTitle(selected) })
      requestAnimationFrame(() => detail.current?.focus())
      return true
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Unable to save the decision. Please try again.'
      setError(message)
      toast({ title: 'Decision could not be saved', description: message, variant: 'destructive' })
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function refresh() {
    setError('')
    const result = await records.refresh()
    toast(
      result.error
        ? { title: 'Refresh failed', description: result.error, variant: 'destructive' }
        : {
            title: 'Records refreshed',
            description: `${result.rows.length} ${result.rows.length === 1 ? copy.singular : `${copy.singular}s`} available.`,
          },
    )
  }
  return (
    <section className={styles.root} aria-label={copy.title}>
      <div className={styles.toolbar}>
        <div>
          <h2>{copy.title}</h2>
          <p>
            {loading && !rows.length
              ? 'Loading records…'
              : `${rows.length} ${rows.length === 1 ? copy.singular : `${copy.singular}s`} loaded`}
          </p>
        </div>
        <Button variant="outline" disabled={loading || busy} onClick={() => void refresh()}>
          {loading ? 'Refreshing…' : 'Refresh records'}
        </Button>
      </div>
      <div className={styles.filters}>
        <label className={styles.search}>
          <span className="sr-only">{copy.search}</span>
          <Input
            type="search"
            placeholder={copy.search}
            value={query}
            disabled={busy}
            onChange={(event) => {
              setQuery(event.target.value)
              setError('')
            }}
          />
        </label>
        <div className={styles.filterTabs} aria-label="Filter by status">
          {['all', ...copy.statuses].map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              aria-pressed={filter === status}
              className={styles.filterTab}
              onClick={() => {
                setFilter(status)
                setError('')
              }}
            >
              {status === 'all' ? 'All' : statusLabels[status] || status}
              <span>
                {status === 'all'
                  ? rows.length
                  : rows.filter((row) => row.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      {records.error && (
        <div className={styles.error} role="alert">
          <strong>Records could not be loaded.</strong>
          <p>{records.error}</p>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            Try again
          </Button>
        </div>
      )}
      {loading && !rows.length ? (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading {view}…
        </div>
      ) : !records.error && !filtered.length ? (
        <div className={styles.empty}>
          <h3>{rows.length ? 'No matching records' : copy.empty}</h3>
          <p>
            {rows.length ? 'Try another search or choose a different status.' : copy.description}
          </p>
          {(query || filter !== 'all') && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        selected && (
          <div className={styles.workspace} aria-busy={busy || loading}>
            <aside className={styles.queue} aria-label={copy.title}>
              <p className={styles.queueCount}>
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </p>
              <ul>
                {filtered.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={selected.id === row.id}
                      aria-controls="review-detail"
                      className={styles.queueItem}
                      onClick={() => select(row.id)}
                    >
                      <span className={styles.queueName}>{reviewTitle(row)}</span>
                      <span className={styles.queueSubtitle}>{reviewSubtitle(row)}</span>
                      <span className={styles.queueMeta}>
                        <Status value={row.status} />
                        {reviewTime(row) && (
                          <span>{reviewDate(reviewTime(row)).split(',')[0]}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            <article
              id="review-detail"
              className={styles.detail}
              aria-labelledby="review-detail-title"
            >
              <header className={styles.detailHeader}>
                <div>
                  <p className={styles.eyebrow}>
                    {view === 'applications'
                      ? 'Seller application'
                      : view === 'sellers'
                        ? 'Seller profile'
                        : 'Customer report'}
                  </p>
                  <h2 id="review-detail-title" ref={detail} tabIndex={-1}>
                    {reviewTitle(selected)}
                  </h2>
                  <p>{reviewSubtitle(selected)}</p>
                </div>
                <Status value={selected.status} />
              </header>
              <ReviewRecordDetails key={selected.id} row={selected} />
              <ReviewActions
                key={`${selected.id}:${selected.status}`}
                row={selected}
                busy={busy || loading}
                error={error}
                onUpdate={update}
              />
              {'businessName' in selected &&
                !['pending', 'more-info'].includes(selected.status) && (
                  <p className={styles.closed}>
                    This application has been {selected.status}.{' '}
                    {selected.status === 'approved'
                      ? 'Manage storefront access in Sellers.'
                      : 'There are no further review actions for this application.'}
                  </p>
                )}
            </article>
          </div>
        )
      )}
      <p className={styles.footer}>
        Showing up to 100 records. Search and filters apply to the loaded records. Use Refresh to
        check for updates.
      </p>
    </section>
  )
}
