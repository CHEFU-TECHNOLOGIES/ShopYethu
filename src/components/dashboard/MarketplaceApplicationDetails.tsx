import type { MarketplaceApplication } from "@/lib/marketplace-admin";

const labels = {
    pending: "Pending review",
    "more-info": "More information required",
    approved: "Approved",
    rejected: "Rejected",
};
const date = (value: string) => new Date(value).toLocaleString("en-ZA");

export function MarketplaceApplicationDetails({
    application,
}: {
    application: MarketplaceApplication;
}) {
    const history = application.history?.length
        ? application.history
        : [
              {
                  status: application.status,
                  at: application.updatedAt,
                  reason: application.reason,
              },
          ];
    return (
        <div
            style={{
                display: "grid",
                gap: 12,
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
            }}
        >
            <div>
                <p>
                    {application.contactName} · {application.email} ·{" "}
                    {application.phone}
                </p>
                {application.phoneConfirmed && (
                    <p>
                        Contact number confirmed by applicant
                        {application.contactConfirmedAt
                            ? ` on ${date(application.contactConfirmedAt)}`
                            : ""}
                        .
                    </p>
                )}
                <p>Operating area: {application.area}</p>
                {application.businessType && (
                    <p>
                        Business type:{" "}
                        {application.businessType === "individual"
                            ? "Individual / sole trader"
                            : "Registered business"}
                    </p>
                )}
                {!!application.categories?.length && (
                    <p>Categories: {application.categories.join(", ")}</p>
                )}
                <p>{application.plans}</p>
            </div>
            {typeof application.collectionOffered === "boolean" && (
                <div>
                    <p>
                        {application.collectionOffered
                            ? `Collection offered in ${application.collectionArea}`
                            : "No collection offered"}
                    </p>
                    {application.collectionOffered && (
                        <p>Pickup hours: {application.pickupHours}</p>
                    )}
                </div>
            )}
            {application.response && (
                <p>Latest applicant response: {application.response}</p>
            )}
            {application.reason && (
                <p>Latest customer-facing message: {application.reason}</p>
            )}
            <details>
                <summary style={{ cursor: "pointer", paddingBlock: 8 }}>
                    Application updates
                </summary>
                {application.createdAt && (
                    <p>First submitted: {date(application.createdAt)}</p>
                )}
                {!application.history?.length && (
                    <p>Showing the latest recorded update.</p>
                )}
                <ol style={{ paddingLeft: 20 }}>
                    {[...history].reverse().map((event, index) => (
                        <li
                            key={`${event.at}:${index}`}
                            style={{ marginBlock: 12 }}
                        >
                            <p>
                                <strong>{labels[event.status]}</strong> ·{" "}
                                {date(event.at)}
                            </p>
                            {event.reason && <p>{event.reason}</p>}
                            {event.response && (
                                <p>Applicant response: {event.response}</p>
                            )}
                        </li>
                    ))}
                </ol>
            </details>
        </div>
    );
}
