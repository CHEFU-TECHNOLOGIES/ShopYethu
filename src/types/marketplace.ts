export interface Admin {
  id: string
  name?: string | null
  role: 'admin' | 'reviewer' | 'moderator' | 'support'
  email?: string | null
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface SellerApplication {
  id: string
  reference: string
  businessName: string
  contactName: string
  email: string
  phone: string
  operatingArea: string
  businessType: 'Sole trader' | 'Limited company' | 'Partnership'
  proposedProducts: string
  businessDescription: string
  submittedAt: string
  status: 'pending' | 'more-info' | 'approved' | 'rejected'
  decisionMessage?: string | null
  reviewedAt?: string | null
  reviewedBy?: (string | null) | Admin
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface Seller {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  operatingArea: string
  status: 'active' | 'suspended'
  statusReason?: string | null
  approvedAt: string
  application: string | SellerApplication
  storefrontSummary?: string | null
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  seller: string | Seller
  category: 'Food' | 'Home' | 'Beauty' | 'Fashion' | 'Crafts'
  price: number
  description: string
  status: 'active' | 'hidden'
  reportCount: number
  reportReason?: string | null
  moderationReason?: string | null
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface Order {
  id: string
  reference: string
  seller: string | Seller
  customerName: string
  customerEmail: string
  items: {
    name: string
    quantity: number
    price: number
    id?: string | null
  }[]
  total: number
  status: 'placed' | 'accepted' | 'dispatched' | 'delivered' | 'cancelled' | 'refunded'
  statusHistory?:
    | {
        status: string
        at: string
        note?: string | null
        id?: string | null
      }[]
    | null
  internalNotes?: string | null
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface Complaint {
  id: string
  reference: string
  subject: string
  customerName: string
  seller: string | Seller
  order?: (string | null) | Order
  details: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'investigating' | 'resolved'
  resolution?: string | null
  internalNotes?: string | null
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}

export interface AuditEvent {
  id: string
  action: string
  targetType: 'application' | 'seller' | 'product' | 'order' | 'complaint'
  targetId: string
  targetLabel: string
  reason: string
  actor: string | Admin
  createdBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedBy?: {
    relationTo: 'admins'
    value: string | Admin
  } | null
  updatedAt: string
  createdAt: string
}
