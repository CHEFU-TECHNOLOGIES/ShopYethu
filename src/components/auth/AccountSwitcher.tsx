'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { AccountUser } from '@/lib/auth/session'
import { accountUrl } from '@/lib/auth/config'
import { AccountAvatar } from './AccountAvatar'
import { AccountIcon } from './AccountIcon'
import { AccountConfirmation, type AccountConfirmationAction } from './AccountConfirmation'
import { useSavedAccounts } from './useSavedAccounts'

export default function AccountSwitcher({ user }: { user: AccountUser }) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<AccountConfirmationAction | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const id = useId()
  const { accounts, loading, busy, error, load, act } = useSavedAccounts(user)
  const active = accounts.find((account) => account.active) || {
    slot: null,
    email: user.email,
    fullName: user.name,
    active: true,
  }
  const disabled = busy !== null

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  return (
    <div
      className="account-switcher"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open && !confirmation) {
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="account-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        onClick={() => {
          if (!open) load()
          setOpen(!open)
        }}
      >
        <AccountAvatar account={active} />
        <span className="account-details">
          <span className="account-name">Account</span>
          <span className="account-email" title={user.email}>
            {user.email}
          </span>
        </span>
        <span className={open ? 'account-chevron is-open' : 'account-chevron'}>
          <AccountIcon name="chevron" />
        </span>
      </button>

      {open && (
        <div
          id={id}
          className="account-popover"
          role="dialog"
          aria-label="Account switcher"
          aria-busy={disabled}
        >
          <div className="account-popover-heading">
            <span>Choose an account</span>
            <button
              type="button"
              ref={closeButton}
              className="account-icon-button"
              aria-label="Close account switcher"
              onClick={close}
            >
              <AccountIcon name="close" />
            </button>
          </div>
          <div className="account-list">
            {accounts.map((account) => (
              <div
                key={`${account.slot}-${account.email}`}
                className={`account-row${account.active ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  className="account-choice"
                  disabled={disabled || account.active || account.slot === null}
                  aria-current={account.active ? 'true' : undefined}
                  onClick={() => void act(account, 'switch')}
                >
                  <AccountAvatar account={account} />
                  <span className="account-details">
                    <span className="account-name" title={account.fullName || account.email}>
                      {account.fullName?.trim() || account.email.split('@')[0]}
                    </span>
                    <span className="account-email" title={account.email}>
                      {account.email}
                    </span>
                  </span>
                  {account.active && (
                    <span className="account-current-dot" aria-label="Current account" />
                  )}
                  {busy !== null && busy === account.slot && (
                    <span className="account-progress" aria-label="Updating account" />
                  )}
                </button>
                {!account.active && account.slot !== null && (
                  <button
                    type="button"
                    className="account-icon-button"
                    disabled={disabled}
                    aria-label={`Remove saved account ${account.email}`}
                    onClick={() => setConfirmation({ kind: 'remove', account })}
                  >
                    <AccountIcon name="close" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {loading && (
            <p className="account-notice" role="status">
              Loading saved accounts…
            </p>
          )}
          {error && (
            <div className="account-notice" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="text-link"
                disabled={loading || disabled}
                onClick={() => load(true)}
              >
                Refresh accounts
              </button>
            </div>
          )}
          <div className="account-actions">
            <a
              href={accountUrl('/account')}
              className="account-action"
              aria-disabled={disabled}
              onClick={(event) => {
                if (disabled) event.preventDefault()
              }}
            >
              <AccountIcon name="settings" />
              Manage account
            </a>
            <a
              href={accountUrl('/login', true)}
              className="account-action"
              aria-disabled={disabled}
              onClick={(event) => {
                if (disabled) event.preventDefault()
              }}
            >
              <AccountIcon name="plus" />
              Add another account
            </a>
            <button
              type="button"
              className="account-action account-signout"
              disabled={disabled}
              onClick={() => setConfirmation({ kind: 'signout' })}
            >
              <AccountIcon name="logout" />
              Sign out of all accounts
            </button>
          </div>
        </div>
      )}

      {confirmation && (
        <AccountConfirmation
          action={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const action = confirmation
            setConfirmation(null)
            if (action.kind === 'signout') window.location.assign(accountUrl('/logout'))
            else void act(action.account, 'remove')
          }}
        />
      )}
    </div>
  )
}
