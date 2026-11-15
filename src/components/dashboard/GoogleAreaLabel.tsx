'use client'

import { useEffect, useState } from 'react'
import { resolveMarketplaceArea } from '@/lib/marketplace-admin'
import styles from './review-details.module.css'

export function GoogleAreaLabel({
  area,
  placeId,
}: {
  area: string
  placeId?: string
}) {
  const [result, setResult] = useState<{
    placeId: string
    label?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    if (!placeId || area) return
    const controller = new AbortController()
    void resolveMarketplaceArea(placeId, controller.signal)
      .then((label) => {
        if (!controller.signal.aborted) setResult({ placeId, label })
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            placeId,
            error: cause instanceof Error ? cause.message : 'Location could not be loaded.',
          })
      })
    return () => controller.abort()
  }, [area, placeId])

  if (!placeId) return <>{area || 'Not provided'}</>
  const current = result?.placeId === placeId ? result : null
  const label = area || current?.label || current?.error || 'Loading location…'
  return (
    <>
      {label}
      <small className={styles.googleAttribution}>Google Maps</small>
    </>
  )
}
