// Temporary toolbar placeholder. The address bar and navigation buttons
// arrive in Phase 1, part 5.
export function App(): React.JSX.Element {
  return (
    <header className="flex h-screen items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-4 text-neutral-100">
      <span className="text-lg font-semibold">Teneke</span>
      <span className="text-xs text-neutral-500">
        Güvenli iskelet · adres çubuğu yakında ({window.teneke.platform})
      </span>
    </header>
  )
}
