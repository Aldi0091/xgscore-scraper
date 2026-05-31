'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

const cycle = { system: 'light', light: 'dark', dark: 'system' } as const
type Theme = keyof typeof cycle

const icons: Record<Theme, React.ElementType> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

const labels: Record<Theme, string> = {
  system: 'System theme — click for light',
  light: 'Light theme — click for dark',
  dark: 'Dark theme — click for system',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Render a placeholder to avoid layout shift before mount
  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />
  }

  const current = (theme as Theme) ?? 'system'
  const Icon = icons[current] ?? Monitor

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(cycle[current])}
      aria-label={labels[current]}
      title={labels[current]}
    >
      <Icon className="h-[1.1rem] w-[1.1rem]" />
    </Button>
  )
}
