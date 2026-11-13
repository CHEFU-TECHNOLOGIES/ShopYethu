'use client'

import { ThemeSwitcher } from '@/components/theme-switcher'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { isView, navigation, type DashboardData, type Selection, type View } from './config'
import DetailsDialog from './DetailsDialog'
import Overview from './Overview'
import Records from './Records'

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [view, setView] = useState<View>('overview')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const data = initialData
  const current = navigation.find((item) => item.id === view)!

  useEffect(() => {
    const syncView = () => {
      const value = window.location.hash.slice(1)
      setView(isView(value) ? value : 'overview')
      setMenuOpen(false)
    }
    syncView()
    const navigate = () => {
      syncView()
      requestAnimationFrame(() => heading.current?.focus())
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [menuOpen])

  return (
    <div className="dashboard">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="wordmark" href="#overview" aria-label="ShopYethu overview">
          <BrandLogo />
          <span className="brand-caption">Marketplace administration</span>
        </a>
        <Button
          variant="outline"
          className="mobile-menu button button--secondary"
          ref={menuButton}
          aria-expanded={menuOpen}
          aria-controls="workspace-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Close menu' : 'Menu'}
        </Button>
        <div className={`sidebar-content ${menuOpen ? 'is-open' : ''}`}>
          <p className="nav-label">Workspace</p>
          <nav id="workspace-navigation" aria-label="Workspace">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => {
                  if (view === item.id) {
                    setMenuOpen(false)
                    heading.current?.focus()
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <p>ShopYethu Admin</p>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-header">
          <span>Marketplace operations</span>
          <div className="workspace-controls">
            <ThemeSwitcher />
          </div>
        </header>
        <main id="main-content" className="workspace-main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">Your marketplace</p>
              <h1 ref={heading} tabIndex={-1}>
                {current.label}
              </h1>
              <p className="page-description">{current.description}</p>
            </div>
          </div>
          {view === 'overview' ? (
            <Overview data={data} onSelect={setSelection} />
          ) : (
            <Records key={view} view={view} data={data} onSelect={setSelection} />
          )}
        </main>
      </div>
      {selection && <DetailsDialog record={selection} onClose={() => setSelection(null)} />}
    </div>
  )
}
