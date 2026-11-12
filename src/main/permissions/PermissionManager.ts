import type { Session } from 'electron'
import { decidePermission } from './permission-policy'

/**
 * Installs deny-by-default permission handlers on a session. Every request and
 * every synchronous check goes through decidePermission(); device pickers
 * (USB, HID, serial, Bluetooth) and screen capture are refused outright.
 */
export class PermissionManager {
  apply(ses: Session): void {
    ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
      const requestingOrigin = originOf(details.requestingUrl || webContents.getURL())
      const granted = decidePermission({ permission, requestingOrigin })
      if (!granted) {
        console.info(
          `[permissions] Denied "${permission}" for ${requestingOrigin || 'unknown origin'}`
        )
      }
      callback(granted)
    })

    ses.setPermissionCheckHandler((_webContents, permission, requestingOrigin) =>
      decidePermission({ permission, requestingOrigin })
    )

    ses.setDevicePermissionHandler(() => false)
    ses.setUSBProtectedClassesHandler((details) => details.protectedClasses)
    ses.setBluetoothPairingHandler((_details, callback) => {
      callback({ confirmed: false })
    })
    ses.setDisplayMediaRequestHandler((_request, callback) => {
      console.info('[permissions] Denied screen capture request')
      callback(null)
    })
  }
}

function originOf(raw: string): string {
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}
