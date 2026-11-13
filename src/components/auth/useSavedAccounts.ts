'use client'

import { useEffect, useRef, useState } from 'react'
import {
  listSavedAccounts,
  removeSavedAccount,
  switchSavedAccount,
  type SavedAccount,
} from '@/lib/auth/account-sessions'
import type { AccountUser } from '@/lib/auth/session'

export function useSavedAccounts(user: AccountUser) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([
    { slot: null, email: user.email, fullName: user.name, active: true },
  ])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const loaded = useRef(false)
  const pending = useRef<Promise<void> | null>(null)
  const locked = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  function load(force = false) {
    if ((!force && loaded.current) || pending.current || locked.current) return
    setLoading(true)
    setError('')
    pending.current = listSavedAccounts()
      .then((result) => {
        if (!mounted.current) return
        if (result.some((account) => account.active && account.email !== user.email)) {
          window.location.reload()
          return
        }
        setAccounts(
          result.map((account) => (account.active ? { ...account, fullName: user.name } : account)),
        )
        loaded.current = true
      })
      .catch((cause) => {
        if (mounted.current)
          setError(cause instanceof Error ? cause.message : 'Unable to load your accounts.')
      })
      .finally(() => {
        pending.current = null
        if (mounted.current) setLoading(false)
      })
  }

  async function act(account: SavedAccount, action: 'switch' | 'remove') {
    if (locked.current || account.active || account.slot === null) return false
    locked.current = true
    setBusy(account.slot)
    setError('')
    try {
      if (action === 'switch') {
        await switchSavedAccount(account.slot)
        // Reload clears the old workspace; the central session gate checks the
        // new identity and administrator permissions before showing a dashboard.
        window.location.reload()
      } else {
        await removeSavedAccount(account.slot)
        if (mounted.current)
          setAccounts((current) => current.filter((item) => item.slot !== account.slot))
      }
      return true
    } catch (cause) {
      if (mounted.current)
        setError(cause instanceof Error ? cause.message : 'Unable to update your account.')
      return false
    } finally {
      locked.current = false
      if (mounted.current) setBusy(null)
    }
  }
  return { accounts, loading, busy, error, load, act }
}
