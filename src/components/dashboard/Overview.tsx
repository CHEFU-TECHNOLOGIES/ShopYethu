import { date, type DashboardData, type Selection, type View } from './config'
import { getRecords } from './record-data'
import { RecordTable } from './Records'
import { EmptyState, Panel } from './ui'

export default function Overview({
  data,
  onSelect,
}: {
  data: DashboardData
  onSelect: (record: Selection) => void
}) {
  const pending = data.applications.filter((application) => application.status === 'pending')
  const concerns = data.complaints.filter((complaint) => complaint.status !== 'resolved')
  const reports = data.products.filter(
    (product) => product.reportCount > 0 && product.status !== 'hidden',
  )
  const queue = getRecords('applications', { ...data, applications: pending })
    .rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 4)
  const metrics: { label: string; value: number; detail: string; view: View }[] = [
    {
      label: 'Awaiting review',
      value: pending.length,
      detail: 'Seller applications',
      view: 'applications',
    },
    {
      label: 'Active sellers',
      value: data.sellers.filter((seller) => seller.status === 'active').length,
      detail: 'Approved businesses',
      view: 'sellers',
    },
    {
      label: 'Reported listings',
      value: reports.length,
      detail: 'Listings to look into',
      view: 'products',
    },
    {
      label: 'Open complaints',
      value: concerns.length,
      detail: 'Customer concerns',
      view: 'complaints',
    },
  ]

  return (
    <div className="overview">
      <section className="metric-strip" aria-label="Marketplace summary">
        {metrics.map((metric) => (
          <a key={metric.label} href={`#${metric.view}`} className="metric">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-detail">{metric.detail}</span>
          </a>
        ))}
      </section>

      <div className="overview-grid">
        <Panel
          title="Applications to review"
          aside={
            <a className="text-link" href="#applications">
              All applications
            </a>
          }
        >
          {queue.length ? (
            <RecordTable
              columns={['Business', 'Location', 'Submitted', 'Status']}
              rows={queue}
              onSelect={onSelect}
              caption="Applications awaiting review, oldest first"
            />
          ) : (
            <EmptyState
              title="No applications awaiting review"
              description="When a business applies to sell, you’ll find their application here."
            />
          )}
          <div className="panel-footnote">Applications are shown oldest first.</div>
        </Panel>

        <Panel title="Needs attention" className="attention-panel">
          <div className="attention-item">
            <div>
              <h3>Listing reports</h3>
              <p>
                {reports.length
                  ? `${reports.length} listing needs a closer look.`
                  : 'No reported listings to review.'}
              </p>
            </div>
            <a className="text-link" href="#products">
              Review listings
            </a>
          </div>
          <div className="attention-item">
            <div>
              <h3>Customer concerns</h3>
              <p>
                {concerns.length
                  ? `${concerns.length} customer concern awaiting resolution.`
                  : 'No open customer concerns.'}
              </p>
            </div>
            <a className="text-link" href="#complaints">
              View complaints
            </a>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent activity"
        aside={
          <a href="#audit" className="text-link">
            All activity
          </a>
        }
      >
        {data.auditEvents.length ? (
          <div className="activity-list">
            {data.auditEvents.slice(0, 4).map((event) => (
              <div className="activity-row" key={event.id}>
                <div>
                  <h3>{event.action}</h3>
                  <p>{event.targetLabel}</p>
                </div>
                <p className="activity-reason">{event.reason}</p>
                <time dateTime={event.createdAt}>{date(event.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="activity-empty">
            <p>No activity recorded yet.</p>
            <span>Reviews and marketplace decisions will appear here.</span>
          </div>
        )}
      </Panel>
    </div>
  )
}
