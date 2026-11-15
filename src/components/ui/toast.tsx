'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import styles from './toast.module.css'

type ToastInput = { title: string; description?: string; variant?: 'default' | 'destructive' }
type Toast = ToastInput & { id: number }
const Context = createContext<((input: ToastInput) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const sequence = useRef(0)
  const dismiss = useCallback(
    (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  )
  const toast = useCallback((input: ToastInput) => {
    const item = { ...input, id: ++sequence.current }
    setItems((current) => [...current.slice(-2), item])
  }, [])
  return (
    <Context.Provider value={toast}>
      {children}
      <div className={styles.viewport} aria-label="Notifications">
        {items.map((item) => (
          <ToastMessage key={item.id} item={item} dismiss={dismiss} />
        ))}
      </div>
    </Context.Provider>
  )
}

function ToastMessage({ item, dismiss }: { item: Toast; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const failed = item.variant === 'destructive'
  useEffect(() => {
    if (paused || failed) return
    const timer = setTimeout(() => dismiss(item.id), 6000)
    return () => clearTimeout(timer)
  }, [paused, failed, item.id, dismiss])
  return (
    <div
      className={styles.toast}
      data-tone={failed ? 'error' : 'success'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className={styles.icon}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        {failed ? <path d="M12 7v6m0 3v1" /> : <path d="m8 12 3 3 5-6" />}
      </svg>
      <div className={styles.content} role={failed ? 'alert' : 'status'} aria-atomic="true">
        <p className={styles.title}>{item.title}</p>
        {item.description && <p className={styles.description}>{item.description}</p>}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label={`Dismiss notification: ${item.title}`}
        onClick={() => dismiss(item.id)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}

export function useToast() {
  const toast = useContext(Context)
  if (!toast) throw new Error('Toast messages require a ToastProvider.')
  return toast
}
