'use client'

import { useState } from 'react'
import {
  marketplaceAdmin,
  type MarketplaceApplication,
  type MarketplaceSeller,
} from '@/lib/marketplace-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarketplaceApplicationDetails } from './MarketplaceApplicationDetails'
import { useMarketplaceCollection } from './MarketplaceData'

export default function MarketplaceReviews({
  view,
}: {
  view: 'applications' | 'sellers' | 'complaints'
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const path = view === 'complaints' ? 'reports' : view
  const records = useMarketplaceCollection(path)
  const { rows, loading } = records
  const problem = error || records.error
  async function update(id: string, status: string) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const updated = await marketplaceAdmin<MarketplaceApplication | MarketplaceSeller>(
        `/${path}/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status, reason: reasons[id] || '' }),
        },
      )
      records.replace(updated)
      if (path === 'applications' && status === 'approved') records.invalidate('sellers')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="overview" aria-busy={loading || busy}>
      <div>
        <Button
          variant="outline"
          disabled={loading || busy}
          onClick={() => {
            setError('')
            records.refresh()
          }}
        >
          Refresh {view}
        </Button>
      </div>
      {loading && <p role="status">Loading marketplace records…</p>}
      {problem && <p role="alert">{problem}</p>}
      {!loading && !problem && !rows.length && (
        <div className="panel empty-state">
          <h3>No {view} yet</h3>
          <p>Records submitted from ShopYethu appear here.</p>
        </div>
      )}
      {rows.map((row) => (
        <article key={row.id} className="panel">
          <div className="panel-heading">
            <h2>
              {'businessName' in row
                ? row.businessName
                : 'name' in row
                  ? row.name
                  : `Report ${row.id}`}
            </h2>
            <span>{row.status}</span>
          </div>
          <div className="attention-item">
            {'contactName' in row && <MarketplaceApplicationDetails application={row} />}
            {'description' in row && (
              <>
                <p>{row.area}</p>
                <p>{row.description}</p>
                <p>{row.reason}</p>
              </>
            )}
            {'message' in row && (
              <>
                <p>{row.message}</p>
                <p>{row.orderId ? `Order: ${row.orderId}` : `Listing: ${row.productId}`}</p>
                <p>Reporter: {row.reporterUid}</p>
                <p>{new Date(row.createdAt).toLocaleString('en-ZA')}</p>
              </>
            )}
            {(('businessName' in row && ['pending', 'more-info'].includes(row.status)) ||
              'name' in row) && (
              <>
                <label>
                  <span>Customer-facing reason</span>
                  <Input
                    aria-label={`Customer-facing reason for ${row.id}`}
                    value={reasons[row.id] || ''}
                    onChange={(event) =>
                      setReasons((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                    disabled={busy}
                  />
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {'businessName' in row ? (
                    <>
                      <Button disabled={busy} onClick={() => void update(row.id, 'approved')}>
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || (reasons[row.id] || '').trim().length < 5}
                        onClick={() => void update(row.id, 'more-info')}
                      >
                        Request more information
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || (reasons[row.id] || '').trim().length < 5}
                        onClick={() => void update(row.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void update(row.id, row.status === 'active' ? 'suspended' : 'active')
                      }
                    >
                      {row.status === 'active' ? 'Suspend seller' : 'Reactivate seller'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}
