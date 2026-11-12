export function App(): React.JSX.Element {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-100">
      <h1 className="text-3xl font-semibold">Teneke</h1>
      <p className="text-sm text-neutral-400">Güvenli iskelet hazır ({window.teneke.platform})</p>
    </main>
  )
}
