import { BrandLogo } from '@/components/brand-logo'
import { accountUrl } from '@/lib/auth/config'

export default function LoginPage() {
  return (
    <main className="not-found-page">
      <BrandLogo />
      <p className="eyebrow">Marketplace administration</p>
      <h1>Sign in to ShopYethu</h1>
      <p>Use your CheFu account to access your workspace. Administrator access is required.</p>
      <a className="button button--secondary" href={accountUrl('/login')}>
        Continue with CheFu
      </a>
      <a className="text-link" href={accountUrl('/login', true)}>
        Use another account
      </a>
    </main>
  )
}
