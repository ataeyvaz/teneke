import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mimeTypeFor, resolveAppAssetPath } from '../../src/main/app/app-path'

const root = resolve('/teneke/out/renderer')

describe('resolveAppAssetPath', () => {
  it('serves index.html for the root', () => {
    expect(resolveAppAssetPath('app://ui/', root)).toBe(join(root, 'index.html'))
    expect(resolveAppAssetPath('app://ui', root)).toBe(join(root, 'index.html'))
  })

  it('serves files inside the renderer folder', () => {
    expect(resolveAppAssetPath('app://ui/index.html', root)).toBe(join(root, 'index.html'))
    expect(resolveAppAssetPath('app://ui/assets/index-abc.js', root)).toBe(
      join(root, 'assets', 'index-abc.js')
    )
  })

  it.each(['app://ui/../../secret.txt', 'app://ui/%2e%2e/%2e%2e/secret.txt'])(
    'keeps dot-segment paths inside the root (%s)',
    (url) => {
      // The URL parser collapses ../ before we see it; the result must stay in root.
      expect(resolveAppAssetPath(url, root)).toBe(join(root, 'secret.txt'))
    }
  )

  it.each([
    'app://ui/assets/%2e%2e%2f%2e%2e%2fsecret.txt',
    'app://ui/..%5c..%5csecret.txt',
    'app://ui/assets/%00.js',
    'app://ui/%E0%A4%A',
    'app://other/index.html',
    'https://ui/index.html',
    'file:///C:/Windows/win.ini',
    'not a url'
  ])('rejects %s', (url) => {
    expect(resolveAppAssetPath(url, root)).toBeNull()
  })
})

describe('mimeTypeFor', () => {
  it('maps known extensions', () => {
    expect(mimeTypeFor('index.html')).toBe('text/html; charset=utf-8')
    expect(mimeTypeFor('a/b.JS')).toBe('text/javascript; charset=utf-8')
    expect(mimeTypeFor('x.css')).toBe('text/css; charset=utf-8')
  })

  it('falls back to opaque bytes', () => {
    expect(mimeTypeFor('file.exe')).toBe('application/octet-stream')
  })
})
