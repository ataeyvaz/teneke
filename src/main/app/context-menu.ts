import type { MenuItemConstructorOptions } from 'electron'

/** The parts of Electron's context-menu params we use (keeps this testable). */
export interface ContextMenuInput {
  isEditable: boolean
  selectionText: string
  linkURL: string
  srcURL: string
  mediaType: string
  editFlags: { canCut: boolean; canCopy: boolean; canPaste: boolean; canSelectAll: boolean }
}

export interface ContextMenuActions {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  copyText: (text: string) => void
  saveImage: (url: string) => void
}

/** Only plain web addresses may be copied or downloaded from a page menu. */
export function isWebUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

const SEPARATOR: MenuItemConstructorOptions = { type: 'separator' }

/**
 * Builds the right-click menu. Page content never defines menu items: the
 * items depend only on what was clicked (link, image, editable field,
 * selection) and call back into the browser through `actions`.
 */
export function buildContextMenu(
  input: ContextMenuInput,
  actions: ContextMenuActions
): MenuItemConstructorOptions[] {
  const sections: MenuItemConstructorOptions[][] = []

  if (isWebUrl(input.linkURL)) {
    sections.push([
      {
        label: 'Bağlantı adresini kopyala',
        click: () => {
          actions.copyText(input.linkURL)
        }
      }
    ])
  }

  if (input.mediaType === 'image' && isWebUrl(input.srcURL)) {
    sections.push([
      {
        label: 'Resmi farklı kaydet…',
        click: () => {
          actions.saveImage(input.srcURL)
        }
      },
      {
        label: 'Resim adresini kopyala',
        click: () => {
          actions.copyText(input.srcURL)
        }
      }
    ])
  }

  const flags = input.editFlags
  if (input.isEditable) {
    sections.push([
      { role: 'cut', label: 'Kes', enabled: flags.canCut },
      { role: 'copy', label: 'Kopyala', enabled: flags.canCopy },
      { role: 'paste', label: 'Yapıştır', enabled: flags.canPaste },
      { role: 'selectAll', label: 'Tümünü seç', enabled: flags.canSelectAll }
    ])
  } else if (input.selectionText.trim() !== '') {
    sections.push([{ role: 'copy', label: 'Kopyala', enabled: flags.canCopy }])
  }

  // Plain page area: navigation shortcuts.
  if (sections.length === 0) {
    sections.push([
      { label: 'Geri', enabled: actions.canGoBack, click: actions.goBack },
      { label: 'İleri', enabled: actions.canGoForward, click: actions.goForward },
      { label: 'Yenile', click: actions.reload }
    ])
  }

  return sections.flatMap((section, index) => (index === 0 ? section : [SEPARATOR, ...section]))
}
