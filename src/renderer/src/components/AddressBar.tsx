import { useEffect, useRef, useState } from 'react'
import { MAX_ADDRESS_INPUT_LENGTH } from '@shared/ipc'
import { completeWithCom } from '../lib/address'
import { addressBarLabel, securityOf } from '../lib/display'
import { run } from '../lib/ipc'

interface AddressBarProps {
  url: string
  title: string
  /** Changes whenever the main process asks to focus the address bar. */
  focusToken: number
}

/**
 * Shows the page title while idle; shows the full URL and lets the user type
 * while focused. Enter sends the text to the main process, which decides
 * whether it is a URL or a search (the UI never builds URLs itself).
 */
export function AddressBar({ url, title, focusToken }: AddressBarProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const editing = draft !== null
  const security = securityOf(url)

  // Ctrl+L / F6 / Alt+D are handled in the main process (they must also work
  // while a website has the focus); it asks us to focus the address bar.
  useEffect(() => {
    if (focusToken > 0) inputRef.current?.focus()
  }, [focusToken])

  const submit = (complete = false): void => {
    const typed = (draft ?? '').trim()
    const text = complete ? completeWithCom(typed) : typed
    if (text !== '') run('navigate', window.teneke.navigate(text))
    inputRef.current?.blur()
  }

  return (
    <form
      className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-neutral-800 px-3 focus-within:outline-2 focus-within:outline-sky-500"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {security === 'secure' && (
        <span title="Bağlantı güvenli (HTTPS)" className="shrink-0 text-emerald-400">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-label="Güvenli">
            <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z" />
          </svg>
        </span>
      )}
      {security === 'insecure' && (
        <span title="Bağlantı güvenli değil (HTTP)" className="shrink-0 text-xs text-amber-400">
          Güvenli değil
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        spellCheck={false}
        autoComplete="off"
        maxLength={MAX_ADDRESS_INPUT_LENGTH}
        aria-label="Adres çubuğu"
        placeholder="Ara ya da adres yaz"
        className="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        value={editing ? draft : addressBarLabel(url, title)}
        onFocus={(event) => {
          setDraft(url)
          event.currentTarget.select()
        }}
        onBlur={() => {
          setDraft(null)
        }}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') inputRef.current?.blur()
          // Ctrl+Enter: "google" -> www.google.com
          if (event.key === 'Enter' && event.ctrlKey) {
            event.preventDefault()
            submit(true)
          }
        }}
      />
    </form>
  )
}
