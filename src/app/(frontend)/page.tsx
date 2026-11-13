import SessionGate from '@/components/auth/SessionGate'

export default function HomePage() {
  return (
    <SessionGate
      initialData={{
        applications: [],
        sellers: [],
        products: [],
        orders: [],
        complaints: [],
        auditEvents: [],
      }}
    />
  )
}
