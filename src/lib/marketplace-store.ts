import {
  marketplaceAdmin,
  readMarketplaceCollection,
  type MarketplaceCollection,
  type MarketplaceCollections,
} from './marketplace-admin'

type State<T> = { rows: T[]; status: 'idle' | 'loading' | 'ready' | 'error'; error: string }
type RecordValue = MarketplaceCollections[MarketplaceCollection]
type Entry = { state: State<RecordValue>; pending?: Promise<void>; version: number }

// One store per signed-in dashboard. Views share results; only Refresh rereads them.
export function createMarketplaceStore() {
  const entries = new Map<MarketplaceCollection, Entry>()
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  function entry(key: MarketplaceCollection) {
    if (!entries.has(key))
      entries.set(key, { state: { rows: [], status: 'idle', error: '' }, version: 0 })
    return entries.get(key)!
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    get<K extends MarketplaceCollection>(key: K) {
      return entry(key).state as State<MarketplaceCollections[K]>
    },
    load(key: MarketplaceCollection, refresh = false): Promise<void> {
      const current = entry(key)
      if (current.pending) return current.pending
      if (!refresh && current.state.status !== 'idle') return Promise.resolve()
      const version = current.version
      current.state = { ...current.state, status: 'loading', error: '' }
      const pending = Promise.resolve().then(async () => {
        try {
          const rows = readMarketplaceCollection(key, await marketplaceAdmin<unknown>(`/${key}`))
          if (current.version === version) current.state = { rows, status: 'ready', error: '' }
        } catch (cause) {
          if (current.version === version)
            current.state = {
              rows: [],
              status: 'error',
              error: cause instanceof Error ? cause.message : 'Unable to load marketplace records.',
            }
        } finally {
          if (current.pending === pending) current.pending = undefined
          emit()
        }
      })
      current.pending = pending
      emit()
      return pending
    },
    replace<K extends MarketplaceCollection>(key: K, row: MarketplaceCollections[K]) {
      const current = entry(key)
      current.version++
      current.pending = undefined
      current.state = {
        rows: current.state.rows.map((item) => (item.id === row.id ? row : item)),
        status: 'ready',
        error: '',
      }
      emit()
    },
    invalidate(key: MarketplaceCollection) {
      const current = entry(key)
      current.version++
      current.pending = undefined
      current.state = { rows: [], status: 'idle', error: '' }
      emit()
    },
  }
}
