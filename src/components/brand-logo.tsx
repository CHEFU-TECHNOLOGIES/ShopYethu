import Image from 'next/image'

export function BrandLogo() {
  return (
    <span className="brand-logo">
      <Image
        className="brand-logo-light"
        src="/ShopYethu-Website-Logo.svg"
        alt="ShopYethu"
        width={455}
        height={104}
        unoptimized
        priority
      />
      <Image
        className="brand-logo-dark"
        src="/ShopYethu-Website-Logo-dark.svg"
        alt="ShopYethu"
        width={455}
        height={104}
        unoptimized
        priority
      />
    </span>
  )
}
