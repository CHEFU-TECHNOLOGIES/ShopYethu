import type { ReviewRecord } from './review-records'
import { reviewDate } from './review-records'
import { MarketplaceApplicationDetails, ReviewField } from './MarketplaceApplicationDetails'
import styles from './review-details.module.css'
import { GoogleAreaLabel } from './GoogleAreaLabel'

export function ReviewRecordDetails({ row }: { row: ReviewRecord }) {
  if ('businessName' in row) return <MarketplaceApplicationDetails application={row} />
  if ('name' in row)
    return (
      <div className={styles.details}>
        <section className={styles.section}>
          <h3>Storefront</h3>
          <dl className={styles.fields}>
            <ReviewField label="Store name">{row.name}</ReviewField>
            <ReviewField label="Operating area">
              <GoogleAreaLabel area={row.area} placeId={row.areaPlaceId} />
            </ReviewField>
          </dl>
          <div className={styles.description}>
            <h4>About the business</h4>
            <p>{row.description || 'No description provided.'}</p>
          </div>
        </section>
        {row.reason && (
          <section className={styles.section}>
            <h3>Current message to seller</h3>
            <p className={styles.bodyText}>{row.reason}</p>
          </section>
        )}
      </div>
    )
  return (
    <div className={styles.details}>
      <section className={styles.section}>
        <h3>Reported issue</h3>
        <p className={styles.bodyText}>{row.message}</p>
      </section>
      <section className={styles.section}>
        <h3>Report details</h3>
        <dl className={styles.fields}>
          <ReviewField label="Report type">
            {row.orderId ? 'Order issue' : 'Listing report'}
          </ReviewField>
          <ReviewField label="Received">{reviewDate(row.createdAt)}</ReviewField>
          {row.orderId && <ReviewField label="Order reference">{row.orderId}</ReviewField>}
          {row.productId && <ReviewField label="Listing reference">{row.productId}</ReviewField>}
          <ReviewField label="Reporter account ID">{row.reporterUid}</ReviewField>
          <ReviewField label="Report reference">{row.id}</ReviewField>
        </dl>
      </section>
      <p className={styles.note}>
        This report is available for staff follow-up. Report resolution actions are not available
        here yet.
      </p>
    </div>
  )
}
