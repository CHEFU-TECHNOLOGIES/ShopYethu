import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

/**
 * Custom not-found page for the frontend.
 * This renders when `notFound()` is called from any page in the (frontend) route group.
 *
 * Customize this component to match your app's design and provide helpful navigation.
 */
export default function NotFound() {
  return (
    <main className="not-found-page">
      <Link href="/" aria-label="ShopYethu overview">
        <BrandLogo />
      </Link>
      <h1>This page isn’t here.</h1>
      <p>The address may have changed. Your workspace is still available.</p>
      <Link className="button button--secondary" href="/">
        Return to overview
      </Link>
    </main>
  )
}
