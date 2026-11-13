import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'
import { statusLabels } from './config'

export function Status({ value }: { value: string }) {
  const tone = ['active', 'approved', 'delivered', 'resolved'].includes(value)
    ? 'positive'
    : ['suspended', 'hidden', 'rejected', 'high', 'cancelled'].includes(value)
      ? 'negative'
      : ['pending', 'open', 'investigating', 'more-info', 'placed'].includes(value)
        ? 'pending'
        : 'neutral'
  return (
    <span className={`record-status record-status--${tone}`}>{statusLabels[value] ?? value}</span>
  )
}

export function EmptyState({
  title,
  description,
  action,
  onAction,
}: {
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && onAction && (
        <Button variant="outline" className="button button--secondary" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

export function Panel({
  title,
  aside,
  children,
  className = '',
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
