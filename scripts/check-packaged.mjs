// Verifies the packaged app (release/win-unpacked) after `npm run pack`:
//  1. Electron Fuses are flipped as required by CLAUDE.md section 5
//  2. app.asar only contains the compiled app (no sources, no node_modules)
//  3. ELECTRON_RUN_AS_NODE / NODE_OPTIONS cannot turn the browser into Node
//  4. the app starts, the UI loads from app://, a site loads, and it closes cleanly
// Playwright's Electron launcher cannot drive the packaged app (the inspector
// fuse is off by design), so we connect over the Chromium debugging protocol.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import asar from '@electron/asar'
import { FuseState, FuseV1Options, getCurrentFuseWire } from '@electron/fuses'
import { chromium } from '@playwright/test'

const APP_DIR = join('release', 'win-unpacked')
const EXE = join(APP_DIR, 'Teneke.exe')
const ASAR = join(APP_DIR, 'resources', 'app.asar')

const EXPECTED_FUSES = {
  RunAsNode: FuseState.DISABLE,
  EnableCookieEncryption: FuseState.ENABLE,
  EnableNodeOptionsEnvironmentVariable: FuseState.DISABLE,
  EnableNodeCliInspectArguments: FuseState.DISABLE,
  EnableEmbeddedAsarIntegrityValidation: FuseState.ENABLE,
  OnlyLoadAppFromAsar: FuseState.ENABLE,
  GrantFileProtocolExtraPrivileges: FuseState.DISABLE
}

let failures = 0
function check(ok, message) {
  console.log(`${ok ? '  ✓' : '  ✗'} ${message}`)
  if (!ok) failures++
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

async function waitForDebugger(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) return true
    } catch {
      // not listening yet
    }
    await wait(250)
  }
  return false
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve(true)
    })
  })
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('check-packaged: only implemented for Windows builds yet; skipping.')
    return
  }
  if (!existsSync(EXE)) {
    console.error(`check-packaged: ${EXE} not found. Run "npm run pack" first.`)
    process.exit(1)
  }

  console.log('Fuses')
  const wire = await getCurrentFuseWire(EXE)
  for (const [name, expected] of Object.entries(EXPECTED_FUSES)) {
    const actual = wire[FuseV1Options[name]]
    check(actual === expected, `${name} = ${actual === FuseState.ENABLE ? 'on' : 'off'}`)
  }

  console.log('app.asar contents')
  const files = asar.listPackage(ASAR).map((f) => f.replace(/\\/g, '/'))
  check(files.includes('/out/main/index.js'), 'contains the compiled main process')
  check(!files.some((f) => f.startsWith('/node_modules')), 'ships no node_modules')
  check(
    !files.some((f) => f.startsWith('/src/') || f.startsWith('/tests/')),
    'ships no sources or tests'
  )

  console.log('Runtime')
  const port = await freePort()
  const child = spawn(
    EXE,
    [`--remote-debugging-port=${port}`, '-e', 'process.stdout.write("RUN_AS_NODE_ACTIVE")'],
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_OPTIONS: '--title=NODE_OPTIONS_ACTIVE'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))

  try {
    const debuggerUp = await waitForDebugger(port, 20_000)
    check(debuggerUp, 'app starts as a browser even with ELECTRON_RUN_AS_NODE=1 set')
    check(!output.includes('RUN_AS_NODE_ACTIVE'), 'RunAsNode is not honoured')
    if (!debuggerUp) return

    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`)
    await wait(3000)
    const urls = browser
      .contexts()
      .flatMap((c) => c.pages())
      .map((p) => p.url())
    check(urls.includes('app://ui/index.html'), 'browser UI loads from app://ui')
    check(
      urls.some((u) => u.startsWith('http')),
      `a web content view exists (${urls.filter((u) => u.startsWith('http')).join(', ') || 'none'})`
    )
    const cdp = await browser.newBrowserCDPSession()
    await cdp.send('Browser.close').catch(() => {})
    const exited = await waitForExit(child, 10_000)
    check(exited, 'app exits cleanly')
  } finally {
    if (child.exitCode === null) child.kill()
  }

  console.log(failures === 0 ? '\nPackaged app OK' : `\n${failures} check(s) FAILED`)
  if (failures > 0) process.exit(1)
}

main().catch((error) => {
  console.error('check-packaged failed:', error)
  process.exit(1)
})
