import { useEffect, useState } from 'react'
import type { TabState } from '@shared/ipc'
import { AddressBar } from './components/AddressBar'
import { ErrorPage } from './components/ErrorPage'
import { NavButton } from './components/NavButton'
import { windowTitle } from './lib/display'
import { run } from './lib/ipc'

const EMPTY_STATE: TabState = {
  id: 0,
  url: '',
  title: '',
  isLoading: false,
  canGoBack: false,
  canGoForward: false,
  error: null
}

export function App(): React.JSX.Element {
  const [tab, setTab] = useState<TabState>(EMPTY_STATE)
  const [focusToken, setFocusToken] = useState(0)

  useEffect(() => window.teneke.onTabState(setTab), [])
  useEffect(
    () =>
      window.teneke.onFocusAddress(() => {
        setFocusToken((token) => token + 1)
      }),
    []
  )

  useEffect(() => {
    document.title = windowTitle(tab.title)
  }, [tab.title])

  return (
    <div className="flex h-screen flex-col bg-neutral-900">
      <header className="relative flex h-12 shrink-0 items-center gap-1 bg-neutral-900 px-2 text-neutral-100">
        <NavButton
          label="Geri"
          disabled={!tab.canGoBack}
          onClick={() => {
            run('back', window.teneke.back())
          }}
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </NavButton>
        <NavButton
          label="İleri"
          disabled={!tab.canGoForward}
          onClick={() => {
            run('forward', window.teneke.forward())
          }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </NavButton>
        {tab.isLoading ? (
          <NavButton
            label="Durdur"
            onClick={() => {
              run('stop', window.teneke.stop())
            }}
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </NavButton>
        ) : (
          <NavButton
            label="Yenile"
            onClick={() => {
              run('reload', window.teneke.reload())
            }}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
          </NavButton>
        )}
        <AddressBar url={tab.url} title={tab.title} focusToken={focusToken} />
        {tab.isLoading && (
          <div
            role="progressbar"
            aria-label="Sayfa yükleniyor"
            className="loading-bar absolute inset-x-0 bottom-0 h-0.5 bg-sky-500"
          />
        )}
      </header>
      {tab.error && <ErrorPage error={tab.error} />}
    </div>
  )
}
