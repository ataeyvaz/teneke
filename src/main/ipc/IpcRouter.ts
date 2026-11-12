import { ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron'
import type { z } from 'zod'
import { IpcChannel } from '@shared/ipc'
import { resolveAddressInput } from '../app/url-policy'
import { navigateArgs, noArgs } from './schemas'
import { isTrustedSender } from './sender'

/** What a UI view can control. Implemented by TabManager. */
export interface NavigationTarget {
  navigateActive(url: string): void
  goBack(): void
  goForward(): void
  reload(): void
  stop(): void
}

/**
 * Single entry point for all UI -> main IPC. Every message is:
 *  1. checked to come from a registered UI view's top frame on the UI origin,
 *  2. validated against a zod schema (type, length, argument count),
 *  3. only then dispatched to that window's NavigationTarget.
 * Rejected messages are logged and the renderer's promise rejects.
 */
export class IpcRouter {
  private readonly targets = new Map<number, NavigationTarget>()

  constructor(
    private readonly uiOrigin: string,
    private readonly searchTemplate: string
  ) {}

  /** Register channel handlers once, after app 'ready'. */
  register(): void {
    this.handle(IpcChannel.navigate, navigateArgs, (target, [input]) => {
      target.navigateActive(resolveAddressInput(input, this.searchTemplate))
    })
    this.handle(IpcChannel.back, noArgs, (target) => {
      target.goBack()
    })
    this.handle(IpcChannel.forward, noArgs, (target) => {
      target.goForward()
    })
    this.handle(IpcChannel.reload, noArgs, (target) => {
      target.reload()
    })
    this.handle(IpcChannel.stop, noArgs, (target) => {
      target.stop()
    })
  }

  /** Trust messages from this UI view and route them to `target`. */
  attach(uiContents: WebContents, target: NavigationTarget): void {
    const id = uiContents.id
    this.targets.set(id, target)
    uiContents.once('destroyed', () => {
      this.targets.delete(id)
    })
  }

  private handle<Args extends unknown[]>(
    channel: string,
    schema: z.ZodType<Args>,
    run: (target: NavigationTarget, args: Args) => void
  ): void {
    ipcMain.handle(channel, (event, ...args: unknown[]) => {
      const target = this.trustedTarget(event)
      if (!target) {
        console.warn(`[ipc] Rejected "${channel}" from untrusted sender:`, senderDescription(event))
        throw new Error('Unauthorized')
      }
      const parsed = schema.safeParse(args)
      if (!parsed.success) {
        console.warn(`[ipc] Rejected "${channel}" with invalid arguments:`, parsed.error.issues)
        throw new Error('Invalid arguments')
      }
      run(target, parsed.data)
    })
  }

  private trustedTarget(event: IpcMainInvokeEvent): NavigationTarget | null {
    const frame = event.senderFrame
    const trusted = isTrustedSender(
      {
        webContentsId: event.sender.id,
        frameUrl: frame?.url ?? null,
        isMainFrame: frame ? frame.parent === null : false
      },
      new Set(this.targets.keys()),
      this.uiOrigin
    )
    return trusted ? (this.targets.get(event.sender.id) ?? null) : null
  }
}

function senderDescription(event: IpcMainInvokeEvent): string {
  return `webContents=${String(event.sender.id)} frame=${event.senderFrame?.url ?? 'gone'}`
}
