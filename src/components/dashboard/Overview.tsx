import { Button } from '@/components/ui/button'
import { date } from './config'
import { EmptyState, Panel, Status } from './ui'
import { useMarketplaceCollection } from './MarketplaceData'

export default function Overview() {
  const applications = useMarketplaceCollection('applications')
  const sellers = useMarketplaceCollection('sellers')
  const reports = useMarketplaceCollection('reports')
  const resources = [applications, sellers, reports]
  const loading = resources.some((resource) => resource.loading)
  const errors = resources
    .map((resource, index) =>
      resource.error ? `${['Applications', 'Sellers', 'Reports'][index]}: ${resource.error}` : '',
    )
    .filter(Boolean)
  const pending = applications.rows.filter((application) => application.status === 'pending')
  const requested = applications.rows.filter((application) => application.status === 'more-info')
  const queue = [...pending]
    .sort((a, b) =>
      (a.createdAt || a.history?.[0]?.at || a.updatedAt).localeCompare(
        b.createdAt || b.history?.[0]?.at || b.updatedAt,
      ),
    )
    .slice(0, 4)
  const openReports = reports.rows.filter((report) => report.status !== 'resolved')
  const metrics = [
    {
      label: 'Awaiting review',
      value: applications.status === 'ready' ? pending.length : '—',
      detail: 'Seller applications',
      view: 'applications',
    },
    {
      label: 'Information requested',
      value: applications.status === 'ready' ? requested.length : '—',
      detail: 'Waiting for applicants',
      view: 'applications',
    },
    {
      label: 'Active sellers',
      value:
        sellers.status === 'ready'
          ? sellers.rows.filter((seller) => seller.status === 'active').length
          : '—',
      detail: 'Approved businesses',
      view: 'sellers',
    },
    {
      label: 'Open reports',
      value: reports.status === 'ready' ? openReports.length : '—',
      detail: 'Listings and orders',
      view: 'complaints',
    },
  ]

  return (
    <div className="overview" aria-busy={loading}>
      <div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => resources.forEach((resource) => resource.refresh())}
        >
          Refresh overview
        </Button>
      </div>
      {loading && <p role="status">Loading marketplace overview…</p>}
      {errors.map((error) => (
        <p role="alert" key={error}>
          {error}
        </p>
      ))}
      <section className="metric-strip" aria-label="Marketplace summary">
        {metrics.map((metric) => (
          <a key={metric.label} href={`#${metric.view}`} className="metric">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-detail">{metric.detail}</span>
          </a>
        ))}
      </section>
      <Panel
        title="Applications to review"
        aside={
          <a className="text-link" href="#applications">
            All applications
          </a>
        }
      >
        {applications.loading ? (
          <p role="status">Loading applications…</p>
        ) : applications.error ? (
          <p>Applications could not be loaded. Use Refresh to try again.</p>
        ) : queue.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Applications awaiting review"
          >
            <table>
              <caption className="sr-only">Applications awaiting review, oldest first</caption>
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Location</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col">Review</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((application) => (
                  <tr key={application.id}>
                    <td data-label="Business">
                      <span className="cell-title">{application.businessName}</span>
                      <span className="cell-description">{application.contactName}</span>
                    </td>
                    <td data-label="Location">{application.area}</td>
                    <td data-label="Submitted">
                      {date(
                        application.createdAt ||
                          application.history?.[0]?.at ||
                          application.updatedAt,
                      )}
                    </td>
                    <td data-label="Status">
                      <Status value={application.status} />
                    </td>
                    <td className="table-action">
                      <a
                        className="text-link"
                        href="#applications"
                        aria-label={`Review ${application.businessName}`}
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No applications awaiting review"
            description="Submitted applications appear here when they are ready for review."
          />
        )}
        <div className="panel-footnote">
          Applications are shown oldest first within the loaded records.
        </div>
      </Panel>
      <Panel title="Needs attention">
        <div className="attention-item">
          <div>
            <h3>More information required</h3>
            <p>
              {applications.status === 'ready'
                ? `${requested.length} applications awaiting an applicant response.`
                : 'Application summary unavailable until records load.'}
            </p>
          </div>
          <a className="text-link" href="#applications">
            View applications
          </a>
        </div>
        <div className="attention-item">
          <div>
            <h3>Customer reports</h3>
            <p>
              {reports.status === 'ready'
                ? `${openReports.length} open listing or order reports.`
                : 'Report summary unavailable until records load.'}
            </p>
          </div>
          <a className="text-link" href="#complaints">
            View reports
          </a>
        </div>
      </Panel>
      <p className="page-description">
        Showing up to 100 records per section. Use Refresh to check for new submissions.
      </p>
    </div>
  )
}
