import { API_URL, APP_ID } from './config'

export type AccountUser = { uid: string; email: string; name: string }
export type SessionResult =
  | { status: 'authenticated'; user: AccountUser }
  | { status: 'anonymous' | 'forbidden' | 'unavailable' }

// Send the existing central HTTP-only cookie to the backend. ShopYethu never
// creates a session or stores credentials itself.
export async function getCentralSession(signal?: AbortSignal): Promise<SessionResult> {
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/auth/shopyethu/session`, {
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      headers: { 'x-chefu-app': APP_ID },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
        : AbortSignal.timeout(8000),
    })
    if (response.status === 401) return { status: 'anonymous' }
    if (response.status === 403) return { status: 'forbidden' }
    if (!response.ok) return { status: 'unavailable' }
    const data = await response.json()
    const user = data?.user
    if (
      data?.app !== APP_ID ||
      typeof user?.uid !== 'string' ||
      !user.uid ||
      typeof user.email !== 'string' ||
      !user.email ||
      typeof user.name !== 'string'
    ) {
      return { status: 'unavailable' }
    }
    return { status: 'authenticated', user: { uid: user.uid, email: user.email, name: user.name } }
  } catch {
    return { status: 'unavailable' }
  }
}
