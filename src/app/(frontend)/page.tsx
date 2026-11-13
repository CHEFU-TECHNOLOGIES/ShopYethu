import Dashboard from '@/components/dashboard/Dashboard'

export default function HomePage() {
  return (
    <Dashboard
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
