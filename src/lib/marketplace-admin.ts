import { API_URL } from './auth/config'

export type MarketplaceApplication = {
  id: string; ownerUid: string; businessName: string; contactName: string; email: string;
  phone: string; area: string; plans: string; response: string;
  status: 'pending' | 'more-info' | 'approved' | 'rejected'; reason: string; updatedAt: string
  businessType?: 'individual' | 'registered-business'; categories?: string[];
  phoneConfirmed?: boolean; contactConfirmedAt?: string;
  collectionOffered?: boolean; collectionArea?: string; pickupHours?: string;
  createdAt?: string;
  history?: { status: MarketplaceApplication['status']; at: string; reason?: string; response?: string }[]
}
export type MarketplaceSeller = { id: string; name: string; area: string; description: string; status: 'active' | 'suspended'; reason: string }
export type MarketplaceReport = { id: string; reporterUid: string; productId?: string; orderId?: string; message: string; status: string; createdAt: string }
export async function marketplaceAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/shopyethu/admin${path}`, {
    ...options, credentials: 'include', cache: 'no-store',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    signal: options.signal || AbortSignal.timeout(10000),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(response.status === 404 ? 'Marketplace endpoints have not been deployed yet.' : data?.error || data?.message || 'Unable to complete this request.')
  return data as T
}
