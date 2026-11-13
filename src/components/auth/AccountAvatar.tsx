'use client'

import { useState } from 'react'
import type { SavedAccount } from '@/lib/auth/account-sessions'

export function AccountAvatar({ account }: { account: SavedAccount }) {
  const [failed, setFailed] = useState<string | null>(null)
  const label = account.fullName?.trim() || account.email
  const picture = account.profilePicture
  return (
    <span className="account-avatar" aria-hidden="true">
      {picture && failed !== picture ? (
        <img src={picture} alt="" referrerPolicy="no-referrer" onError={() => setFailed(picture)} />
      ) : (
        label.charAt(0).toUpperCase()
      )}
    </span>
  )
}
