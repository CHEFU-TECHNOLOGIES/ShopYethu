import { API_URL } from './config'

export type SavedAccount = {
  slot: number | null
  email: string
  fullName?: string
  profilePicture?: string
  active: boolean
}

async function accountRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.error || data?.message
    throw new Error(
      typeof message === 'string' ? message : 'Unable to update your accounts. Please try again.',
    )
  }
  return data
}

export async function listSavedAccounts(): Promise<SavedAccount[]> {
  const data = await accountRequest('/auth/accounts')
  if (
    !Array.isArray(data?.accounts) ||
    !data.accounts.every(
      (account: SavedAccount) =>
        account &&
        typeof account.email === 'string' &&
        typeof account.active === 'boolean' &&
        (account.slot === null ||
          (Number.isInteger(account.slot) && account.slot >= 0 && account.slot < 8)),
    )
  ) {
    throw new Error('Unable to load your saved accounts. Please try again.')
  }
  return data.accounts.map((account: SavedAccount) => ({
    slot: account.slot,
    email: account.email,
    active: account.active,
    fullName: typeof account.fullName === 'string' ? account.fullName : undefined,
    profilePicture: typeof account.profilePicture === 'string' ? account.profilePicture : undefined,
  }))
}

function validSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 8) throw new Error('Invalid saved account.')
}

export async function switchSavedAccount(slot: number) {
  validSlot(slot)
  const data = await accountRequest('/auth/accounts/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot }),
  })
  if (data?.ok !== true) throw new Error('The server could not confirm the account switch.')
}

export async function removeSavedAccount(slot: number) {
  validSlot(slot)
  const data = await accountRequest(`/auth/accounts/${slot}`, { method: 'DELETE' })
  if (data?.ok !== true) throw new Error('The server could not confirm account removal.')
}
