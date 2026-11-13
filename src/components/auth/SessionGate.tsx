'use client'

import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import Dashboard from '@/components/dashboard/Dashboard'
import { accountUrl } from '@/lib/auth/config'
import { getCentralSession, type SessionResult } from '@/lib/auth/session'
import type { DashboardData } from '@/components/dashboard/config'

export default function SessionGate({ initialData }: { initialData: DashboardData }) {
  const [session, setSession] = useState<SessionResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let pending: AbortController | null = null
    const check = async () => {
      pending?.abort()
      const controller = new AbortController()
      pending = controller
      setSession(null)
      const result = await getCentralSession(controller.signal)
      if (!active || controller.signal.aborted) return
      if (result.status === 'anonymous') {
        window.location.replace(accountUrl('/login'))
        return
      }
      setSession(result)
    }
    void check()
    return () => {
      active = false
      pending?.abort()
    }
  }, [attempt])

  if (session?.status === 'authenticated')
    return <Dashboard user={session.user} initialData={initialData} />
  const forbidden = session?.status === 'forbidden'
  return (
    <main className="not-found-page">
      <BrandLogo />
      <h1>
        {!session
          ? 'Checking your session'
          : forbidden
            ? 'Administrator access required'
            : 'Unable to check your session'}
      </h1>
      <p role="status">
        {!session
          ? 'Connecting to your account.'
          : forbidden
            ? 'Your account does not have administrator access to ShopYethu.'
            : 'The account service could not be reached. Please try again.'}
      </p>
      {session && (
        <button className="button button--secondary" onClick={() => setAttempt(attempt + 1)}>
          Try again
        </button>
      )}
      {session && (
        <a className="text-link" href={accountUrl('/login', true)}>
          Use another account
        </a>
      )}
    </main>
  )
}
