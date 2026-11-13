import { API_URL, APP_ID } from './config'

export type AccountUser = { uid: string; email: string; name: string }
export type SessionResult =
  | { status: 'authenticated'; user: AccountUser }
  | { status: 'anonymous' | 'forbidden' | 'unavailable' }

let inFlight: Promise<SessionResult> | null = null

// Share concurrent mounts (including React StrictMode) without caching completed
// authorization decisions. Cancelling one consumer must not restart the request.
export function getCentralSession(signal?: AbortSignal): Promise<SessionResult> {
  if (signal?.aborted) return Promise.resolve({ status: 'unavailable' })
  if (!inFlight) {
    const request = loadCentralSession()
    inFlight = request
    void request.then(() => {
      if (inFlight === request) inFlight = null
    })
  }
  const request = inFlight
  if (!signal) return request
  return new Promise((resolve) => {
    const cancel = () => resolve({ status: 'unavailable' })
    signal.addEventListener('abort', cancel, { once: true })
    void request.then((result) => {
      signal.removeEventListener('abort', cancel)
      resolve(signal.aborted ? { status: 'unavailable' } : result)
    })
  })
}

// The endpoint already identifies the app. Omitting custom headers lets this
// credentialed GET use normal CORS without an additional OPTIONS preflight.
async function loadCentralSession(): Promise<SessionResult> {
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/auth/shopyethu/session`, {
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
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
