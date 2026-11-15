import type {
  MarketplaceApplication,
  MarketplaceSeller,
  MarketplaceReport,
} from '@/lib/marketplace-admin'

export type ReviewRecord = MarketplaceApplication | MarketplaceSeller | MarketplaceReport
export type ReviewView = 'applications' | 'sellers' | 'complaints'
export type ReviewDecision = 'approved' | 'more-info' | 'rejected' | 'active' | 'suspended'

export const reviewCopy = {
  applications: {
    title: 'Application queue',
    singular: 'application',
    search: 'Search business, contact or area',
    empty: 'No applications yet',
    description: 'Applications from sellers will appear here for review.',
    statuses: ['pending', 'more-info', 'approved', 'rejected'],
  },
  sellers: {
    title: 'Seller directory',
    singular: 'seller',
    search: 'Search store name or area',
    empty: 'No sellers yet',
    description: 'Approved businesses appear here once their store is created.',
    statuses: ['active', 'suspended'],
  },
  complaints: {
    title: 'Customer reports',
    singular: 'report',
    search: 'Search reports or references',
    empty: 'No reports yet',
    description: 'Listing and order issues reported by customers will appear here.',
    statuses: ['open', 'resolved'],
  },
}

export function reviewTitle(row: ReviewRecord) {
  return 'businessName' in row
    ? row.businessName
    : 'name' in row
      ? row.name
      : row.orderId
        ? 'Order issue'
        : 'Listing report'
}
export function reviewSubtitle(row: ReviewRecord) {
  return 'contactName' in row
    ? `${row.contactName}${row.area ? ` · ${row.area}` : row.areaPlaceId ? ' · Location selected' : ''}`
    : 'area' in row
      ? row.area || (row.areaPlaceId ? 'Location selected' : '')
      : row.orderId
        ? `Order ${row.orderId}`
        : `Listing ${row.productId || 'not recorded'}`
}
export function reviewTime(row: ReviewRecord) {
  return 'updatedAt' in row ? row.updatedAt : 'createdAt' in row ? row.createdAt : ''
}
export function reviewDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not recorded'
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
export function matchesReview(row: ReviewRecord, query: string) {
  const text = [
    reviewTitle(row),
    reviewSubtitle(row),
    row.id,
    'email' in row
      ? `${row.email} ${row.phone}`
      : 'message' in row
        ? `${row.message} ${row.reporterUid} ${row.productId || ''} ${row.orderId || ''}`
        : row.description,
  ]
    .join(' ')
    .toLocaleLowerCase()
  return text.includes(query.trim().toLocaleLowerCase())
}

export const decisionCopy: Record<
  ReviewDecision,
  { label: string; title: string; description: string; success: string }
> = {
  approved: {
    label: 'Approve application',
    title: 'Approve this business?',
    description: 'Approves the seller application and unlocks My Store in their account.',
    success: 'Application approved.',
  },
  'more-info': {
    label: 'Request more information',
    title: 'Request an application update?',
    description: 'The applicant will see your message and can update their details and resubmit.',
    success: 'More information requested.',
  },
  rejected: {
    label: 'Reject application',
    title: 'Reject this application?',
    description: 'The application will be closed as rejected. The applicant will see your message.',
    success: 'Application rejected.',
  },
  suspended: {
    label: 'Suspend seller',
    title: 'Suspend this seller?',
    description:
      'Selling actions and new purchases from this store will be restricted. The seller can see your message.',
    success: 'Seller suspended.',
  },
  active: {
    label: 'Reactivate seller',
    title: 'Reactivate this seller?',
    description: 'Restores selling access for this store. The seller can see your message.',
    success: 'Seller reactivated.',
  },
}
