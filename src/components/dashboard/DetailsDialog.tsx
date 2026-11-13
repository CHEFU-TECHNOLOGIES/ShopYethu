import { Button } from '@/components/ui/button'
import { useEffect, useRef } from 'react'
import type { Selection } from './config'

export default function DetailsDialog({
  record,
  onClose,
}: {
  record: Selection
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      dialog?.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="details-dialog"
      aria-labelledby="detail-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="dialog-content">
        <header className="dialog-heading">
          <div>
            <p className="eyebrow">{record.reference}</p>
            <h2 id="detail-title">{record.title}</h2>
          </div>
          <Button
            variant="outline"
            autoFocus
            className="button button--secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </header>
        <dl className="detail-fields">
          {record.fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </dialog>
  )
}
