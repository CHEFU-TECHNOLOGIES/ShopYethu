import type { ReactNode } from 'react'
import {
  date,
  money,
  sellerName,
  statusLabels,
  type DashboardData,
  type Selection,
  type View,
} from './config'
import { Status } from './ui'

export type RecordRow = {
  id: string
  name: string
  search: string
  status: string
  createdAt: string
  cells: ReactNode[]
  detail: Selection
}

function business(name: string, description: string) {
  return (
    <>
      <span className="cell-title">{name}</span>
      <span className="cell-description">{description}</span>
    </>
  )
}

export function getRecords(
  view: View,
  data: DashboardData,
): { columns: string[]; rows: RecordRow[] } {
  switch (view) {
    case 'applications':
      return {
        columns: ['Business', 'Location', 'Submitted', 'Status'],
        rows: data.applications.map((item) => ({
          id: item.id,
          name: item.businessName,
          search: `${item.businessName} ${item.contactName} ${item.email} ${item.operatingArea} ${item.reference}`,
          status: item.status,
          createdAt: item.submittedAt,
          cells: [
            business(item.businessName, item.contactName),
            item.operatingArea,
            date(item.submittedAt),
            <Status key="status" value={item.status} />,
          ],
          detail: {
            title: item.businessName,
            reference: item.reference,
            fields: [
              ['Status', statusLabels[item.status]],
              ['Contact', item.contactName],
              ['Email', item.email],
              ['Phone', item.phone],
              ['Location', item.operatingArea],
              ['Business type', item.businessType],
              ['Submitted', date(item.submittedAt)],
              ['About the business', item.businessDescription],
              ['Proposed products', item.proposedProducts],
              ...(item.decisionMessage
                ? [['Latest message', item.decisionMessage] as [string, string]]
                : []),
            ],
          },
        })),
      }
    case 'sellers':
      return {
        columns: ['Business', 'Location', 'Approved', 'Status'],
        rows: data.sellers.map((item) => ({
          id: item.id,
          name: item.businessName,
          search: `${item.businessName} ${item.ownerName} ${item.email} ${item.operatingArea}`,
          status: item.status,
          createdAt: item.approvedAt,
          cells: [
            business(item.businessName, item.ownerName),
            item.operatingArea,
            date(item.approvedAt),
            <Status key="status" value={item.status} />,
          ],
          detail: {
            title: item.businessName,
            reference: 'Seller profile',
            fields: [
              ['Status', statusLabels[item.status]],
              ['Owner', item.ownerName],
              ['Email', item.email],
              ['Phone', item.phone],
              ['Location', item.operatingArea],
              ['Approved', date(item.approvedAt)],
              ['Storefront', item.storefrontSummary || 'No description provided'],
              ...(item.statusReason
                ? [['Account note', item.statusReason] as [string, string]]
                : []),
            ],
          },
        })),
      }
    case 'products':
      return {
        columns: ['Listing', 'Category', 'Price', 'Reports', 'Status'],
        rows: data.products.map((item) => ({
          id: item.id,
          name: item.name,
          search: `${item.name} ${sellerName(item.seller)} ${item.category}`,
          status: item.status,
          createdAt: item.createdAt,
          cells: [
            business(item.name, sellerName(item.seller)),
            item.category,
            money(item.price),
            item.reportCount || 'None',
            <Status key="status" value={item.status} />,
          ],
          detail: {
            title: item.name,
            reference: 'Listing details',
            fields: [
              ['Seller', sellerName(item.seller)],
              ['Status', statusLabels[item.status]],
              ['Category', item.category],
              ['Price', money(item.price)],
              ['Description', item.description],
              ['Customer reports', item.reportReason || 'No reports received'],
              ...(item.moderationReason
                ? [['Moderation note', item.moderationReason] as [string, string]]
                : []),
            ],
          },
        })),
      }
    case 'orders':
      return {
        columns: ['Order', 'Seller', 'Placed', 'Total', 'Status'],
        rows: data.orders.map((item) => ({
          id: item.id,
          name: item.reference,
          search: `${item.reference} ${item.customerName} ${item.customerEmail} ${sellerName(item.seller)}`,
          status: item.status,
          createdAt: item.createdAt,
          cells: [
            business(item.reference, item.customerName),
            sellerName(item.seller),
            date(item.createdAt),
            money(item.total),
            <Status key="status" value={item.status} />,
          ],
          detail: {
            title: item.reference,
            reference: 'Order details',
            fields: [
              ['Customer', item.customerName],
              ['Email', item.customerEmail],
              ['Seller', sellerName(item.seller)],
              ['Status', statusLabels[item.status]],
              ['Total', money(item.total)],
              [
                'Items',
                item.items
                  .map((line) => `${line.quantity} × ${line.name} (${money(line.price)} each)`)
                  .join('\n'),
              ],
              ['Internal notes', item.internalNotes || 'No notes added'],
            ],
          },
        })),
      }
    case 'complaints':
      return {
        columns: ['Concern', 'Customer', 'Priority', 'Status'],
        rows: data.complaints.map((item) => ({
          id: item.id,
          name: item.subject,
          search: `${item.reference} ${item.subject} ${item.customerName} ${sellerName(item.seller)}`,
          status: item.status,
          createdAt: item.createdAt,
          cells: [
            business(item.subject, item.reference),
            item.customerName,
            <Status key="priority" value={item.priority} />,
            <Status key="status" value={item.status} />,
          ],
          detail: {
            title: item.subject,
            reference: item.reference,
            fields: [
              ['Customer', item.customerName],
              ['Seller', sellerName(item.seller)],
              ['Status', statusLabels[item.status]],
              ['Priority', statusLabels[item.priority]],
              ['Customer concern', item.details],
              ['Resolution', item.resolution || 'Not yet resolved'],
            ],
          },
        })),
      }
    case 'audit':
      return {
        columns: ['Action', 'Record', 'Staff member', 'Date'],
        rows: data.auditEvents.map((item) => {
          const actor =
            typeof item.actor === 'string'
              ? 'Staff member'
              : item.actor.name || item.actor.email || 'Staff member'
          return {
            id: item.id,
            name: item.action,
            search: `${item.action} ${item.targetLabel} ${item.reason} ${actor}`,
            status: item.targetType,
            createdAt: item.createdAt,
            cells: [
              business(item.action, item.reason),
              item.targetLabel,
              actor,
              date(item.createdAt),
            ],
            detail: {
              title: item.action,
              reference: 'Activity details',
              fields: [
                ['Record', item.targetLabel],
                ['Staff member', actor],
                ['Date', date(item.createdAt)],
                ['Reason', item.reason],
              ],
            },
          }
        }),
      }
    default:
      return { columns: [], rows: [] }
  }
}
