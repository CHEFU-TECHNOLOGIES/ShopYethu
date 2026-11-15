'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createMarketplaceStore } from '@/lib/marketplace-store'
import type { MarketplaceCollection, MarketplaceCollections } from '@/lib/marketplace-admin'

const Context = createContext<ReturnType<typeof createMarketplaceStore> | null>(null)

export function MarketplaceData({ children }: { children: ReactNode }) {
  const [store] = useState(createMarketplaceStore)
  return <Context.Provider value={store}>{children}</Context.Provider>
}

export function useMarketplaceCollection<K extends MarketplaceCollection>(key: K) {
  const store = useContext(Context)
  if (!store) throw new Error('Marketplace data must be used inside the dashboard.')
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.get(key),
    () => store.get(key),
  )
  useEffect(() => {
    void store.load(key)
  }, [store, key, state.status])
  return {
    ...state,
    loading: state.status === 'idle' || state.status === 'loading',
    refresh: () => {
      void store.load(key, true)
    },
    replace: (row: MarketplaceCollections[K]) => store.replace(key, row),
    invalidate: store.invalidate,
  }
}
