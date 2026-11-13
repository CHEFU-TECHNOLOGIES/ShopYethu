import type {
  AuditEvent,
  Complaint,
  Order,
  Product,
  Seller,
  SellerApplication,
} from '@/types/marketplace'

export type DashboardData = {
  applications: SellerApplication[]
  sellers: Seller[]
  products: Product[]
  orders: Order[]
  complaints: Complaint[]
  auditEvents: AuditEvent[]
}

export const navigation = [
  { id: 'overview', label: 'Overview', description: 'The day-to-day health of your marketplace.' },
  {
    id: 'applications',
    label: 'Applications',
    description: 'Review the businesses looking to join ShopYethu.',
  },
  {
    id: 'sellers',
    label: 'Sellers',
    description: 'Your approved businesses and their storefronts.',
  },
  { id: 'products', label: 'Listings', description: 'Keep an eye on what is being sold.' },
  { id: 'orders', label: 'Orders', description: 'Follow purchases from placement to delivery.' },
  {
    id: 'complaints',
    label: 'Complaints',
    description: 'Customer concerns and the context behind them.',
  },
  { id: 'audit', label: 'Activity', description: 'A record of marketplace decisions.' },
] as const

export type View = (typeof navigation)[number]['id']
export type Selection = { title: string; reference: string; fields: [string, string][] }

export const statusLabels: Record<string, string> = {
  pending: 'Pending review',
  'more-info': 'Information requested',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  hidden: 'Hidden',
  suspended: 'Suspended',
  placed: 'Placed',
  accepted: 'Accepted',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function date(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'Not recorded'
    : new Intl.DateTimeFormat('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Johannesburg',
      }).format(parsed)
}

export function money(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value)
}

export function sellerName(value: Product['seller']) {
  return typeof value === 'string' ? 'Seller details unavailable' : value.businessName
}

export function isView(value: string): value is View {
  return navigation.some((item) => item.id === value)
}
