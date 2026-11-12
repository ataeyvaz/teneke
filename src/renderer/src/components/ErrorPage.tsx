import type { TabLoadError } from '@shared/ipc'
import { formatDisplayUrl } from '../lib/display'
import { describeLoadError } from '../lib/load-error'
import { run } from '../lib/ipc'

/**
 * Shown under the toolbar when a page failed to load. Rendered by the browser
 * UI itself, so websites never get to draw (or spoof) it.
 */
export function ErrorPage({ error }: { error: TabLoadError }): React.JSX.Element {
  const text = describeLoadError(error.description)
  return (
    <main
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 bg-neutral-100 p-8 text-center text-neutral-800"
    >
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="max-w-md text-neutral-600">{text.hint}</p>
      <p className="max-w-md break-all text-sm text-neutral-500">{formatDisplayUrl(error.url)}</p>
      <button
        type="button"
        className="mt-2 rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        onClick={() => {
          run('reload', window.teneke.reload())
        }}
      >
        Tekrar dene
      </button>
      <p className="text-xs text-neutral-400">{error.description}</p>
    </main>
  )
}
