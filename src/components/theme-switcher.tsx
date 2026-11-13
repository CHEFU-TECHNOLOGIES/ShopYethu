'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

const subscribe = () => () => {}

export function ThemeSwitcher() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const { theme, setTheme } = useTheme()

  return (
    <label className="theme-switcher">
      <span className="sr-only">Colour theme</span>
      <NativeSelect
        aria-label="Colour theme"
        disabled={!mounted}
        value={mounted ? (theme ?? 'system') : 'system'}
        onChange={(event) => setTheme(event.target.value)}
      >
        <NativeSelectOption value="light">Light</NativeSelectOption>
        <NativeSelectOption value="dark">Dark</NativeSelectOption>
        <NativeSelectOption value="system">System</NativeSelectOption>
      </NativeSelect>
    </label>
  )
}
