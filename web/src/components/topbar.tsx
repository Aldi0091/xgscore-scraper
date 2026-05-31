import { ThemeToggle } from '@/components/theme-toggle'

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-sm">XGScore</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Fixtures</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
