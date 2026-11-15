import type { ReactNode } from 'react'
import type { MarketplaceApplication } from '@/lib/marketplace-admin'
import { reviewDate } from './review-records'
import { Status } from './ui'
import styles from './review-details.module.css'

export function ReviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || 'Not provided'}</dd>
    </div>
  )
}

export function MarketplaceApplicationDetails({
  application,
}: {
  application: MarketplaceApplication
}) {
  const history = application.history?.length
    ? application.history
    : [{ status: application.status, at: application.updatedAt, reason: application.reason }]
  return (
    <div className={styles.details}>
      <section className={styles.section}>
        <h3>Business details</h3>
        <dl className={styles.fields}>
          <ReviewField label="Business type">
            {application.businessType === 'individual'
              ? 'Individual / sole trader'
              : application.businessType === 'registered-business'
                ? 'Registered business'
                : null}
          </ReviewField>
          <ReviewField label="Operating area">{application.area}</ReviewField>
          <ReviewField label="First submitted">
            {application.createdAt
              ? reviewDate(application.createdAt)
              : 'Not recorded for this application'}
          </ReviewField>
          <ReviewField label="Last updated">{reviewDate(application.updatedAt)}</ReviewField>
        </dl>
        <div className={styles.description}>
          <h4>Products they plan to sell</h4>
          <p>{application.plans}</p>
        </div>
        {!!application.categories?.length && (
          <ul className={styles.categories} aria-label="Product categories">
            {application.categories.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
        )}
      </section>
      <section className={styles.section}>
        <h3>Contact information</h3>
        <dl className={styles.fields}>
          <ReviewField label="Contact person">{application.contactName}</ReviewField>
          <ReviewField label="Email address">
            <a href={`mailto:${application.email}`}>{application.email}</a>
          </ReviewField>
          <ReviewField label="Contact number">
            <a href={`tel:${application.phone.replace(/[^+\d]/g, '')}`}>{application.phone}</a>
          </ReviewField>
          <ReviewField label="Number confirmation">
            {application.phoneConfirmed ? 'Confirmed by applicant' : 'Not recorded'}
          </ReviewField>
        </dl>
        {application.phoneConfirmed && (
          <p className={styles.note}>
            The applicant confirmed this is their business contact number
            {application.contactConfirmedAt
              ? ` on ${reviewDate(application.contactConfirmedAt)}`
              : ''}
            . This is not SMS verification.
          </p>
        )}
      </section>
      <section className={styles.section}>
        <h3>Customer collection</h3>
        {typeof application.collectionOffered === 'boolean' ? (
          application.collectionOffered ? (
            <dl className={styles.fields}>
              <ReviewField label="Pickup area">{application.collectionArea}</ReviewField>
              <ReviewField label="Pickup hours">{application.pickupHours}</ReviewField>
            </dl>
          ) : (
            <p className={styles.bodyText}>This business does not offer collection.</p>
          )
        ) : (
          <p className={styles.note}>Collection details were not recorded for this application.</p>
        )}
      </section>
      {(application.response || application.reason) && (
        <section className={styles.section}>
          <h3>Latest correspondence</h3>
          {application.reason && (
            <div className={styles.message}>
              <h4>Message from the review team</h4>
              <p>{application.reason}</p>
            </div>
          )}
          {application.response && (
            <div className={styles.message}>
              <h4>Applicant’s response</h4>
              <p>{application.response}</p>
            </div>
          )}
        </section>
      )}
      <details className={styles.history}>
        <summary>
          Application history{' '}
          <span>
            {history.length} {history.length === 1 ? 'update' : 'updates'}
          </span>
        </summary>
        {!application.history?.length && (
          <p className={styles.note}>Only the latest recorded update is available.</p>
        )}
        <ol className={styles.timeline}>
          {[...history].reverse().map((event, index) => (
            <li key={`${event.at}:${index}`}>
              <div className={styles.eventHeading}>
                <Status value={event.status} />
                <time>{reviewDate(event.at)}</time>
              </div>
              {event.reason && (
                <p>
                  <strong>Review team:</strong> {event.reason}
                </p>
              )}
              {event.response && (
                <p>
                  <strong>Applicant:</strong> {event.response}
                </p>
              )}
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}
