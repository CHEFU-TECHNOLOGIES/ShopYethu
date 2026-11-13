'use client'

import { useEffect, useRef } from 'react'
import type { SavedAccount } from '@/lib/auth/account-sessions'

export type AccountConfirmationAction =
  | { kind: 'signout' }
  | { kind: 'remove'; account: SavedAccount }

export function AccountConfirmation({
  action,
  onCancel,
  onConfirm,
}: {
  action: AccountConfirmationAction
  onCancel: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const remove = action.kind === 'remove'
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => {
      dialog?.close()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="account-confirmation"
      aria-labelledby="account-confirmation-title"
      aria-describedby="account-confirmation-description"
      onCancel={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <h2 id="account-confirmation-title">
        {remove ? 'Remove saved account?' : 'Sign out of all accounts?'}
      </h2>
      <p id="account-confirmation-description">
        {remove
          ? `Remove ${action.account.email} from this browser's saved sign-ins? Their account and sessions on other devices will stay unchanged.`
          : 'This removes all saved sign-ins from this browser. Your current account will also be signed out of other sessions and connected apps. Other saved accounts stay signed in on their other devices.'}
      </p>
      <div className="account-confirmation-actions">
        <button type="button" className="button button--secondary" autoFocus onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="button account-danger-button" onClick={onConfirm}>
          {remove ? 'Remove saved account' : 'Sign out of all accounts'}
        </button>
      </div>
    </dialog>
  )
}
